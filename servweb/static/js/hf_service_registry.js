hf_service.chunkTypeRegistry = {
	'/user/private_chunk': hf_service.is_valide_private_chunk,
	'/user/public_chunk': hf_service.is_validate_public_chunk
};

/* 
 * verify chunk's content
 *
 * @params <chunk_content>: content of a chunk
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_chunk = function(chunk_content)
{
	try {
		return hf_service.chunkTypeRegistry[chunk_content['__meta']['type']](chunk_content);
	} catch (err) {
		return false;
	}
} 

/* 
 * verify public chunk's content
 *
 * @params <chunk_content>: content of a chunk
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_validate_public_chunk = function(chunk_content)
{
	try {
		var chunk_meta = chunk_content['__meta'];
		var chunk_profile = chunk_content['profile'];
		var chunk_system = chunk_content['system'];

		return hf_service.is_valide_profile(chunk_profile) 
			   && hf_service.is_valide_meta(chunk_meta) 
			   && hf_service.is_valide_system(chunk_system);	
	} catch (err) {
		return false;
	}
}

/* 
 * verify private chunk's content
 *
 * @params <chunk_content>: content of a private chunk
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_private_chunk = function(chunk_content)
{
	try {
		var notifs = chunk_content['notifications'];
		var circles = chunk_content['circles'];
		var keykeeper = chunk_content['keykeeper'];
		var contacts = chunk_content['contacts'];

		var chunk_meta = chunk_content['__meta'];
		var chunk_profile = chunk_content['profile'];
		var chunk_system = chunk_content['system'];

		return hf_service.is_valide_private_profile(chunk_profile) 
			   && hf_service.is_valide_private_meta(chunk_meta) 
			   && hf_service.is_valide_private_system(chunk_system);
	} catch (err) {
		return false;
	}
}

/* 
 * verify profile's content (commun function for public and private chunk)
 *
 * @params <chunk_profile>: content of a profile
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_profile = function(chunk_profile)
{
	try {
		var first_name = chunk_profile['first_name'];
	    var last_name = chunk_profile['last_name'];
	    
	    return typeof(first_name) == 'string' 
	    	   && !hf_service.is_empty_string(first_name) 
	    	   && typeof(last_name) == 'string' 
	           && !hf_service.is_empty_string(last_name);
    } catch (err) {
    	return false;
    }
}

/* 
 * verify private profile's content
 *
 * @params <chunk_profile>: content of a profile
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_private_profile = function(chunk_profile) 
{
	try {
		var valide = hf_service.is_valide_profile(chunk_profile);
		if (valide == false)
			return false; 

		var email = chunk_profile['email'];

		return typeof(email) == 'string' 
			   && !hf_service.is_empty_string(email);
	} catch(err) {
		return false;
	}
}

/* 
 * verify meta data 's chunk (commun function for private && pubic chunk)
 *
 * @params <chunk_meta>: meta data of a chunk
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_meta = function(chunk_meta)
{
	try {
	    var hash = chunk_meta['user_hash'];
	    var chunk_name = chunk_meta['chunk_name'];

	    return hf.is_hash(hash) 
	    	   && hf.is_hash(chunk_name) ;
    } catch (err) {
    	return false;
    }
}

/* 
 * verify private meta data 's chunk
 *
 * @params <chunk_meta>: meta data of a private chunk
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_private_meta = function(chunk_meta)
{
	try {
		var valide = hf_service.is_valide_meta(chunk_meta);
		if (valide == false)
			return false;

		var key = chunk_meta['key'];
		return !hf_service.is_empty_string(key);
	} catch (err) {
		return false;
	}
} 
/* 
 * verify system 's chunk (common function for public and private)
 *
 * @params <chunk_system>: system object of a chunk
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_system = function(chunk_system) 
{   
    try {
		var protected_chunk = chunk_system['protected_chunk'];
	    var name = protected_chunk['name'];
	    var public_key = protected_chunk['public_key'];

	    return hf.is_hash(name) 
	    	   && !hf_service.is_empty_string(public_key);
    } catch (err) {
    	return false;
    }
}

/* 
 * verify private system 's chunk
 *
 * @params <chunk_system>: system object of a chunk
 *
 * @return: true if the chunk is well formated, false otherwise
 */
hf_service.is_valide_private_system = function(chunk_system) 
{
	try {
		var valide_commun_system = hf_service.is_valide_system(chunk_system);
		if (valide_commun_system == false)
			return false;

		var chunks_owner = chunk_system['chunks_owner'];
		var private_key = chunk_system['protected_chunk']['private_key'];

    	return hf.is_hash(chunks_owner) 
    		   && !hf_service.is_empty_string(private_key);
   	} catch (err){
    	return false;
    }
}

/* 
 * verify if a string is empty
 *
 * @params <str>: string to verify
 *
 * @return: true if empty, false if otherwise
 */
hf_service.is_empty_string = function(str) 
{
	return (!str || 0 === str.length);
}
