
var hf = {};

/*
 * Tests if a function
 */
hf.is_function = function(fn)
{
    return typeof fn == 'function'
}

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

    var bitArray = sjcl.hash.sha256.hash(data);
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

    return hf.hash(new Date().toLocaleString() + '\n' + Math.random() + '\n' + salt);
}

/*
 * Fetch a form's json
 *
 * @param <domElement>: the form's DOM element
 *
 * @returns the form's JSON
 */
hf.inputs_to_json = function(domElement)
{
    var inputs = domElement.getElementsByTagName('input');
    var obj = {};

    for (var i = 0; i < inputs.length; i++)
    {
        obj[inputs[i].name] = inputs[i].value;
    }

    return obj;
}

/*
 * Creates a cookie
 *
 * @param <name>: the cookie's name
 * @param <value>: the cookie's value
 * @param <days>: the cookie's days
 */
hf.create_cookie = function(name, value, days)
{
    var expires = "";

    if (days)
    {
        var date = new Date();

        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

        var expires = "; expires="+date.toGMTString();
    }

    document.cookie = name + "=" + value + expires + "; path=/";
}

/*
 * Gets a cookie
 *
 * @param <name>: the cookie's name
 *
 * @returns the cookie
 */
hf.get_cookie = function(name)
{
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');

    for (var i = 0; i < ca.length; i++)
    {
        var c = ca[i];

        while (c.charAt(0)==' ')
        {
            c = c.substring(1, c.length);
        }

        if (c.indexOf(nameEQ) == 0)
        {
            return c.substring(nameEQ.length,c.length);
        }
    }

    return null;
}

/*
 * Delete a cookie
 *
 * @param <name>: the cookie's name
 */
hf.delete_cookie = function(name)
{
    hf.create_cookie(name, "", -1);
}
