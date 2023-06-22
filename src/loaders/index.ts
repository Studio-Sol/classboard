import api from "../api";
import expressLoader from "./express";
import mongooseLoader from "./mongoose";
import neisLoader from "./neis";
import dotenv from "dotenv";
import express from "express";
import pm2 from "./pm2";
import cron from "./cron";

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
