import Gauge from "@pm2/io/build/main/utils/metrics/gauge";
import Session from "../models/session.entity";

export default async (sessionCounter: Gauge) => {
    sessionCounter.set(await Session.countDocuments());
};
