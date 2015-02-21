
var hf_service = {};

/*
 * A user has 3 account's chunks:
 *      - the simetrically crypted private chunk where the owner and the key are
 *      computed from the user's email and the user's password. This chunk
 *      contains the secret user's chunk owner id that is used for all other
 *      chunks owned.
 *      - the uncrypted public chunk where everyone find the user's public
 *      profile containing information such as name, sirname...
 *      - the asimetrically crypted protected chunk where the user have the
 *      private key stored in the private chunk. Therefore only the user can
 *      decrypt the protected chunk's content. But, the chunk name and the public
 *      key is stored in the user's public chunk, and everyone can ONLY append
 *      some crypted data.
 */

/*
 * Resets the entire service's cache
 */
hf_service.reset_cache = function()
{
    hf_service.users_public_chunks = {};
    hf_service.user_private_chunk = null;
}

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
 * Gets the private chunk's name and key from the user's email and
 * password.
 *
 * @param <user_login_profile>: a map at least containing keys "email" and "password"
 */
hf_service.user_private_chunk_name = function(user_login_profile)
{
    assert(typeof user_login_profile['email'] == "string");
    assert(typeof user_login_profile['password'] == "string");

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
 */
hf_service.create_user = function(user_profile)
{
    assert(typeof user_profile['name'] == "string");
    assert(typeof user_profile['sirname'] == "string");
    assert(typeof user_profile['sex'] == "string");
    assert(typeof user_profile['email'] == "string");
    assert(typeof user_profile['password'] == "string");
    assert(typeof user_profile['birth_date'] == "string");
    assert(user_profile['password'].length > 0);

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

    var private_chunk = {
        'meta': {
            'type':         '/user/private_chunk',
            'user_hash':    user_hash,
            'chunk_name':   private_chunk_name
        },
        'profile': {
            'name':         user_profile['name'],
            'sirname':      user_profile['sirname'],
            'sex':          user_profile['sex'],
            'email':        user_profile['email'],
            'birth_date':   user_profile['birth_date'],
        },
        'system': {
            'protected_chunk': {
                'name':         protected_chunk_name,
                'private_key':  '', //TODO
                'public_key':   '' //TODO
            },
            'chunks_owner':  chunks_owner
        },
        'friends': [],
        'circles': []
    };

    var public_chunk = {
        'meta': {
            'type':         '/user/public_chunk',
            'user_hash':    user_hash,
            'chunk_name':   user_hash
        },
        'profile': {
            'name':         private_chunk['profile']['name'],
            'sirname':      private_chunk['profile']['sirname'],
            'sex':          '',
            'email':        '',
            'birth_date':   ''
        },
        'system': {
            'protected_chunk': {
                'name':         private_chunk['system']['protected_chunk']['name'],
                'public_key':   private_chunk['system']['protected_chunk']['public_key']
            }
        }
    };

    hf_com.create_data_chunk(
        private_chunk_name,
        chunks_owner,
        private_chunk_key,
        [JSON.stringify(private_chunk)],
        false,
        null
    );

    hf_com.create_data_chunk(
        user_hash,
        chunks_owner,
        '',
        [JSON.stringify(public_chunk)],
        false,
        null
    );

    hf_com.create_data_chunk(
        protected_chunk_name,
        chunks_owner,
        '',
        [],
        true,
        null
    );

    hf_service.reset_cache();
    hf_service.users_public_chunks[user_hash] = public_chunk;

    return user_hash;
}

/*
 * Gets an user's public chunk
 *
 * @param <user_hash>: the user's hash
 */
hf_service.get_user_public_chunk = function(user_hash, callback)
{
    assert(hf.is_hash(user_hash));

    if (user_hash in hf_service.users_public_chunks)
    {
        callback(hf_service.users_public_chunks[user_hash]);

        return;
    }

    hf_com.get_data_chunk(user_hash, '', function(json_message){
        assert(json_message['chunk_content'].length == 1);

        var public_chunk = JSON.parse(json_message['chunk_content'][0]);

        assert(public_chunk['meta']['type'] == '/user/public_chunk');
        assert(public_chunk['meta']['user_hash'] == user_hash);
        assert(public_chunk['meta']['chunk_name'] == user_hash);

        hf_service.users_public_chunks[user_hash] = public_chunk;

        callback(public_chunk);
    });
}

// init cache
hf_service.reset_cache();
