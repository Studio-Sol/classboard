import express from "express";
import request from "request";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.entity.js";
import { ObjectId } from "bson";
export default (app: express.Application, serviceURL) => {
    app.get("/login", (req, res) => {
        res.render("login/login.html");
    });

    app.get("/login/naver", (req, res) => {
        var client_id = process.env.NAVER_CLIENT_ID;
        var redirectURI = encodeURI(`${serviceURL}/login/callback/naver`);
        var state = Math.round(Math.random() * 1000);
        var url =
            "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" +
            client_id +
            "&redirect_uri=" +
            redirectURI +
            "&state=" +
            state;
        if (req.query.error) {
            res.render("login/naver.html", {
                url: url,
                error: req.query.error,
            });
            return;
        } else {
            res.redirect(url);
        }
    });

    app.get("/login/google", (req, res) => {
        res.render("login/google.html");
    });

    app.get("/login/callback/google", async (req, res) => {
        const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        try {
            var ticket = await googleClient.verifyIdToken({
                idToken: req.query.token as string,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch {
            res.send("오류");
            return;
        }
        const payload = ticket.getPayload();
        // const userid = payload['sub'];

        var user = await User.findOne({ email: payload.email, auth: "google" });
        if (user != null) {
            req.session.user_id = user._id;
            var next = req.cookies.next ?? "/";
            res.clearCookie("next");
            res.redirect(next);
        } else {
            let user = await new User({
                type: null,
                auth: "google",
                email: payload.email,
                name: payload.name,
                avatar: payload.picture,
                class: null,
                waiting: false,
                signup_at: new Date().getTime(),
            }).save();
            req.session.user_id = user._id;
            req.session.save(() => {
                res.redirect("/login/type");
            });
        }
    });

    app.get("/login/callback/naver", async (req, res) => {
        var client_id = process.env.NAVER_CLIENT_ID;
        var client_secret = process.env.NAVER_SECRET;
        var redirectURI = encodeURI(`${serviceURL}/login/callback/naver`);
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
                request.get(
                    options2,
                    async function (error2, response2, body2) {
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
                                var next = req.cookies.next ?? "/";
                                res.clearCookie("next");
                                res.redirect(next);
                            } else {
                                let user = await new User({
                                    type: null,
                                    auth: "naver",
                                    email: payload.email,
                                    name: payload.name,
                                    avatar: payload.profile_image,
                                    class: null,
                                    waiting: false,
                                    signup_at: new Date().getTime(),
                                }).save();
                                req.session.user_id = user._id;
                                req.session.save(() => {
                                    res.redirect("/login/type");
                                });
                            }
                        } else {
                            if (response2 != null) {
                                res.redirect("/login/naver?error=2");
                            }
                        }
                    }
                );
            } else {
                res.send("/login/naver?error=1");
            }
        });
    });

    app.get("/login/type", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        if (user.class) {
            res.redirect("/");
        } else {
            res.render("login/type.html", { id: req.session.user_id });
        }
    });

    app.get("/login/type/callback", async (req, res) => {
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
                res.redirect("/register-class");
            } else if (req.query.type == "student") {
                await User.updateOne(
                    { _id: new ObjectId(req.session.user_id) },
                    { $set: { type: "student" } }
                );
                var next = req.cookies.next ?? "/";
                res.clearCookie("next");
                res.redirect(next);
            }
        }
    });

    app.get("/logout", (req, res) => {
        req.session.destroy();
        res.redirect("/");
    });
};
