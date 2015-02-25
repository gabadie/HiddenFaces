
// ---------------------------------------------------------------- USER SERVICE
/*
 * @returns true if an user is connected
 */
hf_service.is_connected = function()
{
    return (hf_service.user_private_chunk != null);
}

/*
 * Disconnects the current user
 */
hf_service.disconnect = function()
{
    assert(hf_service.is_connected());

    hf_service.reset_cache();
}

/*
 * Gets user's hash
 */
hf_service.user_hash = function()
{
    assert(hf_service.is_connected());

    return hf_service.user_private_chunk['__meta']['user_hash'];
}

/*
 * Gets user's chunks owner id
 */
hf_service.user_chunks_owner = function()
{
    assert(hf_service.is_connected());

    return hf_service.user_private_chunk['system']['chunks_owner'];
}

/*
 * Gets user's public chunk
 */
hf_service.user_public_chunk = function()
{
    assert(hf_service.is_connected());

    return hf_service.users_public_chunks[hf_service.user_hash()];
}

/*
 * Gets the private chunk's name and key from the user's email and
 * password.
 *
 * @param <user_login_profile>: a map at least containing keys "email" and "password"
 */
hf_service.user_private_chunk_name = function(user_login_profile)
{
    assert(typeof user_login_profile['email'] == "string", "email is not string");
    assert(typeof user_login_profile['password'] == "string", "password is not string");

    var salt = 'CYh6ON6zP0DPMLkJuzrV';

    return hf.hash(
        salt + '\n' +
        user_login_profile['email'] + '\n' +
        user_login_profile['password']
    );
}

hf_service.user_private_chunk_key = function(user_login_profile)
{
    return ''; //TODO
}

/*
 * Creates an user
 *
 * @param <user_profile>: the user profile
 * @param <callback>: the function once
 *      function my_callback(user_hash)
 *
 *      @param <user_hash>: is the user's hash if success login or null otherwise.
 */
hf_service.create_user = function(user_profile, callback)
{
    assert(typeof user_profile['first_name'] == "string");
    assert(typeof user_profile['last_name'] == "string");
    assert(typeof user_profile['email'] == "string");
    assert(typeof user_profile['password'] == "string");
    assert(user_profile['password'].length > 0);
    assert(hf.is_function(callback) || callback == undefined);

    var chunks_owner =
            hf.generate_hash('2lbfAs5v1yguvf2ETM7S\n' + user_profile['email']);
    var protected_chunk_name =
            hf.generate_hash('qUaMF8HtvLUtsXArCfhU\n' + user_profile['email']);

    var user_hash =
            hf.generate_hash('fWdFPoyxE4uNoTKoBswp\n' + user_profile['email']);

    var private_chunk_name =
            hf_service.user_private_chunk_name(user_profile);
    var private_chunk_key =
            hf_service.user_private_chunk_key(user_profile);

    assert(private_chunk_name != user_hash);
    assert(protected_chunk_name != user_hash);
    assert(private_chunk_name != protected_chunk_name);

    // Generates the user's private chunk's content
    var private_chunk = {
        '__meta': {
            'type':         '/user/private_chunk',
            'user_hash':    user_hash,
            'chunk_name':   private_chunk_name,
            'key':          private_chunk_key
        },
        'profile': {
            'first_name':   user_profile['first_name'],
            'last_name':    user_profile['last_name'],
            'email':        user_profile['email'],
        },
        'system': {
            'protected_chunk': {
                'name':         protected_chunk_name,
                'private_key':  '', //TODO
                'public_key':   '' //TODO
            },
            'chunks_owner':  chunks_owner
        },
        'contacts': {

        },
        'circles': []
    };

    // Generates the user's private chunk's content
    var public_chunk = {
        '__meta': {
            'type':         '/user/public_chunk',
            'user_hash':    user_hash,
            'chunk_name':   user_hash
        },
        'profile': {
            'first_name':   private_chunk['profile']['first_name'],
            'last_name':    private_chunk['profile']['last_name'],
            'email':        ''
        },
        'system': {
            'protected_chunk': {
                'name':         private_chunk['system']['protected_chunk']['name'],
                'public_key':   private_chunk['system']['protected_chunk']['public_key']
            }
        }
    };

    var transaction = new hf_com.Transaction();

    // Creates the user's private chunk
    transaction.create_data_chunk(
        private_chunk_name,
        chunks_owner,
        private_chunk_key,
        [JSON.stringify(private_chunk)],
        false
    );

    // Creates the user's public chunk
    transaction.create_data_chunk(
        user_hash,
        chunks_owner,
        '',
        [JSON.stringify(public_chunk)],
        false
    );

    // Creates the user's protected chunk
    transaction.create_data_chunk(
        protected_chunk_name,
        chunks_owner,
        '',
        [],
        true
    );

    transaction.commit(function(json_message){
        if (json_message['status'] != 'ok')
        {
            alert('create user has failed');
            return;
        }

        if (callback)
        {
            callback(user_hash);
        }
    })

    hf_service.reset_cache();
    hf_service.users_public_chunks[user_hash] = public_chunk;

    return user_hash;
}

/*
 * Gets an user's public chunk
 *
 * @param <user_hash>: the user's hash
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunk>: is the user's public chunk or false otherwise.
 *      function my_callback(public_chunk)
 */
