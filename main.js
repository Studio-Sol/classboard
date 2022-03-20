// Express
const express = require("express");
const express_session = require('express-session');
const FileStore = require('session-file-store')(express_session);


// Rate Limit
const rateLimit = require('express-rate-limit')

// Neis
const Neis = require("@my-school.info/neis-api").default;
const neis = new Neis({ KEY: "451d037d3e6343f097c4d6ff75d543f1", Type: "json" });


// mongoDB
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require("mongodb").ObjectId;


// GOOGLE CLIENT
const {OAuth2Client} = require('google-auth-library');


// LOG
const winston = require('./config/winston')
const morgan = require("morgan")

// UTILS
function getMondayDate(d) {
    var paramDate = new Date(d);

    var day = paramDate.getDay();
    if (day < 6) {
        var diff = paramDate.getDate() - day + 1;
    }
    else {
        var diff = paramDate.getDate() + (8-day);
    }
    
    var result = new Date(paramDate.setDate(diff)).toISOString().substring(0, 10)
    return result;
}

function choice (a, k=1) {
    if (k == 1) {
        return a[Math.floor(Math.random() * a.length)];
    }
    var return_array = []
    for (var i=0;i < k; i++) {
        return_array.push(a[Math.floor(Math.random() * a.length)])
    }
    return return_array
}

function formatDate(date) {
    var date = new Date(date);
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + month + day;
}






// EXPRESS SETTING
const app = express();
var session = express_session({
    secret: 'ehighsdofkjmseo',  // 암호화
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
    cookie: {
        domain: "sol-studio.shop",
        maxAge: 1000 * 60 * 60 * 24 * 30 // 세션 30일
    },
    key: "sid"
})
var httpServer = require("http").createServer(app);
const io = require('socket.io')(httpServer);
var ios = require("express-socket.io-session");
io.use(ios(session, { autoSave:true }));



app.set('trust proxy',1)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', __dirname + '/view');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use("/static", express.static(__dirname + '/static'));
app.use(morgan('combined', {stream: winston.stream}));
app.use(session);
app.use((req, res, next) => {
    if (!req.session.user_id) {
        if (req.path.startsWith("/login") || req.path.startsWith("/static")) {
            next();
        }
        else {
            req.session.next = req.url;
            req.session.save(() => {
                res.redirect("/login");
            })
            
        }
    }
    else {
        next();
    }
})

// 5분(300초)동안 100호출 제한
const apiRatelimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 100,
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {success: false, message: "요청이 너무 빠릅니다! 잠시 후에 다시 시도해주세요."},
    statusCode: 200
});
app.use("/api/", apiRatelimiter)


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-





// MAIN
app.get("/", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var classroom = await client.db("school").collection("class").findOne({
        _id: new ObjectId(user.class)
    })
    if (user.waiting) {
        res.render("wait.html", {waiting: user.class})
    }
    else if (user.class == null) {
        if (user.type == "teacher") {
            res.redirect("/register-class");
        }
        else if (user.type == "student") {
            res.redirect("/invite");
        }
        else {
            res.redirect("/login/type")
        }
    }
    else {
        var monday = getMondayDate(new Date());
        res.render("main.html", {monday: monday, grade: classroom.class.GRADE, classroom: classroom.class.CLASS_NM, school_name: classroom.school.SCHUL_NM, user: user});
    }
});




// SIGNUP and LOGIN and LOGOUT
app.get("/login", (req, res) => {
    res.render("login/login.html");
});


app.get("/login/naver", (req, res) => {
    var client_id = 'ryaIsyjhpXC5VWERXxdB';
    var redirectURI = encodeURI("https://sol-studio.shop/login/callback/naver");
    var state = Math.round(Math.random() * 1000)
    res.render("login/naver.html", {url: 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state, error: req.query.error});
});


app.get("/login/google", (req, res) => {
    res.render("login/google.html");
});


