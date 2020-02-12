const model = {};

model.Service = require("./service");
model.Link = require("./link");
model.Device = require("./device");
model.CloudDevice = require("./cloudDevice");
model.CloudDeviceAttachment = require("./cloudDeviceAttachment");
model.CloudUnit = require("./cloudUnit");
model.Timeline = require("./timeline");
model.ServiceUser = require("./serviceUser");
model.ServiceDevice = require("./serviceDevice");

module.exports = model;
