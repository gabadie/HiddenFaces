
var hf = {};

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

    return sjcl.codec.hex.fromBits(bitArray);
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
