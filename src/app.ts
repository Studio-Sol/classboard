import loaders from "./loaders/index.js";
import express from "express";
import http from "http";

(async () => {
    const app = express();
    const httpServer = new http.Server(app);
    const allow_hosts = ["classboard.kr", "redirect.kro.kr", "127.0.0.1"];
    const inspecting = false;
    const serviceURL = "https://classboard.kr";

    await loaders(app, allow_hosts, inspecting, serviceURL);

    httpServer.listen(3000, "0.0.0.0", () => {
        console.log("listening...", 3000);
    });
})();
