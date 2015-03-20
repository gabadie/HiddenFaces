/*
 * Searchs for a string pattern in users and groups chunks
 * @param <pattern>: the string to find
 * @param <callback>: the function called once the response has arrived
 *      @param <matching_chunks>: the list of matching groups and users public chunks
 *      function my_callback(matching_chunks)
 */
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
    var patterns_list = pattern.split(' ');

    hf_service.search_string_pattern_users(patterns_list, function(users_chunks){
        if(users_chunks){
            matching_chunks = users_chunks;
        }
        hf_service.search_string_pattern_groups(patterns_list, function(groups_chunks){
            if(groups_chunks){
                matching_chunks = matching_chunks.concat(groups_chunks);
            }
            callback(matching_chunks);
        });
    });

}

/*
 * Searchs for a string pattern in users chunks (fields profile.first_name and profile.last_name)
 * @param <patterns>: the list of strings to find
 * @param <callback>: the function called once the response has arrived
 *      @param <matching_chunks>: the list of matching users public chunks.
 *              = null if cannot access global users list chunk
 *      function my_callback(matching_chunks)
 */
hf_service.search_string_pattern_users = function(patterns, callback)
{
    assert(patterns instanceof Array);
    var users_matching_chunks = [];

    hf_com.get_data_chunk('/global/users_list', '', function(json_message){

        if (json_message['chunk_content'])
        {
            hf_service.get_users_public_chunks(json_message['chunk_content'], function(users_chunks_map){
                if(users_chunks_map){

                    var users_chunks = hf.values(users_chunks_map);

                    for(var i = 0; i < users_chunks.length; i++){
                        for(var j = 0; j < patterns.length; j++){
                            if((users_matching_chunks.indexOf(users_chunks[i]) < 0) &&
                                (users_chunks[i]['profile']['first_name'].toLowerCase().search(patterns[j]) >= 0 ||
                                users_chunks[i]['profile']['last_name'].toLowerCase().search(patterns[j]) >= 0)){
                                users_matching_chunks.push(users_chunks[i]);
                            }
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

/*
 * Searchs for a string pattern in groups chunks (fields group.name and group.description)
 * @param <patterns>: the list of strings to find
 * @param <callback>: the function called once the response has arrived
 *      @param <matching_chunks>: the list of matching groups public chunks.
 *              = null if cannot access global groups list chunk
 *      function my_callback(matching_chunks)
 */
hf_service.search_string_pattern_groups = function(patterns, callback)
{
    assert(patterns instanceof Array);
    var groups_matching_chunks = [];

    hf_com.get_data_chunk('/global/groups_list', '', function(json_message){

        if (json_message['chunk_content'])
        {
            hf_service.get_group_public_chunks(json_message['chunk_content'], function(groups_chunks_list){
                if(groups_chunks_list){
                    for(var i = 0; i < groups_chunks_list.length; i++){
                        for(var j = 0; j < patterns.length; j++){
                            if((groups_matching_chunks.indexOf(groups_chunks_list[i]) < 0) &&
                                (groups_chunks_list[i]['group']['name'].toLowerCase().search(patterns[j]) >= 0 ||
                                groups_chunks_list[i]['group']['description'].toLowerCase().search(patterns[j]) >= 0)){
                                groups_matching_chunks.push(groups_chunks_list[i]);
                            }
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
