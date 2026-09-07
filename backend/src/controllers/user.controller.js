import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMedia, deleteMedia, getPresignedPlaybackUrl } from "../utils/storage.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";




/**
 * @function generateAccessTokenandRefreshToken
 * @description Generates both an Access Token and a Refresh Token for a given user, 
 *              stores the Refresh Token in the database, and returns both tokens.
 * 
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<Object>} An object containing the generated accessToken and refreshToken.
 * 
 * @reason Why it is written:
 * This helper function centralizes the token generation process. Whenever a user logs in
 * or registers, they require credentials (tokens) to access protected API endpoints. 
 * By encapsulating token generation, we avoid duplicate code. Saving the refresh token
 * to the database allows us to track active user sessions and support secure token refresh flows.
 * 
 * @logic
 * 1. Queries the database using `User.findById(userId)` to fetch the user document.
 * 2. Invokes the custom schema methods `generateRefreshToken` and `generateAccessToken`
 *    on the user model instance to retrieve both signed JWTs.
 * 3. Saves the newly generated refresh token directly to the user's database record.
 * 4. Passes `validateBeforeSave: false` to the `.save()` method to prevent Mongoose 
 *    validation from running on other fields (e.g., password, avatar) since we only want to 
 *    update the refreshToken field programmatically.
 * 5. Returns both tokens. If any error occurs, it throws a 500 ApiError.
 */
const generateAccessTokenandRefreshToken = async function (userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found for token generation");
        }
        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error("Error in generateAccessTokenandRefreshToken:", error);
        throw new ApiError(500, error?.message || "Something went wrong while generating Access or Refresh token");
    }
}

/**
 * Dynamic cookie options generator:
 * Ensures cookies work across both plain HTTP (ALB / local Docker) and HTTPS.
 * Setting `secure: true` over plain HTTP causes modern browsers to drop cookies on arrival.
 */
const getCookieOptions = (req) => {
    const isHttps = req.secure || req.headers?.["x-forwarded-proto"] === "https";
    return {
        httpOnly: true,
        secure: isHttps,
        sameSite: isHttps ? "none" : "lax",
        path: "/"
    };
};
/**
 * @function registerUser
 * @description Registers a new user. Performs input validation, verifies uniqueness of username/email,
 *              assigns default avatar or uploads optional media, creates user in MongoDB, and generates tokens.
 */
const registerUser = asyncHandler(async (req, res) => {
    // Step 1: Destructure and retrieve user details from request body
    const { fullName, username, email, password } = req.body;

    // Step 2: Validate that all required fields are provided and not empty
    if (!fullName || !username || !email || !password || [fullName, username, email, password].some((field) => typeof field !== "string" || field.trim() === "")) {
        throw new ApiError(400, "All fields (fullName, username, email, password) are required");
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Step 3: Check if the user already exists in the database by username or email
    const existedUser = await User.findOne({
        $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });
    if (existedUser) {
        throw new ApiError(409, "User with this username or email already exists");
    }

    // Default fallback avatar
    const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
    let avatarUrl = req.body.avatar || defaultAvatar;

    // Step 4: Optional avatar upload if Multer staged a file
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (avatarLocalPath) {
        try {
            const avatar = await uploadMedia(avatarLocalPath, "avatars");
            if (avatar?.url || avatar?.key) {
                avatarUrl = avatar.key || avatar.url;
            }
        } catch (uploadErr) {
            console.warn("Avatar upload failed, using default avatar:", uploadErr?.message);
        }
    }

    // Optional cover image
    let coverImageUrl = req.body.coverImage || "";
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if (coverImageLocalPath) {
        try {
            const coverImage = await uploadMedia(coverImageLocalPath, "cover-images");
            if (coverImage?.url || coverImage?.key) {
                coverImageUrl = coverImage.key || coverImage.url;
            }
        } catch (uploadErr) {
            console.warn("Cover image upload failed:", uploadErr?.message);
        }
    }

    // Step 5: Save the user record in the database
    const user = await User.create({
        fullName: fullName.trim(),
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        email: cleanEmail,
        password: password.trim(),
        username: cleanUsername
    });

    // Step 6: Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Failed to retrieve created user");
    }

    const options = getCookieOptions(req);

    let userObj = createdUser.toObject ? createdUser.toObject() : { ...createdUser };
    if (userObj?.avatar && !userObj.avatar.startsWith("http")) {
        try {
            userObj.avatar = await getPresignedPlaybackUrl(userObj.avatar);
        } catch (e) {
            console.warn("Failed to presign registered user avatar:", e.message);
        }
    }

    // Step 7: Return a successful response to the client with tokens
    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(201, { user: userObj, accessToken, refreshToken }, "User registered successfully")
        );
});


/**
 * @function loginUser
 * @description Authenticates an existing user. Validates credentials (username or email, and password),
 *              generates access and refresh tokens, sets them in secure cookies, and returns the
 *              user details along with the tokens.
 * 
 * @reason Why it is written:
 * This handler allows registered users to log into the platform and obtain session tokens. 
 * Security-wise, it validates credentials, stores JWT tokens in secure, HTTP-only cookies to prevent 
 * client-side access (reducing XSS vulnerability), and returns session state.
 * 
 * @logic
 * 1. Destructures `username`, `email`, and `password` from the request body (`req.body`).
 * 2. Validates that at least one identifier (username or email) is provided, throwing a 400 ApiError if both are missing.
 * 3. Queries the database using `User.findOne` with an `$or` query to find a user matching the provided username or email.
 *    If no user is found, throws a 401 ApiError.
 * 4. Uses the user instance method `isPasswordCorrect` to verify if the supplied password matches the hashed password stored in the database.
 *    If incorrect, throws a 401 ApiError.
 * 5. Generates the accessToken and refreshToken by calling `generateAccessTokenandRefreshToken` helper function.
 * 6. Fetches the logged-in user's details from the database without the password and refreshToken fields.
 * 7. Defines cookie options (`httpOnly: true`, `secure: true`) so that cookies cannot be accessed or modified via client-side scripts.
 * 8. Attaches the accessToken and refreshToken to the HTTP response headers as cookies and returns a 200 OK JSON response with the user details.
 */
