const createError = require("http-errors");
const express = require("express");
const router = express.Router();
const logger = require("../common/logManager")(__filename);
const commonUtil = require("../common/commonUtil");

const oauthService = require("../services/oauthService");
const servicesService = require("../services/servicesService");

router.post("/token", async (req, res, next) => {

    try {

        // check request header
        if (!req.is("application/x-www-form-urlencoded")) {

            next(createError(415, "Content-type must be x-www-form-urlencoded."));
        } else if (!req.get("Authorization") || req.get("Authorization").indexOf("Basic ") === -1) {

            next(createError(400, {code: "AUTH401", message: "No authentication given."}));
        } else {

            // check authorization token
            const basicHeader = req.get("Authorization").split("Basic ")[1];

            if (commonUtil.isNullParam(basicHeader)) {

                next(createError(400, {code: "AUTH401", message: "No authentication given."}));
            } else {

                // check auth type
                const decodedBasicToken = Buffer.from(basicHeader, "base64").toString("utf-8");
                const clientId = decodedBasicToken.split(":")[0];
                const clientSecret = decodedBasicToken.split(":")[1];

                if (clientId === "" || clientSecret === "") {

                    next(createError(400, {code: "AUTH401", message: "No authentication given."}));
                } else if (commonUtil.isNullParam(req.body.grant_type)) {

                    next(createError(400, {code: "AUTH402", message: "grant_type is missing."}));
                } else if (req.body.grant_type !== "client_credentials" && (req.body.grant_type !== "password" && req.body.grant_type !== "refresh_token")) {

                    next(createError(400, {code: "AUTH403", message: "The grant_type is not acceptable."}));
                } else {

                    // check parameter
                    switch (req.body.grant_type) {
                        case "client_credentials":
                            break;
                        case "password":
                            if (commonUtil.isNullParam(req.body.username)) {

                                next(createError(400, {code: "AUTH406", message: "username is missing."}));
                                return;
                            } else if (commonUtil.isNullParam(req.body.password)) {

                                next(createError(400, {code: "AUTH407", message: "password is missing."}));
                                return;
                            }
                            break;
                        case "refresh_token":
                            if (commonUtil.isNullParam(req.body.refresh_token)) {

                                next(createError(400, {code: "AUTH408", message: "refresh_token is missing."}));
                                return;
                            }
                            break;
                        default:
                            next(createError(400, {code: "AUTH409", message: "the grant-type is not supported."}));
                            return;
                    }

                    req.body.client_id = clientId;
                    req.body.client_secret = clientSecret;

                    const token = await oauthService.getToken(req, res);

                    next(token);
                }
            }
        }
    } catch (err) {

        logger.warn(err.message);
        next(err);
    }
});

