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
 * Generates discussion's name from its peers'public chunks list
 * @param <peers_public_chunks_map> : peers'public chunks list
 * @returns <discussion_name>
 */
hf_service.resolve_discussion_name = function(peers_public_chunks_map)
{
    var discussion_name = 'Unnamed discussion';
    for(hash in peers_public_chunks_map){
        if(hash != hf_service.user_hash()){
            discussion_name = hf.capitalize(peers_public_chunks_map[hash]['profile']['first_name']) + ' ' + hf.capitalize(peers_public_chunks_map[hash]['profile']['last_name']);
            break;
        }
    }
    var nb_peers = hf.keys(peers_public_chunks_map).length;
    if(nb_peers > 2){
        discussion_name += ', (+' + (nb_peers - 2) + ')';
    }

    return discussion_name;
}

/*
 * Returns the discussion hash with the specified peer if it exists
 * @param <peer_hash>: the hash of the peer
 * @returns <discussion_hash> = null if not found
 */
hf_service.get_discussion_with_peer = function(peer_hash)
{
    assert(hf.is_hash(peer_hash));
    assert(hf_service.user_hash() != peer_hash);
    assert(hf_service.is_connected());

    for(var discussion_hash in hf_service.user_private_chunk['discussions']){

        var peers_list = hf_service.user_private_chunk['discussions'][discussion_hash]['peers'];

        if(peers_list.length == 2 && peers_list.indexOf(peer_hash) >= 0){
            return discussion_hash;
        }
    }

    return null;
}

/*
 * Creates a private discussion thread
 *
 * @param <discussion_name>: the name chosen for the discussion.
 * @param <callback>: the function called once the response has arrived with parameter
            the discussion hash or null
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

        hf_service.save_user_chunks(function(success){
            if(success){
                callback(thread_chunk_name);
            }else{
                callback(null);
            }
        });

        discussion_hash = thread_chunk_name;
    });

    return discussion_hash;
}

/*
 * Creates a private discussion thread and adds peers
 *
 * @param <discussion_name>: the name chosen for the discussion.
 * @param <peers_hashes>: peers' user hash
 * @param <callback>: the function called once the response has arrived with parameter
            the discussion hash or null
 */
hf_service.create_discussion_with_peers = function(discussion_name, peers_hashes, callback)
{

    hf_service.create_discussion(discussion_name, function(discussion_hash){
        assert(hf_service.is_discussion_hash(discussion_hash));
        hf_service.list_peers(discussion_hash,function(peers_list){
            assert(Object.keys(peers_list).length == 1);
            hf_service.add_peers_to_discussion(discussion_hash, peers_hashes, function(success){
                if(success){
                    callback(discussion_hash);
                }else{
                    hf_service.leave_discussion(discussion_hash,function(){
                        callback(null);
                    });
                }
            });
        });
    });
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
        if(callback)
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
    assert(peers_hashes instanceof Array);
    assert(hf.is_function(callback));

    var discussion = hf_service.user_private_chunk['discussions'][discussion_hash];
    var iteration = peers_hashes.length;
    var new_peers = [];

    if(iteration === 0){
        callback(true);
        return;
    }

    for(var i = 0; i < peers_hashes.length; i++){

        var peer_hash = peers_hashes[i];
        (function(peer_hash){
            hf_service.is_user_hash(peer_hash, function(is_user_hash){
                iteration--;

                if (is_user_hash && !hf_service.is_discussion_peer(discussion_hash,peer_hash)){
                    new_peers.push(peer_hash);
                    discussion['peers'].push(peer_hash);
                }

                //once all the peers have been added
                if(iteration == 0){
                    if(new_peers.length > 0){
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
                                                message += hf.capitalize(public_chunks_map[hash]['profile']['first_name']) + ' ';
                                            }

                                            message += 'to the discussion';
                                            hf_service.append_post_to_discussion(message, discussion_hash,callback);
                                        });
                                    }else{
                                        console.info("cannot send notification to peers");
                                        callback(false);
                                    }
                                });
                            }else{
                                console.info('cannot save user chunks');
                                callback(false);
                            }
                        });
                    }else{
                        console.info('no peers to add');
                        callback(true);
                    }
                }
            });
        })(peer_hash);
    }

}

