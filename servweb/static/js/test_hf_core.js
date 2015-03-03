
test_hf_core = {};


test_hf_core.cookies = function()
{
    var cookie_db = {
        'cookie0': 'my_content 0',
        'cookie1': 'my_content 1',
        'cookie2': 'my\ncontent',
        'cookie3': 'my:content',
        'cookie4': 'my;content'
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

test_hf_core.date_parsing= function()
{
    var string_date = '2015-03-02 17:03:38';
    var date = hf.string_to_date(string_date);
    test_utils.assert(date.getFullYear()== 2015);
    test_utils.assert(date.getMonth() == 2);
    test_utils.assert(date.getDate() == 2);
    test_utils.assert(date.getHours() == 17);
    test_utils.assert(date.getMinutes() == 03);
    test_utils.assert(date.getSeconds() == 38);

    var string_date2 = hf.date_to_string(date);
    test_utils.assert(string_date == string_date2);
}

test_hf_core.get_date_time = function()
{
    var string_date = hf.get_date_time();
    var original_date = new Date().getTime();
    var date = hf.string_to_date(string_date).getTime();
    test_utils.assert((original_date - date) < 2000);
}

test_hf_core.main = function()
{
    test_utils.run(test_hf_core.cookies, 'test_hf_core.cookies');
    test_utils.run(test_hf_core.cookies, 'test_hf_core.clone');
    // Date tests
    test_utils.run(test_hf_core.date_parsing, 'test_hf_core.date_parsing');
    test_utils.run(test_hf_core.get_date_time,'test_hf_core.get_date_time');
}


