
var test_hf_com = {};

test_hf_com.test1 = function()
{
    test_utils.assert(false, 'test 1');
    test_utils.assert(false, 'test 2');
    test_utils.assert(true, 'test 3');
    test_utils.assert(false, 'test 4');
}

test_hf_com.main = function()
{
    test_utils.run(test_hf_com.test1, 'test_hf_com.test1');
}
