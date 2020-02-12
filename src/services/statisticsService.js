const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
const _ = require("lodash");
const logger = require("../common/logManager")(__filename);

dayjs.extend(weekOfYear);

const dateType = {
    M: {
        text: "month",
        format: "YYYY-MM",
    },
    w: {
        text: "week",
        format: "YYYY-MM-",
    },
    d: {
        text: "day",
        format: "YYYY-MM-DD",
    },
    h: {
        text: "hour",
        format: "YYYY-MM-DD HH:00",
    },
    m: {
        text: "minute",
        format: "YYYY-MM-DD HH:mm",
    },
};

/**
 *
 * @param dateString
 * @returns {{dateString: string, dateNumber: number}}
 */
const divideDatePattern = dateString => {
    const datePattern = /([0-9].*?)([A-z].*)/;
    const arrDate = datePattern.exec(dateString);

    return {
        dateNumber: Number(arrDate[1]),
        dateString: arrDate[2],
    };
};

/**
 *
 * @param startDate
 * @param endDate
 * @param interval
 * @returns {any[]}
 */
const getReferenceDate = (startDate, endDate, interval) => {

    const result = new Set();
    let start = dayjs(`${startDate} 00:00`);
    const end = dayjs(`${endDate} 23:59`);
    const {dateNumber, dateString} = divideDatePattern(interval);

    if (dateString === "w") {
        while (start.isSame(end) || start.isBefore(end)) {
            result.add(
                `${dayjs(start).format(dateType[dateString].format) +
                    (dayjs(start).week() -
                        dayjs(start)
                            .subtract(dayjs(start).format("D") - 1, "day")
                            .week() +
                        1)}W`,
            );
            start = start.add(dateNumber, "day");
        }
    } else if (dateString === "M") {
        while (start.isSame(end) || start.isBefore(end)) {
            result.add(start.format(dateType[dateString].format));
            start = start.add(dateNumber, "day");
        }
    } else {
        while (start.isSame(end) || start.isBefore(end)) {
            result.add(start.format(dateType[dateString].format));
            start = start.add(dateNumber, dateType[dateString].text);
        }
    }

    return Array.from(result);
};

/**
 *
 * @param statisticsData
 * @param startDate
 * @param endDate
 * @param interval
 * @param nullDataValue
 * @returns {any[]}
 */
module.exports.fillStatisticsData = ({statisticsData, startDate, endDate, interval, nullDataValue}) => {
    logger.debug("call statisticsService.fillStatisticsData()");

    const referenceList = getReferenceDate(startDate, endDate, interval);

    return _.map(referenceList, item => {
        const referenceData = _.find(statisticsData, {date: item});

        return _.assign({date: item}, referenceData ? _.omit(referenceData, "date") : nullDataValue);
    });
};
