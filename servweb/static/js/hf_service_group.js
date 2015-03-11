/*
 * Initializes an user's private_chunk to contains the groups he had subscribed to or he's admin of
 *
 * @param <repository_chunk>: the data chunk's content
 */
hf_service.init_groups_repository = function(repository_chunk)
{
    assert(!('groups' in repository_chunk));
    repository_chunk['groups'] = {
        'subscribed_to': [],
        'admin_of': {}
    };
}

/*Verifies if the current user is the group's admin
 * @param <group_hash> : the hash of the specified group
 * @return true or false
 */
hf_service.is_group_admin = function(group_hash){
    assert(hf_service.is_connected());
    return group_hash in hf_service.user_private_chunk['groups']['admin_of'];
}

/*Verifies if the user has already subscribed to the specified group
 * Accessible only by the admin
 * @param <user_hash>
 * @param <group_private_chunk>
 * @param <callback>: the function once
 *      function my_callback(bool) : true or false
 */
hf_service.already_user = function(user_hash, group_private_chunk)
{
    assert(hf.is_hash(user_hash));
    return (group_private_chunk['users'].indexOf(user_hash) >= 0);
}

/*Verifies if the user has already subscribed to the specified group
 *
 * @param <user_hash>
 * @param <group_private_chunk>
 * @param <callback>: the function once
 *      function my_callback(bool) : true or false
 */
hf_service.already_subscribed = function(group_hash)
{
    assert(hf.is_hash(group_hash));
    assert(hf_service.is_connected());

    var private_chunk = hf_service.user_private_chunk;
    return (private_chunk['groups']['subscribed_to'].indexOf(group_hash) >= 0);
}
/*
 * Creates a group
 *
 * @param <group_name>: the user profile
 * @param <description> : the group's description
 * @param <public_group> : if the group is public or not
 * @param <public_group> : if the thread is public or not
 * @param <callback>: the function once
 *      function my_callback(group_hash)
 *
 *      @param <group_hash>: is the group's hash
 */
hf_service.create_group = function(group_name, description, public_group, public_thread, callback)
{
    assert(hf_service.is_connected());
    assert(typeof group_name == "string");
    assert(typeof description == 'string');
    assert(group_name.length > 0);
    assert(public_group <= public_thread);
    assert(hf.is_function(callback) || callback == undefined);

    var group_hash = hf.generate_hash(
        '7MPEnsDr7gMzCrrDX8oM\n' +
        group_name
    );
    var chunks_owner = hf.generate_hash(
        'TQsQs8sIN9mNYa2G7kap\n' +
        group_name
    );
    var private_chunk_name = hf.generate_hash('ouvhIPYIjdkbk8IgJhGj');
    var private_chunk_key = hf_com.generate_AES_key('DhPbtSt56xJIqLuJjQJh');
    assert(private_chunk_name != group_hash);

    if(!public_group){
        var shared_chunk_name = hf.generate_hash('CqfS9YVGZOh6NMjzf2On');
        var shared_chunk_key = hf_com.generate_AES_key('pBIphpwpPhTJdZItrDKL');
        assert(shared_chunk_name != group_hash);
    }

    var admin_hash = hf_service.user_hash();
    //Generates the unique thread of the group
    hf_service.create_thread(chunks_owner, true, public_thread, function(thread_info){
        assert(thread_info['status'] == "ok");
        // Generates the group's private chunk's content
        var private_chunk = {
            '__meta': {
                'type':         '/group/private_chunk',
                'group_hash':    group_hash,
                'chunk_name':   private_chunk_name,
                'key':          private_chunk_key
            },
            'system': {
                'chunks_owner':  chunks_owner
            },
            'group': {
                'admin' : admin_hash,
                'public' : public_group,
                'name' : group_name,
                'description' : description
            },
            'thread': {
                'public': public_thread,
                'name': thread_info['thread_chunk_name'],
                'key': thread_info['symetric_key']
            },
            //users who had subscribed to the group. At the beginning only the admin
            'users': [admin_hash]
        };

        var transaction = new hf_com.Transaction();

        hf_service.init_notification_repository(private_chunk, transaction, function(success){
            if (!success)
            {
                callback(null);
                return;
            }

            // Creates the group's shared chunk
            if(!public_group){
                private_chunk['shared_chunk'] = {
                    'name': shared_chunk_name,
                    'key': shared_chunk_key
                };
                var shared_chunk = hf_service.export_group_shared_chunk(private_chunk);
                transaction.create_data_chunk(
                    shared_chunk_name,
                    chunks_owner,
                    shared_chunk_key,
                    [JSON.stringify(shared_chunk)],
                    false
                );
            }

            // Creates the group's private chunk
            transaction.create_data_chunk(
                private_chunk_name,
                chunks_owner,
                private_chunk_key,
                [JSON.stringify(private_chunk)],
                false
            );

            // Generates the group's public chunk's content
            var public_chunk = hf_service.export_group_public_chunk(private_chunk);

            // Creates the group's public chunk
            transaction.create_data_chunk(
                group_hash,
                chunks_owner,
                '',
                [JSON.stringify(public_chunk)],
                false
            );

            transaction.commit(function(json_message){
                if (json_message['status'] != 'ok')
                {
                    alert('create group has failed');
                    if(callback)
                        callback(null);
                }else {
                    //current user is the group's admin
                    var user_private_chunk = hf_service.user_private_chunk;

                    hf_service.store_key(user_private_chunk, private_chunk_name, private_chunk_key);

                    user_private_chunk['groups']['admin_of'][group_hash] = private_chunk_name;
                    user_private_chunk['groups']['subscribed_to'].push(group_hash);

                    hf_service.save_user_chunks(function(success){
                        if(success && callback){
                            callback(group_hash);
                        }else if(callback)
                            callback(null);
                    });
                }
            });
        });
    });

    return group_hash;
}

