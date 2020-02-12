const mysql = require("mysql2/promise");
const config = require("config");
const fs = require("fs");
const path = require("path");
const uuidv4 = require("uuid/v4");
const _ = require("lodash");
const mybatisMapper = require("mybatis-mapper");
const logger = require("./logManager")(__filename);

// ##################################################
// query mapper
// ##################################################
const queryDirPath = path.join(__dirname, "../config/query");

/**
 * MySql DB 관련 함수를 가지고 있는 object.
 * @type {{pool: null, createPool: mysqlManager.createPool, getConnection: mysqlManager.getConnection, querySingle: mysqlManager.querySingle, queryMulti: mysqlManager.queryMulti, queryMultiWithTransaction: mysqlManager.queryMultiwithTransaction, mapper: mysqlManager.mapper, makeDatabaseID: mysqlManager.makeDatabaseID, arrToINClause: mysqlManager.arrToINClause, appendParam: mysqlManager.appendParam}}
 */
class MysqlManager {

    /**
     * Mysql 인스턴스 생성.
     */
    constructor() {
        this.pool = null;
    }

    /**
     * init
     *
     * @memberof Mysql
     */
    async init() {

        this.pool = mysql.createPool(config.get("mysql"));

        const connection = await this.getConnection();

        connection.release();

        logger.debug(`mysql host=${config.get("mysql.host")} database=${config.get("mysql.database")}`);
        logger.info("mysql connection success!");
        mybatisMapper.createMapper(fs.readdirSync(queryDirPath).map(file => path.join(queryDirPath, file)));

        // per 1 hour
        setInterval(this.maintainConnection.bind(this), 3600000);
    }

    /**
     * 연결
     * @returns {Promise<*>}
     */
    async getConnection() {

        logger.debug("call getConnection()");

        try {

            return await this.pool.getConnection(async conn => conn);
        } catch (err) {

            throw err;
        }
    }

    /**
     * 접속 유지
     * @returns {Promise<void>}
     */
    async maintainConnection() {

        logger.debug("call maintainConnection()");

        try {

            const connection = await this.getConnection();

            await connection.query("select 1;");

            connection.release();
        } catch (err) {

            logger.error(err.stack);
        }
    }

    /**
     * 하나의 SQL문을 실행.
     *
     * @param {*} queryParam - 매핑하고자 하는 query name과 param을 포함하고 있는 object list.
     * @returns
     * @memberof Mysql
     */
    async querySingle(...queryParam) {

        logger.debug("call querySingle()");

        const self = this;
        let connection = null;
        let isDelegatedConn = false;

        try {
            let queryList = queryParam[0];

            if (queryParam[0].constructor.name !== "Array") {

                connection = queryParam[0];
                queryList = queryParam[1];
                isDelegatedConn = true;
            }

            const arrSql = this.mapper(queryList);

            logger.debug("====================================================");
            logger.debug(`= sql [${arrSql[0].namespace}/${arrSql[0].name}]`);
            logger.debug(arrSql[0].sql);
            logger.debug("====================================================");

            if (connection === null) {

                connection = await self.pool.getConnection(async conn => conn);
            }

            const [results] = await connection.query(arrSql[0].sql);

            if (!isDelegatedConn) {

                connection.release();
            }

            // logger.debug(`query result=${JSON.stringify(results)}`);
            logger.log({
                level: "debug",
                message: `query result=${JSON.stringify(results)}`,
                length: 500,
            });

            return results;
        } catch (err) {

            if (!isDelegatedConn && connection !== null) {

                connection.release();
            }

            throw err;
        }
    }

