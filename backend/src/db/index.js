import { DB_NAME } from "../../constants.js";
import mongoose from "mongoose";


const connectDB = async () => {
    let uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
    // Append DB_NAME only if not already specified in the URI path
    if (!uri.includes(`/${DB_NAME}`)) {
        if (uri.includes("?")) {
            const [base, query] = uri.split("?");
            uri = `${base.replace(/\/$/, "")}/${DB_NAME}?${query}`;
        } else {
            uri = `${uri.replace(/\/$/, "")}/${DB_NAME}`;
        }
    }
    try {
        const connectionInstance = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`MONGODB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    }
    catch (error) {
        console.error(`MONGODB Connection Error: ${error.message}. Retrying in 5 seconds...`);
        setTimeout(connectDB, 5000);
    }
}

export default connectDB;