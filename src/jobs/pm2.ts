import Gauge from "@pm2/io/build/main/utils/metrics/gauge";
import { MongoClient } from "mongodb";

export default async (client: MongoClient, sessionCounter: Gauge) => {
    console.log("hello");
    sessionCounter.set(
        await client.db("school").collection("session").countDocuments()
    );
};
