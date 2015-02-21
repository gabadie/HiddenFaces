
function assert(condition, message)
{
    if (condition)
    {
        return;
    }

    message = message || "Assertion failed";

    console.assert(condition, message);
    alert(message);

    if (typeof Error !== "undefined")
    {
        throw new Error(message);
    }

    throw message; // Fallback
}
