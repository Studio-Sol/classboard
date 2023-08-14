import mealEntity from "../models/meal.entity.js";
import Timetable from "../models/timetable.entity.js";
import Class from "../models/class.entity.js";
import Neis from "../modules/neis.js";
import express from "express";
import { getUserById } from "../util/index.js";
import { formatDate } from "../util/index.js";
const router = express.Router();
const neis = new Neis(process.env.NEIS_API_KEY);
router.get("/api/meal", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    var classroom = await Class.findOne({
        _id: user.class,
    });

    let meals: any[] = await mealEntity
        .find({
            SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
            MLSV_YMD: req.query.date as string,
        })
        .exec();
    if (meals.length == 0)
        try {
            meals = await neis.getMealInfo(
                {
                    ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                    MLSV_YMD: req.query.date as string,
                },
                {
                    pSize: 10,
                }
            );
            if (meals) await mealEntity.insertMany(meals);
        } catch {}

    if (meals?.length ?? 0 != 0) {
        res.json({ success: true, meal: meals });
    } else {
        res.json({ success: true, meal: [] });
    }
});

router.get("/api/timetable", async (req, res) => {
    const refine = (data: any[]) => {
        var result = [];
        for (const d of data) {
            result.push({
                ITRT_CNTNT: d.ITRT_CNTNT,
                PERIO: d.PERIO,
                ALL_TI_YMD: d.ALL_TI_YMD,
            });
        }
        return result;
    };
    var m = req.query.monday as string;
    var monday = new Date(`${m.slice(0, 4)}-${m.slice(4, 6)}-${m.slice(6, 8)}`);
    var friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    var user = await getUserById(req.session.user_id);
    var classroom = await Class.findOne({
        _id: user.class,
    });
    if (req.query.refresh != "true") {
        var cache = await Timetable.find({
            ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
            SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
            CLASS_NM: classroom.class.CLASS_NM,
            GRADE: classroom.class.GRADE,
            date: { $lte: friday, $gte: monday },
        }).exec();
        if (cache.length > 0) {
            return res.json({
                success: true,
                table: refine(cache),
                friday: formatDate(friday),
            });
        }
    } else {
        await Timetable.deleteMany({
            ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
            SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
            CLASS_NM: classroom.class.CLASS_NM,
            GRADE: classroom.class.GRADE,
            date: { $lte: friday },
        }).exec();
    }
    try {
        var timetable = await neis.getTimetable(
            {
                ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
            },
            {
                TI_FROM_YMD: formatDate(monday),
                TI_TO_YMD: formatDate(friday),
                CLASS_NM: classroom.class.CLASS_NM,
                GRADE: classroom.class.GRADE,
            },
            {
                pSize: 100,
            }
        );
    } catch {
        res.json({ success: false, message: "NEIS API ERROR" });
        return;
    }
    var result = [];
    for (let t of timetable) {
        result.push({
            date: new Date(
                `${t.ALL_TI_YMD.slice(0, 4)}-${t.ALL_TI_YMD.slice(
                    4,
                    6
                )}-${t.ALL_TI_YMD.slice(6, 8)}`
            ),
            ATPT_OFCDC_SC_CODE: t.ATPT_OFCDC_SC_CODE,
            SD_SCHUL_CODE: t.SD_SCHUL_CODE,
            ALL_TI_YMD: t.ALL_TI_YMD,
            CLASS_NM: t.CLASS_NM,
            GRADE: t.GRADE,
            ITRT_CNTNT: t.ITRT_CNTNT?.replace("-", "") ?? "알 수 없음",
            PERIO: t.PERIO,
        });
    }

    Timetable.insertMany(result);
    res.json({
        success: true,
        table: refine(result),
        friday: formatDate(friday),
        TI_FROM_YMD: formatDate(monday),
        TI_TO_YMD: formatDate(friday),
    });
});
export default router;
