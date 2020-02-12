const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);
const linksService = require("./linksService");

const {Timeline} = require("../models");

class TimelineService {

    async getTimelineList(identifier, offset, limit, action, orderBy, startDate, endDate) {
        logger.debug("call getTimelineList()");

        const queryList = [
            {
                namespace: "timeline",
                sqlId: "getTimelineList",
                param: {
                    identifier,
                    offset,
                    limit,
                    action,
                    orderBy: orderBy === "" ? "desc" : orderBy,
                    startDate,
                    endDate,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);
        const resultSet = [];

        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                resultSet.push(new Timeline(results[i]));
            }
        }

        return {
            cnt: results.length === 0 ? 0 : results[0].cnt,
            result: resultSet,
        };
    }

    async getTimelineByServiceId(serviceId, offset, limit, action, orderBy, startDate, endDate) {
        logger.debug("call getTimelineByServiceId()");

        const queryList = [
            {
                namespace: "timeline",
                sqlId: "getTimelineByServiceId",
                param: {
                    serviceId,
                    offset,
                    limit,
                    action,
                    orderBy: orderBy === "" ? "desc" : orderBy,
                    startDate,
                    endDate,
                },
            },
        ];

        const results = await mysqlManager.querySingle(queryList);
        const resultSet = [];

        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                resultSet.push(new Timeline(results[i]));
            }
        }

        return {
            cnt: results.length === 0 ? 0 : results[0].cnt,
            result: resultSet,
        };
    }

    async addTimeline({identifier, category, level, action, unitNumber, controlValue, userId, clientId, ruleId, message}) {

        logger.debug("call addTimeline()");

        const link = await linksService.getLinkFromDevice(identifier);

        if (link !== null) {
            // link 정보가 없는 디바이스 타임라인 요청은 무시한다.
            const queryList = [
                {
                    namespace: "timeline",
                    sqlId: "addTimeline",
                    param: {
                        identifier,
                        category,
                        level,
                        action,
                        unitNumber,
                        controlValue,
                        userId,
                        clientId,
                        ruleId,
                        message,
                    },
                },
            ];

            const results = await mysqlManager.querySingle(queryList);

            return results.affectedRows === 1;
        }
    }
}

module.exports = new TimelineService();
