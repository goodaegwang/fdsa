const MongoClient = require("mongodb").MongoClient;
const config = require("config");
const logger = require("./logManager")(__filename);

/**
 * MongoDB 클래스
 *
 * @class Mongo
 */
class MongoManager {

    /**
     * Mongo 인스턴스 생성.
     */
    constructor() {

        this.mongodb = null;
    }

    /**
     * init
     *
     * @returns
     * @memberof Mongo
     */
    async init() {

        try {

            const mongoURL = `mongodb://${config.get("mongo.user")}:${encodeURIComponent(config.get("mongo.password"))}@${config.get("mongo.server")}:${config.get("mongo.port")}/${config.get("mongo.dbname")}`;
            const database = await MongoClient.connect(mongoURL, config.get("mongo.options"));

            this.mongodb = database.db(config.get("mongo.dbname"));

            logger.debug(`mongoDB host=${config.get("mongo.server")} database=${config.get("mongo.dbname")}`);
            logger.info("MongoDB connection success!");
            return;
        } catch (err) {

            throw err;
        }
    }

    /**
     * Document 추가.
     *
     * @param {*} collectionName
     * @param {*} docs
     * @returns
     * @memberof Mongo
     */
    async insert(collectionName, docs) {

        try {

            const result = await this.mongodb.collection(collectionName).insert(docs);

            return result;
        } catch (err) {

            throw err;
        }
    }

    /**
     * Document 검색.
     *
     * @param {*} collectionName
     * @param {*} filter
     * @param {*} options
     * @returns
     * @memberof Mongo
     */
    async find(collectionName, filter, options) {
        try {

            logger.debug(`find filter: ${JSON.stringify(filter)}`);
            logger.debug(`find options: ${JSON.stringify(options)}`);
            const items = await this.mongodb.collection(collectionName)
                .find(filter, options)
                .toArray();

            return items;
        } catch (err) {

            throw err;
        }
    }

    /**
     * 매칭되는 document 개수 조회.
     *
     * @param {*} collectionName
     * @param {*} filter
     * @param {*} options
     * @returns
     * @memberof Mongo
     */
    async count(collectionName, filter, options) {
        try {

            logger.debug(`count filter: ${JSON.stringify(filter)}`);
            logger.debug(`count options: ${JSON.stringify(options)}`);
            const items = await this.mongodb.collection(collectionName)
                .countDocuments(filter, options);

            return items;
        } catch (err) {

            throw err;
        }
    }

    /**
     * 그룹별로 document 검색.
     *
     * @param {*} collectionName
     * @param {*} pipeline
     * @param {*} callback
     * @returns
     * @memberof Mongo
     */
    async aggregate(collectionName, pipeline, callback) {

        try {

            logger.debug(`aggregate pipeline: ${JSON.stringify(pipeline)}`);
            const items = await this.mongodb.collection(collectionName).aggregate(pipeline)
                            .toArray();

            return items;
        } catch (err) {

            throw err;
        }
    }
}

module.exports = new MongoManager();