/*
 * Gets the specified discussion name and the list of its peers's public chunks
 * @param <discussion_hash>: the hash of the discussion
 * @param <callback>: the function called once the response has arrived
 *          @param <resolved_discussion> : {
 *              'name': <discussion_name>,
                'hash': <discussion_hash>,
 *              'peers': <peers_public_chunks_list>
 *          } or null
 */
hf_service.get_discussion = function(discussion_hash,callback)
{
    assert(hf_service.is_discussion_hash(discussion_hash));
    assert(hf.is_function(callback));
    assert(hf_service.is_connected());

    var discussion = hf_service.user_private_chunk['discussions'][discussion_hash];

    hf_service.get_users_public_chunks(discussion['peers'],function(public_chunks_map){
        if(public_chunks_map){
            var discussion_name = discussion['name'];
            if(discussion_name == null){
                discussion_name = hf_service.resolve_discussion_name(public_chunks_map);
            }
            var resolved_discussion = {
                'name': discussion_name,
                'hash': discussion_hash,
                'peers': hf.values(public_chunks_map)
            };
            callback(resolved_discussion);
        }else{
            callback(null);
        }
    });
}

/*
 * Gets the discussion with the specified peer or starts a new one
 * @param <peer_hash>: the hash of the peer
 * @param <callback>: the function called once the response has arrived
 *          @param <resolved_discussion> : {
 *              'name': <discussion_name>,
                'hash': <discussion_hash>,
 *              'peers': <peers_public_chunks_list>
 *          } or null
 */
hf_service.start_discussion_with_peer = function(peer_hash,callback)
{
    assert(hf.is_function(callback));

    var discussion_hash = hf_service.get_discussion_with_peer(peer_hash);

    if(discussion_hash == null){
        hf_service.create_discussion_with_peers(null, [peer_hash], function(discussion_hash){
            if(discussion_hash != null){
                hf_service.get_discussion(discussion_hash,callback);
            }else{
                callback(null);
            }
        });
    }else{
        hf_service.get_discussion(discussion_hash,callback);
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
        (function(i){
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
        })(i);
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

        if(discussion_name == null){
            (function(discussion_hash){
                hf_service.list_peers(discussion_hash,function(public_chunks_map){

                    var peers_hashes = Object.keys(public_chunks_map);

                    discussion_name = hf_service.resolve_discussion_name(public_chunks_map);

                    discussion_map[discussion_hash] = discussion_name;

                    iteration--;
                    if(iteration === 0){
                        callback(discussion_map);
                    }

                });
            })(discussion_hash);
        }else{
            discussion_map[discussion_hash] = discussion_name;

            iteration--;
            if(iteration === 0){
                callback(discussion_map);
            }
        }
    }
}

/*
 * Deletes the current user from the specified discussion
 * @param <discussion_hash>: the hash of the specified discussion
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.leave_discussion = function(discussion_hash,callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));
    assert(hf_service.is_discussion_hash(discussion_hash));
    assert(hf_service.is_discussion_peer(discussion_hash, hf_service.user_hash()));

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
    var message = hf_service.user_private_chunk['profile']['first_name'] + ' has left the discussion';
    hf_service.append_post_to_discussion(message, discussion_hash);
    delete hf_service.user_private_chunk['discussions'][discussion_hash];

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

    //do not send the notification to himself
    // var index = peers_hashes.indexOf(hf_service.user_hash());
    // if(index >=0){
    //     peers_hashes.splice(index,1);
    // }

    hf_service.send_chunks_infos_to_contacts(peers_hashes, discussions_infos, '/notification/discussion_chunks_infos', callback);
}