    /**
     * Transaction을 적용하지 않고 여러 개의 sql문을 실행.
     * SELECT 문만 있는 경우 사용.
     *
     * @param {*} queryParam - 매핑하고자 하는 serviceId와 query name, param을 포함하고 있는 object list.
     * @returns
     * @memberof Mysql
     */
    async queryMulti(...queryParam) {

        logger.debug("call queryMulti()");

        const self = this;
        let connection = null;
        let isDelegatedConn = false;

        try {
            let queryList = queryParam[0];

            if (queryParam[0].constructor.name !== "Array") {

                connection = queryParam[0];
                queryList = queryParam[1];
                isDelegatedConn = true;
            }

            const arrSql = this.mapper(queryList);

            const resultList = [];

            if (connection === null) {

                connection = await self.pool.getConnection(async conn => conn);
            }

            for (const sql of arrSql) {
                logger.debug("====================================================");
                logger.debug(`= sql [${sql.namespace}/${sql.name}]`);
                logger.debug(sql.sql);
                logger.debug("====================================================");

                resultList.push(connection.query(sql.sql));
            }

            const queryResult = await Promise.all(resultList);
            const [results] = _.zip(...queryResult);

            // logger.debug(`query result=${JSON.stringify(results)}`);
            logger.log({
                level: "debug",
                message: `query result=${JSON.stringify(results)}`,
                length: 500,
            });

            if (!isDelegatedConn) {

                connection.release();
            }

            return results;
        } catch (err) {

            if (!isDelegatedConn && connection !== null) {

                connection.release();
            }

            throw err;
        }
    }

    /**
     * Transaction을 적용하여 여러 개의 sql문을 실행.
     *
     * @param {*} queryParam - 매핑하고자 하는 serviceId와 query name, param을 포함하고 있는 object list.
     * @returns
     * @memberof Mysql
     */
    async queryMultiWithTransaction(...queryParam) {

        logger.debug("call queryMultiwithTransaction()");

        const self = this;
        let connection = null;
        let isDelegatedConn = false;

        try {
            let queryList = queryParam[0];

            if (queryParam[0].constructor.name !== "Array") {

                connection = queryParam[0];
                queryList = queryParam[1];
                isDelegatedConn = true;
            }

            const arrSql = this.mapper(queryList);

            const resultList = [];

            if (connection === null) {

                connection = await self.pool.getConnection(async conn => conn);
            }

            try {

                await connection.beginTransaction();

                for (const sql of arrSql) {
                    logger.debug("====================================================");
                    logger.debug(`= sql [${sql.namespace}/${sql.name}]`);
                    logger.debug(sql.sql);
                    logger.debug("====================================================");

                    resultList.push(connection.query(sql.sql));
                }

                const queryResult = await Promise.all(resultList);
                const [results] = _.zip(...queryResult);

                // logger.debug(`query result=${JSON.stringify(results)}`);
                logger.log({
                    level: "debug",
                    message: `query result=${JSON.stringify(results)}`,
                    length: 500,
                });

                await connection.commit(); // COMMIT
                if (!isDelegatedConn) {

                    connection.release();
                }

                return results;
            } catch (err) {

                await connection.rollback(); // ROLLBACK
                if (!isDelegatedConn && connection !== null) {

                    connection.release();
                }

                throw err;
            }
        } catch (err) {

            if (!isDelegatedConn && connection !== null) {

                connection.release();
            }

            throw err;
        }
    }

    /**
     * SQL문을 parameter와 함께 매핑하여 sqlString을 생성.
     *
     * @param {*} queryList - 매핑하고자 하는 serviceId와 query name, param을 포함하고 있는 object list.
     * @returns sqlString list
     * @memberof Mysql
     */
    mapper(queryList) {

        try {

            const arrSql = [];
            let sqlString = "";

            queryList.forEach(query => {

                // eslint-disable-next-line prefer-const
                let {namespace, sqlId, param, format} = query;

                // mybatis-mapper 모듈 사용
                sqlString = mybatisMapper.getStatement(namespace, sqlId, param, format);

                arrSql.push({
                    namespace,
                    name: query.sqlId,
                    sql: sqlString,
                });
            });

            return arrSql;
        } catch (err) {

            throw err;
        }
    }

    /**
     * MySQL UUID 생성.
     *
     * @returns {string} - UUID v4
     * @memberof Mysql
     */
    makeUUID() {
        return uuidv4().toUpperCase()
            .replace(/-/g, "");
    }
}

module.exports = new MysqlManager();
