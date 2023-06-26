import Gauge from "@pm2/io/build/main/utils/metrics/gauge.js";
import Session from "../models/session.entity.js";

export default async (sessionCounter: Gauge.default) => {
    sessionCounter.set(await Session.countDocuments());
};
