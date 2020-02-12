
class Link {

    constructor(link) {

        this.id = link.id;
        this.name = link.name;
        this.type = link.type;
        this.protocol = link.protocol;
        this.identificationPolicy = link.identification_policy;
        this.identifier = link.identifier;
        this.syncStatus = link.sync_status;
        this.serviceId = link.service_id;
        this.createdAt = link.created_at;
        this.devices = undefined;
    }

    addDevice(device) {

        if (this.devices === undefined) {

            this.devices = [];
        }

        this.devices.push(device);
    }
}

module.exports = Link;
