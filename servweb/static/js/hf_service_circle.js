
// --------------------------------------------------------------------- CIRCLES

/*
 * @param <circle_name>: circle's name
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.create_circle = function(circle_name, callback)
{
    assert(hf_service.is_connected());
    assert(typeof circle_name == 'string');
    assert(hf.is_function(callback));

    var circle_hash = null;

    hf_service.create_thread(hf_service.user_chunks_owner(), false, false, function(thread_info){
        assert(thread_info['status'] == 'ok');

        var thread_chunk_name = thread_info['thread_chunk_name'];
        var thread_chunk_key = thread_info['symetric_key'];

        var circle_infos = {
            'name':                 circle_name,
            'contacts':             [],
            'thread_chunk_name':    thread_chunk_name
        };

        var user_private_chunk = hf_service.user_private_chunk;

        user_private_chunk['circles'][thread_chunk_name] = circle_infos;

        hf_service.store_key(user_private_chunk, thread_chunk_name, thread_chunk_key);

        hf_service.save_user_chunks(function(success){
            callback(success)
        });

        circle_hash = thread_chunk_name;
    });

    /*
     * For testing efficiency, we return the circle's hash
     */
    return circle_hash;
}

/*
 * @param <circle_hash>: circle's hash tp test
 *
 * @returns true or false
 */
hf_service.is_circle_hash = function(circle_hash)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(circle_hash));

    return circle_hash in hf_service.user_private_chunk['circles'];
}

/*
 * @param <contact_user_hash>: contact's user hash
 * @param <circle_hash>: circle's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.add_contact_to_circle = function(contact_user_hash, circle_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_contact(contact_user_hash));
    assert(hf_service.is_circle_hash(circle_hash));

    var circle_infos = hf_service.user_private_chunk['circles'][circle_hash];
    var contact_infos = hf_service.user_private_chunk['contacts'][contact_user_hash];

    if (circle_infos['contacts'].indexOf(contact_user_hash) >= 0)
    {
        assert(contact_infos['circles'].indexOf(circle_hash) >= 0);

        if (callback)
            callback(false);
        return;
    }

    assert(contact_infos['circles'].indexOf(circle_hash) < 0);

    circle_infos['contacts'].push(contact_user_hash);
    contact_infos['circles'].push(circle_hash);

    hf_service.save_user_chunks(function(success){
        if(callback)
            callback(success);
        //TODO : send key
    });
}

/*
 * @param <contact_user_hash>: contact's user hash
 * @param <circle_hash>: circle's hash
 *
 * @returns true or false accordingly
 */
hf_service.is_contact_into_circle = function(contact_user_hash, circle_hash)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_contact(contact_user_hash));
    assert(hf_service.is_circle_hash(circle_hash));

    var circle_infos = hf_service.user_private_chunk['circles'][circle_hash];
    var contact_infos = hf_service.user_private_chunk['contacts'][contact_user_hash];

    var result = circle_infos['contacts'].indexOf(contact_user_hash) >= 0;

    assert((contact_infos['circles'].indexOf(circle_hash) >= 0) == result);

    return result;
}

/*
 * Lists circle's infos
 * @param <callback>: the function called once the response has arrived
 *      @param <circles_list>: the circle info list
 *      function my_callback(circles_list)
 */
hf_service.list_circles = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));

    var circles_list = [];

    for (var circle_hash in hf_service.user_private_chunk['circles'])
    {
        circles_list.push(hf.clone(hf_service.user_private_chunk['circles'][circle_hash]));
    }

    callback(circles_list);
}
