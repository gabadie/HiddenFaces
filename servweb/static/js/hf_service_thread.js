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
    assert(hf.is_function(callback) || callback == undefined);
    assert(typeof public_append == "boolean", "public_append must be a boolean in hf_service.create_thread");

    var part_hash = hf.generate_hash('uGzvkgD6lr6WlMTbvhWK\n');
    var user_hash = hf_service.user_hash();

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

            if(callback)
                callback(thread_info);
        }
    );

    /*
     * For testing conveniency, we return the thread name
     */
    return {
        'thread_chunk_name': thread_chunk_name,
        'symetric_key': symetric_key
    };
}

/*
 * Creates a post
 *
 * @param <post_content>: the content of the post
  * @param <threads_list>: (= null if unspecified) list the threads the post will be posted to.
  A thread must contain fields
            {
                'thread_chunk_name':,
                'symetric_key':
            }; (= null if unspecified)
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
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);

    var owner_hash = hf_service.user_chunks_owner();
    var user_hash = hf_service.user_hash();

    var part_hash = hf.generate_hash('uGzvkgD6lr6WlMTbvhWK\n');
    var post_chunk_name =
        hf.generate_hash('ERmO4vptXigWBnDUjnEN\n');
    var post_chunk_content = {
        '__meta': {
            'type': '/post',
            'chunk_name': post_chunk_name,
            'part_hash' : part_hash,
            'author_user_hash': user_hash
        },
        'date': hf.get_date_time(),
        'content': post_content
    };

    var stringified_post_content = JSON.stringify(post_chunk_content);

    var symetric_key = hf_com.generate_AES_key('uhgGFoMBXi');

    // Creates the post's chunk
    hf_com.create_data_chunk(
        post_chunk_name,
        owner_hash,
        symetric_key,
        [stringified_post_content],
        true,
        function(json_message){
            if (json_message['status'] != 'ok')
            {
                allert("post creation has failed");
                if(callback)
                    callback(null);
                return;
            }

            var post_info = {
                'status' :  json_message['status'],
                'post_chunk_name':   post_chunk_name,
                'symetric_key':   symetric_key
            };

            //chunk certification
            hf_service.certify(
                hf_service.user_private_chunk,
                post_chunk_name,
                part_hash,
                hf.hash(stringified_post_content),
                function(success){
                    if(success){
                        if(threads_list){
                            hf_service.append_post_to_threads(post_chunk_name,symetric_key, threads_list,callback);
                        }else if (callback){
                            callback(post_info);
                        }
                    }else if(callback){
                        callback(null);
                    }
                }
            );
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
            = {
                "post_chunk_name" : ,
                "symetric_key" :
            }; if the append had succeded
            = null otherwise
 */