app.get("/login/callback/google", async (req, res) => {
    const googleClient = new OAuth2Client("349199124039-jrrvfbb7cerksel6s9d5uoq3ta9p0lak.apps.googleusercontent.com");
    try {
        var ticket = await googleClient.verifyIdToken({
            idToken: req.query.token,
            audience: "349199124039-jrrvfbb7cerksel6s9d5uoq3ta9p0lak.apps.googleusercontent.com",
        });
    }
    catch {
        res.send("오류");
        return;
    }
    const payload = ticket.getPayload();
    // const userid = payload['sub'];

    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({ email: payload.email })
    if (user != null) {
        req.session.user_id = user._id;
        res.redirect("/")
    }
    else {
        user = await client.db("school").collection("user").insertOne({
            type: null,
            auth: "google",
            email: payload.email,
            name: null,
            nick: payload.name,
            avatar: payload.picture,
            class: null,
            waiting: false
        });
        req.session.user_id = user.insertedId;
        req.session.save(() => {
            res.redirect("/login/type");
        })
    }
});


app.get("/login/callback/naver", async (req, res) => {
    var client_id = 'ryaIsyjhpXC5VWERXxdB';
    var client_secret = 'u9BbEVK09k';
    var state = "";
    var redirectURI = encodeURI("https://sol-studio.shop/login/callback/naver");
    var api_url = "";
    code = req.query.code;
    state = req.query.state;
    api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
     + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;
    var request = require('request');
    var options = {
        url: api_url,
        headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
     };
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body)
            var api_url2 = 'https://openapi.naver.com/v1/nid/me';
            var options2 = {
                url: api_url2,
                headers: {'Authorization': "Bearer " + body["access_token"]}
            };
            request.get(options2, async function (error2, response2, body2) {
            if (!error2 && response2.statusCode == 200) {
                var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
                var payload = JSON.parse(body2).response;
                var keys = Object.keys(payload)
                if (!keys.includes("email") || !keys.includes("nickname") || !keys.includes("name") || !keys.includes("profile_image")) {
                    res.redirect("/login/naver?error=3");
                    return;
                }
                var user = await client.db("school").collection("user").findOne({ email: payload.email })
                if (user != null) {
                    req.session.user_id = user._id;
                    res.redirect("/")
                }
                else {
                    
                    user = await client.db("school").collection("user").insertOne({
                        type: null,
                        auth: "naver",
                        email: payload.email,
                        name: payload.name,
                        nick: payload.nickname,
                        avatar: payload.profile_image,
                        class: null,
                        waiting: false
                    });
                    req.session.user_id = user.insertedId;
                    req.session.save(() => {
                        res.redirect("/login/type");
                    })
                }
            } else {
                if(response2 != null) {
                res.redirect("/login/naver?error=2");
                }
            }
            });
        } else {
            res.send("/login/naver?error=1");
        }
    });
})


app.get("/login/type", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({ _id: new ObjectId(req.session.user_id) })
    if (user.type != null) {
        res.redirect("/")
    }
    else {
        res.render("login/type.html", {id: req.session.user_id})
    }
});


app.get("/login/type/callback", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({ _id: new ObjectId(req.session.user_id) })
    if (user.type == null) {
        if (req.query.type == "teacher") {
            await client.db("school").collection("user").updateOne({ _id: new ObjectId(req.session.user_id) }, {$set: {type: "teacher"}})
            res.redirect("/register-class");
            return;
        }
        else if (req.query.type == "student") {
            await client.db("school").collection("user").updateOne({ _id: new ObjectId(req.session.user_id) }, {$set: {type: "student"}})
            var next = req.session.next ?? "/";
            delete req.session.next;
            console.log(next)
            res.redirect(next);
            return;
        }

    }
    else {
        res.redirect("/")
    }


});

app.get("/register-class", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});

    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)})
    if (user.type != "teacher" || user.class != null) {
        res.redirect("/");
        return;
    }
    res.render("find-school.html", {error: req.query.error})
});


