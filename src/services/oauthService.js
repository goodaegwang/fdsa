const OAuth2Server = require("oauth2-server");
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;
const commonUtil = require("../common/commonUtil");
const mysqlManager = require("../common/mysqlManager");
const logger = require("../common/logManager")(__filename);
const oauth = require("../models/oauth");
const jwt = require("jsonwebtoken");
const config = require("config");

class OauthService {

    constructor() {

        this.oauth = new OAuth2Server({
            model: require("../models/oauth"),
        });
    }

    /**
     * access token 및 refresh token을 생성하여 반환하는 함수
     */
    async getToken(req, res) {

        try {

            const options = {
                requireClientAuthentication: {password: false, refresh_token: false},
                alwaysIssueNewRefreshToken: false,
            };

            const token = await this.oauth.token(new Request(req), new Response(res), options);

            return token;
        } catch (err) {

            logger.error(err.stack);
            throw err;
        }
    }

    /**
     * 토큰을 검증하는 함수. 검증 실패 시 오류를 반환하고
     * 검증 성공 시 토큰을 분해하여 획득한 정보를 가지고 다음 작업으로 넘어간다.
     */
    async verifyToken(req, res, next) {

        try {

            const token = await this.oauth.authenticate(new Request(req), new Response(res));
            const decodedToken = await this.decodeToken(token.accessToken);

            req.auth = token;

            if (next) next();
            return decodedToken;
        } catch (err) {

            logger.error(err.stack);

            if (next) next();
            return err;
        }
    }

    /**
        토큰을 복호화하는 함수
     */
    async decodeToken(token) {
        let decoded = null;

        try {

            decoded = await jwt.verify(token, config.get("web_token.verify.secret_key"));
        } catch (err) {

            logger.error(err.message);
        }

        return decoded;
    }

    /**
     * Request 헤더의 basic auth를 검증하는 함수
     * 검증 실패 시 {isSuccessful: false, errorMsg: error message} 반환
     * 검증 성공 시 {isSuccessful: true, errorMsg: null}  반환
     * @param req
     * @returns {Promise<void>}
     */
    async verifyBasicAuth(req) {

        if (!req.get("Authorization") || req.get("Authorization").indexOf("Basic ") === -1) {

            return {isSuccessful: false, errorMsg: "No authentication given."};
        } else {

            // check authorization token
            const basicHeader = req.get("Authorization").split("Basic ")[1];

            if (commonUtil.isNullParam(basicHeader)) {

                return {isSuccessful: false, errorMsg: "No authentication given."};
            } else {

                // check auth type
                const decodedBasicToken = Buffer.from(basicHeader, "base64").toString("utf-8");
                const clientId = decodedBasicToken.split(":")[0];
                const clientSecret = decodedBasicToken.split(":")[1];

                try {

                    await oauth.getClient(clientId, clientSecret);
                } catch (err) {

                    return {isSuccessful: false, errorMsg: err.message};
                }

                return {isSuccessful: true, errorMsg: null};
            }
        }
    }

    async savePushKeyForServiceUsers({serviceId, userId, clientId, os, pushkey}) {

        const queryList = [
            {
                namespace: "serviceUsers",
                sqlId: "savePushKey",
                param: {
                    serviceId,
                    userId,
                    clientId,
                    os,
                    pushkey,
                },
            },
        ];

        await mysqlManager.querySingle(queryList);
    }

    async getTokenWithAppKey(req, res) {

        try {

            // 인증 요청 클라이언트 확인
            await oauth.getClient(req.body.client_id, req.body.client_secret);

            // appKey 기준으로 데이터 가져오기
            const queryList = [
                {
                    namespace: "oauth",
                    sqlId: "getAuthInfoWithAppKey",
                    param: {
                        appKey: req.body.appKey,
                    },
                },
            ];

            const authInfo = await mysqlManager.querySingle(queryList);

            if (authInfo.length === 0) {

                return {isSuccessful: false, errorMsg: "appKey is not valid."};
            } else {

                req.body.grant_type = "password";
                req.body.username = `${authInfo[0].user_id}/${authInfo[0].service_id}`;
                req.body.password = authInfo[0].password;

                const options = {
                    requireClientAuthentication: {password: false, refresh_token: false},
                    alwaysIssueNewRefreshToken: false,
                };

                const token = await this.oauth.token(new Request(req), new Response(res), options);

                return {isSuccessful: false, token};
            }
        } catch (err) {

            return {isSuccessful: false, errorMsg: err.message};
        }
    }
}

module.exports = new OauthService();
