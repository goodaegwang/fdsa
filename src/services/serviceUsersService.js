const moment = require("moment-timezone");
const _ = require("lodash");
const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);
const {ServiceUser} = require("../models");
const servicesService = require("./servicesService");
const statisticsService = require("./statisticsService");

/**
 * ID 중복확인
 *
 * @param {*} serviceId
 * @param {*} userId
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.isDuplicatedServiceUserId = async (serviceId, userId) => {
    logger.debug("call ServiceUsersService.isDuplicatedServiceUserId()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "isDuplicatedServiceUserId",
                param: {
                    serviceId,
                    userId,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return results.length > 0;
    } else {
        return null;
    }
};

/**
 * 회원가입
 *
 * @param {*} serviceId
 * @param {*} userId
 * @param {*} parentId
 * @param {*} password
 * @param {*} name
 * @param {*} role
 * @param {*} tel
 * @param {*} mobilePhone
 * @param {*} address
 * @param {*} addressDesc
 * @param {*} email
 * @param {*} birthday
 * @param {*} gender
 * @param {*} maritalStatus
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.joinServiceUser = async ({
                                            serviceId,
                                            userId,
                                            parentId = userId,
                                            password,
                                            name,
                                            status = 1,
                                            role,
                                            tel,
                                            mobilePhone,
                                            address,
                                            addressDesc,
                                            email,
                                            birthday,
                                            gender,
                                            maritalStatus,
                                        }) => {
    logger.debug("call ServiceUsersService.joinServiceUser()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "addServiceUser",
                param: {
                    serviceId,
                    userId,
                    parentId,
                    password,
                    name,
                    status,
                    role,
                    tel,
                    mobilePhone,
                    address,
                    addressDesc,
                    email,
                    birthday,
                    gender,
                    maritalStatus,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return results.affectedRows > 0;
    } else {
        return null;
    }
};

/**
 * 서비스 사용자 리스트 조회
 *
 * @param {*} serviceId
 * @param {*} type
 * @param {*} searchText
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.getServiceUserList = async ({serviceId, type, searchText, orderBy, offset, limit, status}) => {
    logger.debug("call ServiceUsersService.getServiceUserList()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "getServiceUserList",
                param: {
                    serviceId,
                    type,
                    searchText,
                    orderBy,
                    offset,
                    limit,
                    status,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);
        let resultSet = [];

        if (results.length !== 0) {

            resultSet = results.map(item => {

                const result = new ServiceUser(item);

                result.rownum = item.rownum;
                return result;
            });
        }

        return {
            cnt: results.length === 0 ? 0 : results[0].cnt,
            result: resultSet,
        };
    } else {
        return null;
    }
};

/**
 * 서비스 사용자 조회
 *
 * @param {*} serviceId
 * @param {*} userId
 * @returns
 * @memberof ServiceUsersService
 */
const getServiceUser = async (serviceId, userId) => {
    logger.debug("call ServiceUsersService.getServiceUser()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "getServiceUser",
                param: {
                    serviceId,
                    userId,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);
        const result = results.map(item => new ServiceUser(item));

        return result.length > 0 ? result[0] : null;
    } else {
        return null;
    }
};

module.exports.getServiceUser = getServiceUser;

