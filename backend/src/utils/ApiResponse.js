/**
 * @class ApiResponse
 * @description A helper class to format and structure all successful HTTP responses sent back to the client.
 * 
 * @reason Why it is written:
 * Consistent API responses are crucial for a good developer experience (DX). By utilizing this `ApiResponse` 
 * wrapper class, every successful request returns a payload in an identical structure. This allows front-end 
 * developers to write predictable data-parsing and response-handling logic (e.g., always looking for 
 * `response.data` or checking if `response.success` is true).
 */
class ApiResponse {
    /**
     * @constructor
     * @param {number} statusCode - The HTTP status code indicating success (e.g., 200, 201).
     * @param {*} data - The payload or data being sent to the client (objects, arrays, strings, etc.).
     * @param {string} message - A descriptive success message (defaults to "Success").
     * 
     * @logic
     * 1. Stores the provided HTTP `statusCode` (e.g., 200 for OK, 201 for Created).
     * 2. Binds the return payload `data` to this instance.
     * 3. Sets the message string to convey what action was completed successfully.
     * 4. Dynamically computes the `success` field: if the HTTP status code is less than 400, it marks `success` 
     *    as `true`. Status codes 400 and above are HTTP errors, so `success` would be evaluated as `false`.
     */
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };