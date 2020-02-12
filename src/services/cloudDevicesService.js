const _ = require("lodash");
const config = require("config");
const path = require("path");
const fs = require("fs");
const mysqlManager = require("../common/mysqlManager");
const driverServerService = require("./driverServerService");
const logger = require("../common/logManager")(__filename);
const { CloudDevice, CloudDeviceAttachment } = require("../models");

class CloudDevicesService {
  /**
   * 클라우드 디바이스 리스트를 가져온다.
   * @param cloudPublic
   * @param limit
   * @param offset
   * @param manufacturer
   * @param searchText
   * @param ownerId
   * @param orderBy
   * @returns {Promise<{result: Array, cnt: number}>}
   */
  async getCloudDeviceList({
    cloudPublic,
    limit,
    offset,
    manufacturer,
    searchText,
    deviceType,
    protocol,
    ownerId,
    orderBy = "createdAtDesc"
  }) {
    logger.debug("call getCloudDeviceList()");

    const queryList = [
      {
        namespace: "cloudDevices",
        sqlId: "getCloudDeviceList",
        param: {
          cloudPublic,
          ownerId,
          limit,
          offset,
          manufacturer,
          searchText,
          deviceType,
          orderBy
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);
    const resultSet = [];

    for (let i = 0; i < results.length; i++) {
      const result = new CloudDevice(results[i]);

      resultSet.push(result);
    }

    return {
      cnt: results.length === 0 ? 0 : results[0].cnt,
      result: resultSet
    };
  }

  /**
   * 하나의 클라우드 디바이스를 조회한다.
   *
   * @param {*} id
   * @returns
   * @memberof CloudDevicesService
   */
  async getCloudDevice(id) {
    logger.debug("call getCloudDevice()");

    const queryList = [
      {
        namespace: "cloudDevices",
        sqlId: "getCloudDevice",
        param: {
          id
        }
      },
      {
        namespace: "cloudDevices",
        sqlId: "getCloudDevicesAttachList",
        param: {
          id
        }
      }
    ];

    const results = await mysqlManager.queryMulti(queryList);
    let result = null;

    if (results.length > 0) {
      for (let i = 0; i < results[0].length; i++) {
        result = new CloudDevice(results[0][i]);

        if (results[1].length === 0) {
          result.attachments = [];
        } else {
          for (let j = 0; j < results[1].length; j++) {
            result.addAttachment(new CloudDeviceAttachment(results[1][j]));
          }
        }
      }
    }

    return result;
  }

  /**
   * 클라우드 디바이스를 추가한다.
   *
   * @memberof CloudDevicesService
   */
  async addCloudDevice({
    userId,
    productName,
    deviceType,
    protocol,
    dataEncryptionAlgo,
    productImagePath,
    mimeType,
    modelName,
    manufacturer,
    description
  }) {
    logger.debug("call CloudDevicesService.addCloudDevice()");

    const id = mysqlManager.makeUUID();
    const queryList = [
      {
        namespace: "cloudDevices",
        sqlId: "addCloudDevice",
        param: {
          id,
          cloudPublic: "0",
          deviceType,
          protocol,
          dataEncryptionAlgo,
          ownerId: userId,
          productImagePath,
          mimeType,
          productName,
          modelName,
          manufacturer,
          description
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    return { isSuccessful: results.affectedRows === 1, insertId: id };
  }

  /**
   * 클라우드 디바이스의 정보를 변경한다.
   *
   * @memberof CloudDevicesService
   */
  async updateCloudDevice({
    id,
    productName,
    modelName,
    manufacturer,
    productImagePath,
    mimeType,
    description,
    deletedAttachments,
    createdAttachments,
    protocol,
    ownerId
  }) {
    logger.debug("call CloudDevicesService.updateCloudDevice()");

    const cloudDevice = await this.getCloudDevice(id);

    if (cloudDevice === null) {
      return null;
    }

    const queryList = [
      {
        namespace: "cloudDevices",
        sqlId: "updateCloudDevice",
        param: {
          id,
          productName,
          modelName,
          manufacturer,
          // identifier,
          // driverPath,
          productImagePath,
          mimeType,
          description,
          protocol,
          ownerId
        }
      }
    ];

    if (deletedAttachments.length > 0) {
      const queryList1 = [
        {
          namespace: "cloudDevices",
          sqlId: "getAttachmentsFilePath",
          param: {
            attachments: deletedAttachments
          }
        }
      ];

      const attachments = await mysqlManager.querySingle(queryList1);
      const deleteResult = [];

      // delete attachment files.
      attachments.forEach(attachment => {
        const filePath = path.join(
          process.cwd(),
          config.get("server.userDataDir"),
          attachment.file_path
        );
        const deleteTarget = {};

        deleteTarget[attachment.file_path] = fs.existsSync(filePath);
        deleteTarget[attachment.file_path] && fs.unlinkSync(filePath);
        deleteResult.push(deleteTarget);
      });

      logger.debug(`Deleted files :: ${JSON.stringify(deleteResult)}`);

      queryList.push({
        namespace: "cloudDevices",
        sqlId: "deleteAttachments",
        param: {
          attachments: deletedAttachments
        }
      });
    }

    const params = [];
    const createdAttachmentIds = [];

    if (createdAttachments.length > 0) {
      for (let i = 0; i < createdAttachments.length; i++) {
        const attachmentId = mysqlManager.makeUUID();

        params.push({
          id: attachmentId,
          cloudDeviceId: id,
          originalName: createdAttachments[i].originalname,
          filename:
            config.get("server.uploadsDir") + createdAttachments[i].filename,
          userId: ownerId
        });

        createdAttachmentIds.push(attachmentId);
      }

      queryList.push({
        namespace: "cloudDevices",
        sqlId: "addAttachments",
        param: {
          attachments: params
        }
      });
    }

    const results = await mysqlManager.queryMultiWithTransaction(queryList);
    let isSuccessful = false;

    if (results[0].affectedRows === 1) {
      // isSuccessful = await this.makeDriver({cloudDeviceId: id});
      isSuccessful = true;
    }

    if (!isSuccessful) {
      return false;
    } else {
      return createdAttachmentIds;
    }
  }

  /**
   * 클라우드 디바이스를 제거한다.
   * @param id
   * @param ownerId
   * @returns {Promise<{result: boolean}|null>}
   */
  async deleteCloudDevice(id, ownerId) {
    logger.debug("call CloudDevicesService.deleteCloudDevice()");

    const cloudDevice = await this.getCloudDevice(id);

    if (cloudDevice === null) {
      return null;
    }

    const queryList = [
      {
        namespace: "cloudDevices",
        sqlId: "getNumOfCloudDeviceUsed",
        param: { id }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    if (results[results.length - 1].numOfCloudDeviceUsed === 0) {
      const deleteResult = [];

      const queryList = [
        {
          namespace: "cloudUnits",
          sqlId: "deleteAllUnits",
          param: {
            cloudDeviceId: id
          }
        }
      ];

      // delete attachment files.
      cloudDevice.attachments.forEach(attachment => {
        const filePath = path.join(
          process.cwd(),
          config.get("server.userDataDir"),
          attachment.filePath
        );

        const deleteTarget = {};

        deleteTarget[attachment.filePath] = fs.existsSync(filePath);
        deleteTarget[attachment.filePath] && fs.unlinkSync(filePath);
        deleteResult.push(deleteTarget);
      });

      logger.debug(`Deleted files :: ${JSON.stringify(deleteResult)}`);

      queryList.push(
        {
          namespace: "cloudDevices",
          sqlId: "deleteAllAttachments",
          param: {
            cloudDeviceId: id
          }
        },
        {
          namespace: "cloudDevices",
          sqlId: "deleteCloudDevice",
          param: {
            id,
            ownerId
          }
        }
      );

      const results = await mysqlManager.queryMultiWithTransaction(queryList);

      return results[results.length - 1].affectedRows > 0;
    } else {
      return false;
    }
  }

  /**
   * 클라우드 디바이스를 공개한다.
   * @param id
   * @param ownerId
   * @returns {Promise<{result: boolean}|null>}
   */
  async publishCloudDevice(id, ownerId) {
    logger.debug("call CloudDevicesService.publishCloudDevice()");

    const cloudDevice = this.getCloudDevice(id);

    if (cloudDevice === null) {
      return null;
    }

    const queryList = [
      {
        namespace: "cloudDevices",
        sqlId: "publishCloudDevice",
        param: {
          cloudPublic: "1",
          id,
          ownerId
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    return { result: results.affectedRows === 1 };
  }

  /**
   * 드라이버 생성
   *
   * @param {*} {cloudDeviceId}
   * @memberof CloudDevicesService
   */
  async makeDriver({ cloudDeviceId }) {
    logger.debug("call CloudDevicesService.makeDriver()");

    try {
      const options = {
        url: `/drivers/${cloudDeviceId}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
      };

      await driverServerService.request(options);
      await this.setDriverStatus({
        id: cloudDeviceId,
        status: "Y"
      });

      return true;
    } catch (e) {
      logger.warn(e.stack);

      return false;
    }
  }

  /**
   * 드라이버 상태 변경
   * @param id
   * @param status
   * @returns {Promise<{result: boolean}>}
   */
  async setDriverStatus({ id, status }) {
    logger.debug("call CloudDevicesService.setDriverStatus()");

    const queryList = [
      {
        namespace: "cloudDevices",
        sqlId: "setDriverStatus",
        param: {
          id,
          status
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    return { result: results.affectedRows === 1 };
  }
}

module.exports = new CloudDevicesService();
