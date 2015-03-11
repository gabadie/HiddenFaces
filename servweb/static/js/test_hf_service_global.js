
test_hf_service.publish_into_global_list = function()
{
    var chunk_name = hf.generate_hash('');

    var transaction = new hf_com.Transaction();

    for (var i = 0; i < hf_service.global_chunks_names.length; i++)
    {
        var global_chunk_name = hf_service.global_chunks_names[i];

        hf_service.global_list(global_chunk_name, function(global_list){
            test_utils.assert(global_list.length == 0, global_chunk_name + ' should be empty');
        });

        hf_service.publish_into_global_list(transaction, global_chunk_name, chunk_name);
    }

    transaction.commit(function(json_message){
        test_utils.assert(json_message['status'] == 'ok', 'hf_service.publish_in_global_list() has failed');
    });

    for (var i = 0; i < hf_service.global_chunks_names.length; i++)
    {
        var global_chunk_name = hf_service.global_chunks_names[i];

        hf_service.global_list(global_chunk_name, function(global_list){
            test_utils.assert(global_list.length > 0, global_chunk_name + ' should not be empty');
        });
    }

    test_utils.assert_success(2 * hf_service.global_chunks_names.length + 1);
}
