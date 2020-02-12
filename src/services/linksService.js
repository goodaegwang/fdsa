const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);

const { Link } = require("../models");
const servicesService = require("./servicesService");
const cloudDevicesService = require("./cloudDevicesService");
const driverServerService = require("./driverServerService");

class LinksService {
  /**
   * 특정 서비스 하위의 연결 목록을 페이지네이션하여 반환한다.
   * @param serviceId
   * @param ownerId
   * @param limit
   * @param offset
   * @returns {Promise<{cnt: number, result: Array}>}
   */
  async getLinkList(serviceId, ownerId, limit, offset, type, searchText) {
    logger.debug("call getLinkList()");

    const service = await servicesService.getService(serviceId, ownerId);

    if (service === null) {
      return null;
    }

    const queryList = [];

    if (!type && !searchText) {
      queryList.push({
        namespace: "links",
        sqlId: "getLinkList",
        param: {
          serviceId,
          ownerId,
          limit,
          offset
        }
      });
    } else if (type && !searchText) {
      queryList.push({
        namespace: "links",
        sqlId: "getLinkListWithType",
        param: {
          type,
          serviceId,
          ownerId,
          limit,
          offset
        }
      });
    } else if (!type && searchText) {
      queryList.push({
        namespace: "links",
        sqlId: "getLinkListWithSearchText",
        param: {
          searchText: `%${searchText}%`,
          serviceId,
          ownerId,
          limit,
          offset
        }
      });
    } else {
      queryList.push({
        namespace: "links",
        sqlId: "getLinkListWithTypeAndSearchText",
        param: {
          type,
          searchText: `%${searchText}%`,
          serviceId,
          ownerId,
          limit,
          offset
        }
      });
    }

    const results = await mysqlManager.querySingle(queryList);
    const resultSet = [];

    for (let i = 0; i < results.length; i++) {
      const result = new Link(results[i]);

      resultSet.push(result);
    }

    return {
      cnt: results.length === 0 ? 0 : results[0].cnt,
      result: resultSet
    };
  }

  /**
   * 특정 연결 정보를 반환한다.
   * @param id
   * @param ownerId
   * @returns {Promise<*>}
   */
  async getLink(id, ownerId) {
    logger.debug("call getLink()");

    const queryList = [
      {
        namespace: "links",
        sqlId: "getLink",
        param: {
          id,
          ownerId
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);
    let result = null;

    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        result = new Link(results[i]);
      }
    }

    return result;
  }

  /**
   * 디바이스 정보로부터 특정 연결 정보를 반환한다.
   * @param identifier
   * @returns {Promise<*>}
   */
  async getLinkFromDevice(deviceIdentifier) {
    logger.debug("call getLinkFromDevice()");

    const queryList = [
      {
        namespace: "links",
        sqlId: "getLinkFromDevice",
        param: {
          serviceCode: deviceIdentifier.split("_")[0],
          identifier: deviceIdentifier.split("_")[1]
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);
    let result = null;

    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        result = new Link(results[i]);
      }
    }

    return result;
  }

  /**
   * 식별키가 중복되었는지 확인한다.
   *
   * @param {Object} param - 연결 정보
   * @param {string} param.accessToken - API 서버에서 발급받은 access token
   * @param {Object} param.linkId - 연결 ID
   * @returns {Object} result : 연결 여부
   * @throws {MySqlException} MySql 에러
   * @memberof LinksService
   */
  async isIdentifierDuplicated({ serviceId, identifier }) {
    logger.debug("call LinksService.isIdentifierDuplicated()");

    try {
      if (await servicesService.isExistService(serviceId)) {
        const queryList = [
          {
            namespace: "links",
            sqlId: "isIdentifierDuplicated",
            param: {
              serviceId,
              identifier
            }
          }
        ];

        const searchResult = await mysqlManager.querySingle(queryList);

        return {
          isDuplicated: !(searchResult.length === 0)
        };
      } else {
        return null;
      }
    } catch (e) {
      logger.warn(e.stack);
      throw e;
    }
  }

  /**
   * 연결을 생성한다.
   * @param name
   * @param type
   * @param identificationPolicy
   * @param identifier
   * @param serviceId
   * @param ownerId
   * @param userId
   * @returns {Promise<{result: number, data: string}|{result: number, data: {insertId}}|{result: number, data: {code: string, message: string}}|{result: number, data: *}>}
   */
  async addLink({
    name,
    type,
    protocol = "MQTTS",
    identificationPolicy,
    identifier,
    serviceId,
    ownerId,
    userId
  }) {
    logger.debug("call addLink()");

    try {
      const isExistService = await servicesService.isExistService(serviceId);

      if (isExistService === false) {
        return { result: 404, data: "The service does not exist." };
      }

      const result = await this.isIdentifierDuplicated({
        serviceId,
        identifier
      });

      if (result.isDuplicated) {
        return {
          result: 400,
          data: { code: "LINKS101", message: "The identifier is duplicated." }
        };
      } else {
        const id = mysqlManager.makeUUID();

        const queryList = [
          {
            namespace: "links",
            sqlId: "addLink",
            param: {
              id,
              name,
              type,
              protocol,
              identificationPolicy,
              identifier,
              serviceId,
              ownerId,
              userId
            }
          }
        ];

        const results = await mysqlManager.querySingle(queryList);

        if (results.affectedRows === 1) {
          return { result: 201, data: { insertId: id } };
        } else {
          return { result: 500, data: "Failed to save link." };
        }
      }
    } catch (e) {
      logger.warn(e.stack);
      return { result: 500, data: e.message };
    }
  }

