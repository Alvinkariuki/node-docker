const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const cors = require("cors");

let RedisStore = require("connect-redis")(session);

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  SESSION_SECRET,
  REDIS_PORT,
} = require("./config/config");
const app = express();

let redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
});

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({}));
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 30000,
    },
  })
);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

app.get("/api/v1", (req, res) => {
  res.send("<h2> You have live!!</h2>");
  console.log("It run pretty good");
});

const mongoUrl = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

// How to implement a retry incase of network failure
const connectWithRetry = () => {
  mongoose
    .connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Successfully connected to DB"))
    .catch((err) => {
      console.log(err);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();
app.enable("trust proxy");

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
