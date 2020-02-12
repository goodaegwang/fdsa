class Device {
  constructor(device) {
    this.id = device.id;
    this.name = device.name;
    this.cloudDeviceId = device.cloud_device_id;
    this.identifier = device.identifier;
    this.productName = device.product_name;
    this.modelName = device.model_name;
    this.manufacturer = device.manufacturer;
    this.deviceType = device.device_type;
    this.productImagePath = device.product_image_path;
    this.mimeType = device.mime_type;
    this.createdAt = device.created_at;
    this.unitsLength = device.units_length;
  }
}

module.exports = Device;
