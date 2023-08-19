import { Router } from "express";
import { getUserById } from "../util/index.js";
import UID from "uid-safe";
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
        queue: string;
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
    if (req.session.intercept) {
        student_id = req.session.intercept;
    } else {
        student_id = req.session.user_id;
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
            queue: "",
            timestamp: new Date(),
        };
    }
    students[student_id].tab = body;
    students[student_id].timestamp = new Date();
    const queue = students[student_id].queue;
    students[student_id].queue = "";

    return res.json({
        status: "success",
        banned:
            new RegExp(banData.regexp).test(body.url) ||
            banData.hosts.includes(new URL(body.url).hostname),
        closeTab: queue,
    });
});
router.get("/api/intercept/teacher/queue/:student/:id", (req, res) => {
    let student = req.params.student;
    students[student].queue = req.params.id;
    res.redirect("/api/intercept/teacher");
});
router.post("/api/intercept/teacher/banData", (req, res) => {
    banData = JSON.parse(req.body.banData);
    res.redirect("/api/intercept/teacher");
});
router.get("/api/intercept/teacher", async (req, res) => {
    res.render("intercept.html", { banData, students });
});
router.get("/api/intercept/teacher/release/:student", (req, res) => {
    delete students[req.params.student];
    res.redirect("/api/intercept/teacher");
});
export default router;
