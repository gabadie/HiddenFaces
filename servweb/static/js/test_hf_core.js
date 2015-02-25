
test_hf_core = {};


test_hf_core.cookies = function()
{
    var cookie_db = {
        'cookie0': 'my_content 0',
        'cookie1': 'my_content 1',
        'cookie2': 'my_content 2',
    };

    for(var cookie_name in cookie_db)
    {
        hf.create_cookie(cookie_name, cookie_db[cookie_name], 1);
    }

    for(var cookie_name in cookie_db)
    {
        var cookie_content = hf.get_cookie(cookie_name);

        test_utils.assert(cookie_content == cookie_db[cookie_name], cookie_name + ' failed');
    }
}

test_hf_core.main = function()
{
    test_utils.run(test_hf_core.cookies, 'test_hf_core.cookies');
}
