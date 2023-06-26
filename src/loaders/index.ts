import api from "../api/index.js";
import expressLoader from "./express.js";
import mongooseLoader from "./mongoose.js";
import neisLoader from "./neis.js";
import dotenv from "dotenv";
import express from "express";
import pm2 from "./pm2.js";
import cron from "./cron.js";

export default async (
    expressApp: express.Application,
    allow_hosts,
    inspecting,
    serviceURL
) => {
    dotenv.config();

    let neis = await neisLoader();
    console.log("[LOADER] Neis Intialized");

    await mongooseLoader();
    console.log("[LOADER] Mongoose Intialized");

    const { sessionCounter } = pm2();

    await expressLoader({
        app: expressApp,
        allow_hosts: allow_hosts,
        inspecting: inspecting,
    });

    console.log("[LOADER] Express Intialized");

    await api(expressApp, neis, serviceURL);
    console.log("[LOADER] API Intialized");

    cron(sessionCounter);
};
