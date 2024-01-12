import mealEntity from "../models/meal.entity.js";
import Timetable from "../models/timetable.entity.js";
import Class from "../models/class.entity.js";
import Neis from "../modules/neis.js";
import express from "express";
import { NeisDate2Date, getUserById } from "../util/index.js";
import { Date2NeisDate } from "../util/index.js";
import e from "express";
import { ObjectId } from "bson";
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

            if (meals) {
                meals = meals.map((e) => {
                    return {
                        ...e,
                        favorites: Array(e.DDISH_NM.split("<br").length).fill(
                            []
                        ),
                    };
                });
                await mealEntity.insertMany(meals);
            }
        } catch {}

    if (meals?.length ?? 0 != 0) {
        res.json({
            success: true,
            meal: Array.from(
                meals.map((e) => {
                    if (e._id) e = e.toObject();
                    return {
                        ...e,
                        favorites: Array.from(e.favorites.map((a) => a.length)),
                        myFavorites: Array.from(
                            e.favorites.map(
                                (a) =>
                                    !a.every(
                                        (j: ObjectId) =>
                                            String(j) != String(user._id)
                                    )
                            )
                        ),
                    };
                })
            ),
        });
    } else {
        res.json({ success: true, meal: [] });
    }
});
router.post("/api/meal/favorite", async (req, res) => {
    if (isNaN(parseInt(req.body.line))) {
        return res.json({ success: false, message: "line" });
    }
    let user = await getUserById(req.session.user_id);
    let classroom = await Class.findOne({
        _id: user.class,
    });
    let meal = await mealEntity.findOne({
        SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
        MLSV_YMD: req.body.date,
        MMEAL_SC_NM: req.body.mealname,
    });
    if (!meal) {
        return res.json({ success: false, message: "nope" });
    }
    let newFavorites = meal.favorites;
    console.log(meal.favorites);
    let idx = -1;
    for (let i = 0; i < newFavorites[parseInt(req.body.line)].length; i++)
        if (
            newFavorites[parseInt(req.body.line)][i].toString() ==
            user._id.toString()
        )
            idx = i;
    if (idx > -1) newFavorites[parseInt(req.body.line)].splice(idx, 1);
    else newFavorites[parseInt(req.body.line)].push(user._id);
    await mealEntity.updateOne(
        { _id: meal._id },
        {
            $set: {
                favorites: newFavorites,
            },
        }
    );
    res.json({
        success: true,
        favorite: newFavorites[parseInt(req.body.line)].length,
    });
});
router.get("/api/timetable", async (req, res) => {
    const refine = (data: any[]) => {
        var result = [];
        for (const d of data) {
            result.push({
                ITRT_CNTNT: shortSubjectName(d.ITRT_CNTNT),
                PERIO: d.PERIO,
                ALL_TI_YMD: d.ALL_TI_YMD,
            });
        }
        return result;
    };
    const shortSubjectName = (sub: string) => {
        switch (sub) {
            case "과학탐구실험":
                return "과탐실";
            case "통합과학":
                return "통과";
            case "통합사회":
                return "통사";
            case "자율활동":
                return "자율";
            case "진로활동":
                return "진로";
            case "봉사활동":
                return "봉사";
            case "재량휴업일":
                return "휴업일";
            case "동아리활동":
                return "동아리";
            case "기독탄신일(성탄절)":
                return "크리스마스";
            default:
                return sub;
        }
    };
    var monday = NeisDate2Date(req.query.monday as string);
    var friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    var user = await getUserById(req.session.user_id);
    var classroom = await Class.findById(user.class);
    try {
        var timetable = await neis.getTimetable(
            {
                ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
            },
            {
                TI_FROM_YMD: Date2NeisDate(monday),
                TI_TO_YMD: Date2NeisDate(friday),
                CLASS_NM: classroom.class.CLASS_NM,
                GRADE: classroom.class.GRADE,
            },
            {
                pSize: 100,
            }
        );
    } catch {
        return res.json({ success: false, message: "NEIS API ERROR" });
    }
    var result = [];
    for (let t of timetable) {
        result.push({
            ALL_TI_YMD: t.ALL_TI_YMD,
            PERIO: t.PERIO,
            ITRT_CNTNT: t.ITRT_CNTNT?.replace("-", "") ?? "알 수 없음",
        });
    }
    res.json({
        success: true,
        table: refine(result),
        friday: Date2NeisDate(friday),
        TI_FROM_YMD: Date2NeisDate(monday),
        TI_TO_YMD: Date2NeisDate(friday),
    });
});
export default router;
