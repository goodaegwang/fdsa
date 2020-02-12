const createError = require("http-errors");
const express = require("express");
const moment = require("moment");
const _ = require("lodash");
const router = express.Router();
const commonUtil = require("../common/commonUtil");
const {servicesService, serviceUsersService, serviceDevicesService} = require("../services");
const logger = require("../common/logManager")(__filename);

// 서비스 리스트 조회
router.get("/", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "SERVICES401", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "SERVICES402", message: "limit is missing."}));
        } else if (req.query.offset < 0) {

            next(createError(400, {code: "SERVICES403", message: "offset must be greater than or equal to zero."}));
        } else if (req.query.limit <= 0) {

            next(createError(400, {code: "SERVICES404", message: "limit must be greater than zero."}));
        } else {

            const results = await servicesService.getServiceList(req.auth.user.id, req.query.offset, req.query.limit);

            res.status(200);
            res.header("pagination-count", results.cnt);
            res.header("pagination-page", req.query.offset);
            res.header("pagination-limit", req.query.limit);
            next(results.result);
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
});

// 서비스 조회
router.get("/:serviceId", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            const results = await servicesService.getService(req.params.serviceId, req.auth.user.id);

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

// 사용자 전체 조회
router.get("/:serviceId/users", async (req, res, next) => {

    const typeList = [
        "all",
        "name",
        "id",
    ];

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.type)) {

            next(createError(400, {code: "SERVICEUSER408", message: "type is missing."}));
        } else if (!_.includes(typeList, req.query.type)) {

            next(createError(400, {code: "SERVICEUSER409", message: "wrong type."}));
        } else if (req.query.searchText === undefined) {

            next(createError(400, {code: "SERVICEUSER410", message: "searchText is missing."}));
        } else if (req.query.orderBy === undefined) {

            next(createError(400, {code: "SERVICEUSER411", message: "orderBy is missing."}));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "SERVICEUSER412", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "SERVICEUSER413", message: "limit is missing."}));
        } else if (req.query.status === undefined) {

            next(createError(400, {code: "SERVICEUSER421", message: "status is missing."}));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceUsersService.getServiceUserList({
                serviceId: req.params.serviceId,
                type: req.query.type,
                searchText: req.query.searchText,
                orderBy: req.query.orderBy,
                offset: req.query.offset,
                limit: req.query.limit,
                status: req.query.status,
            });

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

        logger.warn(err.stack);
        next(err);
    }
});

// 비밀번호 확인
router.post("/:serviceId/users/:userId/password", async (req, res, next) => {

    try {

        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.password)) {

            next(createError(400, {code: "SERVICEUSER402", message: "Password is missing."}));
        } else {

            const results = await serviceUsersService.isRightPassword({
                serviceId: req.params.serviceId,
                userId: req.params.userId,
                password: req.body.password,
            });

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else if (results === false) {

                next(createError(400, {code: "SERVICEUSER407", message: "Wrong password."}));
            } else {

                res.status(200);
                next({
                    result: results,
                });
            }
        }
    } catch (err) {

        logger.error(err.stack);
        next(createError(500));
    }
});

// 사용자 탈퇴
router.post("/:serviceId/users/:userId/withdrawal", async (req, res, next) => {

    try {

        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {
            const results = await serviceUsersService.withdrawServiceUser({
                serviceId: req.params.serviceId,
                userId: req.params.userId,
            });

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else if (results === false) {

                next(createError(404, "The user does not exist."));
            } else {

                res.status(204);
                next({});
            }
        }
    } catch (err) {

        logger.error(err.stack);
        next(createError(500));
    }
});