app.post("/register-class", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});

    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)})
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    if (user.class != null) {
        res.redirect("/");
        return;
    }

    var schools = await neis.getSchoolInfo(
        {
            SCHUL_NM: req.body.school
        },
        {
            pSize: 100
        }
    )
    for (const s of schools) {
        if (s.SCHUL_NM == req.body.school) {
            var school = s;
            break;
        }
    }
    if (!school) {
        res.redirect("/register-class?error=noschool")
    }
    var classrooms = await neis.getClassInfo(
        {
            SD_SCHUL_CODE: school.SD_SCHUL_CODE,
            GRADE: req.body.grade,
            ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
            DGHT_CRSE_SC_NM: school.DGHT_SC_NM,
            CLASS_NM: req.body.class
        },
        {
            pSize: 100
        }
    )
    for (const s of classrooms) {
        if (s.CLASS_NM == req.body.class) {
            var classroom = s;
            break;
        }
    }
    if (!classroom) {
        res.redirect("/register-class?error=noclass")
    }
    var ay = classroom.AY
    var tmp = await client.db("school").collection("class").findOne({
        school: {
            SD_SCHUL_CODE: school.SD_SCHUL_CODE,
            ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
            SCHUL_NM: school.SCHUL_NM
        },
        class: {
            MADE: user._id,
            GRADE: classroom.GRADE,
            CLASS_NM: classroom.CLASS_NM
        },
        ay: ay
    })
    if (tmp != null) {
        res.send("이미 클래스가 존재합니다!");
        return;
    }
    var i = await client.db("school").collection("class").insertOne({
        school: {
            SD_SCHUL_CODE: school.SD_SCHUL_CODE,
            ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
            SCHUL_NM: school.SCHUL_NM
        },
        class: {
            MADE: user._id,
            GRADE: classroom.GRADE,
            CLASS_NM: classroom.CLASS_NM
        },
        ay: ay,
        invite: choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6).join("")
    })
    await client.db("school").collection("user").updateOne(
        {
            _id: new ObjectId(req.session.user_id)
        },
        {
            $set: {
                class: i.insertedId
            }
        }
    )

    res.redirect("/")
});


app.get("/invite", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)})
    if (user.class) {
        res.redirect("/")
        return;
    }
    res.render("invite.html", {error: req.query.error ?? ""})
});


app.get("/invite/:code", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)})
    if (user.class != null) {
        res.redirect("/");
        return;
    }
    var classroom = await client.db("school").collection("class").findOne({invite: req.params.code})
    
    if (classroom) {
        client.db("school").collection("user").updateOne({_id: new ObjectId(req.session.user_id)}, {$set: {class: classroom._id, waiting: true}})
        res.redirect("/")
    }
    else {
        res.redirect("/invite?error=noinvite")
    }
});


app.get("/logout", (req, res) => {
    delete req.session.user_id
    res.redirect("/login")
});



// 선생님 페이지
app.get("/teacher", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)});
    var classroom = await client.db("school").collection("class").findOne({_id: new ObjectId(user.class)});
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    var students = await client.db("school").collection("user").find({class: user.class, waiting: false, type: "student"}).toArray();
    var join_request = await client.db("school").collection("user").find({class: user.class, waiting: true, type: "student"}).toArray();
    res.render("teacher/teacher.html", {classroom: classroom, user: user, students: students, join_request: join_request})
});


// 소셜 기능
app.get('/user/:id', async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.params.id)});
    var classroom = await client.db("school").collection("class").findOne({_id: new ObjectId(user.class)})
    res.render("user.html", {user: user, classroom: classroom})
})





// POST and NOTICE
app.get("/new-post", (req, res) => {
    res.render("new_post.html")
});


app.get("/post", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var classroom = await client.db("school").collection("class").findOne({
        _id: new ObjectId(user.class)
    })
    res.render("post_list.html", {grade: classroom.class.GRADE, classroom: classroom.class.CLASS_NM, school_name: classroom.school.SCHUL_NM});

});


app.get("/post/:id", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    try {
        new ObjectId(req.params.id)
    }
    catch {
        res.sendStatus(404);
        return;
    }
    var data = await client.db("school").collection("post").findOne({
        class: user.class,
        _id: new ObjectId(req.params.id)
    });
    if (data == null) {
        res.sendStatus(404);
        return;
    }
    var author =  await client.db("school").collection("user").findOne({
        _id: new ObjectId(data.author)
    });
    data.content = data.content.replaceAll("<script", "&lt;script").replaceAll("</script>", "&lt;/script&gt;")
    res.render("post.html", {data: data, author: author, user: {name: user.name, avatar: user.avatar}})
});


app.get("/notice", async (req, res) => {
    res.end()
});


