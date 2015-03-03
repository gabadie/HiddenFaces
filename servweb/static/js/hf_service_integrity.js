/* Adds the certification of a chunk into user's private and public chunks
 * @param <certificate_repository>: the chunk the certification will be added to. Must contain field 'certifications'
 * @param <data_chunk_name>: the name of the chunk to be certificated
 * @param <data_chunk_part>: the hash identifier of the part 
 * @param <data_hash>: the hash of the content of the chunk_part
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.certify = function(certificate_repository, data_chunk_name, data_chunk_part, data_hash, callback){
	assert('certifications' in certificate_repository);
	assert(hf.is_hash(data_chunk_part));
    assert(hf.is_hash(data_hash));

    var certification = {
    	'data_hash' : data_hash
    };

    if(data_chunk_part)
    	certification['data_chunk_part'] = data_chunk_part;

    certificate_repository['certifications'][hf.hash(data_chunk_name)] = certification;

    hf_service.save_user_chunks(function(){
        callback(true);
    });
}

/* Verifies the certification of the specified chunk
 * @param <certificate_repository>: the chunk the certification is in. Must contain field 'certifications'
 * @param <data_chunk_name>: the name of the chunk to be verified
 * @param <data_chunk_part>: the hash identifier of the part 
 * @param <data_hash>: the hash of the chunk
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.verify_certification = function(certificate_repository, data_chunk_name, data_chunk_part, data_hash, callback){
	assert('certifications' in certificate_repository);
    assert(hf.is_hash(data_hash));

    var certification = certificate_repository['certifications'][hf.hash(data_chunk_name)];

    if (certification['data_hash'] == data_hash){
	    if(data_chunk_part){
	    	assert(hf.is_hash(data_chunk_part));  

	    	if(certification['data_chunk_part'] == data_chunk_part)
	    		callback(true);

	    }else{
	    	callback(true);
	    }
	}
	callback(false);
}