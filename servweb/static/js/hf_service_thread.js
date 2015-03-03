/*
 * Creates a thread
 *
 * @param <owner_hash>: the hash of the owner of the thread
 * @param <public_append>: if anyone can append content on the threads
 * @param <public_thread> : if the thread is private or not
 * @param <callback>: the function called once the response has arrived with parameter 
            {
                'status':,
                'thread_chunk_name':,
                'symetric_key':
            };
 */
hf_service.create_thread = function(owner_hash, public_append, public_thread, callback)
{
    assert(typeof owner_hash == "string", "owner_hash must be a string in hf_service.create_thread");
    assert(hf.is_hash(owner_hash));
    assert(typeof public_append == "boolean", "public_append must be a boolean in hf_service.create_thread");

    var thread_content = [];
    var thread_chunk_name =
        hf.generate_hash('C3jsud4AZkDpd7IKEtEH\n');

    var symetric_key = '';
    if(!public_thread){
        var salt = 'BJNWuPHteW';
        symetric_key = hf_com.generate_AES_key(salt);
    }

    // Creates the thread's chunk
    hf_com.create_data_chunk(
        thread_chunk_name,
        owner_hash,
        symetric_key,
        thread_content,
        public_append,
        function(json_message){

            var thread_info = {
                'status' : json_message["status"],
                'thread_chunk_name':   thread_chunk_name,
                'symetric_key':   symetric_key
            };
            
            if(callback){
                callback(thread_info);
            }
        }
    );
}

/*
 * Creates a post
 *
 * @param <post_content>: the content of the post
 * @param <threads_list>: list the threads the post will be posted to (= null if unspecified)
 * @param <callback>: the function called once the response has arrived with parameter 
            {
                'status':,
                'post_chunk_name':,
                'symetric_key':
            };
 */
hf_service.create_post = function(post_content,threads_list,callback)
{
    assert(typeof post_content == 'string', "post_content must be a string in hf_service.create_post");
    
    var owner_hash = hf_service.user_chunks_owner();
    var user_hash = hf_service.user_hash();
    var part_hash = hf.generate_hash('uGzvkgD6lr6WlMTbvhWK\n');
    var post_chunk_content = {
        '__meta': {
            'type': '/post',
            'author_user_hash': user_hash,
            'part_hash' : part_hash
        },
        'content': post_content
    };
    
    var post_chunk_name =
        hf.generate_hash('ERmO4vptXigWBnDUjnEN\n');
    var stringified_post_content = [JSON.stringify(post_chunk_content)];

    var symetric_key = hf_com.generate_AES_key('uhgGFoMBXi');

    // Creates the thread's chunk
    hf_com.create_data_chunk(
        post_chunk_name,
        owner_hash,
        symetric_key,
        stringified_post_content,
        true,
        function(json_message){
            if (json_message['status'] != 'ok')
            {
                allert("post creation has failed");
                callback(null);
            }

            var post_info = {
                'status' :  json_message['status'], 
                'post_chunk_name':   post_chunk_name,
                'symetric_key':   symetric_key
            };

            //chunk certification
            hf_service.certify(hf_service.user_private_chunk, post_chunk_name, part_hash, hf.hash(stringified_post_content[0]), function(success){
                if(!success)
                    callback(null);
            });

            if(threads_list){
                hf_service.append_post_to_threads(post_chunk_name,symetric_key, threads_list,callback);
            }else if (callback){
                callback(post_info);
            }
        }
    );
}

/*
 * Appends a post to a list of threads
 *
 * @param <post_name>: the name of the post
 * @param <post_key> : the decryption key of the post
 * @param <threads_list>: list the threads the post will be posted to. A thread must contain fields
            {
                'thread_chunk_name':,
                'symetric_key':
            }; 
 * @param <callback>: the function called once the response has arrived with parameter 
            = true if the append had succeded
            = false otherwise
 */
hf_service.append_post_to_threads = function(post_name, post_key, threads_list,callback)
{
    assert(typeof post_name == "string");
    assert(typeof post_key == "string");
    assert(threads_list instanceof Array, "threads_list must be an Array in hf_service.append_post_to_threads");
    assert(typeof threads_list[0] !== 'undefined', "threads_list is empty in hf_service.append_post_to_threads")

    var transaction = new hf_com.Transaction();

    var post_info = {
        "post_chunk_name" : post_name,
        "symetric_key" : post_key
    };
    var stringified_post_info = JSON.stringify(post_info);

    for (var i = 0; i < threads_list.length; i++)
    {
        assert(typeof threads_list[i]['thread_chunk_name'] == "string");
        assert(typeof threads_list[i]['symetric_key'] == "string");

        transaction.extend_data_chunk(
            threads_list[i]['thread_chunk_name'],
            hf_service.user_chunks_owner(),
            threads_list[i]['symetric_key'],
            [stringified_post_info],
            function(json_message) {
                if (json_message['status'] != 'ok')
                {
                    alert(
                        'hf_service.append_post_to_threads(' +
                        stringified_post_info + ' , ' +
                        threads_list[i]['thread_chunk_name'] +
                        ') failed'
                    );
                    callback(false);
                }
            }
        );
    }
    transaction.commit(function(json_message){
        if (json_message['status'] != 'ok')
        {
            alert('append post to thread has failed');
            callback(false);
        }

        if (callback)
        {
            callback(true);
        }
    });
}

/*
 * Gets list of the resolved posts of a thread
 * @param <thread_name> : thread's name
 * @param <callback>: the function called once the response has arrived with parameter the list
            of the resolved posts
 *      
 */
hf_service.list_posts = function(thread_name,callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));
    assert(typeof thread_name == 'string');

    var thread_key = hf_service.get_decryption_key(hf_service.user_private_chunk, thread_name);

    hf_com.get_data_chunk(
        thread_name,
        thread_key,
        function(thread){

            var list_posts_info = thread['chunk_content'];
            var list_resolved_posts = [];
            var iteration = 0;

            if(list_posts_info.length == 0)
                callback(list_resolved_posts);
            
            for(var i = 0; i < list_posts_info.length; i++) {
                var post_info_json = JSON.parse(list_posts_info[i]);

                hf_com.get_data_chunk(
                    post_info_json['post_chunk_name'],
                    post_info_json['symetric_key'],
                    function(json_message){
                        if(json_message){

                            var post_content = JSON.parse(json_message['chunk_content']);

                            hf_service.resolve_post_author(post_content, function(resolved_post){
                                if(resolved_post){
                                    list_resolved_posts.push(resolved_post);
                                }
                            });
                        }

                        iteration++;

                        if(iteration == list_posts_info.length)
                            callback(list_resolved_posts);
                    }
                );
            }
        }
    );
}


/*
 * Generic post resolver adding the ['author'] key fetched from the
 * ['__meta']['author_user_hash']
 */
hf_service.resolve_post_author = function(post_json, callback)
{
    hf_service.get_user_public_chunk(
        post_json['__meta']['author_user_hash'],
        function(user_public_chunk)
        {
            if (user_public_chunk == null)
            {
                callback(null);
            }

            var post = hf.clone(post_json);

            post['author'] = user_public_chunk;

            callback(post);
        }
    );
}