app.get("/notice/:id", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    try {
        new ObjectId(req.params.id)
    }
    catch {
        res.sendStatus(404);
        return;
    }
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var data = await client.db("school").collection("notice").findOne({
        class: user.class,
        _id: new ObjectId(req.params.id)
    });
    var author =  await client.db("school").collection("user").findOne({
        _id: new ObjectId(data.author)
    });
    if (data == null) {
        res.sendStatus(404);
        return;
    }
    res.render("notice.html", {data: data, author: author})

    
});





// API
app.get("/api/meal", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var classroom = await client.db("school").collection("class").findOne({
        _id: new ObjectId(user.class)
    })
    var meal = await neis.getMealInfo(
        {
            ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
            SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
            MLSV_YMD: req.query.date
        },
        {
            pSize: 1
        }
    );
    if (meal.success) {
        res.json({meal: meal.meal})
    }
    else {
        res.json({success: true, meal: []})
    }
});


app.post("/api/post", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    client.db("school").collection("post").insertOne({
        title: req.body.title,
        content: req.body.content,
        preview: req.body.content.replace(/<[^>]*>?/gm, '').slice(0, 20),
        author: user._id,
        class: user.class,
        timestamp: new Date().getTime()
    })
    res.redirect("/post")
});


app.get("/api/post", async (req, res) => {
    try {
        var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
        var user = await client.db("school").collection("user").findOne({
            _id: new ObjectId(req.session.user_id)
        })
        var data = await client.db("school").collection("post").find({
            class: user.class
        }).sort("_id", -1).skip(parseInt(req.query.skip)).limit(10).toArray();
    
        var result = []
        for (const d of data) {
            if (req.query.preview) {
                var author = await client.db("school").collection("user").findOne({
                    _id: new ObjectId(d.author)
                })
                result.push({title: d.title, id: d._id, preview: d.preview, timestamp: d.timestamp, author: author})
            }
            else {
                result.push({title: d.title, id: d._id})
            }
        }
        res.json({success: true, post: result})
    }
    catch {
        res.json({success: false, message: "알 수 없는 에러 (GET 파라미터를 확인해주세요)"})
    }
});


app.get("/api/notice", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var data = await client.db("school").collection("notice").find({
        class: user.class
    }).limit(5).toArray();

    var result = []
    for (const d of data) {
        result.push({title: d.title, id: d._id})
    }
    res.json({success: true, notice: result})
});


app.get("/api/timetable", async (req, res) => {
    function refine(data) {
        var result = []
        for (const d of data) {
            result.push({
                ITRT_CNTNT: d.ITRT_CNTNT,
                PERIO: d.PERIO,
                ALL_TI_YMD: d.ALL_TI_YMD
            })
        }
        return result
    }
    var friday = new Date(new Date(`${req.query.monday.slice(0, 4)}-${req.query.monday.slice(4, 6)}-${req.query.monday.slice(6, 8)}`).getTime() + 1000 * 60 * 60 * 24 * 4)
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    });
    var classroom = await client.db("school").collection("class").findOne({
        _id: new ObjectId(user.class)
    });
    if (!req.query.refresh) {
        var cache = []
        for (var i = 0; i < 5; i++) {
            var tmp = new Date(new Date(`${req.query.monday.slice(0, 4)}-${req.query.monday.slice(4, 6)}-${req.query.monday.slice(6, 8)}`).getTime() + 1000 * 60 * 60 * 24 * i)
    
            cache.push.apply(cache, await client.db("school").collection("timetable").find({
                ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                ALL_TI_YMD: formatDate(tmp),
                CLASS_NM: classroom.class.CLASS_NM,
                GRADE: classroom.class.GRADE
            }).toArray());
        }
        if (cache.length != 0) {
            res.json({success: true, table: refine(cache)});
            return;
        }
        try {
            var timetable = await neis.getTimetable(
                {
                    ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE
                },
                {
                    TI_FROM_YMD: req.query.monday,
                    TI_TO_YMD: formatDate(friday),
                    CLASS_NM: classroom.class.CLASS_NM,
                    GRADE: classroom.class.GRADE
                },
                {
                    pSize: 100
                }
            );
        }
        catch {
            res.json({success: false})
            return;
        }

        client.db("school").collection("timetable").insertMany(timetable)
        res.json({success: true, table: refine(timetable), friday: formatDate(friday)})
    }
    else {
        for (var i = 0; i < 5; i++) {
            var tmp = new Date(new Date(`${req.query.monday.slice(0, 4)}-${req.query.monday.slice(4, 6)}-${req.query.monday.slice(6, 8)}`).getTime() + 1000 * 60 * 60 * 24 * i)
            cache, await client.db("school").collection("timetable").deleteMany({
                ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                ALL_TI_YMD: formatDate(tmp),
                CLASS_NM: classroom.class.CLASS_NM,
                GRADE: classroom.class.GRADE
            });
        }
        try {
            var timetable = await neis.getTimetable(
                {
                    ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE
                },
                {
                    TI_FROM_YMD: req.query.monday,
                    TI_TO_YMD: formatDate(friday),
                    CLASS_NM: classroom.class.CLASS_NM,
                    GRADE: classroom.class.GRADE
                },
                {
                    pSize: 100
                }
            );
        }
        catch {
            res.json({
                success: false
            });
            return;
        }

        client.db("school").collection("timetable").insertMany(timetable)
        res.json({success: true, table: refine(timetable), friday: formatDate(friday)})
    }
});


