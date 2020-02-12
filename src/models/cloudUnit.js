class CloudUnit {

    constructor(cloudUnit) {

        this.cloudDeviceId = cloudUnit.cloud_device_id;
        this.number = cloudUnit.number;
        this.name = cloudUnit.name;
        this.commandType = cloudUnit.command_type;
        this.dataPropertyGroupCode = cloudUnit.data_property_group;
        this.type = cloudUnit.type;
        this.measure = cloudUnit.measure;
        this.description = cloudUnit.description;
        this.createdAt = cloudUnit.created_at;
    }
}

module.exports = CloudUnit;
