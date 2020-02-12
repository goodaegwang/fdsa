/**
 * serviceUser 모델 클래스입니다.
 * @class
 */
class ServiceUser {

    /**
     *
     * @param serviceUser 서비스 유저 데이터
     */
    constructor(serviceUser) {

        this.serviceId = serviceUser.service_id;
        this.userId = serviceUser.user_id;
        this.parentId = serviceUser.parent_id;
        this.name = serviceUser.name;
        this.status = serviceUser.status;
        this.tel = serviceUser.tel;
        this.mobilePhone = serviceUser.mobile_phone;
        this.address = serviceUser.address;
        this.addressDesc = serviceUser.address_desc;
        this.email = serviceUser.email;
        this.birthday = serviceUser.birthday;
        this.gender = serviceUser.gender;
        this.maritalStatus = serviceUser.marital_status;
        this.deviceCount = serviceUser.deviceCount;
        this.memberCount = serviceUser.memberCount;
        this.createdAt = serviceUser.created_at_tz;
        this.closedAt = serviceUser.closed_at_tz;
    }
}

module.exports = ServiceUser;
