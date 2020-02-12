const createError = require("http-errors");
const express = require("express");
const router = express.Router();
const commonUtil = require("../common/commonUtil");
const linksService = require("../services/linksService");
const logger = require("../common/logManager")(__filename);

router.get("/", async (req, res, next) => {

    try {

        // check request header and parameters
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.serviceId)) {

            next(createError(400, {code: "LINKS401", message: "service id is missing."}));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "LINKS402", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "LINKS403", message: "limit is missing."}));
        } else {

            // TODO: owner_id가 아닌 user_id가 req.auth.user.id와 같은 경우 리스트 조회하도록 수정
            const results = await linksService.getLinkList(req.query.serviceId, req.auth.user.id, req.query.limit, req.query.offset, req.query.type, req.query.searchText);

            if (results === null) {

                next(createError(404, "The service does not exist."));
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

router.get("/:linkId", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            // TODO: owner_id가 아닌 user_id가 req.auth.user.id와 같은 경우 리스트 조회하도록 수정
            const results = await linksService.getLink(req.params.linkId, req.auth.user.id);

            if (results === null) {

                next(createError(404, "The link does not exist."));
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
        } else if (commonUtil.isNullParam(req.body.serviceId)) {

            next(createError(400, {code: "LINKS401", message: "service id is missing"}));
        } else if (commonUtil.isNullParam(req.body.name)) {

            next(createError(400, {code: "LINKS405", message: "name is missing"}));
        } else if (commonUtil.isNullParam(req.body.type)) {

            next(createError(400, {code: "LINKS406", message: "type is missing"}));
        } else if (commonUtil.isNullParam(req.body.protocol)) {

            next(createError(400, {code: "LINKS413", message: "protocol is missing"}));
        } else if (commonUtil.isNullParam(req.body.identificationPolicy)) {

            next(createError(400, {code: "LINKS407", message: "identification policy is missing"}));
        } else if (commonUtil.isNullParam(req.body.identifier)) {

            next(createError(400, {code: "LINKS408", message: "identifier is missing"}));
        } else {

            // TODO: owner_id, user_id 추가하도록 수정
            const results = await linksService.addLink({
                name: req.body.name,
                type: req.body.type,
                protocol: req.body.protocol,
                identificationPolicy: req.body.identificationPolicy,
                identifier: req.body.identifier,
                serviceId: req.body.serviceId,
                ownerId: req.auth.user.parentid ? req.auth.user.parentid : req.auth.user.id,
                userId: req.auth.user.id,
            });

            if (results.result === 404 || results.result === 500) {

                next(createError(results.result, results.data));
            } else if (results.result === 201) {

                res.status(201);
                next(results.data);
            } else {

                next(createError(400, results.data));
            }
        }
    } catch (err) {

        next(err);
    }
});

router.post("/devices", async (req, res, next) => {

    try {

        // check request header and parameter
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.serviceId)) {

            next(createError(400, {code: "LINKS401", message: "service id is missing"}));
        } else if (commonUtil.isNullParam(req.body.linkName)) {

            next(createError(400, {code: "LINKS409", message: "link name is missing"}));
        } else if (commonUtil.isNullParam(req.body.type)) {

            next(createError(400, {code: "LINKS406", message: "link type is missing"}));
        } else if (commonUtil.isNullParam(req.body.identificationPolicy)) {

            next(createError(400, {code: "LINKS407", message: "identification policy is missing"}));
        } else if (commonUtil.isNullParam(req.body.identifier)) {

            next(createError(400, {code: "LINKS408", message: "link identifier is missing"}));
        } else if (commonUtil.isNullParam(req.body.deviceName)) {

            next(createError(400, {code: "LINKS410", message: "device name is missing"}));
        } else if (commonUtil.isNullParam(req.body.cloudDeviceId)) {

            next(createError(400, {code: "LINKS411", message: "cloud device id is missing"}));
        } else if (commonUtil.isNullParam(req.body.serviceCode)) {

            next(createError(400, {code: "LINKS412", message: "service code is missing"}));
        } else {

            // TODO: owner_id, user_id 추가하도록 수정
            const results = await linksService.addDevice({
                linkName: req.body.linkName,
                type: req.body.type,
                identificationPolicy: req.body.identificationPolicy,
                identifier: req.body.identifier,
                deviceName: req.body.deviceName,
                cloudDeviceId: req.body.cloudDeviceId,
                serviceId: req.body.serviceId,
                serviceCode: req.body.serviceCode,
                parentId: req.auth.user.parentid ? req.auth.user.parentid : req.auth.user.id,
                userId: req.auth.user.id,
                address: req.body.address,
                locationName: req.body.locationName,
            });

            if (results.result === 404 || results.result === 500) {

                next(createError(results.result, results.data));
            } else if (results.result === 201) {

                res.status(201);
                next(results.data);
            } else {

                next(createError(400, results.data));
            }
        }
    } catch (err) {

        next(err);
    }
});

/**
 * 식별키 중복 확인
 * @name  POST /links/identifier/:identifier
 */
router.get("/identifier/:identifier", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.serviceId)) {

            next(createError(400, {code: "LINKS401", message: "serviceId is missing."}));
        } else {

            const results = await linksService.isIdentifierDuplicated({
                serviceId: req.query.serviceId,
                identifier: req.params.identifier,
            });

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else {

                res.status(200);
                next(results);
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
});

router.patch("/:linkId", async (req, res, next) => {

    try {

        // check request header and parameters
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.params.linkId)) {

            next(createError(400, {code: "LINKS404", message: "link id is missing."}));
        } else if (commonUtil.isNullParam(req.body.name)) {

            next(createError(400, {code: "LINKS405", message: "name is missing."}));
        } else {

            const results = await linksService.updateLink(req.body.name, req.body.syncStatus, req.params.linkId, req.auth.user.id);

            if (results === false) {

                next(createError(404, "The link does not exist."));
            } else {

                res.status(204);
                next(results);
            }
        }
    } catch (err) {

        next(err);
    }
});

router.delete("/:linkId", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            const results = await linksService.deleteLink(req.params.linkId, req.auth.user.id);

            if (results === false) {

                next(createError(404, "The link does not exist."));
            } else {

                res.status(204);
                next(results);
            }
        }
    } catch (err) {

        next(err);
    }
});

router.get("/:linkId/connection", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            const results = await linksService.getLinkConnectionTF({
                id: req.params.linkId,
                userId: req.auth.user.id,
                callback: (err, result) => {

                    res.status(200);
                    next({isConnected: result === 1});
                },
            });

            if (results === null) {

                next(createError(404, "The link does not exist."));
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
