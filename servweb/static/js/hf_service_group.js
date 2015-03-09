/*
 * Creates a group
 *
 * @param <group_name>: the user profile
 * @param <public_group> : if the group is public or not
 * @param <callback>: the function once
 *      function my_callback(group_hash)
 *
 *      @param <group_hash>: is the group's hash
 */
hf_service.create_group = function(group_name, public_group, callback)
{
    assert(typeof group_name == "string");
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

    var shared_chunk_name = hf.generate_hash('CqfS9YVGZOh6NMjzf2On');
    var shared_chunk_key = hf_com.generate_AES_key('pBIphpwpPhTJdZItrDKL');

    assert(private_chunk_name != group_hash);
    assert(shared_chunk_name != group_hash);

    //Generates the unique thread of the group
    hf_service.create_thread(chunks_owner, true, public_group, function(thread_info){
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
            'shared_chunk': {
                'name': shared_chunk_name,
                'key': shared_chunk_key
            },
            'thread': {
                'title' : group_name,
                'public': public_group,
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

            var shared_chunk = hf_service.export_group_shared_chunk(private_chunk);

            // Creates the group's private chunk
            transaction.create_data_chunk(
                private_chunk_name,
                chunks_owner,
                private_chunk_key,
                [JSON.stringify(private_chunk)],
                false
            );

            // Creates the group's shared chunk
            transaction.create_data_chunk(
                shared_chunk_hash,
                chunks_owner,
                shared_chunk_key,
                [JSON.stringify(shared_chunk)],
                false
            );

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
            })

            hf_service.reset_cache();
            hf_service.users_public_chunks[group_hash] = public_chunk;
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
            'chunk_name':   group_private_chunk['__meta']['group_hash']
        },
        'system': {
        },
        'thread':{
            'title' : group_private_chunk['thread']['title']
        }
    };

    if(group_private_chunk['thread']['public']){
        public_chunk['thread'] = group_private_chunk['thread'];
        public_chunk['users'] = hf.clone(group_private_chunk['user']);
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
            'chunk_name':   group_private_chunk['__meta']['group_hash']
        },
        'system': {
        },
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

    // checks if <group_hash>'s public chunk is already cached
    if (group_hash in hf_service.users_public_chunks)
    {
        callback(hf_service.users_public_chunks[group_hash]);

        return;
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
