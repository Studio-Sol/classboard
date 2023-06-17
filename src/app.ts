const startAt = new Date().getUTCMilliseconds();
import loaders from "./loaders";
import express from "express";
import http from "http";
import request from "request";
import { Command } from "commander";

(async () => {
    const app = express();
    const httpServer = new http.Server(app);
    const allow_hosts = ["redirect.kro.kr", "127.0.0.1"];
    const inspecting = false;
    const serviceURL = "http://redirect.kro.kr";

    await loaders(app, allow_hosts, inspecting, serviceURL);

    const program = new Command();
    program
        .option("-p, --port <number>", "server port", process.env.PORT)
        .option("-h, --host <host>", "server host", process.env.HOST)
        .parse();

    httpServer.listen(
        parseInt(program.opts().port),
        program.opts().host,
        () => {
            console.log("listening...", program.opts().port);
        }
    );
})();
