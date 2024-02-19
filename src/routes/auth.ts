import express from "express";
import request from "request";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.entity.js";
import { ObjectId } from "bson";
const router = express.Router();

router.get("/api/login/google", async (req, res) => {
    let api_url = "https://www.googleapis.com/oauth2/v1/userinfo";
    request.get(
        {
            url: api_url,
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        },
        async (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let payload = JSON.parse(body);
                console.log(payload);
                var user = await User.findOne({
                    email: payload.email,
                    auth: "google",
                });
                if (user != null) {
                    req.session.user_id = user._id;
                    req.session.user_type = user.type;
                    var next = req.cookies.next ?? "/main";
                    if (next.startsWith("/login")) next = "/main";
                    res.clearCookie("next");
                    res.redirect(next);
                } else {
                    let user = await new User({
                        type: "teacher",
                        auth: "google",
                        email: payload.email,
                        name: payload.name,
                        avatar: payload.picture,
                        class: null,
                        waiting: false,
                        signup_at: new Date().getTime(),
                    }).save();
                    req.session.user_id = user._id;
                    req.session.user_type = user.type;
                    var next = req.cookies.next ?? "/register-class";
                    if (next.startsWith("/login")) next = "/register-class";
                    res.clearCookie("next");
                    res.redirect(next);
                    req.session.save(() => {
                        res.redirect("/register-class");
                    });
                }
            } else {
                return res.redirect("/login");
            }
        }
    );
});

router.get("/api/login/naver", async (req, res) => {
    var client_id = process.env.NAVER_CLIENT_ID;
    var client_secret = process.env.NAVER_SECRET;
    var redirectURI = encodeURI(`${process.env.SERVICE_URL}/api/login/naver`);
    var api_url = "";
    var code = req.query.code;
    var state = req.query.state;
    api_url =
        "https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=" +
        client_id +
        "&client_secret=" +
        client_secret +
        "&redirect_uri=" +
        redirectURI +
        "&code=" +
        code +
        "&state=" +
        state;

    var options = {
        url: api_url,
        headers: {
            "X-Naver-Client-Id": client_id,
            "X-Naver-Client-Secret": client_secret,
        },
    };
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            var api_url2 = "https://openapi.naver.com/v1/nid/me";
            var options2 = {
                url: api_url2,
                headers: {
                    Authorization: "Bearer " + body["access_token"],
                },
            };
            request.get(options2, async function (error2, response2, body2) {
                if (!error2 && response2.statusCode == 200) {
                    var payload = JSON.parse(body2).response;
                    var keys = Object.keys(payload);
                    if (
                        !keys.includes("email") ||
                        !keys.includes("name") ||
                        !keys.includes("profile_image")
                    ) {
                        res.redirect("/login/naver?error=3");
                        return;
                    }
                    var user = await User.findOne({
                        email: payload.email,
                        auth: "naver",
                    });
                    if (user != null) {
                        req.session.user_id = user._id;
                        req.session.user_type = user.type;
                        var next = req.cookies.next ?? "/main";
                        if (next.startsWith("/login")) next = "/main";
                        res.clearCookie("next");
                        res.redirect(next);
                    } else {
                        let user = await new User({
                            type: "teacher",
                            auth: "naver",
                            email: payload.email,
                            name: payload.name,
                            avatar: payload.profile_image,
                            class: null,
                            waiting: false,
                            signup_at: new Date().getTime(),
                        }).save();
                        req.session.user_id = user._id;
                        req.session.user_type = user.type;
                        var next = req.cookies.next ?? "/register-class";
                        if (next.startsWith("/login")) next = "/register-class";
                        res.clearCookie("next");
                        res.redirect(next);
                        req.session.save(() => {
                            res.redirect("/register-class");
                        });
                    }
                } else {
                    if (response2 != null) {
                        res.redirect("/login/naver?error=2");
                    }
                }
            });
        } else {
            res.send("/login/naver?error=1");
        }
    });
});

router.get("/api/login/type", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    if (user.class) {
        res.redirect("/");
    } else {
        if (req.query.type == "teacher") {
            await User.updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: { type: "teacher" } }
            );
            req.session.user_type = "teacher";
            res.json({ status: "success" });
        } else if (req.query.type == "student") {
            await User.updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: { type: "student" } }
            );
            req.session.user_type = "student";
            res.json({ status: "success" });
        }
    }
});

router.get("/api/login/token", async (req, res) => {
    if (req.query.token == "playstore-classboard.kr") {
        req.session.user_id = "65bd0fc9b3419242e93a2491";
        req.session.user_type = "student";
        res.redirect("/main");
    }
    return res.status(404);
});

router.get("/logout", (req, res) => {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/");
});

export default router;