/**
 * 비밀번호 변경
 *
 * @param {*} serviceId
 * @param {*} userId
 * @param {*} password
 * @param {*} name
 * @param {*} role
 * @param {*} tel
 * @param {*} mobilePhone
 * @param {*} address
 * @param {*} addressDesc
 * @param {*} email
 * @param {*} birthday
 * @param {*} gender
 * @param {*} maritalStatus
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.updateServiceUser = async ({
                                              serviceId,
                                              userId,
                                              password,
                                              name,
                                              role,
                                              tel,
                                              mobilePhone,
                                              address,
                                              addressDesc,
                                              email,
                                              birthday,
                                              gender,
                                              maritalStatus,
                                          }) => {
    logger.debug("call ServiceUsersService.updateServiceUser()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "updateServiceUser",
                param: {
                    serviceId,
                    userId,
                    password,
                    name,
                    role,
                    tel,
                    mobilePhone,
                    address,
                    addressDesc,
                    email,
                    birthday,
                    gender,
                    maritalStatus,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return results.affectedRows > 0;
    } else {
        return null;
    }
};

/**
 * 아이디 찾기(휴대폰 인증)
 *
 * @param {*} serviceId
 * @param {*} name
 * @param {*} mobilePhone
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.findServiceUserIdByMobilePhone = async (serviceId, name, mobilePhone) => {
    logger.debug("call ServiceUsersService.findServiceUserIdByMobilePhone()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "findServiceUserIdByMobilePhone",
                param: {
                    serviceId,
                    name,
                    mobilePhone,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return results.length > 0 ? results : "";
    } else {
        return null;
    }
};

/**
 * 아이디 찾기(이메일 인증)
 *
 * @param {*} serviceId
 * @param {*} name
 * @param {*} email
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.findServiceUserIdByEmail = async (serviceId, name, email) => {
    logger.debug("call ServiceUsersService.findServiceUserIdByEmail()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "findServiceUserIdByEmail",
                param: {
                    serviceId,
                    name,
                    email,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return results.length > 0 ? results : "";
    } else {
        return null;
    }
};

/**
 * 비밀번호 변경
 *
 * @param {*} serviceId
 * @param {*} userId
 * @param {*} password
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.changePassword = async ({serviceId, userId, password}) => {
    logger.debug("call ServiceUsersService.changePassword()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "changePassword",
                param: {
                    serviceId,
                    userId,
                    password,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return results.affectedRows > 0;
    } else {
        return null;
    }
};

/**
 * 패스워드 검사
 *
 * @param {*} serviceId
 * @param {*} userId
 * @param {*} password
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.isRightPassword = async ({serviceId, userId, password}) => {

    logger.debug("call ServiceUsersService.isRightPassword()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "isRightPassword",
                param: {
                    serviceId,
                    userId,
                    password,
                },
            },
        ];

        const result = await mysqlManager.querySingle(queryList);

        return result.length > 0;
    } else {
        return null;
    }
};

/**
 * 회원 탈퇴
 *
 * @param {*} serviceId
 * @param {*} userId
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.withdrawServiceUser = async ({serviceId, userId}) => {

    logger.debug("call ServiceUsersService.withdrawServiceUser()");

    if (await servicesService.isExistService(serviceId)) {

        const timestampString = Date.now().toString();
        const queryList = [
            // {
            //     namespace: "serviceUsers",
            //     sqlId: "deleteAllDeviceFromServiceUser",
            //     param: {userId},
            // },
            {
                namespace: "serviceUsers",
                sqlId: "updateUnusedAllLinkFromServiceUser",
                param: {
                    removeId: `removedId${timestampString}`,
                    serviceId,
                    userId,
                },
            }, {
                namespace: "serviceUsers",
                sqlId: "withdrawServiceUser",
                param: {
                    removeId: `removedId${timestampString}`,
                    removeName: `removedName${timestampString}`,
                    remveAddress: `removed`,
                    remveAddressDesc: `removed`,
                    removePhone: `removed`,
                    removeEmail: `removed`,
                    serviceId,
                    userId,
                },
            },
        ];

        const results = await mysqlManager.queryMultiWithTransaction(queryList);

        // 마지막 쿼리가 해당 링크를 지우는 쿼리이므로 그 결과만 체크함
        return (_.last(results).affectedRows > 0);
    } else {
        return null;
    }
};

/**
 * 사용자를 삭제한다.
 *
 * @param {*} serviceId
 * @param {*} userIds
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.deleteServiceUsers = async ({serviceId, userIds}) => {
    logger.debug("call ServiceUsersService.deleteServiceUsers()");

    if (await servicesService.isExistService(serviceId)) {

        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "deleteServiceUsers",
                param: {
                    serviceId,
                    userIds,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return results.affectedRows > 0;
    } else {
        return null;
    }
};

/**
 * 사용자 수를 가져온다.
 *
 * @param {*} serviceId
 * @param {*} timezone
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.getUserCount = async serviceId => {
    logger.debug("call ServiceUsersService.getUserCount()");

    if (await servicesService.isExistService(serviceId)) {

        const startDate = moment(0, "HH")
            .tz("UTC")
            .format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment({hours: 23, minutes: 59, seconds: 59})
            .tz("UTC")
            .format("YYYY-MM-DD HH:mm:ss");

        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "getUserCount",
                param: {
                    serviceId,
                    startDate,
                    endDate,
                },
            },
        ];

        const [results] = await mysqlManager.querySingle(queryList);

        return results;
    } else {
        return null;
    }
};

/**
 * 사용자 수 통계를 가져온다.
 *
 * @param {*} serviceId
 * @param {*} type
 * @param {*} startDate
 * @param {*} endDate
 * @param {*} interval
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.getUserStatistics = async ({serviceId, type, startDate, endDate, interval}) => {
    logger.debug("call ServiceUsersService.getUserStatistics()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "getUserStatistics",
                param: {
                    serviceId,
                    type,
                    startDate: `${startDate} 00:00:00`,
                    endDate: `${endDate} 23:59:59`,
                    interval,
                },
            },
        ];

        if (type === "withdrawal") queryList[0].sqlId = "getUserStatisticsAsWithdrawal";

        const statisticsData = await mysqlManager.querySingle(queryList);
        const statisticsDataWithNull = statisticsService.fillStatisticsData({
            statisticsData,
            startDate,
            endDate,
            interval,
            nullDataValue: {
                cnt: 0,
            },
        });

        let result = [];

        // 누적 타입인 경우 누적합 계산
        if (type === "total") {

            // 첫번째 데이터가 null인 경우 첫번째 데이터 계산
            const queryList2 = [
                {
                    namespace: "serviceUsers",
                    sqlId: "getFirstTotalCount",
                    param: {
                        serviceId,
                        startDate: interval === "1w" ? moment(startDate).add(1, "week").day("Sunday").format("YYYY-MM-DD") : startDate,
                        interval,
                    },
                },
            ];

            const firstData = await mysqlManager.querySingle(queryList2);

            statisticsDataWithNull[0].cnt = firstData[0] ? firstData[0].cnt : 0;

            result.push(_.reduce(statisticsDataWithNull, (acc, val) => {
                if (val.cnt === 0) {
                    val.cnt = acc.cnt;
                }
                result.push(acc);
                return val;
            }));
        } else {

            result = statisticsDataWithNull;
        }

        return result;
    } else {
        return null;
    }
};

/**
 * 사용자의 멤버를 가져온다.
 *
 * @param {*} serviceId
 * @param {*} parentId
 * @param {*} type
 * @param {*} searchText
 * @param {*} orderBy
 * @param {*} offset
 * @param {*} limit
 * @returns
 * @memberof ServiceUsersService
 */