/*
 * Export group's public chunk from the group's private chunk
 *
 * @param <group_private_chunk>: the group's private chunk
 *
 * @returns the newly generated group's public chunk
 */
hf_service.export_group_public_chunk = function(group_private_chunk)
{
    var public_chunk = {
        '__meta': {
            'type':         '/group/public_chunk',
            'group_hash':    group_private_chunk['__meta']['group_hash'],
            'chunk_name':    group_private_chunk['__meta']['group_hash']
        },
        'system': {
        },
        'group': {
            'public' : group_private_chunk['group']['public'],
            'name' : group_private_chunk['group']['name'],
            'description' : group_private_chunk['group']['description']
        }
    };
    if(group_private_chunk['group']['public']){
        public_chunk['users'] = hf.clone(group_private_chunk['users']);
        public_chunk['group']['admin'] = group_private_chunk['group']['admin'];
    }
    if(group_private_chunk['thread']['public']){
        public_chunk['thread'] = group_private_chunk['thread'];
    }

    hf_service.export_public_notification_repository(group_private_chunk, public_chunk);

    return public_chunk;
}

/*
 * Export group's shared chunk from the group's private chunk
 *
 * @param <group_private_chunk>: the group's private chunk
 *
 * @returns the newly generated group's public chunk visible to the users of the group
 */
hf_service.export_group_shared_chunk = function(group_private_chunk)
{
    assert(group_private_chunk['group']['public'] == false);

    var shared_chunk = {
        '__meta': {
            'type':         '/group/shared_chunk',
            'group_hash':    group_private_chunk['__meta']['group_hash'],
            'chunk_name':   group_private_chunk['shared_chunk']['name']
        },
        'system': {
        },
        'group': group_private_chunk['group'],
        'thread': group_private_chunk['thread'],
        'users': group_private_chunk['users']
    };

    return shared_chunk;
}

/*
 * Gets a group's public chunk
 *
 * @param <group_hash>: the group's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunk>: is the group's public chunk or null otherwise.
 *      function my_callback(public_chunk)
 */
hf_service.get_group_public_chunk = function(group_hash, callback)
{
    assert(hf.is_function(callback));

    if(!hf.is_hash(group_hash))
    {
        callback(false);
        return ;
    }

    // fetches the <group_hash>'s public chunk
    hf_com.get_data_chunk(group_hash, '', function(json_message){
        assert(json_message['chunk_content'].length == 1);

        var public_chunk = JSON.parse(json_message['chunk_content'][0]);

        if (public_chunk['__meta']['type'] != '/group/public_chunk' ||
            public_chunk['__meta']['group_hash'] != group_hash ||
            public_chunk['__meta']['chunk_name'] != group_hash)
        {
            callback(null);
            return;
        }

        callback(public_chunk);
    });
}