hf_service.append_post_to_threads = function(post_name, post_key, threads_list,callback)
{
    assert(typeof post_name == "string");
    assert(typeof post_key == "string");
    assert(threads_list instanceof Array, "threads_list must be an Array in hf_service.append_post_to_threads");
    assert(typeof threads_list[0] !== 'undefined', "threads_list is empty in hf_service.append_post_to_threads");
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);

    var transaction = new hf_com.Transaction();

    var post_info = {
        "post_chunk_name" : post_name,
        "symetric_key" : post_key
    };
    var stringified_post_info = JSON.stringify(post_info);

    hf_com.get_data_chunk(
        post_name,
        post_key,
        function(json_message){
            assert(json_message['chunk_content'][0] !== 'undefined');
            var element_json = JSON.parse(json_message['chunk_content'][0]);

            assert(element_json['__meta']['type'] == '/post');
            var post_part_hash = element_json['__meta']['part_hash'];

            var iteration = threads_list.length;
            for (var i = 0; i < threads_list.length; i++)
            {
                assert(typeof threads_list[i]['thread_chunk_name'] == "string");
                assert(typeof threads_list[i]['symetric_key'] == "string");

                hf_service.certify(hf_service.user_private_chunk,
                    threads_list[i]['thread_chunk_name'],
                    post_part_hash,
                    hf.hash(stringified_post_info),
                    function(success){
                        iteration--;

                        if(!success){
                            if(callback)
                                callback(false);
                            console.info('cannot certify post in thread');
                            return;
                        }
                        transaction.extend_data_chunk(
                            threads_list[i]['thread_chunk_name'],
                            hf_service.user_chunks_owner(),
                            threads_list[i]['symetric_key'],
                            [stringified_post_info]
                        );

                        if(iteration == 0){
                            transaction.commit(function(json_message){
                                if (json_message['status'] != 'ok'){
                                    if(callback)
                                        callback(null);
                                }else if (callback){
                                    callback(post_info);
                                }
                            });
                        }
                    }
                );
            }
        }
    );
}
/*
 * Appends a comment to the specified post
 * @param <post_chunk_name> : the name of the post the comment will be appended to
 * @param <post_chunk_key> : the encryption key of the post the comment will be appended to
 * @param <comment> : the comment to be appended
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.comment_post = function(post_chunk_name,post_chunk_key,comment,callback)
{
    assert(hf.is_hash(post_chunk_name));
    assert(typeof comment == 'string');
    assert(hf_com.is_AES_key(post_chunk_key) || post_chunk_key == '');
    assert(hf.is_function(callback) || callback == undefined);

    var transaction = new hf_com.Transaction();

    var part_hash = hf.generate_hash('tZsSPDK94TJZhhGHF2j8\n');
    var user_hash = hf_service.user_hash();
    var comment_json = {
        '__meta': {
            'type': '/comment',
            'part_hash' : part_hash,
            'author_user_hash': user_hash
        },
        'date': hf.get_date_time(),
        'content': comment
    };
    var stringified_comment = JSON.stringify(comment_json);

    hf_service.certify(hf_service.user_private_chunk,
        post_chunk_name,
        part_hash,
        hf.hash(stringified_comment),
        function(success){
            if(!success){
                if(callback)
                    callback(false);
                return;
            }
            transaction.extend_data_chunk(
                post_chunk_name,
                hf_service.user_chunks_owner(),
                post_chunk_key,
                [stringified_comment]
            );

            transaction.commit(function(json_message){
                if (json_message['status'] != 'ok'){
                    if(callback)
                        callback(false);
                }else if (callback){
                    callback(true);
                }
            });
        }
    );
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
    assert(hf.is_function(callback) || callback == undefined);
    assert(hf.is_hash(thread_name));

    var thread_key = hf_service.get_decryption_key(hf_service.user_private_chunk, thread_name);

    var list_posts = null;

    hf_com.get_data_chunk(thread_name,thread_key,function(thread_json_message){
        assert(thread_json_message['status'] == 'ok');

        var list_posts_info = thread_json_message['chunk_content'];
        var list_resolved_posts = [];
        var iteration = 0;

        if(list_posts_info.length == 0 && callback){
            callback(list_resolved_posts);
            return;
        }

        for(var i = 0; i < list_posts_info.length; i++) {
            var post_info_json = JSON.parse(list_posts_info[i]);

            (function(post_info_json){
                hf_com.get_data_chunk(
                    post_info_json['post_chunk_name'],
                    post_info_json['symetric_key'],
                    function(json_message){
                        assert(json_message['status'] == 'ok');
                        hf_service.resolve_post_author(
                            thread_name,
                            post_info_json['symetric_key'],
                            json_message['chunk_content'],
                            function(resolved_post){
                                if(resolved_post){
                                    list_resolved_posts.push(resolved_post);
                                }

                                iteration++;

                                if(iteration == list_posts_info.length)
                                {
                                    list_resolved_posts.sort(function(post_a, post_b){
                                        if (post_a['date'] > post_b['date'])
                                        {
                                            return -1;
                                        }
                                        else if (post_a['date'] < post_b['date'])
                                        {
                                            return 1;
                                        }

                                        return 0;
                                    });

                                    if (callback)
                                    {
                                        callback(list_resolved_posts);
                                    }

                                    list_posts = list_resolved_posts;
                                }
                            }
                        );
                    }
                );
            })(post_info_json)
        }
    });

    /*
     * For testing conveniency, we return the thread name
     */
    return list_posts;
}

/*
 * Comment resolver adding the ['author'] key fetched from the
 * ['__meta']['author_user_hash'] and verifying its certification
 */
