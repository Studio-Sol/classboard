import timetableEntity from "../models/timetable.entity.js";
import mealEntity from "../models/meal.entity.js";
import { logger } from "../config/winston.js";
export default async () => {
    logger.info("[CACHE CLEANER] cleaning : Timetable");
    await timetableEntity
        .deleteMany({
            date: { $lte: new Date() },
        })
        .exec();
    logger.info("[CACHE CLEANER] cleaning : Meal");
    await mealEntity
        .deleteMany({
            date: { $lte: new Date() },
        })
        .exec();
    logger.info("[CACHE CLEANER] Success");
};
