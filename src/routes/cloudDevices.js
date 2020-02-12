const createError = require("http-errors");
const express = require("express");
const config = require("config");

const router = express.Router();
const _ = require("lodash");
const commonUtil = require("../common/commonUtil");
const multer = require("multer");

const upload = multer(commonUtil.fileUploadOption);
const cloudDevicesService = require("../services/cloudDevicesService");
const cloudUnitsService = require("../services/cloudUnitsService");
const logger = require("../common/logManager")(__filename);

router.get("/", async (req, res, next) => {
  try {
    // check request header and param
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.query.cloudPublic)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES401",
          message: "cloudPublic is missing"
        })
      );
    } else if (commonUtil.isNullParam(req.query.offset)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES402",
          message: "offset is missing"
        })
      );
    } else if (commonUtil.isNullParam(req.query.limit)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES403",
          message: "limit is missing"
        })
      );
    } else if (req.query.manufacturer === undefined) {
      next(
        createError(400, {
          code: "CLOUDDEVICES404",
          message: "manufacturer is missing"
        })
      );
    } else if (req.query.searchText === undefined) {
      next(
        createError(400, {
          code: "CLOUDDEVICES405",
          message: "searchText is missing"
        })
      );
    } else {
      const results = await cloudDevicesService.getCloudDeviceList({
        cloudPublic: req.query.cloudPublic,
        limit: req.query.limit,
        offset: req.query.offset,
        manufacturer: req.query.manufacturer,
        searchText: req.query.searchText,
        deviceType: req.query.deviceType,
        protocol: req.query.protocol,
        ownerId: req.auth.user.id,
        orderBy: req.query.orderBy
      });

      res.status(200);
      res.header("pagination-count", results.cnt);
      res.header("pagination-page", req.query.offset);
      res.header("pagination-limit", req.query.limit);
      next(results.result);
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.post("/", upload.single("files"), async (req, res, next) => {
  try {
    if (commonUtil.isNullParam(req.body.productName)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES406",
          message: "productName is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.deviceType)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES407",
          message: "deviceType is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.modelName)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES408",
          message: "modelName is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.manufacturer)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES404",
          message: "manufacturer is missing."
        })
      );
    } else {
      req.body.userId = req.auth.user.id;

      if (req.file !== undefined) {
        req.body.productImagePath =
          config.get("server.uploadsDir") + req.file.filename;
        req.body.mimeType = req.file.mimetype;
      }

      const {
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
      } = req.body;

      const results = await cloudDevicesService.addCloudDevice({
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
      });

      if (results.isSuccessful) {
        res.status(200);
        next({ insertId: results.insertId });
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.get("/:cloudDeviceId", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else {
      const results = await cloudDevicesService.getCloudDevice(
        req.params.cloudDeviceId,
        req.auth.user.id
      );

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else {
        res.status(200);
        next(results);
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.patch("/:cloudDeviceId", upload.any(), async (req, res, next) => {
  try {
    // check request header and parameter
    if (!req.headers["content-type"].includes("multipart/form-data")) {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.body.productName)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES406",
          message: "productName is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.modelName)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES408",
          message: "modelName is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.manufacturer)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES404",
          message: "manufacturer is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.deletedAttachments)) {
      next(
        createError(400, {
          code: "CLOUDDEVICES409",
          message: "deleted attachments is missing."
        })
      );
    } else {
      const images = _.filter(req.files, { fieldname: "files" });
      const createdAttachments = _.filter(req.files, {
        fieldname: "createdAttachments"
      });

      req.body.deletedAttachments = JSON.parse(req.body.deletedAttachments);

      if (images !== undefined && images.length > 0) {
        req.body.productImagePath =
          config.get("server.uploadsDir") + images[0].filename;
        req.body.mimeType = images[0].mimetype;
      }

      const {
        productName,
        modelName,
        manufacturer,
        description,
        deletedAttachments,
        productImagePath,
        mimeType,
        protocol
      } = req.body;

      const results = await cloudDevicesService.updateCloudDevice({
        id: req.params.cloudDeviceId,
        productName,
        modelName,
        manufacturer,
        productImagePath,
        mimeType,
        description,
        deletedAttachments,
        createdAttachments,
        protocol,
        ownerId: req.auth.user.id
      });

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else {
        res.status(200);
        next({ createdAttachmentIds: results });
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.delete("/:cloudDeviceId", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else {
      const results = await cloudDevicesService.deleteCloudDevice(
        req.params.cloudDeviceId,
        req.auth.user.id
      );

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else if (results === false) {
        res.status(400);
        next(
          createError(400, {
            code: "CLOUDDEVICES424",
            message: "There was a device in use and could not be deleted."
          })
        );
      } else {
        res.status(204);
        next({});
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.post("/:cloudDeviceId/publication", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else {
      const results = await cloudDevicesService.publishCloudDevice(
        req.params.cloudDeviceId,
        req.auth.user.id
      );

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else {
        res.status(200);
        next(results);
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.get("/:cloudDeviceId/units", async (req, res, next) => {
  try {
    // check request header and param
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.query.offset)) {
      next(
        createError(400, {
          code: "CLOUDUNITS401",
          message: "offset is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.query.limit)) {
      next(
        createError(400, {
          code: "CLOUDUNITS402",
          message: "limit is missing."
        })
      );
    } else if (req.query.searchText === undefined) {
      next(
        createError(400, {
          code: "CLOUDUNITS403",
          message: "searchText is missing."
        })
      );
    } else if (req.query.orderBy === undefined) {
      next(
        createError(400, {
          code: "CLOUDUNITS404",
          message: "orderBy is missing."
        })
      );
    } else {
      // TODO: 클라우드 디바이스 owner이거나 클라우드 디바이스가 공개인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
      const results = await cloudUnitsService.getCloudUnitList(
        req.params.cloudDeviceId,
        req.query.limit,
        req.query.offset,
        req.query.searchText,
        req.query.orderBy
      );

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else {
        res.status(200);
        res.header("pagination-count", results.cnt);
        res.header("pagination-page", req.query.offset);
        res.header("pagination-limit", req.query.limit);
        next(results.result);
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.post("/:cloudDeviceId/units", async (req, res, next) => {
  try {
    // check request header and param
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.body.units)) {
      next(
        createError(400, {
          code: "CLOUDUNITS405",
          message: "units is missing."
        })
      );
    } else if (!Array.isArray(req.body.units)) {
      next(
        createError(400, {
          code: "CLOUDUNITS406",
          message: "units type is not array."
        })
      );
    } else if (!_.every(req.body.units, "name")) {
      next(
        createError(400, {
          code: "CLOUDUNITS407",
          message: "unit name is missing."
        })
      );
    } else if (!_.every(req.body.units, "number")) {
      next(
        createError(400, {
          code: "CLOUDUNITS408",
          message: "unit number is missing."
        })
      );
    } else if (!_.every(req.body.units, "commandType")) {
      next(
        createError(400, {
          code: "CLOUDUNITS409",
          message: "unit commandType is missing."
        })
      );
    } else {
      // TODO: 클라우드 디바이스 owner이거나 클라우드 디바이스가 공개인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
      const results = await cloudUnitsService.addCloudUnitList(
        req.params.cloudDeviceId,
        req.auth.user.id,
        req.body.units
      );

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else {
        res.status(201);
        next({});
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.get("/:cloudDeviceId/units/:number", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else {
      // TODO: 클라우드 디바이스 owner이거나 클라우드 디바이스가 공개인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
      const results = await cloudUnitsService.getCloudUnit(
        req.params.cloudDeviceId,
        req.params.number
      );

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else if (Object.keys(results).length === 0) {
        next(createError(404, "The cloud unit does not exist."));
      } else {
        res.status(200);
        next(results);
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.patch("/:cloudDeviceId/units/:number", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.body.name)) {
      next(
        createError(400, {
          code: "CLOUDUNITS407",
          message: "unit name is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.commandType)) {
      next(
        createError(400, {
          code: "CLOUDUNITS409",
          message: "unit commandType is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.dataPropertyGroupCode)) {
      next(
        createError(400, {
          code: "CLOUDUNITS412",
          message: "unit dataPropertyGroupCode is missing."
        })
      );
    } else if (commonUtil.isNullParam(req.body.dataPropertyCode)) {
      next(
        createError(400, {
          code: "CLOUDUNITS413",
          message: "unit dataPropertyCode is missing."
        })
      );
    } else {
      // TODO: 클라우드 디바이스 owner이거나 클라우드 디바이스가 공개인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
      const results = await cloudUnitsService.updateCloudUnit({
        cloudDeviceId: req.params.cloudDeviceId,
        number: req.params.number,
        name: req.body.name,
        commandType: req.body.commandType,
        dataPropertyGroupCode: req.body.dataPropertyGroupCode,
        dataPropertyCode: req.body.dataPropertyCode,
        measure: req.body.measure,
        description: req.body.description
      });

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else if (results.isSuccessful === false) {
        next(createError(404, "The cloud unit does not exist."));
      } else {
        res.status(204);
        next({});
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.post("/:cloudDeviceId/units/deletion", async (req, res, next) => {
  try {
    // check request header
    if (req.headers["content-type"] !== "application/json") {
      next(createError(415, "Invalid content-type."));
    } else if (commonUtil.isNullParam(req.body.unitNumbers)) {
      next(
        createError(400, {
          code: "CLOUDUNITS410",
          message: "unitNumbers is missing."
        })
      );
    }
    if (!Array.isArray(req.body.unitNumbers)) {
      next(
        createError(400, {
          code: "CLOUDUNITS411",
          message: "unitNumbers is not array."
        })
      );
    } else {
      // TODO: 클라우드 디바이스 owner이거나 클라우드 디바이스가 공개인 경우에만 조회가능하고 아닌 경우 404에 오류 반환
      const results = await cloudUnitsService.deleteCloudUnit(
        req.params.cloudDeviceId,
        req.body.unitNumbers
      );

      if (results === null) {
        next(createError(404, "The cloud device does not exist."));
      } else {
        res.status(200);
        next({});
      }
    }
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

/**
 * 드라이버 자동 생성
 */
router.post("/:cloudDevicesId/driver/automation", async (req, res, next) => {
  try {
    const result = await cloudDevicesService.makeDriver({
      cloudDeviceId: req.params.cloudDeviceId
    });

    res.status(201);
    next(result);
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.all("/", (req, res, next) => {
  res.status(405);
  next({});
});

module.exports = router;