hf_service.resolve_comment_author = function(post_name,comment_json, callback)
{
    assert(hf.is_function(callback));
    assert(hf.is_hash(post_name));

    hf_service.get_user_public_chunk(
        comment_json['__meta']['author_user_hash'],
        function(user_public_chunk)
        {
            if (user_public_chunk == null)
            {
                callback(null);
                return;
            }

            hf_service.verify_certification(
                user_public_chunk,
                post_name,
                comment_json['__meta']['part_hash'],
                hf.hash(JSON.stringify(comment_json)),
                function(success){
                    if(!success){ //if the comment is not certified
                        callback(null);
                        console.info('comment not certified');
                        return;
                    }
                    var comment = hf.clone(comment_json);
                    comment['author'] = user_public_chunk;

                    callback(comment);
                }
            );
        }
    );
}

/*
 * Generic post resolver adding the ['author'] key fetched from the
 * ['__meta']['author_user_hash'] and verifying its certification
 */
hf_service.resolve_post_author = function(thread_name,post_key,post_content, callback)
{
    assert(hf.is_function(callback));
    assert(typeof post_content[0] == 'string');

    var post_json = JSON.parse(post_content[0]);
    var post_name = post_json['__meta']['chunk_name'];

    var post_info = {
        "post_chunk_name" : post_name,
        "symetric_key" : post_key
    };
    var stringified_post_info = JSON.stringify(post_info);

    hf_service.get_user_public_chunk(post_json['__meta']['author_user_hash'],function(user_public_chunk){
        if (user_public_chunk == null)
        {
            callback(null);
            return;
        }

        //verify post certification
        hf_service.verify_certification(
            user_public_chunk,
            post_name,
            post_json['__meta']['part_hash'],
            hf.hash(post_content[0]),
            function(success){
                if(!success){ //if the post is not certified
                    callback(null);
                    console.info('post not certified');
                    return;
                }
                //verify post in thread certification
                hf_service.verify_certification(
                    user_public_chunk,
                    thread_name,
                    post_json['__meta']['part_hash'],
                    hf.hash(JSON.stringify(post_info)),
                    function(success){
                        if(!success){ //if the post is not certified
                            callback(null);
                            console.info('post not certified');
                            return;
                        }
                        //post resolution
                        var clone_post = hf.clone(post_json);
                        clone_post['author'] = user_public_chunk;
                        clone_post['comments'] = [];

                        //comments resolution
                        var iterations = post_content.length - 1;

                        if(iterations == 0)
                            callback(clone_post);

                        for(var i = 1; i < post_content.length; i++){

                            hf_service.resolve_comment_author(
                                post_name,
                                JSON.parse(post_content[i]),
                                function(comment){
                                    if(comment){ //if comment not corrupted
                                        clone_post['comments'].push(comment);
                                    }
                                    iterations--;

                                    if(iterations == 0){

                                        clone_post['comments'].sort(function(comment_a, comment_b){
                                            if (comment_a['date'] > comment_b['date'])
                                            {
                                                return -1;
                                            }
                                            else if (comment_a['date'] < comment_b['date'])
                                            {
                                                return 1;
                                            }

                                            return 0;
                                        });

                                        callback(clone_post);
                                    }
                                }
                            );
                        }
                });
            }
        );
    });
}

/*
 * Merges differents posts lists into one, removing duplicated and keeping
 * the date order.
 *
 * @param <posts_lists>: the lists of posts lists
 * @returns a lists of cloned posts
 */
hf_service.merge_posts_lists = function(posts_lists)
{
    var posts_list = [];
    var lists_cursors = [];
    var posts_hash_listed = new Set();

    for (var i = 0; i < posts_lists.length; i++)
    {
        lists_cursors.push(0);
    }

    while (true)
    {
        var most_recent_list_id = 0;
        var most_recent_post = null;

        for (var i = 0; i < posts_lists.length; i++)
        {
            var post = null;

            while (true)
            {
                var lists_cursor = lists_cursors[i];

                post = null;

                if (lists_cursor == posts_lists[i].length)
                {
                    break;
                }

                post = posts_lists[i][lists_cursor];

                if (!posts_hash_listed.has(post['__meta']['chunk_name']))
                {
                    break;
                }

                lists_cursors[i]++;
            }

            if (post == null)
            {
                continue;
            }
            else if (most_recent_post == null || post['date'] > most_recent_post['date'])
            {
                most_recent_post = post;
                most_recent_list_id = i;
            }
        }

        if (most_recent_post == null)
        {
            break;
        }

        posts_list.push(hf.clone(most_recent_post));
        posts_hash_listed.add(most_recent_post['__meta']['chunk_name']);

        lists_cursors[most_recent_list_id]++;
    }

    return posts_list;
}
