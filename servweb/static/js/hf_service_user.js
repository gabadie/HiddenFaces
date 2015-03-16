
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
 * Compute the user's password hash
 */
hf_service.user_password_hash = function(password)
{
    assert(typeof password == "string");
    assert(password.length > 0);

    return hf.hash(
        password + '\nmaOujnsBnIW2NRGT1PrX3ednAL1L9dua1vZUIPyKVnf3DbVj1LWRZfRSOG3TbktjOmyHa8Ix8CyWydME'
    );
}

/*
 * Compute a user's login hash with a given salt.
 */
hf_service.user_login_hash = function(user_login_profile, salt)
{
    assert(user_login_profile);
    assert(typeof user_login_profile['email'] == "string");

    var password_hash = null;

    if ('password_hash' in user_login_profile)
    {
        assert(hf.is_hash(user_login_profile['password_hash']));

        password_hash = user_login_profile['password_hash'];
    }
    else
    {
        password_hash = hf_service.user_password_hash(user_login_profile['password']);
    }

    assert(hf.is_hash(password_hash));

    return hf.hash(
        user_login_profile['email'] + '\n' +
        password_hash + '\n' +
        salt
    );
}

/*
 * Gets the private chunk's name and key from the user's email and
 * password or password hash.
 *
 * @param <user_login_profile>: a map at least containing keys "email" and "password"
 */
hf_service.user_private_chunk_name = function(user_login_profile)
{
    return hf_service.user_login_hash(
        user_login_profile,
        '8MghUWRllGKa2IHrARCFFtaSvUHbq6TUe4l8PtntqBYB4hDtwuv7npXcZJpvpN4t8O96QSDivtWbW2vO'
    );
}

hf_service.user_private_chunk_key = function(user_login_profile)
{
    return 'AES\n' + hf_service.user_login_hash(
        user_login_profile,
        '0XJ2keczYRagi99V9V128YxJexMrs7KU6oGbX1H37WYPQIWfSW7QHtTBODdDjIbzr5Xj4LWBQROXZxjd'
    );
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
    assert(hf.is_function(callback) || callback == undefined);

    var password_hash = hf_service.user_password_hash(user_profile['password']);

    var chunks_owner = hf.generate_hash(
        '2lbfAs5v1yguvf2ETM7S\n' +
        user_profile['email']
    );
    var user_hash = hf.generate_hash(
        'fWdFPoyxE4uNoTKoBswp\n' +
        user_profile['email']
    );

    var private_chunk_name =
            hf_service.user_private_chunk_name(user_profile);
    var private_chunk_key =
            hf_service.user_private_chunk_key(user_profile);

    assert(private_chunk_name != user_hash);

    var public_markdown = (
        '# About me.\n' +
        '* You can modify this to write what ever you want using markdown syntax\n' +
        '* See more on [the wikipedia\'s markdown page](http://en.wikipedia.org/wiki/Markdown)\n'
    );

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
            'public_markdown': public_markdown
        },
        'system': {
            'chunks_owner':  chunks_owner,
            'password_hash': password_hash
        },
        'certifications' : {
        },

        'contacts': {},

        /*
         * user's circles are agregations for contacts so that he can post
         * message to only some of his friends.
         */
        'circles': {}
    };

    var transaction = new hf_com.Transaction();

    hf_service.init_key_repository(private_chunk);
    hf_service.init_groups_repository(private_chunk);
    //hf_service.init_discussions_repository(private_chunk);

    hf_service.init_notification_repository(private_chunk, transaction, function(success){
        if (!success)
        {
            callback(null);
            return;
        }

        // Generates the user's public chunk's content
        var public_chunk = hf_service.export_user_public_chunk(private_chunk);

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

        hf_service.publish_into_global_list(transaction, '/global/users_list', user_hash);

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
    });

    return user_hash;
}

/*
 * Export user's public chunk from the user's private chunk
 *
 * @param <user_private_chunk>: the user's private chunk
 *
 * @returns the newly generated user's public chunk
 */
