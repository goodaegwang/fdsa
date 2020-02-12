const path = require("path");
const config = require("config");
const _ = require("lodash");

// 빈 파라미터 값 체크
module.exports.isNullParam = param => param === undefined || param === null || param === "" || Number.isNaN(param);

module.exports.fileUploadOption = {dest: path.join(process.cwd(), config.get("server.userDataDir"), config.get("server.uploadsDir"))};

module.exports.replaceObjValue = (array, key, value) => {
    if (_.some(key)) array.map(item => item[key] ? item[key] = value : item[key]);
    return array;
};