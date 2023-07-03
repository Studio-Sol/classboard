import { ObjectId } from "bson";
import express from "express";
import User from "../models/user.entity.js";
import Class from "../models/class.entity.js";
import { choice, getUserById } from "../util/index.js";
import Neis from "../modules/neis.js";
export default (app: express.Application, neis: Neis) => {
    // 선생님 전용 페이지들
    app.use(["/teacher", "/teacher/*"], async (req, res, next) => {
        var user = await getUserById(req.session.user_id);
        if (user.type != "teacher") return res.redirect("/");
        if (!user.class) return res.redirect("/register-class");
        next();
    });

    app.get("/teacher", async (req, res) => {
        var user = await getUserById(req.session.user_id);
        var classroom = await Class.findOne({ _id: user.class });
        if (!classroom) return res.redirect("/");

        var students = await User.find({
            class: classroom._id,
            waiting: false,
            type: "student",
        }).exec();
        var join_request = await User.find({
            class: classroom._id,
            waiting: true,
            type: "student",
        }).exec();
        res.render("teacher.html", {
            classroom: classroom,
            user: user,
            students: students,
            join_request: join_request,
        });
    });

    app.get("/teacher/seat", async (req, res) => {
        res.render("seat/index.html");
    });

    app.get("/teacher/seat/print", async (req, res) => {
        res.render("seat/print.html");
    });

    app.get("/register-class", async (req, res) => {
        var user = await getUserById(req.session.user_id);
        if (user.type != "teacher" || user.class) return res.redirect("/");

        res.render("find-school.html", { error: req.query.error });
    });

    app.post("/register-class", async (req, res) => {
        var user = await getUserById(req.session.user_id);
        if (user.type != "teacher" || user.class) return res.redirect("/");
        console.log(req.body);
        let schools;
        try {
            schools = await neis.getSchoolInfo(
                {
                    SCHUL_NM: req.body.school,
                },
                {
                    pSize: 50,
                }
            );
        } catch (e) {
            schools = [];
        }

        for (const s of schools) {
            if (s.SCHUL_NM == req.body.school) {
                var school = s;
                break;
            }
        }
        if (!school) {
            if (schools.length == 50) {
                res.redirect("/register-class?error=noschool");
                return;
            }
            if (schools.length != 0) {
                res.render("select-school.html", {
                    schools: schools,
                    grade: req.body.grade,
                    classroom: req.body.class,
                });
                return;
            } else {
                res.redirect("/register-class?error=noschool");
                return;
            }
        }
        let classrooms;
        try {
            classrooms = await neis.getClassInfo(
                {
                    SD_SCHUL_CODE: school.SD_SCHUL_CODE,
                    ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
                    GRADE: req.body.grade,
                },
                {
                    pSize: 100,
                }
            );
        } catch {}

        for (const c of classrooms) {
            if (c.CLASS_NM == req.body.class) {
                var classroom = c;
                break;
            }
        }
        if (!classroom) {
            if (req.body.select_school) {
                res.json({
                    success: false,
                    redirect: "/register-class?error=noclass",
                });
                return;
            }
            res.redirect("/register-class?error=noclass");
            return;
        }
        var ay = classroom.AY;
        var tmp = await Class.findOne({
            "school.SD_SCHUL_CODE": school.SD_SCHUL_CODE,
            "school.ATPT_OFCDC_SC_CODE": school.ATPT_OFCDC_SC_CODE,
            "school.SCHUL_NM": school.SCHUL_NM,
            "class.GRADE": classroom.GRADE,
            "class.CLASS_NM": classroom.CLASS_NM,
            ay: ay,
        });
        if (tmp != null) {
            if (req.body.select_school) {
                res.json({
                    success: false,
                    redirect: "/register-class?error=alreadyexist",
                });
                return;
            }
            res.redirect("/register-class?error=alreadyexist");
            return;
        }
        var i = await new Class({
            school: {
                SD_SCHUL_CODE: school.SD_SCHUL_CODE,
                ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
                SCHUL_NM: school.SCHUL_NM,
            },
            class: {
                MADE: user._id,
                GRADE: classroom.GRADE,
                CLASS_NM: classroom.CLASS_NM,
            },
            ay: ay,
            invite: choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6).join(""),
        }).save();
        await User.updateOne(
            {
                _id: new ObjectId(req.session.user_id),
            },
            {
                $set: {
                    class: i._id,
                },
            }
        );
        if (req.body.select_school) {
            res.json({ success: true, redirect: "/main" });
            return;
        }
        res.redirect("/");
    });
};