  /**
   * 연결 정보를 수정한다.
   * @param params
   * @returns {Promise<Error|Boolean>}
   */
  async updateLink(name, syncStatus, id, ownerId) {
    logger.debug("call updateLink()");

    const queryList = [
      {
        namespace: "links",
        sqlId: "updateLink",
        param: {
          name,
          syncStatus,
          id,
          ownerId
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    return results.affectedRows === 1;
  }

  /**
   * 연결을 삭제한다.
   * @param id
   * @param ownerId
   * @returns {Promise<Error|Boolean>}
   */
  async deleteLink(id, ownerId) {
    logger.debug("call deleteLink()");

    // directLink 인지 조회
    let queryList = [
      {
        namespace: "links",
        sqlId: "getLinkInfoForDriverServer",
        param: {
          id
        }
      }
    ];

    const links = await mysqlManager.querySingle(queryList);

    queryList = [
      {
        namespace: "links",
        sqlId: "deleteDeviceWithLinkId",
        param: {
          id
        }
      },
      {
        namespace: "links",
        sqlId: "deleteLocationWithLinkId",
        param: {
          id
        }
      },
      {
        namespace: "links",
        sqlId: "deleteLink",
        param: {
          id,
          ownerId
        }
      }
    ];

    const results = await mysqlManager.queryMultiWithTransaction(queryList);

    // 마지막 쿼리가 해당 링크를 지우는 쿼리이므로 그 결과만 체크함
    if (results[results.length - 1].affectedRows >= 1) {
      // directLink 인 경우 linkHubServer에 send request for removing devices-map
      if (links.length > 0 && links[0].type === "0007") {
        const options = {
          url: `/devices-map/${links[0].device_id}`,
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        };

        await driverServerService.request(options);
      }

      return true;
    } else {
      return false;
    }
  }

  async getLinkConnectionTF({ id, userId, callback }) {
    logger.debug("call getLinkConnectionTF()");

    // 연결 정보 가져오기
    const queryList = [
      {
        namespace: "links",
        sqlId: "getLinkForIdentifier",
        param: {
          id
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    if (results.length === 0) {
      return null;
    } else {
      const deviceIdentifier = `${results[0].service_code}_${results[0].identifier}`;
      const command = "connect";

      // Request device command
      const options = {
        url: `/devices/command`,
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          deviceIdentifier,
          command,
          payload: ""
        }
      };

      try {
        const response = await driverServerService.request(options);

        callback(null, response.data.result);
      } catch (e) {
        logger.warn(e.stack);
        callback(null, { isConnected: false });
      }

      return true;
    }
  }

  /**
   * 연결 및 하위 디바이스를 생성한다.
   * @param linkName
   * @param type
   * @param identificationPolicy
   * @param identifier
   * @param deviceName
   * @param cloudDeviceId
   * @param serviceId
   * @param serviceCode
   * @param parentId
   * @param userId
   * @param address
   * @param locationName
   * @returns {Promise<{result: number, data: string}|{result: number, data: {insertDeviceId: string, insertLinkId: string}}|{result: number, data: {code: string, message: string}}|{result: number, data: *}>}
   */
  async addDevice({
    linkName,
    type,
    protocol = "MQTTS",
    identificationPolicy,
    identifier,
    deviceName,
    cloudDeviceId,
    serviceId,
    serviceCode,
    parentId,
    userId,
    address,
    locationName
  }) {
    logger.debug("call addDevice()");

    try {
      const isExistService = await servicesService.isExistService(serviceId);

      if (isExistService === false) {
        return { result: 404, data: "The service does not exist." };
      }

      const cloudDevice = await cloudDevicesService.getCloudDevice(
        cloudDeviceId
      );

      if (cloudDevice === null) {
        return { result: 404, data: "The cloud device does not exist." };
      }

      const result = await this.isIdentifierDuplicated({
        serviceId,
        identifier
      });

      if (result.isDuplicated) {
        return {
          result: 400,
          data: { code: "LINKS101", message: "The identifier is duplicated." }
        };
      } else {
        const ownerId = parentId || userId;

        const linkId = mysqlManager.makeUUID();
        const deviceId = mysqlManager.makeUUID();

        const queryList = [
          {
            namespace: "links",
            sqlId: "addLink",
            param: {
              id: linkId,
              name: linkName,
              type,
              protocol,
              identificationPolicy,
              identifier,
              serviceId,
              ownerId,
              userId,
              syncStatus: "1"
            }
          },
          {
            namespace: "devices",
            sqlId: "addDevice",
            param: {
              id: deviceId,
              name: deviceName,
              cloudDeviceId,
              identifier,
              serviceId,
              linkId,
              ownerId
            }
          }
        ];

        if (address !== undefined) {
          queryList.push({
            namespace: "links",
            sqlId: "addLinkLocation",
            param: {
              linkId,
              name: locationName,
              address,
              serviceId
            }
          });
        }

        const results = await mysqlManager.queryMultiWithTransaction(queryList);

        // Request driver use
        const options = {
          url: `/devices-map/${deviceId}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        };

        await driverServerService.request(options);

        let isSuccessful = false;

        if (address === undefined) {
          isSuccessful =
            results.length === 2 &&
            results[0].affectedRows === 1 &&
            results[1].affectedRows === 1;
        } else {
          isSuccessful =
            results.length === 3 &&
            results[0].affectedRows === 1 &&
            results[1].affectedRows === 1 &&
            results[2].affectedRows === 1;
        }

        if (isSuccessful) {
          return {
            result: 201,
            data: { insertLinkId: linkId, insertDeviceId: deviceId }
          };
        } else {
          return { result: 500, data: "Failed to save device." };
        }
      }
    } catch (e) {
      logger.warn(e.stack);
      return { result: 500, data: e.message };
    }
  }
}

module.exports = new LinksService();