router.post("/token/services/:serviceId", async (req, res, next) => {

    try {

        // check request header
        if (!req.is("application/x-www-form-urlencoded")) {

            next(createError(415, "Content-type must be x-www-form-urlencoded."));
        } else if (!req.get("Authorization") || req.get("Authorization").indexOf("Basic ") === -1) {

            next(createError(400, {code: "AUTH401", message: "No authentication given."}));
        } else {

            // check authorization token
            const basicHeader = req.get("Authorization").split("Basic ")[1];

            if (commonUtil.isNullParam(basicHeader)) {

                next(createError(400, {code: "AUTH401", message: "No authentication given."}));
            } else {

                // check auth type
                const decodedBasicToken = Buffer.from(basicHeader, "base64").toString("utf-8");
                const clientId = decodedBasicToken.split(":")[0];
                const clientSecret = decodedBasicToken.split(":")[1];

                if (clientId === "" || clientSecret === "") {

                    next(createError(400, {code: "AUTH401", message: "No authentication given."}));
                } else if (commonUtil.isNullParam(req.body.grant_type)) {

                    next(createError(400, {code: "AUTH402", message: "grant_type is missing."}));
                } else if (req.body.grant_type !== "password" && req.body.grant_type !== "refresh_token") {

                    next(createError(400, {code: "AUTH403", message: "The grant_type is not acceptable."}));
                } else {

                    // check parameter
                    switch (req.body.grant_type) {
                        case "client_credentials":
                            if (commonUtil.isNullParam(req.body.client_id)) {

                                next(createError(400, {code: "AUTH404", message: "client_id is missing."}));
                                return;
                            } else if (commonUtil.isNullParam(req.body.client_secret)) {

                                next(createError(400, {code: "AUTH405", message: "client_secret is missing."}));
                                return;
                            }
                            break;
                        case "password":
                            if (commonUtil.isNullParam(req.body.username)) {

                                next(createError(400, {code: "AUTH406", message: "username is missing."}));
                                return;
                            } else if (commonUtil.isNullParam(req.body.password)) {

                                next(createError(400, {code: "AUTH407", message: "password is missing."}));
                                return;
                            }
                            break;
                        case "refresh_token":
                            if (commonUtil.isNullParam(req.body.refresh_token)) {

                                next(createError(400, {code: "AUTH408", message: "refresh_token is missing."}));
                                return;
                            }
                            break;
                        default:
                            next(createError(400, {code: "AUTH409", message: "the grant-type is not supported."}));
                            return;
                    }

                    const isExistService = await servicesService.isExistService(req.params.serviceId);
                    const userId = req.body.username;

                    if (!isExistService) {

                        next(createError(404, "The service does not exist."));
                    } else {

                        if (req.body.grant_type === "password") {

                            req.body.username = `${req.body.username}/${req.params.serviceId}`;
                        }

                        req.body.client_id = clientId;
                        req.body.client_secret = clientSecret;

                        const token = await oauthService.getToken(req, res);

                        if (req.body.pushkey && req.body.pushkey !== "") {

                            if (commonUtil.isNullParam(req.body.os)) {

                                next(createError(400, {code: "AUTH410", message: "os is missing."}));
                            } else {

                                await oauthService.savePushKeyForServiceUsers({
                                    serviceId: req.params.serviceId,
                                    userId,
                                    clientId,
                                    os: req.body.os,
                                    pushkey: req.body.pushkey,
                                });
                            }
                        }

                        next(token);
                    }
                }
            }
        }
    } catch (err) {

        logger.warn(err.message);
        next(err);
    }
});

router.post("/appkey", async (req, res, next) => {

    try {

        // check request header
        if (!req.is("application/x-www-form-urlencoded")) {

            next(createError(415, "Content-type must be x-www-form-urlencoded."));
        } else if (!req.get("Authorization") || req.get("Authorization").indexOf("Basic ") === -1) {

            next(createError(400, {code: "AUTH401", message: "No authentication given."}));
        } else {

            // check authorization token
            const basicHeader = req.get("Authorization").split("Basic ")[1];

            if (commonUtil.isNullParam(basicHeader)) {

                next(createError(400, {code: "AUTH401", message: "No authentication given."}));
            } else {

                // check auth type
                const decodedBasicToken = Buffer.from(basicHeader, "base64").toString("utf-8");
                const clientId = decodedBasicToken.split(":")[0];
                const clientSecret = decodedBasicToken.split(":")[1];

                if (clientId === "" || clientSecret === "") {

                    next(createError(400, {code: "AUTH401", message: "No authentication given."}));
                } else if (commonUtil.isNullParam(req.body.appKey)) {

                        next(createError(400, {code: "AUTH409", message: "appKey is missing."}));
                } else {

                    req.body.client_id = clientId;
                    req.body.client_secret = clientSecret;

                    const result = await oauthService.getTokenWithAppKey(req, res);

                    if (result === false) {

                        next(createError(401, result.errorMsg));
                    } else {

                        next(result.token);
                    }
                }
            }
        }
    } catch (err) {

        logger.warn(err.message);
        next(err);
    }
});

router.post("/verification", async (req, res, next) => {

    try {

        // check request header
        if (!req.get("Authorization")) {

            next(createError(400, {code: "AUTH401", message: "No authentication given."}));
        } else {

            const token = await oauthService.verifyToken(req, res);

            next(token);
        }
    } catch (err) {

        logger.warn(err.message);
        next(err);
    }
});

router.all("/token", (req, res, next) => {
    res.status(405);
    next({});
});

module.exports = router;
