const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);
const {Service} = require("../models");

/**
 * services 대한 기능을 제공하는 서비스 클래스입니다.
 * @class
 */
class ServicesService {

    /**
     * 해당 사용자가 이용하는 모든 서비스 목록을 반환합니다.
     * @param userId   서비스를 이용하는 사용자 아이디
     * @param offset    페이지네이션 offset
     * @param limit     페이지네이션 limit
     * @returns {Promise<{cnt: number, result: Array}>}    {cnt: 전체 목록 갯수, result: 페이지네이션된 목록 배열}
     */
    async getServiceList(userId, offset, limit) {

        logger.debug("call getServiceList()");

        try {
            const queryList = [
                {
                    namespace: "services",
                    sqlId: "getServiceList",
                    param: {
                        userId, limit, offset,
                    },
                },
            ];

            const results = await mysqlManager.querySingle(queryList);
            const resultSet = [];

            if (results.length > 0) {

                for (let i = 0; i < results.length; i++) {

                    resultSet.push(new Service(results[i]));
                }
            }

            return {
                cnt: results.length === 0 ? 0 : results[0].cnt,
                result: resultSet,
            };
        } catch (err) {

            logger.error(err.stack);
            return err;
        }
    }

    /**
     * 지정한 서비스 정보를 반환합니다.
     * @param id    서비스 아이디
     * @param userId   서비스 사용자 아이디
     * @returns {Promise<Service|null>} 성공 시 Service 인스턴스 실패 시 null
     */
    async getService(id, userId) {

        logger.debug("call getService()");

        try {
            const queryList = [
                {
                    namespace: "services",
                    sqlId: "getService",
                    param: {
                        id, userId,
                    },
                },
            ];

            const results = await mysqlManager.querySingle(queryList);

            if (results.length > 0) {

                return new Service(results[0]);
            } else {

                return null;
            }
        } catch (err) {

            logger.error(err.stack);
            return err;
        }
    }

    /**
     * id에 해당하는 서비스가 존재하는지 체크합니다.
     * @param id    서비스 아이디
     * @returns {Promise<Service|null>} 존재하는 경우 true 없는 경우 false
     */
    async isExistService(id) {

        logger.debug("call isExistService()");

        try {
            const queryList = [
                {
                    namespace: "services",
                    sqlId: "isExistService",
                    param: {
                        id,
                    },
                },
            ];

            const results = await mysqlManager.querySingle(queryList);

            if (results.length > 0) {

                return true;
            } else {

                return false;
            }
        } catch (err) {

            logger.error(err.stack);
            return err;
        }
    }
}

module.exports = new ServicesService();
