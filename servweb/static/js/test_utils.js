
var test_utils = {};

/*
 * Runs a test suite <testName>
 * @param <testFunction>: the test suite's function to call
 * @param <testName>: the test suite's name
 */
test_utils.run = function(testFunction, testName)
{
    test_utils.testId += 1;
    test_utils.domOutput.innerHTML += '<div id="testId' + test_utils.testId + '"></div>';
    test_utils.testCount = 0;
    test_utils.testFailed = 0;
    test_utils.testName = testName;
    test_utils.refresh();

    testFunction();
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
 * Commits a success in the currently running test suite
 * @param <name>: the succes name
 */
test_utils.success = function(name)
{
    test_utils.testCount += 1;
    test_utils.refresh();
}

/*
 * Commits a failure in the currently running test suite
 * @param <name>: the failure name
 */
test_utils.failure = function(name)
{
    test_utils.testCount += 1;
    test_utils.testFailed += 1;
    test_utils.refresh();
}

/*
 * Refreshs in the currently running test suite's output line
 */
test_utils.refresh = function()
{
    var domElem = document.getElementById('testId' + test_utils.testId);
    domElem.innerHTML = (
        test_utils.testName +
        ' (success:' +
        (test_utils.testCount - test_utils.testFailed) +
        ', failures:' +
        test_utils.testFailed +
        ')'
    );

    if (test_utils.testFailed != 0)
    {
        domElem.className = 'failed';
    }
}

/*
 * Inits the test API
 */
test_utils.init = function()
{
    test_utils.domOutput = document.getElementById('test_output');
    test_utils.testId = 0;
}
