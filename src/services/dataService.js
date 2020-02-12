const _ = require("lodash");
const mongoManager = require("../common/mongoManager");
const servicesService = require("./servicesService");
const devicesService = require("./devicesService");
const statisticsService = require("./statisticsService");

const logger = require("../common/logManager")(__filename);

/**
 * 가장 마지막 데이터를 가져온다.
 *
 * @param {*} {userId, serviceId, deviceId}
 * @returns
 * @memberof DataService
 */
module.exports.getLatestData = async ({user, serviceId, deviceId}) => {
  logger.debug("call getLatestData()");

  let service = null;

  if (user.serviceid === null) {
    service = await servicesService.getService(serviceId, user.id);
  } else if (user.serviceid === serviceId) {
    const resultTF = await servicesService.isExistService(serviceId);

    service = resultTF ? {} : null;
  }

  if (service === null) {
    return 2;
  }

  const device = await devicesService.getDevice(deviceId);

  if (device === null) {
    return 3;
  }

  const collectionName = serviceId;
  let items = null;

  const filter = {
    deviceId,
  };
  const options = {
    sort: {createdAt: -1},
    limit: 1,
  };

  items = await mongoManager.find(collectionName, filter, options);

  if (items.length === 0) {
    return {
      units: null,
      createdAt: null,
    };
  } else {
    return {
      units: items[0].units,
      createdAt: items[0].createdAt,
    };
  }
};

/**
 * mongodb 파이프라인을 구한다.
 *
 * @param {*} {deviceId, unitNumbers, dataType, startDate, endDate, interval, timeOffset}
 * @returns
 * @memberof DataService
 */
const getPipeline = ({
  deviceId,
  unitNumbers,
  dataType,
  startDate,
  endDate,
  interval,
  timeOffset,
}) => {
  logger.debug("call getPipeline()");

  const timeOffsetMilliSec = timeOffset * 60 * 60 * 1000;
  const pipeline = [
    {
      $match: {
        $and: [{deviceId}, {createdAt: {$gte: new Date(startDate), $lte: new Date(endDate)}},],
      },
    }, {
      $sort: {_id: 1},
    },
  ];
  let additionalOperator = {};

  if (dataType === "raw") {
    // 원본 데이터 조회 시

    additionalOperator = {
      $project: {
        date: {
          $dateToString: {
            format: "%Y-%m-%d %H:%M:%S.%L",
            date: {$add: ["$createdAt", timeOffsetMilliSec]},
          },
        },
      },
    };

    // project 하위에 유닛 value를 value_number 형태로 추가
    unitNumbers.forEach(number => {
      additionalOperator.$project[`value_${number}`] = `$units.${number}`;
    });
  } else {
    // 그룹 데이터 조회 시

    additionalOperator = {
      $group: {
        _id: {
          year: {$year: {$add: ["$createdAt", timeOffsetMilliSec]}},
          month: {$month: {$add: ["$createdAt", timeOffsetMilliSec]}},
          day: {$dayOfMonth: {$add: ["$createdAt", timeOffsetMilliSec]}},
        },
      },
    };

    if (_.includes(interval, "h") || _.includes(interval, "m")) {
      additionalOperator.$group._id.hour = {
        $hour: {$add: ["$createdAt", timeOffsetMilliSec]},
      };
    }

    if (_.includes(interval, "m")) {
      additionalOperator.$group._id.minute = {
        $subtract: [{$minute: "$createdAt"}, {$mod: [{$minute: "$createdAt"}, parseInt(interval, 10)]},],
      };
    }

    // group 하위에 유닛 value를 value_number 형태로 추가
    unitNumbers.forEach(number => {
      additionalOperator.$group[`value_${number}`] = {
        [`$${dataType}`]: `$units.${number}`,
      };
    });
  }

  // match ~ sort 사이에 operator 추가
  pipeline.splice(1, 0, additionalOperator);

  return pipeline;
};

/**
 * 통계 데이터를 가져온다.
 *
 * @param {*} {serviceId, deviceId, unitNumbers, dataType, startDate, endDate, interval, timeOffset}
 *
 * @returns
 * @memberof DataService
 */
module.exports.getStatisticsData = async ({
  serviceId,
  deviceId,
  unitNumbers,
  dataType,
  startDate,
  endDate,
  interval,
  timeOffset,
}) => {
  logger.debug("call getStatisticsData()");

  const pipeline = getPipeline({
    deviceId,
    unitNumbers,
    dataType,
    startDate: `${startDate} 00:00:00`,
    endDate: `${endDate} 23:59:59`,
    interval,
    timeOffset,
  });
  const mongoResult = await mongoManager.aggregate(serviceId, pipeline);

  const statisticsData = _.map(mongoResult, item => {
    /*
            {_id: {year: 1234, month: 56, day: 78, hour: 90, minute: 12}, value_0: 3, value_1: 2, value_2: 1} 형태의 데이터를
            {date: "1234-56-78 90:12", "units": {"0": 3, "1": 2, "2": 3}} 형태로 변환
        */
    const result = {
      units: {},
    };

    if (item.date) {
      result.date = item.date;
    } else {
      item._id = _.mapValues(item._id, value => _.padStart(value, 2, "0"));
      const {year, month, day, hour, minute = "00"} = item._id;

      if (hour) {
        result.date = `${year}-${month}-${day} ${hour}:${minute}`;
      } else {
        result.date = `${year}-${month}-${day}`;
      }
    }

    _.forIn(item, (value, key) => {
      if (_.includes(key, "value")) {
        result.units[_.replace(key, "value_", "")] =
          _.isNumber(value) && dataType !== "raw" ? _.round(value, 2) : value;
      }
    });

    return result;
  });

  const nullDataValue = {
    units: _.zipObject(unitNumbers, Array(unitNumbers.length).fill(null)),
  };

  return statisticsService.fillStatisticsData({
    statisticsData,
    startDate,
    endDate,
    interval,
    nullDataValue,
  });
};

/**
 * 원본 데이터를 가져온다.
 *
 * @param {*} {serviceId, deviceId, unitNumbers, startDate, endDate, timeOffset, offset, limit}
 *
 * @returns
 * @memberof DataService
 */
module.exports.getRawData = async ({
  serviceId,
  deviceId,
  unitNumbers,
  startDate,
  endDate,
  offset = 0,
  limit = 10,
  order = "asc",
}) => {
  logger.debug("call getRawData()");

  const collection = serviceId;
  const sort = {
    asc: 1,
    desc: -1,
  };
  const query = {
    deviceId,
    createdAt: {
      $gt: new Date(startDate),
      $lt: new Date(endDate),
    },
  };
  const options = {
    projection: {
      createdAt: 1,
      _id: 0,
    },
    sort: {
      createdAt: sort[order],
    },
    skip: offset,
    limit,
  };

  _.forEach(unitNumbers, item => (options.projection[`units.${item}`] = 1));

  const mongoResult = await mongoManager.find(collection, query, options);
  const totalCount = await mongoManager.count(collection, query);

  return {
    item: mongoResult,
    count: totalCount,
  };
};
