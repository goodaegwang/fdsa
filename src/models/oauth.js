const logger = require("../common/logManager")(__filename);
const mysqlManager = require("../common/mysqlManager");
const jwt = require("jsonwebtoken");
const config = require("config");

const InvalidClientError = require("oauth2-server/lib/errors/invalid-client-error");
const InvalidTokenError = require("oauth2-server/lib/errors/invalid-token-error");
const ServerError = require("oauth2-server/lib/errors/server-error");
const UnauthorizedClientError = require("oauth2-server/lib/errors/unauthorized-client-error");
const createError = require("http-errors");

const model = {
  /**
   * JWTOKEN 으로 access token을 생성한다.
   * @param client
   * @param user
   * @param scope
   * @returns
   */
  async generateAccessToken(client, user) {
    logger.debug("call generateAccessToken()");

    const tokenPayload = {
      clientid: client.id,
      userid: user.id,
      scope: user.scope,
      serviceid: user.serviceId
    };

    const options = {
      algorithm: "HS256",
      expiresIn: client.accessTokenLifetime
    };

    const token = await jwt.sign(
      tokenPayload,
      config.get("web_token.sign.secret_key"),
      options
    );

    return token;
  },

  /**
   * JWTOKEN 으로 refresh token을 생성한다.
   * @param client
   * @param user
   * @param scope
   * @returns {Promise: refresh jwt}
   */
  async generateRefreshToken(client, user, scope) {
    logger.debug("call generateRefreshToken()");

    const tokenPayload = {
      clientid: client.id,
      serviceid: user.serviceId,
      userid: user.id
    };

    const options = {
      algorithm: "HS256",
      expiresIn: client.refreshTokenLifetime
    };

    const token = await jwt.sign(
      tokenPayload,
      config.get("web_token.sign.secret_key"),
      options
    );

    return token;
  },

  /**
   * access token 검증을 수행한다.
   * @param accessToken
   * @returns {Promise<{accessTokenExpiresAt: Date, scope: *, client: {id: *}, accessToken: *, user: {scope: *, id: *}}>}
   */
  async getAccessToken(accessToken) {
    logger.debug("call getAccessToken()");

    let decoded = null;

    try {
      decoded = await jwt.verify(
        accessToken,
        config.get("web_token.verify.secret_key")
      );
    } catch (err) {
      throw new InvalidTokenError(err.message);
    }

    logger.debug(`DECODED access token:: ${JSON.stringify(decoded)}`);
    logger.debug(`expiresAt:: ${new Date(decoded.exp * 1000).toISOString()}`);
    return {
      accessToken,
      accessTokenExpiresAt: new Date(decoded.exp * 1000),
      scope: decoded.scope,
      client: {
        id: decoded.clientid
      },
      user: {
        id: decoded.userid,
        serviceid: decoded.serviceid,
        scope: decoded.scope
      }
    };
  },

  /**
   * 생성한 refresh token을 저장한다.
   * @param token
   * @param client
   * @param user
   * @returns
   */
  async saveToken(token, client, user) {
    logger.debug("call saveToken()");

    if (token.refreshToken) {
      const queryList = [];

      if (user.serviceId === null) {
        queryList.push({
          namespace: "oauth",
          sqlId: "saveToken",
          param: {
            clientId: client.id,
            userId: user.id,
            refreshToken: token.refreshToken
          }
        });
      } else {
        queryList.push({
          namespace: "oauth",
          sqlId: "saveTokenForServiceUser",
          param: {
            clientId: client.id,
            serviceId: user.serviceId,
            userId: user.id,
            refreshToken: token.refreshToken
          }
        });
      }

      const results = await mysqlManager.querySingle(queryList);

      if (results.affectedRows >= 1) {
        token.tokenType = "bearer";
        token.client = {
          id: client.id,
          redirectUris: client.redirectUris,
          grants: ["client_credentials", "password", "refresh_token"]
        };
        token.user = user;
        return token;
      } else {
        throw new ServerError("fail to save token");
      }
    } else {
      token.tokenType = "bearer";
      token.client = {
        id: client.id,
        redirectUris: client.redirectUris,
        grants: ["client_credentials", "password", "refresh_token"]
      };
      token.user = user;
      return token;
    }
  },

  revokeToken: () => {
    logger.debug("call revokeToken()");
    return "works!";
  },

  /**
   * refresh token 검증을 수행한다.
   * @param refreshToken
   * @returns
   */
  async getRefreshToken(refreshToken) {
    logger.debug("call getRefreshToken()");

    let decoded = null;

    try {
      decoded = jwt.verify(
        refreshToken,
        config.get("web_token.verify.secret_key")
      );
    } catch (err) {
      throw new InvalidTokenError(err.message);
    }

    logger.debug(`DECODED access token:: ${JSON.stringify(decoded)}`);

    // refresh token 유효성만 검증하고 DB 체크는 하지 않습니다.
    let results = null;

    if (decoded.serviceid) {
      // for service user
      const queryList = [
        {
          namespace: "oauth",
          sqlId: "getServiceUserByRefreshToken",
          param: {
            id: decoded.userid,
            serviceId: decoded.serviceid
          }
        }
      ];

      results = await mysqlManager.querySingle(queryList);
    } else {
      const queryList = [
        {
          namespace: "oauth",
          sqlId: "getUserByRefreshToken",
          param: {
            id: decoded.userid
          }
        }
      ];

      results = await mysqlManager.querySingle(queryList);
    }

    if (results.length === 0) {
      throw new InvalidClientError(
        createError(400, { code: "AUTH101", message: "No matched user exist." })
      );
    } else if (results[0].status === "4") {
      // 탈퇴회원 체크
      throw new InvalidClientError(
        createError(400, {
          code: "AUTH102",
          message: "This is a closed account."
        })
      );
    } else {
      return {
        refreshToken,
        refreshTokenExpiresAt: new Date(decoded.exp * 1000),
        scope: decoded.scope,
        client: {
          id: decoded.clientid
        },
        user: {
          id: results[0].id,
          name: results[0].name,
          scope: results[0].role,
          serviceId: decoded.serviceid ? decoded.serviceid : null
        }
      };
    }
    // const queryList = [];
    //
    // if (decoded.serviceid === null) {
    //     queryList.push({
    //         namespace: "oauth",
    //         sqlId: "getRefreshToken",
    //         param: {
    //             refreshToken,
    //         },
    //     });
    // } else {
    //
    //     queryList.push({
    //         namespace: "oauth",
    //         sqlId: "getRefreshTokenForServiceUser",
    //         param: {
    //             refreshToken,
    //         },
    //     });
    // }
    //
    // const results = await mysqlManager.querySingle(queryList);
    //
    // if (results.length === 0) {
    //
    //     throw new InvalidTokenError("The refresh token does not match.");
    // } else {

    // }
  },

  /**
   * 클라이언트의 정보를 가져온다.
   * @param clientId
   * @param clientSecret
   * @returns {Promise: clientInfo<{id: *, redirectUris: string, grants: Array, accessTokenLifetime: *, refreshTokenLifetime: *}>}
   */
  async getClient(clientId, clientSecret) {
    logger.debug("call getClient()");

    const queryList = [
      {
        namespace: "oauth",
        sqlId: "getClient",
        param: {
          clientId
        }
      }
    ];

    const results = await mysqlManager.querySingle(queryList);

    if (results.length === 0) {
      throw new UnauthorizedClientError(
        "The client does not match: client is not exist"
      );
    } else if (results[0].client_secret !== clientSecret) {
      throw new UnauthorizedClientError(
        "The client does not match: client is not match"
      );
    } else {
      const clientInfo = {
        id: results[0].client_id,
        redirectUris: "",
        grants: [],
        accessTokenLifetime: results[0].access_token_lifetime,
        refreshTokenLifetime: results[0].refresh_token_lifetime,
        userId: results[0].user_id
      };

      const tokenizer = results[0].grant_type.split(",");

      clientInfo.grants = tokenizer.slice();
      return clientInfo;
    }
  },

  /**
   *
   * @param username
   * @param password
   * @returns {Promise: userInfo<{id, name: *, img: *, scope: *}>}
   */
  async getUser(username, password) {
    logger.debug("call getUser()");

    const queryList = [];
    let results = null;
    const token = username.split("/");

    if (token.length === 2) {
      // for service user
      queryList.push({
        namespace: "oauth",
        sqlId: "getServiceUser",
        param: {
          id: token[0],
          password,
          serviceId: token[1]
        }
      });
    } else {
      queryList.push({
        namespace: "oauth",
        sqlId: "getUser",
        param: {
          id: username,
          password
        }
      });

      results = await mysqlManager.querySingle(queryList);
    }

    results = await mysqlManager.querySingle(queryList);
    if (results.length === 0) {
      throw new InvalidClientError(
        createError(400, { code: "AUTH101", message: "No matched user exist." })
      );
    } else if (results[0].status === "4") {
      // 탈퇴회원 체크
      throw new InvalidClientError(
        createError(400, {
          code: "AUTH102",
          message: "This is a closed account."
        })
      );
    } else {
      return {
        id: results[0].id,
        name: results[0].name,
        scope: results[0].role,
        serviceId: token.length === 2 ? token[1] : null
      };
    }
  },

  getUserFromClient: async client => {
    logger.debug("call getUserFromClient()");
    return {};

    // if (client.userId === null || client.userId.trim() === "") {
    //
    //     throw new InvalidClientError("no existed client user");
    // } else {
    //
    //     const queryList = [{
    //         namespace: "oauth",
    //         sqlId: "getUserFromClient",
    //         param: {
    //             id: client.userId
    //         }
    //     }];
    //
    //     let results = await mysqlManager.querySingle(queryList);
    //     if (results.length === 0) {
    //
    //         throw new InvalidClientError("no existed user");
    //     } else {
    //
    //         return {
    //             id: results[0].id,
    //             name: results[0].name,
    //             img: results[0].image_path,
    //             scope: results[0].role
    //         };
    //     }
    // }
  }
};

module.exports = model;
