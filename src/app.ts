import loaders from "./loaders/index.js";
import express from "express";
import http from "http";
import dotenv from "dotenv";
(async () => {
    dotenv.config();
    const app = express();
    const httpServer = new http.Server(app);
    const allow_hosts = [
        "classboard.kr",
        "localhost",
        "dev.classboard.kr",
        "192.168.0.10",
    ];
    const inspecting = false;

    await loaders(app, allow_hosts, inspecting);

    const port = parseInt(process.env.PORT);
    httpServer.listen(port, "0.0.0.0", () => {
        console.log("listening...", port);
    });
})();
