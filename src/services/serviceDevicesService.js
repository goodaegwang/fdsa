const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);
const {ServiceDevice} = require("../models");
const servicesService = require("./servicesService");

/**
* 전체 디바이스 조회
*
* @param {*} serviceId
* @param {*} type
* @param {*} searchText
* @returns
* @memberof serviceDevicesService
*/
module.exports.getDevicesList = async ({serviceId, type, searchText, orderBy, offset, limit}) => {
    logger.debug("call serviceDevicesService.getDevicesList()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceDevices",
                sqlId: "getServiceDeviceList",
                param: {
                    serviceId,
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

                const result = new ServiceDevice(item);

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
* 사용자의 등록 디바이스 조회
*
* @param {*} serviceId
* @param {*} type
* @param {*} searchText
* @returns
* @memberof serviceDevicesService
*/
module.exports.getUserDevicesList = async ({serviceId, parentId, type, searchText, orderBy, offset, limit}) => {
    logger.debug("call serviceDevicesService.getUserDevicesList()");

    if (await servicesService.isExistService(serviceId)) {
        const queryList = [
            {
                namespace: "serviceDevices",
                sqlId: "getServiceDeviceList",
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

                const result = new ServiceDevice(item);

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
