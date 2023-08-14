require('dotenv').config()
const express = require('express');
const cors = require('cors');

const aws = require('aws-sdk');
const morgan = require('morgan');
const multer = require('multer');
const multerS3 = require('multer-s3');
const axios = require('axios')
aws.config.loadFromPath('./creds.json');
var jwt = require('jsonwebtoken');
var querystring = require('querystring');
const { join } = require("path");
const YAML = require('json-to-pretty-yaml');
const sms = require("./client/utils/sms")
const traderProcess = require('./Trader')


const DeviceDetector = require("device-detector-js");

const app = express();

var { MongoClient, ObjectId } = require('mongodb');
const { error } = require('console');
const { v4: uuidv4 } = require("uuid")
const crypto = require('crypto');

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'))

const session = require('express-session');
const MongoDBStore = require('express-mongodb-session')(session);

var Bugsnag = require('@bugsnag/js')
var BugsnagPluginExpress = require('@bugsnag/plugin-express')

Bugsnag.start({
    apiKey: 'f088d748c99f920d8b2b9335d95ea7d6',
    plugins: [BugsnagPluginExpress]
})

const {
    JWT_TOKEN = 'shhhhh',
    DB_URL,
    DB_NAME
} = process.env


const store = new MongoDBStore({
    uri: `${DB_URL}`,
    collection: 'connect_mongodb_session_test'
});

app.use(require('express-session')({
    secret: 'This is a secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    genid: function (req) {
        return uuidv4() // use UUIDs for session IDs
    },
    store: store,
    // Boilerplate options, see:
    // * https://www.npmjs.com/package/express-session#resave
    // * https://www.npmjs.com/package/express-session#saveuninitialized
    resave: true,
    saveUninitialized: true
}));

// Catch errors
store.on('error', function (error) {
    console.log(error);
});



const fetchAccessTokenFromPaypal = async () => new Promise((resolve, reject) => {
    const options = {
        method: 'POST',
        withCredentials: true,
        url: 'https://api-m.paypal.com/v1/oauth2/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic QWFWa25NeHE1STY4TlU0ajJ6LUdJTk5keFBoMXc5RlhWcHc4N2x2bUpUb0FycTVBQU9hUllOdC0zZWxMWmo3LWlxMVNIY0pBdEFOQXllVVo6RU1tNUhEbHdiU0wtamo2bTdBcUpPY2Z0TUtydk9Id1JfQkR6bGNsTkZjaTlnbEs1R3JxWmZ6X3Q5U3JsYURkYXZITjhhVTdEOG53SEpqNi0='
        },
        auth: {
            username: "AaVknMxq5I68NU4j2z-GINNdxPh1w9FXVpw87lvmJToArq5AAOaRYNt-3elLZj7-iq1SHcJAtANAyeUZ",
            password: "EMm5HDlwbSL-jj6m7AqJOcftMKrvOHwR_BDzlclNFci9glK5GrqZfz_t9SrlaDdavHN8aU7D8nwHJj6-"
        },
        data: querystring.stringify({ 'grant_type': 'client_credentials' })
    };

    axios.request(options).then(function (response) {
        resolve(response.data.access_token);
    }).catch(function (error) {
        reject(error);
    });
})

