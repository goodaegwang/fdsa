class CloudDeviceAttachment {

    constructor(cloudDeviceAttachment) {

        this.id = cloudDeviceAttachment.id;
        this.cloudDeviceId = cloudDeviceAttachment.cloud_device_id;
        this.fileName = cloudDeviceAttachment.file_name;
        this.filePath = cloudDeviceAttachment.file_path;
        this.createdAt = cloudDeviceAttachment.created_at;
    }
}

module.exports = CloudDeviceAttachment;
