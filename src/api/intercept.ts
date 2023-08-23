import { Router } from "express";
import { getUserById } from "../util/index.js";
import UID from "uid-safe";
import { logger } from "../config/winston.js";
const router = Router();
interface Tab {
    id: string;
    favIconUrl: string;
    title: string;
    url: string;
}
const students: {
    [key: string]: {
        id: string;
        profile: any;
        close: string;
        open: string;
        tab: Tab;
        timestamp: Date;
    };
} = {};
let banData = {
    hosts: [],
    regexp: "banme.com",
};
router.post("/api/intercept/student", async (req, res) => {
    if (!req.session.user_id && !req.session.intercept) {
        req.session.intercept = "User-" + (await UID(16));
    }
    let student_id;
    if (req.session.user_id) {
        student_id = req.session.user_id;
    } else {
        student_id = req.session.intercept;
    }

    const body: Tab = req.body.tab;
    if (!students[student_id]) {
        let profile;
        if (student_id.startsWith("User-")) {
            profile = { name: student_id };
        } else {
            profile = await getUserById(student_id);
        }
        students[student_id] = {
            id: student_id,
            profile: profile,
            tab: body,
            close: "",
            open: "",
            timestamp: new Date(),
        };
    }
    students[student_id].tab = body;
    students[student_id].timestamp = new Date();
    logger.info(
        JSON.stringify({
            file: "api/intercept",
            payload: {
                action: "student",
                target: students[student_id],
            },
        })
    );
    const close = students[student_id].close;
    students[student_id].close = "";
    const open = students[student_id].open;
    students[student_id].open = "";

    return res.json({
        status: "success",
        banned:
            new RegExp(banData.regexp).test(body.url) ||
            banData.hosts.includes(new URL(body.url).hostname),
        closeTab: close,
        openTab: open,
    });
});
const teacher_fix = "teacher9874";
router.get(`/api/intercept/${teacher_fix}/close/:student/:id`, (req, res) => {
    let student = req.params.student;
    logger.info(
        JSON.stringify({
            file: "api/intercept",
            payload: {
                action: "close",
                target: students[student],
            },
        })
    );

    students[student].close = req.params.id;
    res.redirect(`/api/intercept/${teacher_fix}`);
});
router.get(`/api/intercept/${teacher_fix}/open`, (req, res) => {
    logger.info(
        JSON.stringify({
            file: "api/intercept",
            payload: {
                action: "open",
                target: "all",
                url: req.query.url,
            },
        })
    );
    for (let i of Object.keys(students)) {
        students[i].open = req.query.url as string;
    }
    res.redirect(`/api/intercept/${teacher_fix}`);
});
router.get(`/api/intercept/${teacher_fix}/open/:student`, (req, res) => {
    students[req.params.student].open = req.query.url as string;
    logger.info(
        JSON.stringify({
            file: "api/intercept",
            payload: {
                action: "open",
                target: students[req.params.student],
                url: req.query.url,
            },
        })
    );
    res.redirect(`/api/intercept/${teacher_fix}`);
});
router.post(`/api/intercept/${teacher_fix}/banData`, (req, res) => {
    banData = JSON.parse(req.body.banData);
    logger.info(
        JSON.stringify({
            file: "api/intercept",
            payload: {
                action: "updateBanData",
                banData: JSON.parse(req.body.banData),
            },
        })
    );
    res.redirect(`/api/intercept/${teacher_fix}`);
});
router.get(`/api/intercept/${teacher_fix}`, async (req, res) => {
    logger.info(
        JSON.stringify({
            file: "api/intercept",
            payload: {
                action: "teacher",
                user: req.session.user_id,
            },
        })
    );
    res.render("intercept.html", { banData, students });
});
router.get(`/api/intercept/${teacher_fix}/release/:student`, (req, res) => {
    logger.info(
        JSON.stringify({
            file: "api/intercept",
            payload: {
                action: "release",
                target: students[req.params.student],
            },
        })
    );
    delete students[req.params.student];
    res.redirect(`/api/intercept/${teacher_fix}`);
});
export default router;
