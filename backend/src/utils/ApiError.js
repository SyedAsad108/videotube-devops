/**
 * @class ApiError
 * @extends Error
 * @description A custom error class that extends JavaScript's built-in Error class. 
 *              It is designed to standardize the structure of API errors across the application,
 *              providing consistent error codes, user-friendly messages, and stack traces.
 * 
 * @reason Why it is written:
 * Express has a default error handler, but it often sends stack traces or inconsistent formats
 * to the client. By writing a custom `ApiError` class, we can throw errors anywhere in the controller
 * or middleware layers with specific HTTP status codes (e.g., 400 for Bad Request, 401 for Unauthorized) 
 * and return structured, predictable error responses to the frontend.
 */
class ApiError extends Error {
    /**
     * @constructor
     * @param {number} statusCode - The HTTP status code representing the error (e.g., 400, 401, 500).
     * @param {string} message - A brief description of the error (defaults to "Something went wrong").
     * @param {Array} errors - An array containing detailed/multiple validation errors.
     * @param {string} stack - An optional parameter to pass a custom stack trace.
     * 
     * @logic
     * 1. Calls `super(message)` to invoke the parent `Error` class constructor and register the error message.
     * 2. Sets the `statusCode` property to hold the HTTP error code.
     * 3. Sets the `data` property to `null` because this is an error object, not a successful data response.
     * 4. Explicitly sets `this.message` to the provided message.
     * 5. Sets a `success` boolean to `false` so the frontend can easily read the status of the response.
     * 6. Populates the `errors` property with any custom validation details or array of errors.
     * 7. Checks if a custom stack trace is provided. If so, assigns it to `this.stack`. Otherwise, it uses 
     *    `Error.captureStackTrace` to record the execution path up to when this error was instantiated, 
     *    facilitating easier server-side debugging.
     */
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };