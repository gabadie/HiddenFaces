
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

    for(var cookie_name in cookie_db)
    {
        hf.delete_cookie(cookie_name);
    }
}

test_hf_core.clone = function()
{
    var a = {
        '__meta': {
            'type': '/my_type'
        },
        'message': 'I love you all!',
        'author': 'me',
        'comments': [
            {
                'message': 'love you too dude!',
                'author': 'the cool guy'
            },
            {
                'message': 'would you marry me?',
                'author': 'the awesome guy'
            }
        ]
    };

    var b = hf.clone(a);

    b['__meta']['type'] = '';
    b['author'] = '';
    b['comments'][0]['message'] = '';

    test_utils.assert(
        a['__meta']['type'] != b['__meta']['type'],
        "a['__meta']['type'] modified"
    );
    test_utils.assert(
        a['author'] != b['author'],
        "a['author'] modified"
    );
    test_utils.assert(
        a['comments'][0]['message'] != b['comments'][0]['message'],
        "a['comments'][0]['message'] modified"
    );
}

test_hf_core.main = function()
{
    test_utils.run(test_hf_core.cookies, 'test_hf_core.cookies');
    test_utils.run(test_hf_core.cookies, 'test_hf_core.clone');
}
