const config = require("config");
const axios = require("axios");

const logger = require("../common/logManager")(__filename);

/**
 * Nubison 드라이버 서버 호출 서비스
 *
 * @class DriverServerService
 *
 */
class DriverServerService {

    constructor() {

        this.request = axios.create({
            baseURL: config.get("driverServer.baseURL"),
            headers: {
                "accept": "application/json",
            },
            timeout: config.get("driverServer.timeout"),
        });
        this.request.interceptors.request.use(axiosRequest => {
            logger.debug("=== [ Driver Server Request ] ===");
            logger.debug({
                baseURL: axiosRequest.baseURL,
                method: axiosRequest.method,
                url: axiosRequest.url,
                data: axiosRequest.data,
                params: axiosRequest.params,
            });
            logger.debug("==========================");
            return axiosRequest;
        });
        this.request.interceptors.response.use(axiosResponse => {
            logger.debug("=== [ Driver Server Response ] ===");
            logger.debug({
                status: axiosResponse.status,
                data: axiosResponse.data,
            });
            logger.debug("==========================");
            return axiosResponse;
        });
    }
}

module.exports = new DriverServerService();
