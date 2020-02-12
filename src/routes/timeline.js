const createError = require("http-errors");
const express = require("express");
const router = express.Router();
const commonUtil = require("../common/commonUtil");
const timelineService = require("../services/timelineService");
const logger = require("../common/logManager")(__filename);

router.get("/", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.query.identifier)) {
      next(
        createError(400, {
          code: "TIMELINE401",
          message: "device identifier is missing",
        }),
      );
    } else if (commonUtil.isNullParam(req.query.offset)) {
      next(
        createError(400, {code: "TIMELINE402", message: "offset is missing"}),
      );
    } else if (commonUtil.isNullParam(req.query.limit)) {
      next(
        createError(400, {code: "TIMELINE403", message: "limit is missing"}),
      );
    } else if (req.query.action === undefined) {
      next(
        createError(400, {code: "TIMELINE404", message: "action is missing."}),
      );
    } else if (req.query.orderBy === undefined) {
      next(
        createError(400, {code: "TIMELINE405", message: "period is missing."}),
      );
    } else if (
      !commonUtil.isNullParam(req.query.endDate) &&
      commonUtil.isNullParam(req.query.startDate)
    ) {
      next(
        createError(400, {
          code: "TIMELINE406",
          message: "start date is missing.",
        }),
      );
    } else if (
      !commonUtil.isNullParam(req.query.startDate) &&
      commonUtil.isNullParam(req.query.endDate)
    ) {
      next(
        createError(400, {
          code: "TIMELINE407",
          message: "end date is missing.",
        }),
      );
    } else {
      const results = await timelineService.getTimelineList(
        req.query.identifier,
        req.query.offset,
        req.query.limit,
        req.query.action,
        req.query.orderBy,
        req.query.startDate,
        req.query.endDate,
      );

      res.status(200);
      res.header("pagination-count", results.cnt);
      res.header("pagination-page", req.query.offset);
      res.header("pagination-limit", req.query.limit);
      next(results.result);
    }
  } catch (err) {
    next(err);
  }
});

router.get("/services/:serviceId", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.query.serviceId)) {
      next(
        createError(400, {
          code: "TIMELINE401",
          message: "device serviceId is missing",
        }),
      );
    } else if (commonUtil.isNullParam(req.query.offset)) {
      next(
        createError(400, {code: "TIMELINE402", message: "offset is missing"}),
      );
    } else if (commonUtil.isNullParam(req.query.limit)) {
      next(
        createError(400, {code: "TIMELINE403", message: "limit is missing"}),
      );
    } else if (req.query.action === undefined) {
      next(
        createError(400, {code: "TIMELINE404", message: "action is missing."}),
      );
    } else if (req.query.orderBy === undefined) {
      next(
        createError(400, {code: "TIMELINE405", message: "period is missing."}),
      );
    } else if (
      !commonUtil.isNullParam(req.query.endDate) &&
      commonUtil.isNullParam(req.query.startDate)
    ) {
      next(
        createError(400, {
          code: "TIMELINE406",
          message: "start date is missing.",
        }),
      );
    } else if (
      !commonUtil.isNullParam(req.query.startDate) &&
      commonUtil.isNullParam(req.query.endDate)
    ) {
      next(
        createError(400, {
          code: "TIMELINE407",
          message: "end date is missing.",
        }),
      );
    } else {
      const results = await timelineService.getTimelineByServiceId(
        req.query.serviceId,
        req.query.offset,
        req.query.limit,
        req.query.action,
        req.query.orderBy,
        req.query.startDate,
        req.query.endDate,
      );

      res.status(200);
      res.header("pagination-count", results.cnt);
      res.header("pagination-page", req.query.offset);
      res.header("pagination-limit", req.query.limit);
      next(results.result);
    }
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.body.identifier)) {
      next(
        createError(400, {
          code: "TIMELINE401",
          message: "identifier is missing",
        }),
      );
    } else if (commonUtil.isNullParam(req.body.category)) {
      next(
        createError(400, {
          code: "TIMELINE408",
          message: "category is missing",
        }),
      );
    } else if (commonUtil.isNullParam(req.body.level)) {
      next(
        createError(400, {code: "TIMELINE409", message: "level is missing"}),
      );
    } else if (commonUtil.isNullParam(req.body.action)) {
      next(
        createError(400, {code: "TIMELINE404", message: "action is missing"}),
      );
    } else {
      const isSuccessful = await timelineService.addTimeline({
        identifier: req.body.identifier,
        category: req.body.category,
        level: req.body.level,
        action: req.body.action,
        unitNumber: req.body.unitNumber,
        controlValue: req.body.controlValue,
        userId: req.auth.user.id,
        clientId: req.auth.client.id,
        ruleId: req.body.ruleId,
        message: req.body.message,
      });

      if (isSuccessful === false) {
        next(createError(404, "The connectivity does not exist."));
      } else {
        res.status(201);
        next({});
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
