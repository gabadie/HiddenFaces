
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
 * Clones deeply an object.
 */
hf.clone = function(obj)
{
    if (obj == null || typeof(obj) != 'object')
    {
        return obj;
    }

    var temp = obj.constructor(); // changed

    for (var key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            temp[key] = hf.clone(obj[key]);
        }
    }

    return temp;
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

    document.cookie = name + "=" + window.btoa(value) + expires + "; path=/";
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
            return window.atob(c.substring(nameEQ.length,c.length));
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

/*
 * Converts from a given string to date
 *
 * @param <stringDate>: string which will be converted
 */
hf.string_to_date = function(stringDate)
{
    var thisDate = stringDate;
    //alert(thisDate);
    var thisDateT = thisDate.substr(0, 10) + "T" + thisDate.substr(11, 8);
   // alert(thisDateT);
    var jDate = new Date(thisDateT);
    return jDate;
}

/*
 * Gets today's date and return a string date
 */
hf.get_date_time = function()
{
    var now  = new Date();

    return hf.date_to_string(now);
}
/*
 * Converts from date to string
 *
 * @param<date>: the date which will be converted
 */
hf.date_to_string = function(date)
{

    var year    = date.getFullYear();
    var month   = date.getMonth()+1;
    var day     = date.getDate();
    var hour    = date.getHours();
    var minute  = date.getMinutes();
    var second  = date.getSeconds();

    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }

    var string_date_time = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;
    return string_date_time;

}

/*
 * Generates full date of the day
 *
 */

hf.generate_full_date = function()
{
    var string_date = hf.get_date_time();
    var date = hf.string_to_date(string_date);
    var date_timeStamp = date.getTime();
    var full_date = Date.create(date_timeStamp).toString().substr(0,21);
    return full_date;

}