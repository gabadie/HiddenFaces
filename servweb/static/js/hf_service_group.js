/*
 * Initializes an user's private_chunk to contains the groups he had subscribed to or he's admin of
 *
 * @param <repository_chunk>: the data chunk's content
 */
hf_service.init_groups_repository = function(repository_chunk)
{
    assert(!('groups' in repository_chunk));
    repository_chunk['groups'] = {
        'subscribed_to': {},
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
    return (group_hash in private_chunk['groups']['subscribed_to']);
}

/* Find state of user in this group (not subcribe, waiting to accept or subcribed)
 *
 * @param <user_hash>
 *      function return :
 *                1: subcribed
 *                0: waiting
 *               -1: not subcribe
 */
hf_service.waiting_accept_subcribe = function(group)
{
    assert(hf_service.is_connected());
    var group_hash = group['__meta']['group_hash'];

    var private_chunk = hf_service.user_private_chunk;

    if(group['group']['public'] == false)
    {
        if (group_hash in private_chunk['groups']['subscribed_to'])
        {
            return private_chunk['groups']['subscribed_to'][group_hash] == null ? 0 : 1;
        }
        else
        {
            return -1;
        }
    }
    else
    {
        return (group_hash in private_chunk['groups']['subscribed_to'])?1 : -1;
    }
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

    var shared_chunk_name = null;
    var shared_chunk_key;

    if(!public_group){
        shared_chunk_name = hf.generate_hash('CqfS9YVGZOh6NMjzf2On');
        shared_chunk_key = hf_com.generate_AES_key('pBIphpwpPhTJdZItrDKL');
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

            hf_service.publish_into_global_list(transaction, '/global/groups_list', group_hash);

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
                    if(!public_group)
                        hf_service.store_key(user_private_chunk, shared_chunk_name, shared_chunk_key);

                    user_private_chunk['groups']['admin_of'][group_hash] = private_chunk_name;
                    user_private_chunk['groups']['subscribed_to'][group_hash] = shared_chunk_name;

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
 * Gets a list of public chunk from list of group hash
 *
 * @param <group_hashes>: list of group hash
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunk>: is the group's public chunk or null otherwise.
 *      function my_callback(public_chunk)
 */
hf_service.get_group_public_chunks = function(group_hashes, callback)
{
    var nb_public_chunks = 0;
    var group_chunks = [];

    if(group_hashes.length === 0){
        callback(group_chunks);
    }
    for(var i = 0; i < group_hashes.length; i++)
    {
        hf_service.get_group_public_chunk(group_hashes[i], function(public_group_chunk){
            if(public_group_chunk)
            {
                group_chunks.push(public_group_chunk);
                nb_public_chunks++;
            }

            if (nb_public_chunks == group_hashes.length)
            {
                callback(group_chunks);
            }
        });
    }
}

/*
 * Gets a group's shared chunk
 *
 * @param <group_hash>: the group's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunk>: is the group's shared chunk or null otherwise.
 *      function my_callback(private_chunk)
 */
hf_service.get_group_shared_chunk = function(group_hash, callback)
{
    assert(hf.is_function(callback));
    assert(hf.is_hash(group_hash));
    assert(hf_service.already_subscribed(group_hash));

    var user_private_chunk = hf_service.user_private_chunk;
    var group_shared_chunk_name = user_private_chunk['groups']['subscribed_to'][group_hash];

    if(!hf.is_hash(group_shared_chunk_name)){
        callback(null);
        return;
    }
    var group_shared_chunk_key = hf_service.get_decryption_key(user_private_chunk, group_shared_chunk_name);

    //get group private chunk
    hf_com.get_data_chunk(
        group_shared_chunk_name,
        group_shared_chunk_key,
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
 * Gets the thread's name and key of the specified group
 * @param <group_hash>: the hash of the specified group
 * @param <callback>: the function called once the response has arrived
 * with paramter
 *          {
                'name': ,
                'key':
            },
 */

hf_service.get_thread_infos = function(group_hash,callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(group_hash));
    assert(hf.is_function(callback));

    var thread_info = {};

    hf_service.get_group_public_chunk(group_hash, function(group_public_chunk){
        if(group_public_chunk){

            if(group_public_chunk['group']['public']){
                assert(group_public_chunk['thread'] !== undefined);
                thread_info['name'] = group_public_chunk['thread']['name'];
                thread_info['key'] = group_public_chunk['thread']['key'];
                callback(thread_info);

            }else{
                hf_service.get_group_shared_chunk(group_hash, function(group_shared_chunk){

                    if(group_shared_chunk){
                        assert(group_shared_chunk['thread'] !== undefined);
                        thread_info['name'] = group_shared_chunk['thread']['name'];
                        thread_info['key'] = group_shared_chunk['thread']['key'];
                        callback(thread_info);

                    }else{
                        callback(null);

                    }
                });
            }

        }else{
            callback(null);

        }
    });
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

    if (user_hash == hf_service.user_hash())
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
                        alert('already user');
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
                                alert('cannot save group chunks');
                                callback(false);
                            }
                        });
                    }else{
                        hf_service.save_group_chunks(group_json,callback);
                    }
                }else{
                    alert('group json is not good');
                    callback(false);
                }
            }
        );
    });
}