const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email must be entered
    //find user
    //check password
    //generate access and refresh tokens
    //send cookie

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (!user) {
        throw new ApiError(401, "user does not exist")
    }
    const passwordCorrect = await user.isPasswordCorrect(password);
    if (!passwordCorrect) {
        throw new ApiError(401, "Invalid credentials")
    }
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id);

    const loggeedInUser = await User.findById(user._id).
        select("-password -refreshToken");

    let userObj = loggeedInUser.toObject ? loggeedInUser.toObject() : { ...loggeedInUser };
    if (userObj?.avatar && !userObj.avatar.startsWith("http")) {
        try {
            userObj.avatar = await getPresignedPlaybackUrl(userObj.avatar);
        } catch (e) {
            console.warn("Failed to presign logged-in user avatar:", e.message);
        }
    }

    const options = getCookieOptions(req);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: userObj, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        );


})


/**
 * @function logoutUser
 * @description Logs out the current user by removing the stored refresh token from the database
 *              and clearing the access and refresh token cookies from the client browser.
 * 
 * @reason Why it is written:
 * This handler allows users to securely terminate their session. By clearing the refresh token
 * from the database, we ensure that even if a token is intercepted later, it cannot be used to
 * generate new access tokens. Clearing the client-side cookies completes the logout process.
 * 
 * @logic
 * 1. Uses `req.user._id` (set by the authentication middleware) to find the current user in the database.
 * 2. Updates the user's database record to set their `refreshToken` to `undefined` (removing it).
 * 3. Defines the cookie options matching the ones used when setting the cookies (`httpOnly: true`, `secure: true`).
 * 4. Clears the `accessToken` and `refreshToken` cookies from the response object.
 * 5. Returns a 200 OK JSON response confirming successful logout.
 */
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = getCookieOptions(req);

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken ||
        req.header("Authorization")?.replace("Bearer ", "")?.trim();

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request: No refresh token provided");
    }

    try {
        const secret = process.env.REFRESH_TOKEN_SECRET || "videotube_dev_refresh_secret_1234567890";
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            secret
        );

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "invalid refresh token: User not found");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = getCookieOptions(req);

        const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, refreshToken }, "tokens refreshed")
            );

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token");
    }

})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old password and new password are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters long");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }
    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    let userObj = req.user?.toObject ? req.user.toObject() : { ...req.user };
    if (userObj?.avatar && !userObj.avatar.startsWith("http")) {
        try {
            userObj.avatar = await getPresignedPlaybackUrl(userObj.avatar);
        } catch (e) {
            console.warn("Failed to presign current user avatar:", e.message);
        }
    }
    return res
        .status(200)
        .json(new ApiResponse(200, userObj, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "Both fullName and email are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName.trim(),
                email: email.trim().toLowerCase()
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadMedia(avatarLocalPath, "avatars");

    if (!avatar?.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    // Clean up old avatar from storage
    if (req.user?.avatar) {
        await deleteMedia(req.user.avatar);
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.key || avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadMedia(coverImageLocalPath, "cover-images");

    if (!coverImage?.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    // Clean up old cover image from storage
    if (req.user?.coverImage) {
        await deleteMedia(req.user.coverImage);
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.key || coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});





const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase().trim()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: req.user?._id
                            ? { $in: [new mongoose.Types.ObjectId(req.user._id), "$subscribers.subscriber"] }
                            : false,
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const userDoc = await User.findById(req.user._id).select("watchHistory");
    const rawHistoryIds = userDoc?.watchHistory || [];

    if (!rawHistoryIds.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "Watch history fetched successfully"));
    }

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                watchHistory: 1
            }
        }
    ]);

    let history = user[0]?.watchHistory || [];

    // Filter out any null or deleted video documents
    history = history.filter((v) => v && v._id);

    // Sort by position in rawHistoryIds descending (most recently watched first)
    const idOrder = rawHistoryIds.map((id) => id.toString());
    history.sort((a, b) => idOrder.lastIndexOf(b._id.toString()) - idOrder.lastIndexOf(a._id.toString()));

    // Presign thumbnails and avatars so watch history renders cleanly from S3
    if (history.length) {
        history = await Promise.all(
            history.map(async (video) => {
                if (video.thumbnail && !video.thumbnail.startsWith("http")) {
                    try {
                        video.thumbnail = await getPresignedPlaybackUrl(video.thumbnail);
                    } catch (e) {
                        console.warn("Failed to presign history thumbnail:", e.message);
                    }
                }
                if (video.owner?.avatar && !video.owner.avatar.startsWith("http")) {
                    try {
                        video.owner.avatar = await getPresignedPlaybackUrl(video.owner.avatar);
                    } catch (e) {
                        console.warn("Failed to presign history avatar:", e.message);
                    }
                }
                return video;
            })
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                history,
                "Watch history fetched successfully"
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
