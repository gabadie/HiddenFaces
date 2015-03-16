/*
 * Initializes an user's private_chunk to contains the discussion is being part of
 *
 * @param <repository_chunk>: the data chunk's content
 */
hf_service.init_discussions_repository = function(repository_chunk)
{
    assert(!('discussions' in repository_chunk));
    repository_chunk['discussions'] = {};
}

/*
 * @param <discussion_hash>: discussion's hash to test
 *
 * @returns true or false
 */
hf_service.is_discussion_hash = function(discussion_hash)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(discussion_hash));

    return discussion_hash in hf_service.user_private_chunk['discussions'];
}

/*
 * @param <discussion_hash>: discussion's hash to test
 * @param <user_hash>: user's hash of peer
 *
 * @returns true or false
 */
hf_service.is_discussion_peer = function(discussion_hash, user_hash)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_discussion_hash(discussion_hash));
    assert(hf.is_hash(user_hash));

    return (hf_service.user_private_chunk['discussions'][discussion_hash]['peers'].indexOf(user_hash) >=0);
}

/*
 * Creates a private discussion thread
 *
 * @param <discussion_name>: the name chosen for the discussion.
 * @param <callback>: the function called once the response has arrived with parameter
            true or false
 */
hf_service.create_discussion = function(discussion_name, callback)
{
    assert(hf_service.is_connected());
    assert(typeof discussion_name == 'string' || discussion_name == null);
    assert(hf.is_function(callback) || callback == undefined);

    var discussion_hash = null;
    hf_service.create_thread(hf_service.user_chunks_owner(), true, false, function(thread_info){
        assert(thread_info['status'] == 'ok');

        var thread_chunk_name = thread_info['thread_chunk_name'];
        var thread_chunk_key = thread_info['symetric_key'];

        var discussion_infos = {
            'name':                 discussion_name,
            'peers':                [hf_service.user_hash()]
        };

        var user_private_chunk = hf_service.user_private_chunk;

        user_private_chunk['discussions'][thread_chunk_name] = discussion_infos;

        hf_service.store_key(user_private_chunk, thread_chunk_name, thread_chunk_key);

        hf_service.save_user_chunks(callback);

        discussion_hash = thread_chunk_name;
    });

    return discussion_hash;
}

/*
 * Creates a post in the discussion
 *
 * @param <discussion_hash>: the discussion's hash
 * @param <callback>: the function called once the response has arrived with parameter
            true or false
 */
hf_service.append_post_to_discussion = function(message, discussion_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_discussion_hash(discussion_hash));
    assert(hf.is_function(callback) || callback == undefined);

    var discussion_infos = {
        'thread_chunk_name' : discussion_hash,
        'symetric_key' : hf_service.get_decryption_key(hf_service.user_private_chunk, discussion_hash)
    };

    hf_service.create_post(message,[discussion_infos],function(post_info){
        callback(post_info !== null);
    });
}

/*
 * Adds many peers to a discussion
 * @param <discussion_hash>: the hash of the specified discussion
 * @param <peers_hashes>: peers' user hash
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.add_peers_to_discussion = function(discussion_hash, peers_hashes, callback)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_discussion_hash(discussion_hash));
    assert(peers_hashes.length > 0);
    assert(hf.is_function(callback) || callback == undefined);

    var discussion = hf_service.user_private_chunk['discussions'][discussion_hash];
    var iteration = peers_hashes.length;

    for(var i = 0; i < peers_hashes.length; i++){

        var peer_hash = peers_hashes[i];

        if (peer_hash == hf_service.user_hash())
        {
            assert(hf.is_function(callback));
            callback(false);
            return ;
        }

        hf_service.is_user_hash(peer_hash, function(is_user_hash){
            if (!is_user_hash)
            {
                assert(hf.is_function(callback));
                callback(false);
                return;
            }
            iteration--;

            if(!hf_service.is_discussion_peer(discussion_hash,peer_hash))
                discussion['peers'].push(peer_hash);

            //once all the peers have been added
            if(iteration == 0){
                hf_service.save_user_chunks(function(success){
                    if(success){

                        var discussion_info = {
                            'type':             '/thread',
                            'name':             discussion_hash,
                            'symetric_key':     hf_service.get_decryption_key(hf_service.user_private_chunk, discussion_hash),
                            'discussion_name':  discussion['name'],
                            'peers':            discussion['peers']
                        };
                        hf_service.send_discussions_infos_to_peers(discussion['peers'],[discussion_info], function(success){
                            if(success){

                                var message = hf_service.user_private_chunk['profile']['first_name'] + ' just added ';
                                //getting peers' names
                                hf_service.get_users_public_chunks(peers_hashes,function(public_chunks_map){

                                    for(hash in public_chunks_map){
                                        message += public_chunks_map[hash]['profile']['first_name'] + ' ';
                                    }

                                    message += 'to the discussion';
                                    hf_service.append_post_to_discussion(message, discussion_hash,callback);
                                });
                            }else{
                                callback(false);
                            }
                        });
                    }else{
                        callback(false);
                    }
                });
            }
        });
    }

}

/*
 * Gets the map hash-public_chunk of discussion's peers
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunks>: the peers' hash-public chunk
 *      function my_callback(public_chunks)
 */
