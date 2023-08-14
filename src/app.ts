import loaders from "./loaders/index.js";
import express from "express";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
console.log(dotenv.config({ path: path.join(__dirname, "..", ".env") }));
(async () => {
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

    httpServer.listen(3000, "0.0.0.0", () => {
        console.log("listening...", 3000);
    });
})();