// 사용자 수 조회
router.get("/:serviceId/users/count", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceUsersService.getUserCount(req.params.serviceId);

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

// 사용자 수 통계
router.get("/:serviceId/users/statistics", async (req, res, next) => {

    const typeList = [
        "total",
        "new",
        "withdrawal",
    ];

    const intervalList = [
        "1h",
        "1d",
        "1w",
        "1M",
    ];

    const isValidDateFormat = date => moment(date, "YYYY-MM-DD", true).isValid();

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.type)) {

            next(createError(400, {code: "SERVICEUSER408", message: "type is missing."}));
        } else if (!_.includes(typeList, req.query.type)) {

            next(createError(400, {code: "SERVICEUSER409", message: "wrong type."}));
        } else if (commonUtil.isNullParam(req.query.startDate)) {

            next(createError(400, {code: "SERVICEUSER415", message: "startDate is missing."}));
        } else if (!isValidDateFormat(req.query.startDate)) {

            next(createError(400, {code: "SERVICEUSER416", message: "startDate must be in the format [YYYY-MM-DD]."}));
        } else if (commonUtil.isNullParam(req.query.endDate)) {

            next(createError(400, {code: "SERVICEUSER417", message: "endDate is missing."}));
        } else if (!isValidDateFormat(req.query.endDate)) {

            next(createError(400, {code: "SERVICEUSER418", message: "endDate must be in the format [YYYY-MM-DD]."}));
        } else if (commonUtil.isNullParam(req.query.interval)) {

            next(createError(400, {code: "SERVICEUSER419", message: "interval is missing."}));
        } else if (!_.includes(intervalList, req.query.interval)) {

            next(createError(400, {code: "SERVICEUSER420", message: "wrong interval."}));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceUsersService.getUserStatistics({
                serviceId: req.params.serviceId,
                type: req.query.type,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                interval: req.query.interval,
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

// 사용자 조회
router.get("/:serviceId/users/:userId", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceUsersService.getServiceUser(req.params.serviceId, req.params.userId);

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else if (results.length === 0) {

                next(createError(404, "The user does not exist."));
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

// 사용자 멤버 조회
router.get("/:serviceId/users/:userId/members", async (req, res, next) => {

    const typeList = [
        "all",
        "name",
        "id",
    ];

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.type)) {

            next(createError(400, {code: "SERVICEUSER408", message: "type is missing."}));
        } else if (!_.includes(typeList, req.query.type)) {

            next(createError(400, {code: "SERVICEUSER409", message: "wrong type."}));
        } else if (req.query.searchText === undefined) {

            next(createError(400, {code: "SERVICEUSER410", message: "searchText is missing."}));
        } else if (req.query.orderBy === undefined) {

            next(createError(400, {code: "SERVICEUSER411", message: "orderBy is missing."}));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "SERVICEUSER412", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "SERVICEUSER413", message: "limit is missing."}));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceUsersService.getServiceUserMembers({
                serviceId: req.params.serviceId,
                parentId: req.params.userId,
                type: req.query.type,
                searchText: req.query.searchText || "",
                orderBy: req.query.orderBy,
                offset: req.query.offset || 0,
                limit: req.query.limit || 10,
            });

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else if (results.length === 0) {

                next(createError(404, "The user does not exist."));
            } else {

                res.status(200);
                res.header("pagination-count", results.cnt);
                res.header("pagination-page", req.query.offset);
                res.header("pagination-limit", req.query.limit);
                next(results.result);
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
});

// 사용자 등록 디바이스 조회
router.get("/:serviceId/users/:userId/devices", async (req, res, next) => {

    const typeList = [
        "all",
        "linkName",
        "identifier",
        "deviceName",
    ];

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.type)) {

            next(createError(400, {code: "SERVICEUSER408", message: "type is missing."}));
        } else if (!_.includes(typeList, req.query.type)) {

            next(createError(400, {code: "SERVICEUSER409", message: "wrong type."}));
        } else if (req.query.searchText === undefined) {

            next(createError(400, {code: "SERVICEUSER410", message: "searchText is missing."}));
        } else if (req.query.orderBy === undefined) {

            next(createError(400, {code: "SERVICEUSER411", message: "orderBy is missing."}));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "SERVICEUSER412", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "SERVICEUSER413", message: "limit is missing."}));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceDevicesService.getUserDevicesList({
                serviceId: req.params.serviceId,
                parentId: req.params.userId,
                type: req.query.type,
                searchText: req.query.searchText || "",
                orderBy: req.query.orderBy,
                offset: req.query.offset || 0,
                limit: req.query.limit || 10,
            });

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else if (results.length === 0) {

                next(createError(404, "The device does not exist."));
            } else {

                res.status(200);
                res.header("pagination-count", results.cnt);
                res.header("pagination-page", req.query.offset);
                res.header("pagination-limit", req.query.limit);
                next(results.result);
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
});