module.exports.getServiceUserMembers = async ({serviceId, parentId, type, searchText, orderBy, offset, limit}) => {
    logger.debug("call ServiceUsersService.getServiceUserMembers()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "getServiceUserList",
                param: {
                    serviceId,
                    parentId,
                    type,
                    searchText,
                    orderBy,
                    offset,
                    limit,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);
        let resultSet = [];

        if (results.length !== 0) {

            resultSet = results.map(item => {

                const result = new ServiceUser(item);

                result.rownum = item.rownum;
                return result;
            });
        }

        return {
            cnt: results.length === 0 ? 0 : results[0].cnt,
            result: resultSet,
        };
    } else {
        return null;
    }
};

/**
 * push key를 가져온다.
 * @param offset
 * @param limit
 * @param cloudDeviceId
 * @param serviceId
 * @param ownerId
 * @returns {Promise<{result, cnt: number}|null>}
 */
module.exports.getPushkeyList = async ({offset, limit, cloudDeviceId, serviceId, ownerId}) => {

    logger.debug("call ServiceUsersService.getPushkeyList()");

    const service = await servicesService.getService(serviceId, ownerId);

    if (service === null) {

        return null;
    } else {

        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "getPushkeyList",
                param: {
                    serviceId,
                    cloudDeviceId,
                    offset,
                    limit,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return {
            cnt: results.length === 0 ? 0 : results[0].cnt,
            result: results,
        };
    }
};
