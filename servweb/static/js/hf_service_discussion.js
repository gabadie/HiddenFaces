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
 * Creates a private discussion thread
 *
 * @param <owner_hash>: the hash of the owner of the thread
 * @param <discussion_name>: the name chosen for the discussion
 * @param <callback>: the function called once the response has arrived with parameter
            {
                'status':,
                'thread_chunk_name':,
                'symetric_key':
            };
 */
hf_service.create_discussion = function(owner_hash, discussion_name, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(owner_hash));
    assert(hf.is_function(callback) || callback == undefined);

    var discussion_hash = null;

    hf_service.create_thread(owner_hash, true, false, function(thread_info){
        assert(thread_info['status'] == 'ok');

        var thread_chunk_name = thread_info['thread_chunk_name'];
        var thread_chunk_key = thread_info['symetric_key'];

        var discussion_infos = {
            'name':                 discussion_name,
            'peers':                [hf_service.user_hash()],
            'thread_chunk_name':    thread_chunk_name
        };

        var user_private_chunk = hf_service.user_private_chunk;

        user_private_chunk['discussions'][thread_chunk_name] = discussion_infos;

        hf_service.store_key(user_private_chunk, thread_chunk_name, thread_chunk_key);

        hf_service.save_user_chunks(callback);

        discussion_hash = thread_chunk_name;
    });

    /*
     * For testing efficiency, we return the discussion's hash
     */
    return discussion_hash;
}

/*
 * Adds a peer to a discussion
 * @param <discussion_hash>: the hash of the specified discussion
 * @param <peer_hash>: peer's user hash
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.add_peer_to_discussion = function(discussion_hash, peer_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_discussion_hash(discussion_hash));
    assert(hf.is_function(callback) || callback == undefined);

    if (user_hash == hf_service.user_hash())
    {
        assert(hf.is_function(callback));
        callback(false);
        return ;
    }

    hf_service.is_user_hash(peer_hash, function(is_user_hash)
    {
        if (!is_user_hash)
        {
            callback(false);
            return;
        }
        var discussion = hf_service.user_private_chunk['discussions'][discussion_hash];
        discussion['peers'].push(peer_hash);

        hf_service.save_user_chunks(function(success)
        {
            if(success){
                var discussion_info = {
                    'type':             '/thread',
                    'name':             discussion['thread_chunk_name'],
                    'symetric_key':     hf_service.get_decryption_key(hf_service.user_private_chunk, discussion['thread_chunk_name']),
                    'discussion_name':  discussion['name'],
                    'peers':            discussion['peers']
                };
                hf_service.send_discussions_infos_to_peers([peer_hash],[discussion_info],callback);
            }else{
                callback(false);
            }
        });
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

        if (!hf_service.is_contact(peer_hash))
        {
            return 'continue';
        }

        var user_private_chunk = hf_service.user_private_chunk;
        var chunks_infos = notification_json['chunks'];

        for (var i = 0; i < chunks_infos.length; i++)
        {
            var chunk_infos = chunks_infos[i];

            if (chunk_infos['type'] == '/thread')
            {
                user_private_chunk['discussions'][thread_chunk_name] = {
                    'name':                 chunk_infos['discussion_name'],
                    'peers':                chunk_infos['peers'],
                    'thread_chunk_name':    chunk_infos['thread_name']
                };
            }
            else
            {
                assert(false, 'unexpected type');
            }

            /*
             * TODO: we should check that we can still open this document in
             * the notification's validation (issue #27).
             */
            hf_service.store_key(user_private_chunk, chunk_infos['name'], chunk_infos['symetric_key']);
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
    hf_service.send_chunks_infos_to_contacts(peers_hashes, discussions_infos, '/notification/discussion_chunks_infos', callback);
}
