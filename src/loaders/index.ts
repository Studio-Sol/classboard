import api from "../api";
import expressLoader from "./express";
import mongooseLoader from "./mongoose";
import neisLoader from "./neis";
import dotenv from "dotenv";
import express from "express";

export default async (
    expressApp: express.Application,
    allow_hosts,
    inspecting,
    serviceURL
) => {
    dotenv.config();

    let neis = await neisLoader();
    console.log("[LOADER] Neis Intialized");

    const mongoConnection = await mongooseLoader();
    console.log("[LOADER] MongoDB Intialized");

    await expressLoader({
        app: expressApp,
        allow_hosts: allow_hosts,
        inspecting: inspecting,
    });

    console.log("[LOADER] Express Intialized");
    expressApp.get("/asdf", (req, res) => {
        console.log("asdf!!!");
        res.sendStatus(404);
    });
    await api(expressApp, mongoConnection, neis, serviceURL);
    console.log("[LOADER] API Intialized");
};