app.get("/api/teacher/student.ban", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    await client.db("school").collection("user").updateOne(
        {
            _id: new ObjectId(req.query.user)
        },
        {$set: {
            class: null
        }}
    );
    res.json({success: true})
})


app.get("/api/teacher/join.accept", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    await client.db("school").collection("user").updateOne(
        {
            _id: new ObjectId(req.query.user)
        },
        {$set: {
            waiting: false
        }}
    );
    res.json({success: true})
});


app.get("/api/teacher/join.reject", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    await client.db("school").collection("user").updateOne(
        {
            _id: new ObjectId(req.query.user)
        },
        {$set: {
            class: null,
            waiting: false
        }}
    );
    res.json({success: true})
})


app.get("/api/user", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    var target = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.query.user)
    });
    res.json({success: true, user: target})
})


app.get("/api/comment", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var raw = await client.db("school").collection("comment").find({
        id: req.query.id,
        reply: req.query.reply ?? null
    }).limit(30).skip(parseInt(req.query.skip)).toArray();

    var comments = []

    for (const r of raw) {
        var author = await client.db("school").collection("user").findOne({
            _id: r.author
        })
        comments.push({
            _id: r._id,
            author: {
                name: author.name,
                avatar: author.avatar
            },
            content: r.content,
            timestamp: r.timestamp,
            reply: r.reply,
            reply_count: await client.db("school").collection("comment").count({reply: String(r._id)})
        })
    }

    res.json({success: true, comment: comments, total: await client.db("school").collection("comment").count({id: req.query.id, reply: req.query.reply ?? null})})
})


app.post("/api/comment", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)})
    var comment = await client.db("school").collection("comment").insertOne({
        id: req.body.id,
        author: user._id,
        content: req.body.content,
        timestamp: new Date().getTime(),
        reply: req.body.reply ?? null
    })

    res.json({success: true, comment: {
        _id: comment.insertedId,
        id: req.body.id,
        author: {
            name: user.name,
            avatar: user.avatar
        },
        content: req.body.content,
        timestamp: new Date().getTime(),
        reply: req.body.reply ?? null
    }})
})


app.get("/api/error", (req, res) => {
    res.end();
});




// ETC
app.get("/privacy", (req, res) => {
    res.render("privacy.html")
});


app.get("/terms", (req, res) => {
    res.render("terms.html")
});




// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Socket.io
var online = {}
io.on("connection", async (socket) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(socket.handshake.session.user_id)});
    if (!online[String(user.class)]) {
        online[String(user.class)] = []
    }
    if (!online[String(user.class)].includes(String(user._id))) {
        online[String(user.class)].push(String(user._id))
    }
    socket.join("class-" + String(user.class));
    io.to("class-" + String(user.class)).emit("online-count", online[String(user.class)].length);
    socket.on("disconnect", () => {
        const idx = online[String(user.class)].indexOf(String(user._id))
        if (idx > -1) online[String(user.class)].splice(idx, 1)
        io.to("class-" + String(user.class)).emit("online-count", online[String(user.class)].length);
    })
})



// RUN
httpServer.listen(3000, () => {
    console.log("hi");
})