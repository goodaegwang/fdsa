/**
 * services 모델 클래스입니다.
 * @class
 */
class Service {

    /**
     *
     * @param service 서비스 데이터
     */
    constructor(service) {

        this.id = service.id;
        this.name = service.name;
        this.code = service.code;
        this.summary = service.summary;
        this.additionalFunctions = service.additional_functions;
        this.imagePath = service.image_path;
        this.userId = service.user_id;
        this.ownerId = service.owner_id;
        this.ownerName = service.owner_name;
        this.status = service.status;
        this.colorLogoImagePath = service.color_logo_path;
        this.whiteLogoImagePath = service.white_logo_path;
        this.serviceIdentityColor = service.identity_color;
        this.serviceLoginStyle = service.login_template_type;
        this.appKey = service.app_key;
        this.createdAt = service.created_at;
        this.links = undefined;
    }

    addLink(link) {

        if (this.links === undefined) {

            this.links = [];
        }

        this.links.push(link);
    }
}

module.exports = Service;
