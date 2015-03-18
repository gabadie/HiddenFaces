
hf_service.search_string_pattern = function(pattern, callback)
{
    assert(typeof pattern == 'string');
    assert(hf.is_function(callback));

    var matching_chunks = [];

    if(pattern == ''){
        callback(matching_chunks);
        return;
    }

    pattern = pattern.toLowerCase();

    hf_service.search_string_pattern_users(pattern, function(users_chunks){
        if(users_chunks){
            matching_chunks = users_chunks;
        }
        hf_service.search_string_pattern_groups(pattern, function(groups_chunks){
            if(groups_chunks){
                matching_chunks = matching_chunks.concat(groups_chunks);
            }
            callback(matching_chunks);
        });
    });

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
                        if(users_chunks[i]['profile']['first_name'].toLowerCase().search(pattern) >= 0 ||
                            users_chunks[i]['profile']['last_name'].toLowerCase().search(pattern) >= 0){
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

hf_service.search_string_pattern_groups = function(pattern, callback)
{
    var groups_matching_chunks = [];

    hf_com.get_data_chunk('/global/groups_list', '', function(json_message){

        if (json_message['chunk_content'])
        {
            hf_service.get_group_public_chunks(json_message['chunk_content'], function(groups_chunks_list){
                if(groups_chunks_list){
                    for(var i = 0; i < groups_chunks_list.length; i++){
                        if(groups_chunks_list[i]['group']['name'].toLowerCase().search(pattern) >= 0 ||
                            groups_chunks_list[i]['group']['description'].toLowerCase().search(pattern) >= 0){
                            groups_matching_chunks.push(groups_chunks_list[i]);
                        }
                    }
                }
                callback(groups_matching_chunks);
            });
        }else{
            console.info("Cannot find global groups list chunk");
            callback(null);
        }

    });
}