hf_service.get_user_public_chunk = function(user_hash, callback)
{
    assert(hf.is_function(callback));

    if(!hf.is_hash(user_hash))
    {
        callback(false);
        return ;
    }

    // checks if <user_hash>'s public chunk is already cached
    if (user_hash in hf_service.users_public_chunks)
    {
        callback(hf_service.users_public_chunks[user_hash]);

        return;
    }

    // fetches the <user_hash>'s public chunk
    hf_com.get_data_chunk(user_hash, '', function(json_message){
        assert(json_message['chunk_content'].length == 1);

        var public_chunk = JSON.parse(json_message['chunk_content'][0]);

        if (public_chunk['__meta']['type'] != '/user/public_chunk' ||
            public_chunk['__meta']['user_hash'] != user_hash ||
            public_chunk['__meta']['chunk_name'] != user_hash)
        {
            callback(false);
            return;
        }


        hf_service.users_public_chunks[user_hash] = public_chunk;

        callback(public_chunk);
    });
}

/*
 * Logins user
 *
 * @param <user_profile>: the user profile
 * @param <callback>: the function once
 *      function my_callback(user_hash)
 *
 *      @param <user_hash>: is the user's hash if success login or null otherwise.
 */
hf_service.login_user = function(user_login_profile, callback)
{
    var private_chunk_name =
            hf_service.user_private_chunk_name(user_login_profile);
    var private_chunk_key =
            hf_service.user_private_chunk_key(user_login_profile);

    return hf_service.login_private_chunk(
        private_chunk_name,
        private_chunk_key,
        callback
    );
}

hf_service.login_user_cookie = function(cookie_content, callback)
{
    assert(typeof cookie_content == 'string');

    var private_chunk_infos = cookie_content.split(':');
    var private_chunk_name = private_chunk_infos[0];
    var private_chunk_key = private_chunk_infos[1];

    return hf_service.login_private_chunk(
        private_chunk_name,
        private_chunk_key,
        callback
    );
}

hf_service.login_private_chunk = function(private_chunk_name, private_chunk_key, callback)
{
    assert(!hf_service.is_connected(), "user not connect in login user");
    assert(hf.is_function(callback) || callback == undefined);

    hf_service.reset_cache();

    // Try to get the user's private chunk
    hf_com.get_data_chunk(private_chunk_name, private_chunk_key, function(json_message){
        try
        {
            // parse private chunk
            private_chunk = JSON.parse(json_message['chunk_content']);

            // ensure this is a private chunk
            assert(private_chunk['__meta']['type'] == '/user/private_chunk');
        }
        catch(err)
        {
            // an exception appened, the connection has failed
            if (callback)
            {
                callback(null);
            }

            return;
        }

        // gets the user's public chunk to cache right away
        hf_service.get_user_public_chunk(private_chunk['__meta']['user_hash'], function(public_chunk){
            hf_service.user_private_chunk = private_chunk;
            assert(hf_service.is_connected());
            assert(private_chunk['__meta']['user_hash'] == public_chunk['__meta']['user_hash']);

            // we succesfully cached the user's public chunk
            if (callback)
            {
                callback(private_chunk['__meta']['user_hash']);
            }
        });
    });
}

/*
 * Gets the user's login cookie's content
 *
 * @param <user_login_profile>: a map at least containing keys "email" and "password"
 */
hf_service.get_user_login_cookie = function(user_login_profile)
{
    var private_chunk_name =
            hf_service.user_private_chunk_name(user_login_profile);
    var private_chunk_key =
            hf_service.user_private_chunk_key(user_login_profile);

    return private_chunk_name + ':' + private_chunk_key;
}

/*
 * Saves user's public and private chunks
 * @param <callback>: the function called once done
 *      function my_callback()
 */
hf_service.save_user_chunks = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);

    var user_chunks_owner = hf_service.user_chunks_owner();
    var transaction = new hf_com.Transaction();

    // saves user's private chunk
    transaction.write_data_chunk(
        hf_service.user_private_chunk['__meta']['chunk_name'],
        user_chunks_owner,
        hf_service.user_private_chunk['__meta']['key'],
        [JSON.stringify(hf_service.user_private_chunk)]
    );

    // saves user's public chunk
    transaction.write_data_chunk(
        hf_service.user_hash(),
        user_chunks_owner,
        '',
        [JSON.stringify(hf_service.user_public_chunk())]
    );

    transaction.commit(function(json_message){
        assert(json_message['status'] == 'ok');

        if (callback)
        {
            callback();
        }
    })
}

/*
 * @param <user_hash>: contact's user hash
 * @param <callback>: the function called once the response has arrived
 *      @param <is_user_hash>: true or false
 *      function my_callback(is_user_hash)
 */
hf_service.is_user_hash = function(user_hash, callback)
{
    assert(hf.is_function(callback));

    hf_service.get_user_public_chunk(user_hash, function(public_chunk) {
        callback(public_chunk != false);
    });
}

/*
 * @param <user_hash>: contact's user hash
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.add_contact = function(user_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);

    if (user_hash == hf_service.user_hash() || (user_hash in hf_service.user_private_chunk['contacts']))
    {
        assert(hf.is_function(callback));
        callback(false);
        return ;
    }

    hf_service.is_user_hash(user_hash, function(is_user_hash)
    {
        if (!is_user_hash)
        {
            callback(false);
            return;
        }

        hf_service.user_private_chunk['contacts'][user_hash] = {
            'circles': []
        };

        hf_service.save_user_chunks(function()
        {
            if (callback)
            {
                callback(true);
            }
        });
    });
}

/*
 * Lists contact's public chunks
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunks>: the contacts' public chunk
 *      function my_callback(public_chunks)
 */
hf_service.list_contacts = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));

    var contacts = hf_service.user_private_chunk['contacts'];
    var objCount = Object.keys(contacts).length;
    var content=[];

    if (objCount === 0) {
        callback(content);
        return ;
    }

    var iteration = 0;

    for(var contact in contacts) {
        hf_service.get_user_public_chunk(contact, function(public_chunk) {
            if (public_chunk)
            {
                content.push(public_chunk);
            }

            iteration++;
            if (iteration == objCount) {
                callback(content);
            }
        });
    }
}
