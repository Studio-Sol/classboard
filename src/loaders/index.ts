import expressLoader from "./express.js";
import mongooseLoader from "./mongoose.js";
import express from "express";

export default async (
    expressApp: express.Application,
    allow_hosts,
    inspecting
) => {
    console.log("[LOADER] Neis Intialized");

    await mongooseLoader();
    console.log("[LOADER] Mongoose Intialized");

    await expressLoader({
        app: expressApp,
        allow_hosts: allow_hosts,
        inspecting: inspecting,
    });
    console.log("[LOADER] Express Intialized");
};
