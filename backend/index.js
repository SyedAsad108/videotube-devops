import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./src/db/index.js";
import { app } from "./app.js"

dotenv.config({
    path: './.env'
})
connectDB()
    .then(() => {
        const port = process.env.PORT || 8000
        app.listen(port, () => {
            console.log(`App listening on ${port}`)
        })
    })
    .catch((err) => {
        console.log("Mongodb Connection failed: ", err)
    })