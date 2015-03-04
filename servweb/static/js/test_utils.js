
var test_utils = {};

/*
 * Runs a test suite <testName>
 * @param <testFunction>: the test suite's function to call
 * @param <testName>: the test suite's name
 */
test_utils.run = function(testFunction, testName, doNotDropDataBase)
{
    if (!test_utils.should_run(testName))
    {
        return;
    }

    test_utils.testId += 1;
    test_utils.domOutput.innerHTML += '<div class="test_suite" id="testId' + test_utils.testId + '"></div>';
    test_utils.testCount = 0;
    test_utils.testTotalCount = 0;
    test_utils.testFailed = [];
    test_utils.testName = testName;
    test_utils.refresh();

    // run the test function on a clean database
    if (!doNotDropDataBase)
    {
        test_utils.drop_database();
    }

    test_utils.domSandboxElem.innerHTML = '';

    testFunction();

    test_utils.domSandboxElem.innerHTML = '';
}

/*
 * Asserts a condition.
 * @param <cond>: the condition to assert in order to pass the test
 * @param <name>: the assertion's name
 */
test_utils.assert = function(cond, name)
{
    if (cond)
    {
        test_utils.success(name);
    }
    else
    {
        test_utils.failure(name);
    }
}

/*
 * Asserts success.
 * @param <successCount>: the expected number of success
 */
test_utils.assert_success = function(successCount)
{
    var name = successCount + ' success expected';

    if (test_utils.testCount == successCount)
    {
        test_utils.success(name);
    }
    else
    {
        test_utils.failure(name);
    }

    test_utils.testCount = 0;
}

/*
 * Commits a success in the currently running test suite
 * @param <name>: the succes name
 */
test_utils.success = function(name)
{
    test_utils.testCount += 1;
    test_utils.testTotalCount += 1;
    test_utils.refresh();
}

/*
 * Commits a failure in the currently running test suite
 * @param <name>: the failure name
 */
test_utils.failure = function(name)
{
    test_utils.testCount += 1;
    test_utils.testTotalCount += 1;
    test_utils.testFailed[test_utils.testFailed.length] = name;
    test_utils.refresh();
}

/*
 * Refreshs in the currently running test suite's output line
 */
test_utils.refresh = function()
{
    var domElem = document.getElementById('testId' + test_utils.testId);
    domElem.innerHTML = (
        '<div>' +
        test_utils.testName +
        ' (success:' +
        (test_utils.testTotalCount - test_utils.testFailed.length) +
        ', failures:' +
        test_utils.testFailed.length +
        ')</div>'
    );

    if (test_utils.testFailed.length == 0)
    {
        return;
    }

    if (test_utils.testFailed.length == 1)
    {
        domElem.className += ' failed';
    }

    for (var i = 0; i < test_utils.testFailed.length; i++)
    {
        domElem.innerHTML += (
            '<div class="test_name">' +
            test_utils.testFailed[i] +
            '</div>'
        );
    }

    domElem.scrollIntoView();
}

/*
 * Tests we should run this test
 */
test_utils.should_run = function(testName)
{
    var href = window.location.href.split('#');

    if (href.length == 1)
    {
        return true;
    }

    assert(href.length == 2);

    return testName.slice(0, href[1].length) == href[1];
}

/*
 * Drops the database
 */
test_utils.drop_database = function()
{
    var params = {
        'operation': 'testing:drop_database'
    };

    hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            test_utils.failure("test_hf_com.drop_database() failed (status == " + status + ")");
        }
        else if (json["status"] != "ok")
        {
            test_utils.failure("test_hf_com.drop_database() failed");
        }
    });
}

/*
 * Inits the test API
 */
test_utils.init = function()
{
    test_utils.domOutput = document.getElementById('test_output');
    test_utils.domSandboxElem = document.getElementById('test_sandbox_element');
    test_utils.testId = 0;

    // patches up the dom page content
    hf_control.domPageContainer = document.getElementById('test_hf_page_container');
}
