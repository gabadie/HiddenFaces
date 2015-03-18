
hf_service.search_string_pattern = function(pattern, callback)
{
    assert(typeof pattern == 'string');
    assert(hf.is_function(callback));

    var matching_chunks = [];

    if(pattern == ''){
        callback(matching_chunks);
        return;
    }

    hf_service.search_string_pattern_users(pattern, callback);

}

hf_service.search_string_pattern_users = function(pattern, callback)
{
    var users_matching_chunks = [];

    hf_com.get_data_chunk('/global/users_list', '', function(json_message){

        if (json_message['chunk_content'])
        {
            hf_service.get_users_public_chunks(json_message['chunk_content'], function(users_chunks_map){
                if(users_chunks_map){

                    var users_chunks = hf.values(users_chunks_map);

                    for(var i = 0; i < users_chunks.length; i++){
                        if(users_chunks[i]['profile']['first_name'].search(pattern) >= 0 ||
                            users_chunks[i]['profile']['last_name'].search(pattern) >= 0){
                            users_matching_chunks.push(users_chunks[i]);
                        }
                    }
                }
                callback(users_matching_chunks);
            });
        }else{
            console.info("Cannot find global users list chunk");
            callback(null);
        }

    });
}
