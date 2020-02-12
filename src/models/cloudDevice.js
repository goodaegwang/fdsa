class CloudDevice {
  constructor(cloudDevice) {
    this.id = cloudDevice.id;
    this.cloudPublic = cloudDevice.cloud_public;

    switch (cloudDevice.protocol) {
      case "CLOUD_MQTTS":
        this.protocol = "MQTTS";
        break;
      case "CLOUD_MQTT":
        this.protocol = "MQTT";
        break;
      case "CLOUD_UDP":
        this.protocol = "UDP";
        break;
      case "CLOUD_TCP/IP":
        this.protocol = "TCP/IP";
        break;
      case "CLOUD_HTTPS":
        this.protocol = "HTTPS";
        break;
      case "CLOUD_HTTP":
        this.protocol = "HTTP";
        break;
      case "CLOUD_SMARTTHINGS":
        this.protocol = "SmartThings";
        break;
      case "GATEWAY_TCP/IP":
        this.protocol = "Ethernet TCP / IP";
        break;
      case "GATEWAY_SERIAL":
        this.protocol = "USB Serial";
        break;
      default:
        this.protocol = "MQTTS";
        break;
    }

    this.dataEncryptionAlgo = cloudDevice.data_encryption_algo;
    this.productName = cloudDevice.product_name;
    this.modelName = cloudDevice.model_name;
    this.manufacturer = cloudDevice.manufacturer;
    this.deviceType = cloudDevice.device_type;
    this.productImagePath = cloudDevice.product_image_path;
    this.mimeType = cloudDevice.mime_type;
    this.driver = cloudDevice.driver;
    this.driverStatus = cloudDevice.driver_status;
    this.description = cloudDevice.description
      ? cloudDevice.description.toString()
      : cloudDevice.description;
    this.createdAt = cloudDevice.created_at;
    this.unitsLength = cloudDevice.units_length;
    this.attachments = undefined;
  }

  addAttachment(attachment) {
    if (this.attachments === undefined) {
      this.attachments = [];
    }

    this.attachments.push(attachment);
  }
}

module.exports = CloudDevice;
