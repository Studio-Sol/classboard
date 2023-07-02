import timetableEntity from "../models/timetable.entity.js";
import mealEntity from "../models/meal.entity.js";
export default async () => {
    console.log("[CACHE CLEANER] cleaning : Timetable");
    await timetableEntity
        .deleteMany({
            date: { $lte: new Date() },
        })
        .exec();
    console.log("[CACHE CLEANER] cleaning : Meal");
    await mealEntity
        .deleteMany({
            date: { $lte: new Date() },
        })
        .exec();
    console.log("[CACHE CLEANER] Success");
};