/*
 * Lists groups' public or shared or private chunk the user has subscribes to
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

    var nb_groups = Object.keys(groups).length;
    if (nb_groups === 0) {
        callback(content);
        return ;
    }

    var iteration = nb_groups;

    for(var group_hash in groups) {

        if(hf_service.is_group_admin(group_hash)){

            hf_service.get_group_private_chunk(group_hash, function(group_private_chunk){
                if(group_private_chunk){
                    content.push(group_private_chunk);
                }
                iteration--;
                if (iteration == 0) {
                    callback(content);
                }
            });
        }else{

            hf_service.get_group_public_chunk(group_hash, function(group_public_chunk){
                if(group_public_chunk){
                    if(group_public_chunk['group']['public']){
                        content.push(group_public_chunk);

                        iteration--;
                        if (iteration == 0) {
                            callback(content);
                        }
                    }else{
                        hf_service.get_group_shared_chunk(group_public_chunk['__meta']['group_hash'], function(group_shared_chunk){
                            if(group_shared_chunk){
                                content.push(group_shared_chunk);
                            }else{
                                content.push(group_public_chunk);
                            }
                            iteration--;
                            if (iteration == 0) {
                                callback(content);
                            }
                        });
                    }
                }
            });

        }
    }
}

/*
 * Lists the users public chunks if visible by the current user
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunks>: the contacts' public chunk
 *      function my_callback(public_chunks)
 */
hf_service.list_users = function(group_hash,callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(group_hash));
    assert(hf.is_function(callback));

    hf_service.get_group_public_chunk(group_hash, function(group_public_chunk){

        if(group_public_chunk){

            if(group_public_chunk['group']['public']){
                assert(group_public_chunk['users'] !== undefined);
                hf_service.get_users_public_chunks(group_public_chunk['users'], callback);

            }else{
                hf_service.get_group_shared_chunk(group_hash, function(group_shared_chunk){

                    if(group_shared_chunk){
                        assert(group_shared_chunk['users'] !== undefined);
                        hf_service.get_users_public_chunks(group_shared_chunk['users'], callback);

                    }else{
                        callback([]);

                    }
                });
            }

        }else{
            callback([]);

        }
    });
}

//------------------------------------------------------------------- GROUP NOTIFICATIONS
/*
 * Define a notification interface for /notification/subscription
 */
hf_service.define_notification('/notification/subscription', {
    automation: function(notification_json,repository_chunk)
    {
        assert(hf_service.is_connected());
        assert(notification_json['__meta']['author_user_hash'] !== undefined);

        var user_hash = notification_json['__meta']['author_user_hash'];

        if(hf_service.already_user(user_hash,repository_chunk)){

            return 'discard';

        }

        return 'continue';
    },
    resolve: hf_service.resolve_notification_author
});

/*
 * Group notification resolver adding the ['author'] key fetched frorm the
 * ['__meta']['author_user_hash']
 */
hf_service.resolve_group_notification_author = function(notification_json, callback)
{
    assert(hf.is_function(callback));

    hf_service.get_group_public_chunk(
        notification_json['__meta']['author_user_hash'],
        function(group_public_chunk)
        {
            if (group_public_chunk == null)
            {
                callback(null);
                return;
            }

            var notification = hf.clone(notification_json);

            notification['author'] = group_public_chunk;

            callback(notification);
        }
    );
}

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
                    private_chunk['groups']['subscribed_to'][group_hash] = null;
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
            if (!(group_hash in user_groups_list))
            {
                user_groups_list.push(group_hash);
            }
        }
        else
        {
            assert(false, 'unexpected type');
        }

        user_private_chunk['groups']['subscribed_to'][group_hash] = shared_chunk_infos['name'];
        hf_service.store_key(user_private_chunk, shared_chunk_infos['name'], shared_chunk_infos['symetric_key']);
        hf_service.save_user_chunks();

        return 'discard';
    },
    resolve: hf_service.resolve_group_notification_author
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

/*
 * Lists group's notifications
 *
 * @params <group_hash>: group's hash
 * @param <callback>: the function called once done
 *      @param <notifications_list>: the list of notifications or null
 *      function my_callback(notifications_list)
 */
hf_service.list_group_notifications = function(group_hash, callback)
{
    hf_service.get_group_private_chunk(group_hash, function(group_private_chunk){
        if (group_private_chunk == null)
        {
            return callback(null);
        }

        hf_service.list_notifications(group_private_chunk, function(notifications_list, modified_repository){
            var todo = function(success)
            {
                if (!success)
                {
                    return callback(null);
                }

                callback(notifications_list);
            }

            if (!modified_repository)
            {
                return todo(true);
            }

            hf_service.save_group_chunks(group_private_chunk, todo);
        });
    });
}

/*
 * change group's profile
 *
 * @params <group_hash>: group's hash
 * @params <json_modification>: information stock as a map that must contain
                                'group_name'
                                'group_description'
                                'group_group_public'
                                'group_thread_public'
 *
 */
hf_service.change_group_profile = function(group_hash, json_modification, callback)
{
    hf_service.get_group_private_chunk(group_hash, function(private_chunk){
        private_chunk['group']['name'] = json_modification['group_name'];
        private_chunk['group']['description'] = json_modification['group_description'];
        private_chunk['group']['public'] = json_modification['group_group_public'];
        private_chunk['thread']['public'] = json_modification['group_thread_public'];

        hf_service.save_group_chunks(private_chunk, function(success){
            callback(success);
        });
    });
}

/*
 * Deletes a group notification with its hash
 *
 * @param <group_hash>: the hash of the group
 * @param <notification_hash>: the notification's hash to delete
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.delete_group_notification = function(group_hash, notification_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_group_admin(group_hash));

    hf_service.get_group_private_chunk(group_hash, function(group_private_chunk){
        if(group_private_chunk){
            hf_service.delete_notification(
                group_private_chunk,
                notification_hash,
                function(success)
                {
                    if (success)
                    {
                        hf_service.save_group_chunks(group_private_chunk);
                    }
                    else
                    {
                        callback(false);
                    }
                }
            );
        }else{
            callback(false);
        }

    });
}

