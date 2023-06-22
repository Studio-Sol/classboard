import cron from "node-cron";
import pm2Job from "../jobs/pm2";
export default (sessionCounter) => {
    cron.schedule("0 * * * * *", () => pm2Job(sessionCounter));
};
