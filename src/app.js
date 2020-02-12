process.env.NODE_CONFIG_DIR = `${__dirname}/config/`;

const createError = require("http-errors");
const express = require("express");
const mongoManager = require("./common/mongoManager");
const mysqlManager = require("./common/mysqlManager");
const config = require("config");
const path = require("path");
const _ = require("lodash");
const logger = require("./common/logManager")(__filename);
const {accessLogger} = require("./common/logManager");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const Table = require("cli-table");
const oauthService = require("./services/oauthService");
const Sentry = require("@sentry/node");

const app = express();

app.use(cors());

logger.info(`NODE_ENV=${process.env.NODE_ENV || "development"}`);
logger.debug(`current working directory=${process.cwd()}`);
logger.debug(`source directory=${__dirname}`);

if (process.env.NODE_ENV === "production") {
  app.use(helmet());
  app.use(hpp());
}

app.use(accessLogger());

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(process.cwd(), config.get("server.userDataDir"))));
// app.use(require('./common/timeout').app);

Sentry.init({
  dsn: config.get("sentry.dsn"),
  environment: process.env.NODE_ENV,
});

// garbage collection setup
const scheduleGc = () => {
  if (!global.gc) {
    logger.info(
      "Garbage collection unavailable. Pass --expose-gc when launching node to enable forced garbage collection.",
    );
  } else {
    setTimeout(() => {
      // 3시간마다 garbage collection 수행
      global.gc();
      logger.info(`after manual gc, memory usage: ${JSON.stringify(process.memoryUsage())}`);
      scheduleGc();
    }, 10800000);
  }
};

scheduleGc();

const routeExpress = async () => {
  logger.debug("route()");

  const handleRequestError = (requestTable, req) => {
    const err = new Error();

    if (req.headers.accept === undefined || req.headers.accept !== "application/json") {
      err.status = 406;
      err.message = "Invalid accept.";
    } else if (!req.headers["content-type"]) {
      err.status = 400;
      err.message = "No content type.";
    } else {
      return {err: null};
    }

    logger.info(`\n${requestTable.toString()}`);
    logger.debug(`[Header   ] :: ${JSON.stringify(req.headers)}`);

    return {err};
  };

  const handleRequestSuccess = (requestTable, req) => {

    if (req.method === "GET" || req.method === "DELETE") {
      requestTable.push({query: JSON.stringify(req.query)});
    } else {
      // (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")
      requestTable.push({"content-type": req.headers["content-type"]});
    }
    logger.info(`\n${requestTable.toString()}`);
    logger.debug(`[Header   ] :: ${JSON.stringify(req.headers)}`);
    logger.info(`[Body   ] :: ${JSON.stringify(req.body)}`);

    // offset, limit string to integer
    if (req.query.limit) req.query.limit = Number(req.query.limit);
    if (req.query.offset) req.query.offset = Number(req.query.offset);
  };

  // router
  app.all("*", (req, res, next) => {
    const requestTable = new Table();

    requestTable.push({Type: " ==== REQUEST ==== "});
    requestTable.push({method: req.method});
    requestTable.push({url: req.originalUrl});

    req.requestTime = Date.now();

    if (
      !(req.method === "GET" && req.url === "/") &&
      !(req.method === "GET" && req.url === "/v2") &&
      !(req.method === "GET" && req.url === "/v2/") &&
      !(req.method === "GET" && req.url === "/favicon.ico") &&
      !(req.method === "GET" && req.url.startsWith("/v2/oauth")) &&
      !(req.method === "GET" && req.url.startsWith("/v2/plugins"))
    ) {
      const {err} = handleRequestError(requestTable, req);

      if (!err) {
        handleRequestSuccess(requestTable, req);
        next();
      } else {
        next(err);
      }
    } else {
      handleRequestSuccess(requestTable, req);
      next();
    }
  });

  // 토큰이 필요하지 않은 경로
  const serviceUsersController = require("./routes/serviceUsersController");

  app.use("/", require("./routes"));
  app.use("/v2/oauth", require("./routes/oauth"));
  app.use("/v2/plugins", express.static(path.join(process.cwd(), "node_modules")));
  app.post("/v2/services/:serviceId/users", serviceUsersController.joinServiceUser);
  app.post("/v2/services/:serviceId/users/check", serviceUsersController.isDuplicatedServiceUserId);
  app.get("/v2/services/:serviceId/users/idInquery/phone", serviceUsersController.findServiceUserIdByMobilePhone);
  app.get("/v2/services/:serviceId/users/idInquery/email", serviceUsersController.findServiceUserIdByEmail);
  app.patch("/v2/services/:serviceId/users/security", serviceUsersController.changePassword);

  app.use("*", oauthService.verifyToken.bind(oauthService));

  // 토큰이 필요한 경로
  app.use("/v2/services", require("./routes/services"));
  app.use("/v2/iot/links", require("./routes/links"));
  app.use("/v2/iot/devices", require("./routes/devices"));
  app.use("/v2/iot/clouddevices", require("./routes/cloudDevices"));
  app.use("/v2/iot/timeline", require("./routes/timeline"));
  app.use("/v2/data", require("./routes/data"));

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    next(createError(404));
  });

  // response & error handler
  app.use((err, req, res, next) => {
    let responseBody = null;
    const responseTable = new Table();

    if (err.inner instanceof Error) {
      err.code = err.inner.code;
      err.message = err.inner.message;
    }

    if (err instanceof Error) {
      if (err.status < 500) {
        logger.warn(`${req.originalUrl} [${err}]`);
      } else {
        logger.error(`${req.originalUrl} [${err}]`);
        logger.error(err.stack);
      }

      // set the error object
      res.status(err.status || 500);
      responseBody = {
        code: err.code,
        message: err.message,
      };
    } else {
      responseBody = err;
    }

    const endTime = new Date();

    responseTable.push(
      {Type: " ==== RESPONSE ==== "},
      {method: req.method},
      {url: req.originalUrl},
      {status: res.statusCode},
      {time: `${(endTime - req.requestTime) / 1000}ms`},
    );
    logger.info(`\n${responseTable.toString()}`);
    // logger.debug(`[body  ]:: ${JSON.stringify(responseBody)}`);
    logger.log({
      level: "debug",
      message: `[body  ]:: ${JSON.stringify(responseBody)}`,
      length: 500,
    });

    if (Object.keys(responseBody).length === 0 && responseBody.constructor === Object) {
      res.sendStatus(res.statusCode);
    } else {
      res.send(responseBody);
    }
  });

  // exception 에러가 발생해도 shutdown 되지 않게 예외 로직 추가
  process.on("uncaughtException", err => {
    logger.error("========================[Exception Error Occur]===========================");
    logger.error(err.message);
    logger.error(err.stack);
    logger.error("==========================================================================");
  });
};

// database Connection
(async () => {
  try {
    await Promise.all([
        mysqlManager.init(),
        mongoManager.init(),
        routeExpress(),
    ]);
  } catch (err) {
    logger.error(err.stack);
  }
})();

module.exports = app;
