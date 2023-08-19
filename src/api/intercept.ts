import { Router } from "express";
import { getUserById } from "../util/index.js";
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
    };
} = {};
let banData = {
    hosts: [],
    regexp: "banme.com",
};
router.post("/api/intercept/student", async (req, res) => {
    const body: Tab = req.body.tab;
    if (req.session.user_id) {
        if (!students[req.session.user_id]) {
            students[req.session.user_id] = {
                id: req.session.user_id,
                profile: await getUserById(req.session.user_id),
                tab: body,
                queue: "",
            };
        }
        students[req.session.user_id].tab = body;
        const queue = students[req.session.user_id].queue;
        students[req.session.user_id].queue = "";
        if (
            new RegExp(banData.regexp).test(body.url) ||
            banData.hosts.includes(new URL(body.url).hostname)
        ) {
            return res.json({
                status: "success",
                banned: true,
                closeTab: queue,
            });
        }
        return res.json({
            status: "success",
            banned: false,
            closeTab: queue,
        });
    } else {
        return res.json({
            status: "success",
            banned: false,
            nologin: true,
        });
    }
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
export default router;
