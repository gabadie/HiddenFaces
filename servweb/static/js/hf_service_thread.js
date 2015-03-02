/*
 * Creates a thread
 *
 * @param <user_hash>: the hash of the owner of the thread
 * @param <public_append>: if anyone can append content on the threads
 */
hf_service.create_thread = function(user_hash, public_append, public_thread, callback)
{
    assert(typeof user_hash == "string", "user_hash must be a string in hf_service.create_thread");
    assert(hf.is_hash(user_hash));
    assert(typeof public_append == "boolean", "public_append must be a boolean in hf_service.create_thread");

    var thread_content = [];
    var thread_chunk_name =
        hf.generate_hash('C3jsud4AZkDpd7IKEtEH\n');
    var symetric_key = ''; //TODO

    // Creates the thread's chunk
    hf_com.create_data_chunk(
        thread_chunk_name,
        user_hash,
        symetric_key,
        thread_content,
        public_append,
        function(json_message){

            var thread_info = {
                'status' : json_message["status"],
                'thread_chunk_name':   thread_chunk_name,
                'symetric_key':   symetric_key
            };

            callback(thread_info);
        }
    );
}

hf_service.create_post = function(user_hash, post_content,callback)
{
    assert(typeof user_hash == "string", "user_hash must be a string in hf_service.create_post");
    assert(hf.is_hash(user_hash));
    assert(typeof post_content['__meta']['type'] == 'string');
    assert(post_content['__meta']['type'] == '/post');
    assert(hf.is_hash(post_content['__meta']['author_user_hash']));

    var post_chunk_name =
        hf.generate_hash('ERmO4vptXigWBnDUjnEN\n');
    var symetric_key = ''; //TODO
    var stringified_post_content = [JSON.stringify(post_content)];

    // Creates the thread's chunk
    hf_com.create_data_chunk(
        post_chunk_name,
        user_hash,
        symetric_key,
        stringified_post_content,
        true,
        function(json_message){

            var post_info = {
                'status' :  json_message['status'], 
                'post_chunk_name':   post_chunk_name,
                'symetric_key':   symetric_key
            };

            callback(post_info);
        }
    );
}

hf_service.append_post_to_threads = function(post_info, threads_list,callback)
{
    assert(typeof post_info['post_chunk_name'] == "string");
    assert(typeof post_info['symetric_key'] == "string");
    assert(threads_list instanceof Array, "threads_list must be an Array in hf_service.append_post_to_threads");

    var stringified_post_info = JSON.stringify(post_info);

    for (var i = 0; i < threads_list.length; i++)
    {
        assert(typeof threads_list[i]['thread_chunk_name'] == "string");
        assert(typeof threads_list[i]['symetric_key'] == "string");
        hf_com.append_data_chunk(
            threads_list[i]['thread_chunk_name'],
            hf_service.user_chunks_owner(),
            threads_list[i]['symetric_key'],
            stringified_post_info,
            function(json_message) {
                if (json_message['status'] != 'ok')
                {
                    allert(
                        'hf_service.append_post_to_threads(' +
                        stringified_post_info + ' , ' +
                        threads_list[i]['thread_chunk_name'] +
                        ') failed'
                    );
                    callback(false);
                    return;
                }
            }
        );
    }
    callback(true);
}