/*
 * Gets a group's private chunk. User connected must be the admin
 *
 * @param <group_hash>: the group's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunk>: is the group's private chunk or null otherwise.
 *      function my_callback(private_chunk)
 */
hf_service.get_group_private_chunk = function(group_hash, callback)
{
    assert(hf.is_function(callback));
    assert(hf.is_hash(group_hash));
    assert(hf_service.is_group_admin(group_hash));

    var user_private_chunk = hf_service.user_private_chunk;
    var group_private_chunk_name = user_private_chunk['groups']['admin_of'][group_hash];
    var group_private_chunk_key = hf_service.get_decryption_key(user_private_chunk, group_private_chunk_name);

    //get group private chunk
    hf_com.get_data_chunk(
        group_private_chunk_name,
        group_private_chunk_key,
        function(json_message){
            if(json_message['chunk_content'][0] !== 'undefined'){
                var group_json = JSON.parse(json_message['chunk_content'][0]);
                callback(group_json);
            }else{
                callback(null);
            }
        }
    );
}
/*
 * Saves group's public, shared and private chunks
 * @param <callback>: the function called once done
 *      function my_callback(success) with success = true or false
 */
hf_service.save_group_chunks = function(group_private_chunk,callback)
{
    assert(hf.is_function(callback) || callback == undefined);

    var group_chunks_owner = group_private_chunk['system']['chunks_owner'];
    var group_hash = group_private_chunk['__meta']['group_hash'];

    var transaction = new hf_com.Transaction();

    // saves user's private chunk
    transaction.write_data_chunk(
        group_private_chunk['__meta']['chunk_name'],
        group_chunks_owner,
        group_private_chunk['__meta']['key'],
        [JSON.stringify(group_private_chunk)]
    );

    // saves user's public chunk
    var group_public_chunk = hf_service.export_group_public_chunk(group_private_chunk);
    transaction.write_data_chunk(
        group_hash,
        group_chunks_owner,
        '',
        [JSON.stringify(group_public_chunk)]
    );

    // saves group's shared chunk
    if(!group_private_chunk['group']['public']){
        var shared_chunk = hf_service.export_group_shared_chunk(group_private_chunk);
        transaction.write_data_chunk(
            group_private_chunk['shared_chunk']['name'],
            group_chunks_owner,
            group_private_chunk['shared_chunk']['key'],
            [JSON.stringify(shared_chunk)]
        );
    }

    transaction.commit(function(json_message){
        if (callback)
        {
            if(json_message['status'] == 'ok')
                callback(true);
            else
                callback(false);
        }
    });
}

/* Adds an user to the specified group if the current user is the group's admin
 * @param <user_hash>: contact's user hash
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.add_user_to_group = function(user_hash, group_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);
    assert(hf_service.is_group_admin(group_hash));

    if (user_hash == admin_hash)
    {
        console.info('Cannot add user to specified group');
        if(callback)
            callback(false);
        return ;
    }

    hf_service.is_user_hash(user_hash, function(is_user_hash)
    {
        if (!is_user_hash)
        {
            callback(false);
            return;
        }

        hf_service.get_group_private_chunk(
            group_hash,
            function(group_json){
                if(group_json){
                    if(hf_service.already_user(user_hash,group_json)){
                        callback(false);
                        return;
                    }

                    //add user to group
                    group_json['users'].push(user_hash);

                    if(!group_json['group']['public']){
                        //send notification to user
                        var shared_chunk_infos = {
                            'name': group_json['shared_chunk']['name'],
                            'type': '/group/shared_chunk',
                            'symetric_key': group_json['shared_chunk']['key']
                        };

                        hf_service.save_group_chunks(group_json,function(success){
                            if(success){
                                hf_service.send_group_infos_to_user(user_hash, group_hash, shared_chunk_infos,callback);
                            }else{
                                callback(false);
                            }
                        });
                    }else{
                        hf_service.save_group_chunks(group_json,callback);
                    }
                }else{
                    callback(false);
                }
            }
        );
    });
}

/*
 * Lists groups' public chunks the user has subscribes to
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunks>: the contacts' public chunk
 *      function my_callback(public_chunks)
 */
hf_service.list_groups = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));

    var groups = hf_service.user_private_chunk['groups']['subscribed_to'];
    var content = [];

    if (groups.length === 0) {
        callback(content);
        return ;
    }

    var iteration = groups.length;

    for(var i = 0; i < groups.length; i++) {
        hf_service.get_group_public_chunk(groups[i], function(group_public_chunk){
        if(group_public_chunk){
                content.push(group_public_chunk);
            }

            iteration--;
            if (iteration == 0) {
                callback(content);
            }
        });
    }
}

