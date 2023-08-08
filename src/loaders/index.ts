import expressLoader from "./express.js";
import mongooseLoader from "./mongoose.js";
import dotenv from "dotenv";
import express from "express";
import cron from "./cron.js";

export default async (
    expressApp: express.Application,
    allow_hosts,
    inspecting
) => {
    dotenv.config();

    console.log("[LOADER] Neis Intialized");

    await mongooseLoader();
    console.log("[LOADER] Mongoose Intialized");

    await expressLoader({
        app: expressApp,
        allow_hosts: allow_hosts,
        inspecting: inspecting,
    });
    console.log("[LOADER] Express Intialized");

    cron();
    console.log("[LOADER] CRON registered");
};
