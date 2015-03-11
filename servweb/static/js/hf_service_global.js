
hf_service.global_chunks_names = [
    '/global/users_list',
    '/global/groups_list',
];

/*
 * Inits server
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.init_global = function(callback)
{
    var transaction = new hf_com.Transaction();

    var global_owner = hf.generate_hash('');

    for (var i = 0; i < hf_service.global_chunks_names.length; i++)
    {
        transaction.create_data_chunk(
            hf_service.global_chunks_names[i],
            global_owner,
            '',
            [],
            true
        );
    }

    transaction.commit(function(json_message){
        callback(json_message['status'] == 'ok');
    });
}

/*
 * @param <transaction>: the transaction in charge of commiting it
 * @param <global_chunk_name>: the global chunk name where to push
 * @param <public_chunk_name>: the public chunk name to list
 */
hf_service.publish_into_global_list = function(transaction, global_chunk_name, public_chunk_name)
{
    assert(hf_service.global_chunks_names.indexOf(global_chunk_name) >= 0);
    assert(hf.is_hash(public_chunk_name));

    transaction.extend_data_chunk(
        global_chunk_name,
        '',
        '',
        [public_chunk_name]
    );
}

/*
 * @param <global_chunk_name>: the global chunk name where to list is
 * @param <callback>: the function called once done
 *      @param <global_list>: the list once successed
 *      function my_callback(global_list)
 */
hf_service.global_list = function(global_chunk_name, callback)
{
    assert(hf_service.global_chunks_names.indexOf(global_chunk_name) >= 0);

    hf_com.get_data_chunk(global_chunk_name, '', function(json_message){
        if (json_message == null)
        {
            return callback(null);
        }

        callback(json_message['chunk_content']);
    });
}