//------------------------------------------------------------------- GROUP NOTIFICATIONS
/*
 * Define a notification interface for /notification/subscription
 */
hf_service.define_notification('/notification/subscription', {
    automation: null,
    resolve: hf_service.resolve_notification_author
});

/*
 * Sends a request of subscription for a group
 *
 * @params <group_hash>: group's hash
 * @params <message>: message to send to the group
 * @param <callback>: the callback once the notification has been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.subscribe_to_group = function(group_hash, message, callback)
{
    assert(hf_service.is_connected(), "user not connected in hf_service.send_contact_request");
    assert(hf.is_function(callback));

    if (hf_service.is_group_admin(group_hash))
    {
        callback(false);
        return;
    }

    var notification_json = {
        '__meta': {
            'type': '/notification/subscription',
            'author_user_hash': hf_service.user_hash()
        },
        'content': message
    };

    hf_service.get_group_public_chunk(group_hash, function(group_public_chunk){
        if(group_public_chunk){
            hf_service.push_notification(group_public_chunk, notification_json, function(success){
                if(success){
                    var private_chunk = hf_service.user_private_chunk;
                    private_chunk['groups']['subscribed_to'].push(group_hash);
                    hf_service.save_user_chunks(callback);
                }else{
                    callback(false);
                }
            });
        }else{
            callback(false);
        }
    });
}

/*
 * Define a notification interface for /notification/group_shared_chunk_infos
 */
hf_service.define_notification('/notification/group_shared_chunk_infos', {
    automation: function(notification_json)
    {
        assert(hf_service.is_connected());
        assert(notification_json['chunks'] !== undefined);
        assert(notification_json['__meta']['author_user_hash'] !== undefined);

        var group_hash = notification_json['__meta']['author_user_hash'];

        if (!hf_service.already_subscribed(group_hash))
        {
            return 'continue';
        }

        var user_private_chunk = hf_service.user_private_chunk;
        var shared_chunk_infos = notification_json['chunks'];
        var user_groups_list = user_private_chunk['groups']['subscribed_to'];

        if (shared_chunk_infos['type'] == '/group/shared_chunk')
        {
            if (user_groups_list.indexOf(group_hash) < 0)
            {
                user_groups_list.push(group_hash);
            }
        }
        else
        {
            assert(false, 'unexpected type');
        }

        /*
         * TODO: we should check that we can still open this document in
         * the notification's validation (issue #27).
         */
        hf_service.store_key(user_private_chunk, shared_chunk_infos['name'], shared_chunk_infos['symetric_key']);

        return 'discard';
    },
    resolve: hf_service.resolve_notification_author
});

/*
 * Sends shared chunk infos to an user.
 *
 * @param <user_hash>: the user's hash to send the infos
 * @param <group_hash>: the group's hash the infos are relative to
 * @param <shared_chunk_infos>: the shared chunk infos to send
 *      {
 *          'name':             <the chunk's name>,
 *          'type':             <the chunk's type>,
 *          'symetric_key':     <the chunk's symetric key>
 *      }
 *
 * @param <callback>: the callback once the notifications have been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.send_group_infos_to_user = function(user_hash, group_hash, shared_chunk_infos, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(user_hash));
    assert(hf.is_hash(group_hash));
    assert(hf.is_function(callback));

    assert('name' in shared_chunk_infos);
    assert('type' in shared_chunk_infos);
    assert('symetric_key' in shared_chunk_infos);

    assert(hf.is_hash(shared_chunk_infos['name']));
    assert(shared_chunk_infos['type'] == '/group/shared_chunk');
    assert(hf_com.is_AES_key(shared_chunk_infos['symetric_key']));

    hf_service.get_group_private_chunk(group_hash, function(group_private_chunk){
        assert(hf_service.already_user(user_hash, group_private_chunk));
        var notification_json = {
            '__meta': {
                'type': '/notification/group_shared_chunk_infos',
                'author_user_hash': group_hash
            },
            'chunks': hf.clone(shared_chunk_infos)
        };

        hf_service.get_user_public_chunk(user_hash, function(user_public_chunk){
            hf_service.push_notification(user_public_chunk, notification_json, callback);
        });
    });
}
