const express = require("express");
var { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const UID = require("uid-safe");
const sharp = require("sharp");

const router = new express.Router();

router.get("/an", (req, res) => {
    res.render("an/list.html");
});

router.get("/an/api/list", async (req, res) => {
    try {
        var client = await MongoClient.connect("mongodb://127.0.0.1/", {
            useNewUrlParser: true,
        });

        if (isNaN(parseInt(req.query.skip))) {
            res.json({ success: false });
            return;
        }
        var data = await client
            .db("school")
            .collection("an-post")
            .find({})
            .sort("_id", -1)
            .skip(parseInt(req.query.skip))
            .limit(10)
            .toArray();

        var result = [];
        for (const d of data) {
            if (req.query.preview) {
                var commentCount = await client
                    .db("school")
                    .collection("an-comment")
                    .count({ id: String(d._id) });
                result.push({
                    title: d.title,
                    id: d._id,
                    preview: d.content.replace(/<[^>]*>?/gm, "").slice(0, 30),
                    timestamp: d.timestamp,
                    commentCount: commentCount,
                    length: d.content.length,
                });
            } else {
                result.push({ title: d.title, id: d._id });
            }
        }
        res.json({ success: true, post: result });
    } catch {
        res.json({
            success: false,
            message: "알 수 없는 에러 (GET 파라미터를 확인해주세요)",
        });
    }
});
router.get("/an/post/:id", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {
        useNewUrlParser: true,
    });
    try {
        new ObjectId(req.params.id);
    } catch {
        res.sendStatus(404);
        return;
    }
    var data = await client
        .db("school")
        .collection("an-post")
        .findOne({
            _id: new ObjectId(req.params.id),
        });
    if (data == null) {
        res.sendStatus(404);
        return;
    }
    data.content = data.content
        .replaceAll("<script", "&lt;script")
        .replaceAll("</script>", "&lt;/script&gt;");
    res.render("an/post.html", { data: data });
});
router.get("/an/new-post", async (req, res) => {
    res.render("an/new.html");
});
router.post("/an/api/post", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {
        useNewUrlParser: true,
    });
    var post_new = await client.db("school").collection("an-post").insertOne({
        title: req.body.title,
        content: req.body.content,
        timestamp: new Date().getTime(),
    });
    res.redirect("/an/post/" + post_new.insertedId);
});
router.post("/an/api/upload-img", async (req, res) => {
    if (!req.files.file) {
        res.sendStatus(500);
        return;
    }
    var uid = UID.sync(64);
    var url = `https://sol-studio.ga/static/img/${uid}.webp`;
    fs.writeFileSync(
        path.join(__dirname, `/static/img/${uid}.webp`),
        await sharp(req.files.file.data).webp().rotate().toBuffer()
    );
    res.json({ url: url });
});
router.get("/an/api/comment", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {
        useNewUrlParser: true,
    });
    if (isNaN(parseInt(req.query.skip))) {
        res.json({ success: false });
        return;
    }
    var raw = await client
        .db("school")
        .collection("an-comment")
        .find({
            id: req.query.id,
            reply: req.query.reply ?? null,
        })
        .limit(30)
        .skip(parseInt(req.query.skip))
        .toArray();

    var comments = [];

    for (const r of raw) {
        comments.push({
            _id: r._id,
            content: r.content,
            timestamp: r.timestamp,
            reply: r.reply,
            reply_count: await client
                .db("school")
                .collection("an-comment")
                .count({ reply: String(r._id) }),
        });
    }

    res.json({
        success: true,
        comment: comments,
        total: await client
            .db("school")
            .collection("an-comment")
            .count({ id: req.query.id, reply: req.query.reply ?? null }),
    });
});

router.post("/an/api/comment", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {
        useNewUrlParser: true,
    });
    var comment = await client
        .db("school")
        .collection("an-comment")
        .insertOne({
            id: req.body.id,
            content: req.body.content,
            timestamp: new Date().getTime(),
            reply: req.body.reply ?? null,
        });

    res.json({
        success: true,
        comment: {
            _id: comment.insertedId,
            content: req.body.content,
            timestamp: new Date().getTime(),
            reply: req.body.reply ?? null,
        },
    });
});

module.exports = router;
