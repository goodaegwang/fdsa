class Timeline {

    /**
     *
     * @param timeline 데이터
     */
    constructor(timeline) {

        this.no = timeline.no;
        this.identifier = timeline.identifier;
        this.category = timeline.category;
        this.level = timeline.level;
        this.action = timeline.action;
        this.unitNumber = timeline.unit_number;
        this.controlValue = timeline.control_value;
        this.userId = timeline.user_id;
        this.clientId = timeline.client_id;
        this.ruleId = timeline.rule_id;
        this.message = timeline.message;
        this.createdAt = timeline.created_at;
    }
}

module.exports = Timeline;
