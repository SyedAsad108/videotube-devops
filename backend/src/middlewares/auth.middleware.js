import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

/**
 * @middleware verifyJWT
 * @description Authentication middleware that verifies the user's JSON Web Token (JWT) sent via cookies or
 *              the Authorization header. If the token is valid, it retrieves the user from the database,
 *              removes sensitive fields (password, refresh token), and attaches the user object to the request.
 * 
 * @reason Why it is written:
 * This middleware acts as a gatekeeper for protected routes. By requiring a valid, unexpired access token,
 * it prevents unauthorized access to sensitive endpoints. Attaching the authenticated user object (`req.user`)
 * to the request object ensures that subsequent middleware functions and controller handlers can easily access 
 * the logged-in user's details without having to re-authenticate or re-query the database.
 * 
 * @logic
 * 1. Attempts to retrieve the access token from the request cookies (populated by cookie-parser) or from the 
 *    `Authorization` header (stripping the "Bearer " prefix).
 * 2. If no token is found, throws a 401 ApiError ("Unauthorized request").
 * 3. Verifies and decodes the JWT using `jwt.verify` along with the secret key `process.env.ACCESS_TOKEN_SECRET`.
 * 4. Queries the database using `User.findById` with the user ID (`_id`) extracted from the decoded token payload.
 * 5. Uses `.select("-password -refreshToken")` to omit sensitive fields from the fetched user object.
 * 6. If the user does not exist in the database (e.g., deleted or invalid token payload), throws a 401 ApiError ("Invalid Access Token").
 * 7. Injects the fetched user object into the request as `req.user` to make it accessible to downstream handlers.
 * 8. Calls `next()` to hand over control to the next middleware or controller in the route path.
 * 9. Catches any errors (such as token expiration or invalid signature) and throws a 401 ApiError with an appropriate message.
 */
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})
