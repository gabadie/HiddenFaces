
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
    assert(hf.is_function(callback));

    var circle_infos = hf_service.user_private_chunk['circles'][circle_hash];
    var contact_infos = hf_service.user_private_chunk['contacts'][contact_user_hash];

    if (circle_infos['contacts'].indexOf(contact_user_hash) >= 0)
    {
        assert(contact_infos['circles'].indexOf(circle_hash) >= 0);

        callback(false);
        return;
    }

    assert(contact_infos['circles'].indexOf(circle_hash) < 0);

    circle_infos['contacts'].push(contact_user_hash);
    contact_infos['circles'].push(circle_hash);

    hf_service.save_user_chunks(function(success){
        var chunk_info = {
            'name': circle_hash,
            'type': '/thread',
            'symetric_key': hf_service.get_decryption_key(hf_service.user_private_chunk, circle_hash)
        };

        hf_service.send_contacts_infos_to_contacts([contact_user_hash], [chunk_info], callback);
    });
}

/*
 * @param <contacts_hashes>: list contacts' user hashes
 * @param <circle_hash>: circle's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true
 *      function my_callback(success)
 */
hf_service.add_contacts_to_circle = function(contacts_hashes, circle_hash, callback)
{
    assert(contacts_hashes instanceof Array);
    var iteration = contacts_hashes.length;

    if(iteration === 0){
        callback(true);
    }

    for (var i = 0; i < contacts_hashes.length; i++)
    {
        assert(hf_service.is_contact(contacts_hashes[i]));

        if(!hf_service.is_contact_into_circle(contacts_hashes[i],circle_hash)){

            hf_service.add_contact_to_circle(contacts_hashes[i], circle_hash, function(success){
                if(success == false){
                    console.info('Cannot add contact to circle');
                }

                iteration--;
                if(iteration === 0){
                    callback(true);
                }
            });

        }else{
            iteration--;
            if(iteration === 0){
                callback(true);
            }
        }
    }
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
 * Gets the map hash-public_chunk of circle's contacts
 * @param <circle_hash>: the hash of the specified circle
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunks>: the contacts' hash-public chunk
 *      function my_callback(public_chunks)
 */
hf_service.list_circle_contacts = function(circle_hash,callback)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_circle_hash(circle_hash));
    assert(hf.is_function(callback));

    var circle_contacts = hf_service.user_private_chunk['circles'][circle_hash]['contacts'];
    var content = {};

    var iteration = circle_contacts.length;

    if (iteration === 0) {
        callback(content);
        return;
    }

    for(var i = 0; i < circle_contacts.length; i++) {
        hf_service.get_user_public_chunk(circle_contacts[i], function(public_chunk) {
            if (public_chunk)
            {
                content[circle_contacts[i]] = public_chunk;
            }

            iteration--;
            if (iteration === 0) {
                callback(content);
            }
        });
    }
}

/*
 * @param <circle_hash>: circle's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <circle>: resolved circle
 *      function my_callback(circle)
 */
hf_service.get_circle = function(circle_hash, callback)
{
    assert(hf_service.is_circle_hash(circle_hash));
    assert(hf.is_function(callback));

    // TODO: resolve
    callback(hf_service.user_private_chunk['circles'][circle_hash]);
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
        // TODO: resolve
        circles_list.push(hf.clone(hf_service.user_private_chunk['circles'][circle_hash]));
    }

    callback(circles_list);
}

/*
 * Lists circle's names
 * @param <callback>: the function called once the response has arrived
 *      @param <circles_names>: the circle info list
 *      function my_callback(circles_names)
 */
hf_service.list_circles_names = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));

    var circles_names = [];

    for (var circle_hash in hf_service.user_private_chunk['circles'])
    {
        circles_names.push(circle_hash);
    }

    callback(circles_names);
}

/*
 * Lists circle's threads names
 * @param <circle_hash>: circle's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <threads_names>: the list of threads names
 *      function my_callback(threads_names)
 */
hf_service.list_circle_threads_names = function(circle_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf_service.is_circle_hash(circle_hash));
    assert(hf.is_function(callback));

    var contacts = hf_service.user_private_chunk['contacts'];
    var circle_contacts_lists = hf_service.user_private_chunk['circles'][circle_hash]['contacts'];
    var threads_names = [circle_hash];

    for (var i = 0; i < circle_contacts_lists.length; i++)
    {
        var contact_user_hash = circle_contacts_lists[i];

        threads_names = threads_names.concat(contacts[contact_user_hash]['threads']);
    }

    callback(threads_names);
}
