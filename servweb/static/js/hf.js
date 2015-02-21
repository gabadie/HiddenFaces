
var hf = {};

/*
 * Checks if the parameter is a valide hash
 *
 * @param <hash>: value to check
 *
 * @returns true if this is a valide hash
 */
hf.is_hash = function(hash)
{
    if (typeof hash != 'string' || hash.length != 64)
    {
        return false;
    }

    for (var i = 0; i < hash.length; i++)
    {
        var c = hash.charCodeAt(i);

        if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0))
        {
            continue;
        }
        else if (c >= 'a'.charCodeAt(0) && c <= 'f'.charCodeAt(0))
        {
            continue;
        }
        else if (c >= 'A'.charCodeAt(0) && c <= 'F'.charCodeAt(0))
        {
            continue;
        }

        return false;
    }

    return true;
}

/*
 * Hash function
 *
 * @param <data>: the data to hash.
 *
 * @returns a hash
 */
hf.hash = function(data)
{
    assert(typeof data == 'string');

    var bitArray = sjcl.hash.sha256.hash("message");
    var hash = sjcl.codec.hex.fromBits(bitArray);

    assert(hf.is_hash(hash));

    return hash;
}

/*
 * Generates a hash from given salt
 *
 * @param <salt>: a generating salt to avoid colision at most as possible.
 *
 * @returns a hash
 */
hf.generate_hash = function(salt)
{
    salt = salt || '';

    assert(typeof salt == 'string');

    return hf.hash(new Date().toLocaleString() + '\n' + salt);
}
