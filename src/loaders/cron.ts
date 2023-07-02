import cron from "node-cron";
import remove_cache from "../jobs/remove_cache.js";
export default () => {
    cron.schedule("0 50 23 * * 7", () => remove_cache()); // 매주 일요일 23시 50분
};
