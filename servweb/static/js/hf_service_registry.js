hf_service.chunkTypeRegistry = {};

var meta_names = ['/user/private_chunk', '/user/public_chunk'];

hf_service.is_valide_chunk = function(chunk_content)
{
	if(!('__meta' in chunk_content))
		return false;
	var meta_name = chunk_content['__meta']['type'];
	
	if(meta_names.indexOf(meta_name) == -1)
		return false;
	if(meta_name == meta_names[0]) {
		if (meta_name in hf_service.chunkTypeRegistry)
			return hf_service.chunkTypeRegistry[meta_name];
		hf_service.chunkTypeRegistry[meta_name] = true;
		return true;
	} else if (meta_name == meta_names[1]) {
		if (meta_name in hf_service.chunkTypeRegistry)
			return hf_service.chunkTypeRegistry[meta_name];
		hf_service.chunkTypeRegistry[meta_name] = true;
		return true;
	}
	return false;
} 