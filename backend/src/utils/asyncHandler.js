/**
 * @function asyncHandler
 * @description A higher-order utility wrapper function designed to automatically handle asynchronous route errors 
 *              in Express. It accepts an asynchronous request handler and returns a standard Express middleware function.
 * 
 * @param {Function} requestHandler - The asynchronous middleware or controller function (req, res, next) to be executed.
 * @returns {Function} A standard Express middleware function (req, res, next) that wraps the execution in a Promise.
 * 
 * @reason Why it is written:
 * Writing async/await in Express route handlers requires wrapping the code in `try-catch` blocks to catch potential 
 * database, network, or validation errors. Failing to catch an error in an async function will crash the Express 
 * server or result in unhandled promise rejections. Writing `try-catch` in every route controller introduces a lot 
 * of boilerplate code. The `asyncHandler` pattern keeps controllers clean and DRY (Don't Repeat Yourself) by 
 * automatically catching any thrown errors or rejected promises and forwarding them to Express's global error handler.
 * 
 * @logic
 * 1. Takes the async `requestHandler` function as its parameter.
 * 2. Returns a new anonymous function that matches the signature of Express middleware `(req, res, next)`.
 * 3. Inside the returned function, wraps the execution of the original `requestHandler(req, res, next)` inside a 
 *    `Promise.resolve()`. This ensures that whether the controller returns a value, returns a Promise, or throws 
 *    an error, it behaves like a standard JavaScript Promise.
 * 4. Chains a `.catch((err) => next(err))` to the Promise. If any error is thrown or if the returned Promise is 
 *    rejected within the async controller, it will capture that error (`err`) and call `next(err)`. Passing the 
 *    error to `next()` tells Express to bypass normal routes and send the error straight to the global error middleware.
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

export { asyncHandler }