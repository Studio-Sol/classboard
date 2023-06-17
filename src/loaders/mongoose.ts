import { MongoClient } from "mongodb";
export default async () => {
    return await MongoClient.connect(process.env.MONGO_URL);
};