hf_service.export_user_public_chunk = function(user_private_chunk)
{
    var public_chunk = {
        '__meta': {
            'type':         '/user/public_chunk',
            'user_hash':    user_private_chunk['__meta']['user_hash'],
            'chunk_name':   user_private_chunk['__meta']['user_hash']
        },
        'profile': {
            'first_name':   user_private_chunk['profile']['first_name'],
            'last_name':    user_private_chunk['profile']['last_name'],
            'email':        '',
            'public_markdown': user_private_chunk['profile']['public_markdown']
        },
        'system': {
        },
        'certifications' : hf.clone(user_private_chunk['certifications'])
    };

    hf_service.export_public_notification_repository(user_private_chunk, public_chunk);

    return public_chunk;
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
 * Gets severals user's public chunks
 *
 * @param <users_hashes>: the users' hashes
 * @param <callback>: the function called once the response has arrived
 *      @param <users_public_chunks>: map(<user_hash> -> <user_public_chunk>).
 *      function my_callback(users_public_chunks)
 */
hf_service.get_users_public_chunks = function(users_hashes, callback)
{
    assert(hf.is_function(callback));

    var transaction = null;
    var users_public_chunks = {};

    for (var i = 0; i < users_hashes.length; i++)
    {
        var user_hash = users_hashes[i];

        assert(hf.is_hash(user_hash));

        if (user_hash in users_public_chunks)
        {
            continue;
        }
        else if (user_hash in hf_service.users_public_chunks)
        {
            users_public_chunks[user_hash] = hf_service.users_public_chunks[user_hash];
            continue;
        }

        users_public_chunks[user_hash] = null;

        if (transaction == null)
        {
            transaction = new hf_com.Transaction();
        }

        transaction.get_data_chunk(user_hash, '');
    }

    if (transaction == null)
    {
        callback(users_public_chunks);
        return;
    }

    transaction.commit(function(json_message){
        if (json_message['status'] != 'ok')
        {
            return callback(null);
        }

        var missing_public_chunks = json_message['chunk']
        var missing_public_chunks_names = hf.keys(missing_public_chunks);

        for (var i = 0; i < missing_public_chunks_names.length; i++)
        {
            var user_hash = missing_public_chunks_names[i];

            if (users_public_chunks[user_hash] != null)
            {
                continue;
            }

            var user_public_chunk = JSON.parse(missing_public_chunks[user_hash]);

            users_public_chunks[user_hash] = user_public_chunk;
        }

        for (var user_hash in users_public_chunks)
        {
            assert(users_public_chunks[user_hash] != null);
        }

        callback(users_public_chunks)
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
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.save_user_chunks = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);

    var user_chunks_owner = hf_service.user_chunks_owner();

    hf_service.users_public_chunks[hf_service.user_hash()] =
        hf_service.export_user_public_chunk(hf_service.user_private_chunk);

    var transaction = new hf_com.Transaction();

    var old_private_chunk_name = hf_service.user_private_chunk['__meta']['chunk_name'];

    var user_login_profile = {
        'email':            hf_service.user_private_chunk['profile']['email'],
        'password_hash':    hf_service.user_private_chunk['system']['password_hash']
    };

    var new_private_chunk_name = hf_service.user_private_chunk_name(user_login_profile);
    var new_private_chunk_key = hf_service.user_private_chunk_key(user_login_profile);

    hf_service.user_private_chunk['__meta']['chunk_name'] = new_private_chunk_name;
    hf_service.user_private_chunk['__meta']['key'] = new_private_chunk_key;

    if (new_private_chunk_name == old_private_chunk_name)
    {
        // saves user's private chunk
        transaction.write_data_chunk(
            new_private_chunk_name,
            user_chunks_owner,
            new_private_chunk_key,
            [JSON.stringify(hf_service.user_private_chunk)]
        );
    }
    else
    {
        /*
         * the private chunk name has changed, so we delete the old one and
         * create the new one
         */
        transaction.delete_data_chunk(
            old_private_chunk_name,
            user_chunks_owner
        );

        transaction.create_data_chunk(
            new_private_chunk_name,
            user_chunks_owner,
            new_private_chunk_key,
            [JSON.stringify(hf_service.user_private_chunk)],
            true
        );
    }

    // saves user's public chunk
    transaction.write_data_chunk(
        hf_service.user_hash(),
        user_chunks_owner,
        '',
        [JSON.stringify(hf_service.user_public_chunk())]
    );

    transaction.commit(function(json_message){
        if (callback)
        {
            if(json_message['status'] == 'ok')
                callback(true);
            else
                callback(false);
        }
    })
}

/*
 * Changes user's login profile
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.change_user_login_profile = function(new_user_login_profile, callback)
{
    assert(hf_service.is_connected());
    assert(typeof new_user_login_profile['email'] == 'string');
    assert(new_user_login_profile['email'].length > 0);

    hf_service.user_private_chunk['profile']['email'] = new_user_login_profile['email'];
    hf_service.user_private_chunk['system']['password_hash'] = hf_service.user_password_hash(
        new_user_login_profile['password']
    );

    hf_service.save_user_chunks(callback);
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