hf_service.list_peers = function(discussion_hash,callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));
    assert(hf_service.is_discussion_hash(discussion_hash));

    var peers = hf_service.user_private_chunk['discussions'][discussion_hash]['peers'];
    var content = {};

    var iteration = peers.length;

    if (iteration === 0) {
        callback(content);
        return;
    }

    for(var i = 0; i < peers.length; i++) {
        hf_service.get_user_public_chunk(peers[i], function(public_chunk) {
            if (public_chunk)
            {
                content[peers[i]] = public_chunk;
            }

            iteration--;
            if (iteration === 0) {
                callback(content);
            }
        });
    }
}

/*
 * Lists user's discussions hashes-names
 * @param <callback>: the function called once the response has arrived
 *      @param <discussions_list>: the discussions hashes
 *      function my_callback(discussions_list)
 */
hf_service.list_discussions = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));

    var discussion_map = {};
    var iteration = Object.keys(hf_service.user_private_chunk['discussions']).length;
    if(iteration === 0){
        callback(discussion_map);
        return;
    }

    for(var discussion_hash in hf_service.user_private_chunk['discussions']){

        var discussion_name = hf_service.user_private_chunk['discussions'][discussion_hash]['name'];
        iteration--;
        if(discussion_name == null){
            hf_service.list_peers(discussion_hash,function(public_chunks_map){

                var peers_hashes = Object.keys(public_chunks_map);

                for(hash in public_chunks_map){
                    if(hash != hf_service.user_hash()){
                        discussion_name = public_chunks_map[hash]['profile']['first_name'] + ' ' + public_chunks_map[hash]['profile']['last_name'];
                        break;
                    }
                }
                if(peers_hashes.length > 2){
                    discussion_name += ', (+' + (peers_hashes.length - 2) + ')';
                }

                discussion_map[discussion_hash] = discussion_name;

                if(iteration === 0){
                    callback(discussion_map);
                }

            });
        }else{
            discussion_map[discussion_hash] = discussion_name;

            if(iteration === 0){
                callback(discussion_map);
            }
        }
    }
}

hf_service.leave_discussion = function(discussion_hash,callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);
    assert(hf_service.is_discussion_hash(discussion_hash));

    var discussion = hf_service.user_private_chunk['discussions'][discussion_hash];
    var peers = discussion['peers'];
    peers.splice(peers.indexOf(hf_service.user_hash()),1);

    var discussion_info = {
        'type':             '/thread',
        'name':             discussion_hash,
        'symetric_key':     hf_service.get_decryption_key(hf_service.user_private_chunk, discussion_hash),
        'discussion_name':  discussion['name'],
        'peers':            peers
    };

    hf_service.store_key(hf_service.user_private_chunk, discussion_hash, '');
    delete discussion;

    hf_service.save_user_chunks(function(success){
        if(success){
            hf_service.send_discussions_infos_to_peers(peers,[discussion_info], callback);
        }else{
            callback(false);
        }
    });

}


//------------------------------------------------------------------------- DISCUSSION'S NOTIFICATIONS
/*
 * Define a notification interface for /notification/discussion_chunks_infos
 */
hf_service.define_notification('/notification/discussion_chunks_infos', {
    automation: function(notification_json)
    {
        assert(hf_service.is_connected());

        var peer_hash = notification_json['__meta']['author_user_hash'];
        var user_private_chunk = hf_service.user_private_chunk;
        var chunks_infos = notification_json['chunks'];

        for (var i = 0; i < chunks_infos.length; i++)
        {
            var chunk_infos = chunks_infos[i];
            assert('name' in chunk_infos);

            if (chunk_infos['type'] == '/thread')
            {
                if(user_private_chunk['discussions'][chunk_infos['name']] == undefined){
                    hf_service.store_key(user_private_chunk, chunk_infos['name'], chunk_infos['symetric_key']);
                }

                user_private_chunk['discussions'][chunk_infos['name']] = {
                    'name':                 chunk_infos['discussion_name'],
                    'peers':                chunk_infos['peers']
                };
            }
            else
            {
                assert(false, 'unexpected type');
            }
        }

        return 'discard';
    },
    resolve: hf_service.resolve_notification_author
});

/*
 * Sends chunks' keys to severals contacts.
 *
 * @param <peers_hashes>: the peers to send the chunks' keys
 * @param <discussions_infos>: the chunks' infos to send
 *      [
 *          {
 *              'type':             <the chunk's type>,
 *              'name':      <the chunk's name>,
 *              'symetric_key':     <the chunk's symetric key>,
 *              'discussion_name':  <the discussion's name>,
 *              'peers':            <the peers' list>
 *          }
 *      ]
 *
 * @param <callback>: the callback once the notifications have been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.send_discussions_infos_to_peers = function(peers_hashes, discussions_infos, callback)
{
    assert(hf_service.is_connected());
    hf_service.send_chunks_infos_to_contacts(peers_hashes, discussions_infos, '/notification/discussion_chunks_infos', callback);
}
