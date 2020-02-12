const createError = require("http-errors");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const moment = require("moment-timezone");
const commonUtil = require("../common/commonUtil");
const dataService = require("../services/dataService");
const logger = require("../common/logManager")(__filename);

router.get("/latest", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.query.serviceId)) {
      next(
        createError(400, {code: "DATA401", message: "service id is missing"}),
      );
    } else if (commonUtil.isNullParam(req.query.deviceId)) {
      next(
        createError(400, {code: "DATA402", message: "device id is missing"}),
      );
    } else {
      const result = await dataService.getLatestData({
        user: req.auth.user,
        serviceId: req.query.serviceId,
        deviceId: req.query.deviceId,
      });

      if (result === 2) {
        // 서비스 아이디에 해당하는 정보가 없는 경우(서비스 아이디와 소유자 아이디가 맞지 않는 경우 포함)
        next(createError(404, "The service does not exist."));
      } else if (result === 3) {
        // 디바이스 아이디에 해당하는 정보가 없는 경우
        next(createError(404, "The device does not exist."));
      } else {
        res.status(200);
        next(result);
      }
    }
  } catch (err) {
    next(err);
  }
});

router.get("/statistics", async (req, res, next) => {
  try {
    // param check
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.query.serviceId)) {
      next(
        createError(400, {code: "DATA401", message: "service id is missing."}),
      );
    } else if (commonUtil.isNullParam(req.query.deviceId)) {
      next(
        createError(400, {code: "DATA402", message: "device id is missing."}),
      );
    } else if (commonUtil.isNullParam(req.query.unitNumbers)) {
      next(
        createError(400, {
          code: "DATA403",
          message: "unitNumbers are missing.",
        }),
      );
    } else if (commonUtil.isNullParam(req.query.dataType)) {
      next(
        createError(400, {code: "DATA404", message: "dataType is missing."}),
      );
    } else if (
      !commonUtil.isNullParam(req.query.endDate) &&
      commonUtil.isNullParam(req.query.startDate)
    ) {
      next(
        createError(400, {code: "DATA405", message: "start date is missing."}),
      );
    } else if (
      !commonUtil.isNullParam(req.query.startDate) &&
      commonUtil.isNullParam(req.query.endDate)
    ) {
      next(
        createError(400, {code: "DATA406", message: "end date is missing."}),
      );
    } else if (
      req.query.dataType !== "raw" &&
      commonUtil.isNullParam(req.query.interval)
    ) {
      next(
        createError(400, {code: "DATA407", message: "interval is missing."}),
      );
    } else if (commonUtil.isNullParam(req.query.timezone)) {
      next(
        createError(400, {code: "DATA408", message: "timezone is missing."}),
      );
    } else {
      const {
        serviceId,
        deviceId,
        dataType,
        startDate,
        endDate,
        interval,
      } = req.query;

      const result = await dataService.getStatisticsData({
        serviceId,
        deviceId,
        unitNumbers: req.query.unitNumbers.split(","),
        dataType,
        startDate,
        endDate,
        interval,
        timeOffset: parseInt(
          moment()
            .tz(req.query.timezone)
            .format("Z"),
          10,
        ),
      });

      if (result === null) {
        // 디바이스 아이디에 해당하는 정보가 없는 경우(디바이스 아이디와 소유자 아이디가 맞지 않는 경우 포함)
        next(createError(404, "The device does not exist."));
      } else {
        res.status(200);
        next(result);
      }
    }
  } catch (err) {
    next(err);
  }
});

router.get("/raw", async (req, res, next) => {
  try {
    // param check
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.query.serviceId)) {
      next(
        createError(400, {code: "DATA401", message: "service id is missing."}),
      );
    } else if (commonUtil.isNullParam(req.query.deviceId)) {
      next(
        createError(400, {code: "DATA402", message: "device id is missing."}),
      );
    } else if (commonUtil.isNullParam(req.query.unitNumbers)) {
      next(
        createError(400, {
          code: "DATA403",
          message: "unitNumbers are missing.",
        }),
      );
    } else if (
      !commonUtil.isNullParam(req.query.endDate) &&
      commonUtil.isNullParam(req.query.startDate)
    ) {
      next(
        createError(400, {code: "DATA405", message: "start date is missing."}),
      );
    } else if (
      !commonUtil.isNullParam(req.query.startDate) &&
      commonUtil.isNullParam(req.query.endDate)
    ) {
      next(
        createError(400, {code: "DATA406", message: "end date is missing."}),
      );
    } else if (commonUtil.isNullParam(req.query.offset)) {
      next(
        createError(400, {code: "DATA409", message: "offset is missing."}),
      );
    } else if (commonUtil.isNullParam(req.query.limit)) {
      next(createError(400, {code: "DATA410", message: "limit is missing."}));
    } else {
      const {
        serviceId,
        deviceId,
        startDate,
        endDate,
        offset,
        limit,
        order,
      } = req.query;

      const result = await dataService.getRawData({
        serviceId,
        deviceId,
        unitNumbers: req.query.unitNumbers.split(","),
        startDate,
        endDate,
        offset,
        limit,
        order,
      });

      if (result === null) {
        // 디바이스 아이디에 해당하는 정보가 없는 경우(디바이스 아이디와 소유자 아이디가 맞지 않는 경우 포함)
        next(createError(404, "The device does not exist."));
      } else {
        res.status(200);
        next(result);
      }
    }
  } catch (err) {
    next(err);
  }
});

router.all("/", (req, res, next) => {
  res.status(405);
  next({});
});

module.exports = router;
