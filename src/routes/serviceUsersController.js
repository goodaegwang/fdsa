const createError = require("http-errors");
const _ = require("lodash");
const commonUtil = require("../common/commonUtil");
const {serviceUsersService} = require("../services");
const oauthService = require("../services/oauthService");
const logger = require("../common/logManager")(__filename);

// ID 중복확인
// POST /v2/:serviceId/users/check
module.exports.isDuplicatedServiceUserId = async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            const result = await oauthService.verifyBasicAuth(req);

            if (!result.isSuccessful) {

                next(createError(401, result.errorMsg));
            } else {

                const results = await serviceUsersService.isDuplicatedServiceUserId(req.params.serviceId, req.body.userId);

                if (results === null) {

                    next(createError(404, "The service does not exist."));
                } else {

                    res.status(200);
                    next({
                        result: results,
                    });
                }
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
};

// 회원가입
// POST /v2/:serviceId/users
module.exports.joinServiceUser = async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.userId)) {

            next(createError(400, {code: "SERVICEUSER401", message: "User ID is missing."}));
        } else if (commonUtil.isNullParam(req.body.password)) {

            next(createError(400, {code: "SERVICEUSER402", message: "Password is missing."}));
        } else if (commonUtil.isNullParam(req.body.name)) {

            next(createError(400, {code: "SERVICEUSER403", message: "Name is missing."}));
        } else {

            const result = await oauthService.verifyBasicAuth(req);

            if (!result.isSuccessful) {

                next(createError(401, result.errorMsg));
            } else {

                const results = await serviceUsersService.joinServiceUser({
                    serviceId: req.params.serviceId,
                    userId: req.body.userId,
                    parentId: req.body.parentId,
                    password: req.body.password,
                    name: req.body.name,
                    role: req.body.role,
                    tel: req.body.tel,
                    mobilePhone: req.body.mobilePhone,
                    address: req.body.address,
                    addressDesc: req.body.addressDesc,
                    email: req.body.email,
                    birthday: req.body.birthday,
                    gender: req.body.gender,
                    maritalStatus: req.body.maritalStatus,
                });

                if (results === null) {

                    next(createError(404, "The service does not exist."));
                } else {

                    res.status(201);
                    next({});
                }
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
};

// 아이디 찾기(휴대폰 인증)
// GET /v2/:serviceId/users/idInquery/phone
module.exports.findServiceUserIdByMobilePhone = async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.name)) {

            next(createError(400, {code: "SERVICEUSER403", message: "Name is missing."}));
        } else if (commonUtil.isNullParam(req.query.mobilePhone)) {

            next(createError(400, {code: "SERVICEUSER404", message: "Mobile phone is missing."}));
        } else {

            const result = await oauthService.verifyBasicAuth(req);

            if (!result.isSuccessful) {

                next(createError(401, result.errorMsg));
            } else {

                const results = await serviceUsersService.findServiceUserIdByMobilePhone(req.params.serviceId, req.query.name, req.query.mobilePhone);

                if (results === null) {

                    next(createError(404, "The service does not exist."));
                } else if (results === "") {

                    next(createError(400, {code: "SERVICEUSER101", message: "No matched user."}));
                } else {

                    res.status(200);
                    next({
                        id: results,
                    });
                }
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
};

// 아이디 찾기(이메일 인증)
// GET /v2/:serviceId/users/idInquery/email
module.exports.findServiceUserIdByEmail = async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.name)) {

            next(createError(400, {code: "SERVICEUSER403", message: "Name is missing."}));
        } else if (commonUtil.isNullParam(req.query.email)) {

            next(createError(400, {code: "SERVICEUSER405", message: "Email is missing."}));
        } else {

            const result = await oauthService.verifyBasicAuth(req);

            if (!result.isSuccessful) {

                next(createError(401, result.errorMsg));
            } else {

                const results = await serviceUsersService.findServiceUserIdByEmail(req.params.serviceId, req.query.name, req.query.email);

                if (results === null) {

                    next(createError(404, "The service does not exist."));
                } else if (results === "") {

                    next(createError(400, {code: "SERVICEUSER101", message: "No matched user."}));
                } else {

                    res.status(200);
                    next({
                        id: results,
                    });
                }
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
};

// 비밀번호 변경
// PATCH /v2/:serviceId/users/security
module.exports.changePassword = async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.userId)) {

            next(createError(400, {code: "SERVICEUSER401", message: "User ID is missing."}));
        } else if (commonUtil.isNullParam(req.body.password)) {

            next(createError(400, {code: "SERVICEUSER402", message: "Password is missing."}));
        } else {

            const result = await oauthService.verifyBasicAuth(req);

            if (!result.isSuccessful) {

                next(createError(401, result.errorMsg));
            } else {

                const results = await serviceUsersService.changePassword({
                    serviceId: req.params.serviceId,
                    userId: req.body.userId,
                    password: req.body.password,
                });

                if (results === null) {

                    next(createError(404, "The service does not exist."));
                } else if (results === false) {

                    next(createError(400, {code: "SERVICEUSER101", message: "No matched user."}));
                } else {

                    res.status(204);
                    next({});
                }
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
};
