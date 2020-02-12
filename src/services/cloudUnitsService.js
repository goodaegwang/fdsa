const _ = require("lodash");
const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);

const {CloudUnit} = require("../models");
const cloudDevicesService = require("./cloudDevicesService");

class CloudUnitsService {

    /**
     * 디바이스 하위 모든 유닛 리스트를 반환한다.
     * @param cloudDeviceId
     * @param limit
     * @param offset
     * @param searchText
     * @param orderBy
     * @returns {Promise<{result: Array, cnt: *}|null>}
     */
    async getCloudUnitList(cloudDeviceId, limit, offset, searchText, orderBy = "numberOrderByAsc") {

        logger.debug("call getCloudUnitList()");

        const cloudDevice = await cloudDevicesService.getCloudDevice(cloudDeviceId);

        if (cloudDevice === null) {
            return null;
        }

        const arrOrder = orderBy.split("OrderBy").map(item => _.snakeCase(item));

        const queryList = [
            {
                namespace: "cloudUnits",
                sqlId: "getCloudUnitList",
                param: {
                    cloudDeviceId,
                    limit,
                    offset,
                    searchText,
                    orderColumn: arrOrder[0],
                    orderMethod: arrOrder[1],
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);
        const resultSet = [];

        for (let i = 0; i < results.length; i++) {

            const result = new CloudUnit(results[i]);

            resultSet.push(result);
        }

        return {
            cnt: results.length === 0 ? 0 : results[0].cnt,
            result: resultSet,
        };
    }

    /**
     * 하나 이상의 유닛을 추가한다.
     * @param cloudDeviceId
     * @param userId
     * @param units
     * @returns {Promise<null>}
     */
    async addCloudUnitList(cloudDeviceId, userId, units) {

        logger.debug("call CloudUnitsService.addCloudUnitList()");

        const cloudDevice = await cloudDevicesService.getCloudDevice(cloudDeviceId);

        if (cloudDevice === null) {
            return null;
        }

        try {

            units.forEach(unit => {
                unit.cloudDeviceId = cloudDeviceId;
                unit.ownerId = userId;
            });

            const queryList = [
                {
                    namespace: "cloudUnits",
                    sqlId: "addUnits",
                    param: {
                        units,
                    },
                },
            ];

            await mysqlManager.querySingle(queryList);
        } catch (e) {

            // 이미 존재하는 유닛 여부 검사
            if (/Duplicate entry '.*' for key 'PRIMARY'/.test(e.message)) {
                e.status = 400;
                e.code = "CLOUDUNITS101";
                e.message = "This unit already exists.";
            }

            throw e;
        }
    }

    /**
     * 특정 유닛을 반환한다.
     * @param cloudDeviceId
     * @param number
     * @returns {Promise<*>}
     */
    async getCloudUnit(cloudDeviceId, number) {

        logger.debug("call CloudUnitsService.getCloudUnit()");

        const cloudDevice = await cloudDevicesService.getCloudDevice(cloudDeviceId);

        if (cloudDevice === null) {
            return null;
        }

        const queryList = [
            {
                namespace: "cloudUnits",
                sqlId: "getCloudUnit",
                param: {
                    cloudDeviceId,
                    number,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);
        let result = {};

        if (results.length > 0) {

            result = new CloudUnit(results[0]);
        }

        return result;
    }

    async updateCloudUnit({cloudDeviceId, number, name, commandType, dataPropertyGroupCode,
        dataPropertyCode, measure, description}) {

        logger.debug("call CloudUnitsService.updateCloudUnit()");

        const cloudDevice = await cloudDevicesService.getCloudDevice(cloudDeviceId);

        if (cloudDevice === null) {
            return null;
        }

        const queryList = [
            {
                namespace: "cloudUnits",
                sqlId: "updateUnit",
                param: {
                    name,
                    commandType,
                    dataPropertyGroupCode,
                    dataPropertyCode,
                    measure,
                    description,
                    cloudDeviceId,
                    number,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);

        return {isSuccessful: results.affectedRows === 1};
    }
    /**
     * 특정 유닛을 삭제한다.
     * @param cloudDeviceId
     * @param unitNumbers
     * @returns {Promise<null>}
     */
    async deleteCloudUnit(cloudDeviceId, unitNumbers) {

        logger.debug("call CloudUnitsService.addCloudUnitList()");

        const cloudDevice = await cloudDevicesService.getCloudDevice(cloudDeviceId);

        if (cloudDevice === null) {
            return null;
        }

        const queryList = [
            {
                namespace: "cloudUnits",
                sqlId: "deleteUnits",
                param: {
                    cloudDeviceId,
                    unitNumbers: _.map(unitNumbers, _.toString),
                },
            },
        ];

        await mysqlManager.querySingle(queryList);
    }
}

module.exports = new CloudUnitsService();