// 사용자 정보 변경
router.patch("/:serviceId/users/:userId", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else {

            // TODO: req.auth.user.id === req.params.userId인 경우에만 변경 가능하고 아닌 경우 404에 오류 반환
            // 관리자는 수정 불가
            const results = await serviceUsersService.updateServiceUser({
                serviceId: req.params.serviceId,
                userId: req.params.userId,
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
            } else if (results === false) {

                next(createError(404, "The user does not exist."));
            } else {

                res.status(204);
                next({});
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
});

// 사용자 삭제
router.post("/:serviceId/users/deletion", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.body.userIds) || req.body.userIds.length === 0) {

            next(createError(400, {code: "SERVICEUSER414", message: "user IDs are missing."}));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceUsersService.deleteServiceUsers({
                serviceId: req.params.serviceId,
                userIds: req.body.userIds,
            });

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else if (results === false) {

                next(createError(404, "The user does not exist."));
            } else {

                res.status(204);
                next({});
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
});

// 디바이스 전체 조회
router.get("/:serviceId/devices", async (req, res, next) => {

    const typeList = [
        "all",
        "linkName",
        "identifier",
        "deviceName",
    ];

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.type)) {

            next(createError(400, {code: "SERVICEUSER408", message: "type is missing."}));
        } else if (!_.includes(typeList, req.query.type)) {

            next(createError(400, {code: "SERVICEUSER409", message: "wrong type."}));
        } else if (req.query.searchText === undefined) {

            next(createError(400, {code: "SERVICEUSER410", message: "searchText is missing."}));
        } else if (req.query.orderBy === undefined) {

            next(createError(400, {code: "SERVICEUSER411", message: "orderBy is missing."}));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "SERVICEUSER412", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "SERVICEUSER413", message: "limit is missing."}));
        } else {

            // TODO: 서비스 owner인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
            const results = await serviceDevicesService.getDevicesList({
                serviceId: req.params.serviceId,
                type: req.query.type,
                searchText: req.query.searchText || "",
                orderBy: req.query.orderBy,
                offset: req.query.offset || 0,
                limit: req.query.limit || 10,
            });

            if (results === null) {

                next(createError(404, "The service does not exist."));
            } else if (results.length === 0) {

                next(createError(404, "The device does not exist."));
            } else {

                res.status(200);
                res.header("pagination-count", results.cnt);
                res.header("pagination-page", req.query.offset);
                res.header("pagination-limit", req.query.limit);
                next(results.result);
            }
        }
    } catch (err) {

        logger.warn(err.stack);
        next(err);
    }
});

// 사용자 푸시키 리스트 조회
router.get("/:serviceId/pushkeys", async (req, res, next) => {

    try {

        // check request header
        if (req.headers["content-type"] !== "application/json") {

            next(createError(415, "Invalid content-type."));
        } else if (commonUtil.isNullParam(req.query.offset)) {

            next(createError(400, {code: "SERVICEUSER412", message: "offset is missing."}));
        } else if (commonUtil.isNullParam(req.query.limit)) {

            next(createError(400, {code: "SERVICEUSER413", message: "limit is missing."}));
        } else if (req.query.os === undefined) {

            next(createError(400, {code: "SERVICEUSER422", message: "os is missing."}));
        } else if (req.query.cloudDeviceId === undefined) {

            next(createError(400, {code: "SERVICEUSER423", message: "cloudDeviceId is missing."}));
        } else {

            const results = await serviceUsersService.getPushkeyList({
                offset: req.query.offset || 0,
                limit: req.query.limit || 10,
                os: req.query.os,
                cloudDeviceId: req.query.cloudDeviceId,
                serviceId: req.params.serviceId,
                ownerId: req.auth.user.id,
            });

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

        logger.warn(err.stack);
        next(err);
    }
});

router.all("/", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/check", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/idInquery/phone", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/idInquery/email", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/security", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/:userId/password", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/:userId/withdrawal", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/count", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/statistics", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/deletion", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/:userId/members", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/:userId/devices", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/users/:userId", (req, res, next) => {
    res.status(405);
    next({});
});

router.all("/:serviceId/devices", (req, res, next) => {
    res.status(405);
    next({});
});

module.exports = router;
