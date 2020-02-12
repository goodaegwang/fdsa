/**
 * serviceDevice 모델 클래스입니다.
 * @class
 */
class ServiceDevice {

    /**
     *
     * @param serviceDevice 서비스 유저 디바이스 데이터
     */
    constructor(serviceDevice) {

        this.serviceId = serviceDevice.service_id;
        this.parentId = serviceDevice.parent_id;
        this.parentId = serviceDevice.parent_id;
        this.modelName = serviceDevice.model_name;
        this.linkName = serviceDevice.link_name;
        this.identifier = serviceDevice.identifier;
        this.deviceName = serviceDevice.device_name;
        this.userId = serviceDevice.user_id;
        this.userName = serviceDevice.user_name;
        this.address = serviceDevice.address;
        this.locationName = serviceDevice.location_name;
        this.createdAt = serviceDevice.created_at;
        this.closedAt = serviceDevice.closed_at;
    }
}

module.exports = ServiceDevice;