const routes = async (client) => {
    const db = await client.db(DB_NAME || "WellAutoWashers")

    if (app.get('env') === 'production') {
        app.set('trust proxy', 1) // trust first proxy
        // sess.cookie.secure = true // serve secure cookies
    }

    function userAuthMiddleware(req, res, next) {
        // Extract the user ID from the authorization header
        const userId = req.headers.authorization;
        // Check if the user is logged in
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User is not logged in" });
        }
        // Increment the login count for the user
        db.collection('user-tracking').updateOne({ userId }, { $inc: { loginCount: 1 } }, { upsert: true })
        // Attach the user ID to the request object
        req.userId = userId;
        next();
    }

    function userTrackingMiddleware(req, res, next) {
        // Extract the user ID from the authorization header
        const userId = req.headers.authorization;
        // Extract other relevant information from the req object
        const { method, url, body, headers } = req;
        // Increment the count of access for the user
        db.collection('user-tracking').updateOne({ userId }, { $inc: { count: 1 } }, { upsert: true })
        // Insert the request information as a new document in the "user-tracking" collection
        db.collection('user-tracking').insertOne({ userId, method, url, body, headers, timestamp: new Date() });
        next();
    }

    function userBlockedMiddleware(req, res, next) {
        // Extract the token from the headers
        const token = req.headers.authorization;
        try {
            // Verify the token
            const decoded = jwt.verify(token, JWT_TOKEN);
            // Extract the user's id from the token
            const { _id: userId } = decoded;
            // Find the user in the database
            db.collection('users').findOne({ _id: ObjectId(userId) }, function (err, user) {
                if (err) throw err;
                // Check if the user is blocked
                if (user?.deleted) {
                    return res.status(403).json({ message: "Forbidden: User is blocked" });
                }
                // Attach the user to the request object
                req.user = user;
                next();
            });
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    }

    // This must be the first piece of middleware in the stack.
    // It can only capture errors in downstream middleware
    app.use(Bugsnag.getPlugin('express').requestHandler)

    /* all other middleware and application routes go here */
    const importantMiddleWares = [userAuthMiddleware, userBlockedMiddleware, userTrackingMiddleware]

    app.use(userTrackingMiddleware)

    // Routes
    app.use('/health', (req, res) => {
        res.send({ status: "ok" })
    });

    // Endpoint to serve the configuration file
    app.get("/auth_config.json", (req, res) => {
        res.sendFile(join(__dirname, "auth_config.json"));
    });

    // authMiddleware
    app.get('/jobs', importantMiddleWares, (req, res) => {
        db.collection('jobs').find({
            deleted: false
        }).toArray(function (err, result) {
            if (err) throw err

            res.send(result.map(job => {
                // if (req.auth.role != "Owner") {
                //     delete job.price
                //     delete job.paid
                // }
                job.createdAt = job._id.getTimestamp()
                return job
            }))
        })
    });

    app.get('/jobs/:id', importantMiddleWares, (req, res) => {
        let objectId;
        try {
            objectId = ObjectId(req.params.id);
        } catch (error) {
            // The given id is not a valid BSON ObjectId
            objectId = null;
        }

        db.collection('jobs').findOne({
            $or: [
                { _id: objectId },
                { shortId: req.params.id }
            ],
            deleted: false
        }, function (err, result) {
            if (err) throw err

            if (result) {
                result.createdAt = result._id.getTimestamp();
                res.send(result);
            } else {
                res.status(404).send({ message: "Job not found" });
            }
        });
    });


    app.get('/jobs/shortId/:shortId', importantMiddleWares, (req, res) => {
        db.collection('jobs').findOne({
            shortId: req.params.shortId,
            deleted: false
        }, function (err, result) {
            if (err) throw err

            result.createdAt = result._id.getTimestamp()
            res.send(result)
        })
    });

    app.get('/jobs/findByGoogleId/:googleId', importantMiddleWares, (req, res) => {
        db.collection('jobs').find({
            googleId: req.params.googleId,
            deleted: false
        }).toArray(function (err, result) {
            if (err) throw err
            res.send(result)
        })
    });



    app.post('/jobs', (req, res) => {
        Object.assign(req.body, {
            deleted: false
        })

        db.collection('jobs').insertOne(req.body, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.post('/track-refferals', async (req, res) => {
        // generate a short ID
        const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();
        console.log(shortId);
        // console.log(shortId); // output: "9a2b7c"
        const { REFFERAL_CODE, DISCOUNT_CODE } = req.body;

        const deviceDetector = new DeviceDetector();
        const device = deviceDetector.parse(req.headers['user-agent']);

        const newJobData = Object.assign(req.body, {
            _id: new ObjectId(),
            deleted: false,
            shortId,
            device
        });

        const trackData = {
            shortId,
            jobId: newJobData._id,
            timestamp: Date.now().toLocaleString(),
            REFFERAL_CODE,
            DISCOUNT_CODE
        };

        // console.log({ newJobData, trackData })
        db.collection('jobs').insertOne(newJobData);
        db.collection('track').insertOne(trackData)

        delete newJobData._id
        delete newJobData.jobId

        const message = YAML.stringify({ newJobData, trackData })
        console.log(message.length, message)
        sms({
            phone: "+254711657108",
            message
        }, console.log)
        return res.status(201).send(newJobData);
    });

    app.patch('/jobs/:id', importantMiddleWares, async (req, res) => {
        const deviceDetector = new DeviceDetector();
        const device = deviceDetector.parse(req.headers['user-agent']);
    
        try {
            let jobId = req.params.id;
            if (jobId === 'null') {
                jobId = new ObjectId();
            }
    
            const job = await db.collection('jobs').findOne({
                _id: ObjectId(jobId),
                deleted: false
            });
    
            if (!job) {
                const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();
    
                const newJobData = Object.assign(req.body, {
                    _id: ObjectId(jobId),
                    deleted: false,
                    shortId,
                    device
                });
    
                // SMS here
                if (newJobData.saved === true && newJobData.sendSMSOption === true) {
                    delete newJobData.device;
                    delete newJobData._id;
                    delete newJobData.deleted;
                    delete newJobData.googleId;
                    delete newJobData.userId;
                    delete newJobData.mpesaPhoneNumber;
                    delete newJobData.curtains;
                    delete newJobData.generalKgs;
    
                    newJobData.orderUrl = "http://wellwash.online/j/" + newJobData.shortId;
    
                    const message = YAML.stringify(newJobData);
    
                    console.log(message.length, message);
    
                    sms({
                        phone: req.body.phone,
                        message: YAML.stringify(newJobData)
                    }, console.log);
                }
    
                return res.status(201).send({ id: jobId, jobUrl: newJobData.orderUrl });
            }
    
            const jobBody = req.body;
            const updatedJob = await db.collection('jobs').updateOne(
                { _id: ObjectId(jobId) },
                { $set: Object.assign(jobBody, { device }) },
                { upsert: true }
            );
            console.log("Request Body:", req.body);
    
    
            if (req.body.saved == true) {
                const selectedItems = [];
                if (req.body.sendSMSOption == true) {
                    if (req.body.curtainsAmount > 0) {
                        selectedItems.push(`${req.body.curtainsAmount} Curtains`);
                    }
    
                    if (req.body.blanketsAmount > 0) {
                        selectedItems.push(`${req.body.blanketsAmount} Blankets`);
                    }
    
                    if (req.body.duvetsAmount > 0) {
                        selectedItems.push(`${req.body.duvetsAmount} Duvets`);
                    }
    
                    if (req.body.generalKgsAmount > 0) {
                        selectedItems.push(`${req.body.generalKgsAmount} Kgs of General Clothes`);
                    }
    
                    if (req.body.shoesAmount > 0) {
                        selectedItems.push(`${req.body.shoesAmount} Pairs of Shoes`);
                    }
    
                    const totalCost = (req.body.curtainsAmount || 0) * (req.body.curtainsCharge || 0) +
                                      (req.body.blanketsAmount || 0) * (req.body.blanketsCharge || 0) +
                                      (req.body.duvetsAmount || 0) * (req.body.duvetsCharge || 0) +
                                      (req.body.generalKgsAmount || 0) * (req.body.generalKgsCharge || 0) +
                                      (req.body.shoesAmount || 0) * (req.body.shoesCharge || 0);
    
                    const message = `Hello there! We hope you had a fantastic laundry experience with us. Your laundry bill is Ksh ${totalCost} for the following items:\n${selectedItems.join("\n")}.\nTo make the payment, please use Till number 8062238. Thank you for choosing us, and we look forward to serving you again soon at Well Auto Washers! Have a wonderful day!`;
    
                    sms({
                        phone: req.body.phone,
                        message: message
                    }, (error, response) => {
                        if (error) {
                            console.error("Error sending SMS:", error);
                        } else {
                            console.log("SMS sent successfully:", response);
                        }
                    });
                } else {
                    req.session.activeOrder = req.body;
                }
            }
    
            // Logic to send SMS based on selected status
            //const selectedStatus = req.body.statusInfo || [];
            const statusInfo = req.body.statusInfo || [];
            const selectedStatus = statusInfo.length > 0 ? statusInfo[0].status : null; 
            
            console.log("Received Status:", selectedStatus);
            const statusToMessageMap = {
                'PICK_UP': "Pick-Up Reminder: Hi [Customer Name], just a friendly reminder that we will be picking up your laundry today between [time window]. Thank you!",
                'COLLECTED': "Order Collected:Great news! We've collected your laundry and it's on its way to our facility. We'll keep you updated on the progress. ",
                'PROCESSING': "Order Processing: Your laundry is now being processed. Our team is taking care of everything to ensure your clothes come out fresh and clean!",
                'QUALITY_CHECK':"Quality Check and Pressing: We've completed the quality checks and pressing. Your clothes are looking fantastic and will be on their way to you soon.",
                'DISPATCH': "Dispatch for Delivery: Your order is on its way to you! Expect our delivery personnel to arrive between [time window]. We hope you're satisfied with our service!",
                'DELIVERED': "Delivery Confirmation:Your laundry has been delivered! Thank you for choosing us. We'd love to hear about your experience. Leave a review at [link].",
                'BLOCKED': ""
            };
    
            const statusMessage = statusToMessageMap[selectedStatus];
            if (statusMessage) {
                console.log("Sending SMS with status message:", statusMessage);
                console.log("Sending SMS with status message:", statusMessage);
                console.log("Phone:", req.body.phone);
               
                sms({
                    phone: req.body.phone,
                    message: statusMessage
                }, (error, response) => {
                    if (error) {
                        console.error("Error sending SMS:", error);
                    } else {
                        console.log("SMS sent successfully:", response);
                    }
                });
            }
    
            res.status(200).send({ id: jobId });
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: 'Server error' });
        }
    });
    
    app.get('/jobs-received/:laundryId', importantMiddleWares, (req, res) => {
        const laundryId = req.params.laundryId;
        db.collection('jobs').findOne({ _id: ObjectId(laundryId), deleted: false }, (err, job) => {
            if (err) throw err;
            if (!job) {
                res.status(404).send({ error: "Job not found" });
            } else {
                db.collection('users').findOne({ _id: job.userId }, (err, user) => {
                    if (err) throw err;
                    if (!user) {
                        res.status(404).send({ error: "User not found" });
                    } else {
                        const messages = [
                            "Great news! We've received your laundry order and everything looks good. Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be cleaned and ready for pickup at {{totalCost}} total cost. We're excited to take care of your laundry needs!",
                            "Your laundry details have been confirmed! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be freshly cleaned and cost {{totalCost}} in total. Thanks for choosing us!",
                            "We've got your laundry covered! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be cleaned to perfection and the total cost is {{totalCost}}. Looking forward to serving you!",
                            "Your laundry order is confirmed! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be expertly cleaned and the total cost is {{totalCost}}. We're excited to provide you with top-notch service!",
                            "We've received your laundry order and are excited to take care of it for you! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be cleaned and ready at a total cost of {{totalCost}}. Thanks for choosing us!"
                        ];
                        const message = messages[Math.floor(Math.random() * messages.length)];
                        message.replace("{{duvets}}", job.duvets)
                            .replace("{{curtains}}", job.curtains)
                            .replace("{{generalLaundry}}", job.generalLaundry)
                            .replace("{{shoes}}", job.shoes)
                            .replace("{{totalCost}}", job.totalCost);
                        func({ phone: user.phone, message: message }, console.log);
                        res.send({ message: "SMS sent successfully" });
                    }
                });
            }
        });
    });

    app.get('/jobs-ready/:laundryId', importantMiddleWares, (req, res) => {
        const laundryId = req.params.laundryId;
        db.collection('jobs').findOne({ _id: ObjectId(laundryId), deleted: false }, (err, job) => {
            if (err) throw err;
            if (!job) {
                res.status(404).send({ error: "Job not found" });
            } else {
                db.collection('users').findOne({ _id: job.userId }, (err, user) => {
                    if (err) throw err;
                    if (!user) {
                        res.status(404).send({ error: "User not found" });
                    } else {
                        const messages = [
                            "Great news! Your laundry order with ID of {{orderId}} is ready for delivery. Our bike courier is on the way to bring your fresh and clean laundry to you"
                            , "Your laundry order with ID of {{orderId}} is ready for delivery! Our bike messenger is en route to bring your freshly cleaned laundry to you"
                            , "Your laundry order with ID of {{orderId}} is all set for delivery. Our bike delivery rider is on the way to your location with your freshly cleaned laundry"
                            , "Your laundry order with ID of {{orderId}} is ready for pickup. Our bike courier is en route to bring your freshly cleaned laundry to you"
                            , "Your laundry order with ID of {{orderId}} is ready for pickup. Our bike messenger is on the way to deliver your freshly cleaned laundry to you"];
                        const message = messages[Math.floor(Math.random() * messages.length)];
                        message.replace("{{duvets}}", job.duvets)
                            .replace("{{curtains}}", job.curtains)
                            .replace("{{generalLaundry}}", job.generalLaundry)
                            .replace("{{shoes}}", job.shoes)
                            .replace("{{totalCost}}", job.totalCost);
                        func({ phone: user.phone, message: message }, console.log);
                        res.send({ message: "SMS sent successfully" });
                    }
                });
            }
        });
    });

    app.delete('/jobs/:id', importantMiddleWares, (req, res) => {
        db.collection('jobs').updateOne({ _id: ObjectId(req.params.id) }, { $set: { deleted: true } }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    // user mannagement
    app.post('/users', (req, res) => {
        const { googleId } = req.body

        db.collection('users').findOne({ googleId }, function (err, result) {
            console.log(result)

            if (!result) {
                // check if error is a "not found error"
                db.collection('users').updateOne({ googleId }, { $set: req.body, }, { upsert: true }, function (err, result) {
                    if (err) throw err

                    const { upsertedId: id } = result

                    var token = jwt.sign(result, JWT_TOKEN);

                    res.send({
                        user: Object.assign({}, req.body, { id }),
                        token
                    })

                    db.collection('roles').updateOne({ _id: ObjectId(id) }, { $set: { role: 'CLIENT' }, }, { upsert: true }, function (err, result) {
                        if (err) throw err
                    })
                })


            } else if (result) {

                db.collection('users').updateOne({ googleId }, { $set: req.body, }, { upsert: true }, function (err, _) {
                    if (err) throw err

                    var token = jwt.sign(result, JWT_TOKEN);

                    console.log({
                        user: result,
                        token
                    })

                    res.send({
                        user: result,
                        token
                    })
                })
            }
        })
    });

    app.patch('/users/roles/:id', importantMiddleWares, (req, res) => {
        db.collection('roles').updateOne({ _id: ObjectId(req.params.id) }, { $set: req.body }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.get('/users', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('users').find({
            // deleted: false
        }).toArray(async function (err, result) {
            if (err) throw err

            const result2 = await Promise.all(result.map(user => new Promise((resolve, reject) => {
                db.collection('roles').findOne({ _id: new ObjectId(user._id) }, function (err, result) {
                    if (err) throw err
                    // res.status(result ? 200 : 404).send(result)
                    user.role = result
                    resolve(user)
                })
            })))

            console.log(result2)
            res.send(result2)
        })
    });

    app.get('/users/:googleId', (req, res) => {
        // check google if this is a valid user first
        db.collection('users').findOne({ googleId: req.params.googleId, deleted: false }, function (err, result) {
            if (err) throw err
            res.status(result ? 200 : 404).send(result)
        })
    });

    app.patch('/users/:email', importantMiddleWares, (req, res) => {
        db.collection('users').updateOne({ email: req.params.email }, { $set: req.body }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.delete('/users/:email', importantMiddleWares, (req, res) => {
        db.collection('users').findOne({ email: req.params.email }, function (err, result) {
            if (err) throw err

            db.collection('users').updateOne({ email: req.params.email }, { $set: { deleted: !result.deleted } }, function (err, result) {
                if (err) throw err

                res.send(result)
            })
        })


    });

    app.patch('/users/role/:email', importantMiddleWares, (req, res) => {
        db.collection('user_roles').updateOne(
            { id: req.params.email },
            { $set: req.body },
            { upsert: true },
            function (err, result) {
                if (err) throw err

                res.send(result)
            })
    });

    app.post('/payments', async (req, res) => {
        // find job, find what we billed the client
        // get an access token from paypal
        // send api request to capture the paymant as final
        const paymentData = req.body
        db.collection('payments').insertOne(paymentData, function (err, paymentInsertRes) {
            if (err) throw err
            console.log("inserted payment", paymentInsertRes)

            db.collection('jobs').findOne({ id: req.body.jobID }, async function (err, job) {
                if (err) throw err
                console.log("found job", job)
                const access_token = await fetchAccessTokenFromPaypal()

                console.log("Got access token - ", access_token)
                // capture the transaction
                const options = {
                    method: 'POST',
                    url: `https://api-m.paypal.com/v1/payments/authorization/${paymentData.authorizationID}/capture`,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${access_token}`
                    },
                    data: { amount: { currency: 'USD', total: 0.01 }, is_final_capture: true }
                };

                axios.request(options).then(function (response) {
                    console.log("CAPTURERED TRANSACTION!!!", response.data);

                    db.collection('payments').updateOne({ _id: paymentInsertRes.insertedId }, { $set: { paypalCaptureInfo: response.data } }, function (err, paymentUpdateRes) {
                        if (err) throw err
                        console.log("updating capture res", paymentUpdateRes)
                    })
                }).catch(function (error) {
                    console.error(error.data);
                });
            })

            res.send(paymentInsertRes)
        })
    });


    // Set S3 endpoint to DigitalOcean Spaces
    const spacesEndpoint = new aws.Endpoint('fra1.digitaloceanspaces.com');
    const s3 = new aws.S3({
        endpoint: spacesEndpoint
    });

    const upload = multer({
        storage: multerS3({
            s3: s3,
            bucket: 'temp-uploads-storage',
            acl: 'public-read',
            key: function (request, file, cb) {
                console.log(file);
                cb(null, file.originalname);
            }
        })
    }).array('upload', 1);


    app.post('/upload', function (request, response, next) {
        upload(request, response, function (error) {
            if (error) {
                console.log(error);
                return response.status(500).send(error)
            }
            console.log('File uploaded successfully.');
            response.send({
                status: "OK"
            })

        });
    });

    // This handles any errors that Express catches
    app.use(Bugsnag.getPlugin('express').errorHandler)
}

const PORT = process.env.PORT || 8002;

async function main(startUpCompleteCallBack) {
    const { DB_URL = '' } = process.env
    const uri = DB_URL;

    if (DB_URL === '') {
        throw 'Mongo url missing'
    }

    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        routes(client)
        app.listen(PORT, console.log(`Server started on port ${PORT}`));
        startUpCompleteCallBack()
    } catch (e) {
        console.error(e);
    } finally {
        // await client.close();
    }
}

main(() => {
    // console.log("Starting trader Process...")
    // traderProcess()
}).catch(console.error);