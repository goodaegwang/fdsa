const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);

const { Device } = require("../models");
const linksService = require("./linksService");
const cloudDevicesService = require("./cloudDevicesService");
const driverServerService = require("./driverServerService");
const timelineService = require("./timelineService");

class DeviceService {
  /**
   *
   * @param linkId
   * @param ownerId
   * @param limit
   * @param offset
   * @returns {Promise<{cnt: number, result: Array}>}
   */
  async getDeviceList(linkId, ownerId, limit, offset) {
    logger.debug("call getDeviceList()");

    const link = await linksService.getLink(linkId, ownerId);

    if (link === null) {
      return null;
    }

    const queryList = [
      {
        namespace: "devices",
        sqlId: "getDeviceList",
        param: {
          linkId,
          ownerId,
          limit,
          offset
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);
    const resultSet = [];

    for (let i = 0; i < results.length; i++) {
      resultSet.push(new Device(results[i]));
    }

    return {
      cnt: results.length === 0 ? 0 : results[0].cnt,
      result: resultSet
    };
  }

  /**
   * 특정 디바이스를 반환한다.
   * @param id
   * @returns {Promise<*>}
   */
  async getDevice(id) {
    logger.debug("call getDevice()");

    const queryList = [
      {
        namespace: "devices",
        sqlId: "getDevice",
        param: {
          id
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);
    let result = null;

    for (let i = 0; i < results.length; i++) {
      result = new Device(results[i]);
    }

    return result;
  }

  /**
   * 디바이스를 생성한다.
   * @param name
   * @param cloudDeviceId
   * @param identifier
   * @param linkId
   * @param ownerId
   * @returns {Promise<{isSuccessful: boolean, insertedId: number|*}>}
   */
  async addDevice(name, cloudDeviceId, identifier, linkId, ownerId) {
    logger.debug("call addDevice()");

    const link = await linksService.getLink(linkId, ownerId);

    if (link === null) {
      return null;
    }

    const cloudDevice = await cloudDevicesService.getCloudDevice(cloudDeviceId);

    if (cloudDevice === null) {
      return null;
    }

    const id = mysqlManager.makeUUID();
    let syncStatus = "0";

    if (link.type === "0007") {
      syncStatus = "1";
    }

    const queryList = [
      {
        namespace: "devices",
        sqlId: "addDevice",
        param: {
          id,
          name,
          cloudDeviceId,
          identifier,
          serviceId: link.serviceId,
          linkId
        }
      },
      {
        namespace: "links",
        sqlId: "updateSyncStatus",
        param: {
          linkId,
          syncStatus
        }
      }
    ];

    const results = await mysqlManager.queryMulti(queryList);
    const isSuccessful = results.every(item => item.affectedRows === 1);

    if (isSuccessful) {
      if (link.type === "0007") {
        // Request to driverServer for adding devices-map
        const options = {
          url: `/devices-map/${id}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        };

        await driverServerService.request(options);
      }

      return { isSuccessful: true, insertId: id };
    } else {
      return { isSuccessful: false, insertId: id };
    }
  }

  /**
   * 디바이스를 수정한다.
   * @param name
   * @param identifier
   * @param id
   * @param ownerId
   * @returns {Promise<null|boolean>}
   */
  async updateDevice(name, identifier, id, ownerId) {
    logger.debug("call updateDevice()");
    let linkId = null;

    // 연결 정보 가져오기
    let queryList = [
      {
        namespace: "links",
        sqlId: "getLinkIdFromDevice",
        param: {
          id
        }
      }
    ];

    let results = await mysqlManager.querySingle(queryList);

    if (results.length === 0) {
      return null;
    } else {
      linkId = results[0].id;
    }

    queryList = [
      {
        namespace: "devices",
        sqlId: "updateDevice",
        param: {
          name,
          identifier,
          id
        }
      },
      {
        namespace: "links",
        sqlId: "updateSyncStatus",
        param: {
          linkId,
          syncStatus: "0"
        }
      }
    ];

    results = await mysqlManager.queryMultiWithTransaction(queryList);

    return results.every(item => item.affectedRows >= 1);
  }

  /**
   * 디바이스를 삭제한다.
   * @param id
   * @param ownerId
   * @returns {Promise<null|boolean>}
   */
  async deleteDevice(id, ownerId) {
    logger.debug("call deleteDevice()");
    let linkId = null;

    // 연결 정보 가져오기
    let queryList = [
      {
        namespace: "links",
        sqlId: "getLinkIdFromDevice",
        param: {
          id
        }
      }
    ];

    let results = await mysqlManager.querySingle(queryList);

    if (results.length === 0) {
      return null;
    } else {
      linkId = results[0].id;
    }

    queryList = [
      {
        namespace: "devices",
        sqlId: "deleteElementWithDevice",
        param: {
          id
        }
      },
      {
        namespace: "devices",
        sqlId: "deleteDevice",
        param: {
          id
        }
      },
      {
        namespace: "links",
        sqlId: "updateSyncStatus",
        param: {
          linkId,
          syncStatus: "0"
        }
      }
    ];

    results = await mysqlManager.queryMultiWithTransaction(queryList);
    // 마지막 쿼리가 해당 디바이스를 지우는 쿼리이므로 그 결과만 체크함

    if (results[1].affectedRows === 1 && results[2].affectedRows === 1) {
      // Request to driverServer for removing devices-map
      const options = {
        url: `/devices-map/${id}`,
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      };

      await driverServerService.request(options);

      return true;
    } else {
      return false;
    }
  }

  async control({
    action,
    userInterface,
    deviceId,
    unitNumber,
    controlValue,
    userId,
    clientId,
    ruleId,
    callback
  }) {
    logger.debug("call control()");

    // 연결 정보 가져오기
    const queryList = [
      {
        namespace: "devices",
        sqlId: "getDeviceForControl",
        param: {
          deviceId
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    if (results.length === 0) {
      callback(null, { err: "devices is not exist.", result: 0 });
    } else {
      const deviceIdentifier = `${results[0].service_code}_${results[0].identifier}`;
      const command = "control";

      // Request device control
      const options = {
        url: `/devices/command`,
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          deviceIdentifier,
          command,
          payload: { unitNumber, controlValue }
        }
      };

      try {
        const response = await driverServerService.request(options);

        // 제어 시 타임라인 저장
        if (action === "userControl") {
          // 사용자에 의한 제어 성공 시 제어에 대한 타임라인 저장은 이곳에서
          await timelineService.addTimeline({
            identifier: deviceIdentifier,
            category: "1",
            level: "1",
            action,
            unitNumber,
            controlValue,
            userId,
            clientId,
            message: `${results[0].device_name},${userInterface}`
          });
        } else if (action === "ruleControl") {
          // 룰에 의한 제어 시 saveObj.userInterface 값에는 룰 이름이 저장되어 있음
          await timelineService.addTimeline({
            identifier: deviceIdentifier,
            category: "1",
            level: "1",
            action,
            unitNumber,
            controlValue,
            ruleId,
            message: `${results[0].device_name},${userInterface}`
          });
        }

        callback(null, response.data);
      } catch (e) {
        logger.warn(e.stack);
        callback(null, { err: e.message, result: 0 });
      }
    }
  }
}

module.exports = new DeviceService();
