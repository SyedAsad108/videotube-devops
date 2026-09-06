import { DB_NAME } from "../../constants.js";
import mongoose from "mongoose";


const connectDB = async () => {
    try {
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
        const connectionInstance = await mongoose.connect(uri);
        console.log(`MONGODB Connected !! DB HOST: ${connectionInstance.connection.host}`)
    }
    catch (error) {
        console.error(`ERROR:`, error)
        process.exit(1)
    }
}

export default connectDB;