const createError = require("http-errors");
const express = require("express");
const router = express.Router();
const commonUtil = require("../common/commonUtil");
const devicesService = require("../services/devicesService");
const logger = require("../common/logManager")(__filename);

router.get("/", async (req, res, next) => {

    try {

        // check request header and parameters
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.linkId)) {

            next(createError(400, {code: "DEVICES401", message: "link id is missing."}));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "DEVICES402", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "DEVICES403", message: "limit is missing."}));
        } else {

            const results = await devicesService.getDeviceList(req.query.linkId, req.auth.user.id, req.query.limit, req.query.offset);

            if (results === null) {

                next(createError(404, "The link does not exist."));
            } else {

                res.status(200);
                res.header("pagination-count", results.cnt);
                res.header("pagination-page", req.query.offset);
                res.header("pagination-limit", req.query.limit);
                next(results.result);
            }
        }
    } catch (err) {

        next(err);
    }
});

router.get("/:deviceId", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            const results = await devicesService.getDevice(req.params.deviceId);

            if (results === null) {

                next(createError(404, "The device does not exist."));
            } else {

                res.status(200);
                next(results);
            }
        }
    } catch (err) {

        next(err);
    }
});

router.post("/", async (req, res, next) => {

    try {

        // check request header and parameters
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.linkId)) {

            next(createError(400, {code: "DEVICES401", message: "link id is missing."}));
        } else if (commonUtil.isNullParam(req.body.name)) {

            next(createError(400, {code: "DEVICES404", message: "name is missing."}));
        } else if (commonUtil.isNullParam(req.body.cloudDeviceId)) {

            next(createError(400, {code: "DEVICES405", message: "cloud device id is missing."}));
        } else {

            const results = await devicesService.addDevice(req.body.name, req.body.cloudDeviceId, req.body.identifier, req.body.linkId, req.auth.user.id);

            if (results === null || results.isSuccessful === false) {

                next(createError(404, "The link or cloud device does not exist."));
            } else {

                res.status(201);
                next({insertId: results.insertId});
            }
        }
    } catch (err) {

        next(err);
    }
});

router.patch("/:deviceId", async (req, res, next) => {

    try {

        // check request header and parameters
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.name)) {

            next(createError(400, {code: "DEVICES404", message: "name is missing"}));
        } else {

            const results = await devicesService.updateDevice(req.body.name, req.body.identifier, req.params.deviceId, req.auth.user.id);

            if (results === false) {

                next(createError(404, "The device does not exist."));
            } else {

                res.status(204);
                next(results);
            }
        }
    } catch (err) {

        next(err);
    }
});

router.delete("/:deviceId", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            const results = await devicesService.deleteDevice(req.params.deviceId, req.auth.user.id);

            if (results === false) {

                next(createError(404, "The device does not exist."));
            } else {

                res.status(204);
                next(results);
            }
        }
    } catch (err) {

        next(err);
    }
});

router.post("/:deviceId/control", async (req, res, next) => {

    try {

        // check request header and parameters
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.controlType)) {

            next(createError(400, {code: "DEVICES406", message: "control type is missing."}));
        } else if (commonUtil.isNullParam(req.body.userInterface)) {

            next(createError(400, {code: "DEVICES407", message: "user interface is missing."}));
        } else if (commonUtil.isNullParam(req.body.unitNumber)) {

            next(createError(400, {code: "DEVICES408", message: "unit number is missing."}));
        } else if (commonUtil.isNullParam(req.body.controlValue)) {

            next(createError(400, {code: "DEVICES409", message: "control value is missing."}));
        } else {

            const results = await devicesService.control({
                action: req.body.controlType,
                userInterface: req.body.userInterface,
                deviceId: req.params.deviceId,
                unitNumber: req.body.unitNumber,
                controlValue: req.body.controlValue,
                userId: req.auth.user.id,
                clientId: req.auth.client.id,
                ruleId: req.body.ruleId,
                callback: (err, result) => {

                    res.status(200);
                    next(result);
                },
            });

            if (results === null) {
                next(createError(404, "The device does not exist."));
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
