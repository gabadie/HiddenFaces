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
 *
 * @param <user_hash>
 * @param <group_private_chunk>
 * @param <callback>: the function once
 *      function my_callback(bool) : true or false
 */
hf_service.already_subscribed = function(user_hash, group_private_chunk)
{
    assert(hf.is_hash(user_hash));
    return user_hash in group_private_chunk['users'];
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
                'public' : public_group,
                'name' : group_name,
                'description' : description
            },
            'thread': {
                'public': public_thread,
                'name': thread_info['thread_chunk_name'],
                'key': thread_info['symetric_key']
            },
            //users who had subscribed to the group
            'users': []
        };

        var transaction = new hf_com.Transaction();

        hf_service.init_notification_repository(private_chunk, transaction, function(success){
            if (!success)
            {
                callback(null);
                return;
            }

            // Generates the group's public chunk's content
            var public_chunk = hf_service.export_group_public_chunk(private_chunk);

            // Creates the group's private chunk
            transaction.create_data_chunk(
                private_chunk_name,
                chunks_owner,
                private_chunk_key,
                [JSON.stringify(private_chunk)],
                false
            );

            // Creates the group's shared chunk
            if(!public_group){
                private_chunk['shared_chunk'] = {
                    'name': shared_chunk_name,
                    'key': shared_chunk_key
                };
                var shared_chunk = hf_service.export_group_shared_chunk(private_chunk);
                transaction.create_data_chunk(
                    shared_chunk_hash,
                    chunks_owner,
                    shared_chunk_key,
                    [JSON.stringify(shared_chunk)],
                    false
                );
            }

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
                    return;
                }

                if (callback)
                {
                    callback(group_hash);
                }
            });

            //current user is the group's admin
            var user_private_chunk = hf_service.user_public_chunk;
            hf_service.store_key(user_private_chunk, private_chunk_name, private_chunk_key);
            user_private_chunk['groups']['admin_of'][group_hash] = private_chunk_name;
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
        'group': group_private_chunk['group']
    };
    if(group_private_chunk['group']['public']){
        public_chunk['users'] = hf.clone(group_private_chunk['users']);
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
 *      @param <public_chunk>: is the group's public chunk or false otherwise.
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
            callback(false);
            return;
        }

        hf_service.users_public_chunks[group_hash] = public_chunk;

        callback(public_chunk);
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

    if (!hf_service.is_group_admin(group_hash) || user_hash == hf_service.user_hash())
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

        var user_private_chunk = hf_service.user_private_chunk;
        var group_private_chunk_name = user_private_chunk['groups']['admin_of'][group_hash];
        var group_private_chunk_key = hf_service.get_decryption_key(user_private_chunk, group_private_chunk_name);

        //get group private chunk
        hf_com.get_data_chunk(
            group_private_chunk_name,
            group_private_chunk_key,
            function(json_message){
                assert(json_message['chunk_content'][0] !== 'undefined');
                var group_json = JSON.parse(json_message['chunk_content'][0]);

                if(hf_service.already_subscribed(user_hash,group_json)){
                    callback(false);
                    return;
                }

                //add user to group
                group_json['users'].push(user_hash);

            }
        );
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
        var shared_chunk = hf_service.export_group_shared_chunk(private_chunk);
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
