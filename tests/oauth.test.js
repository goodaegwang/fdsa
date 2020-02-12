const request = require("supertest");
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const config = require('config');

let globalRefreshToken = "";

const requestParam = config.get("test.auth.requestParam");
const requestHeader = config.get("test.auth.requestHeader");

beforeAll(async () => {

    await new Promise((r) => setTimeout(r, 2000));
});

describe('POST /v2/oauth/token', () => {
    test("Content-type is not x-www-form-urlencoded.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('content-Type', 'application/json');

        expect(response.status).toBe(415);
        done();
    });

    test("No auth.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded');

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH401");
        done();
    });
});

describe('POST /v2/oauth/token - OAuth 2.0 Password Grant Type', () => {

    const makeBasicToken = (header = requestHeader) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

    test("No basic token.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic `);

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH401");
        done();
    });

    test("No grant type.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH402");
        done();
    });

    test("Bad grant type.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: "test",
                username: requestParam.username,
                password: requestParam.password
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH403");
        done();
    });

    test("No client id.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken({
                client_id: "",
                client_secret: requestHeader.client_secret
            })}`)
            .send(requestParam);

        expect(response.status).toBe(400);
        done();
    });

    test("No client secret.", async done => {

        delete requestParam.client_secret;

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken({
                client_id: requestHeader.client_id,
                client_secret: ""
            })}`)
            .send(requestParam);

        expect(response.status).toBe(400);
        done();
    });

    test("No username.", async done => {

        delete requestParam.client_secret;

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                username: "",
                password: requestParam.password
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH406");
        done();
    });

    test("No password.", async done => {

        delete requestParam.client_secret;

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                username: requestParam.username,
                password: ""
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH407");
        done();
    });

    test("Authorization Success.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send(requestParam);

        const tokenPattern = /^.*\..*\..*$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            accessToken: expect.stringMatching(tokenPattern),
            accessTokenExpiresAt: expect.stringMatching(dateTimePattern),
            refreshToken: expect.stringMatching(tokenPattern),
            refreshTokenExpiresAt: expect.stringMatching(dateTimePattern),
        });

        globalRefreshToken = response.body.refreshToken;
        done();
    });
});

describe('POST /v2/oauth/token - OAuth 2.0 Refresh Token Grant Type', () => {
    const requestParam = {
        grant_type: "refresh_token",
        refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRpZCI6Ik54MFpkSk5uUHN4SUlKR2J4eG9GIiwic2VydmljZWlkIjpudWxsLCJ1c2VyaWQiOiJtYWVuZ2plQHNpbXBsYXRmb3JtLmNvbSIsImlhdCI6MTU2MjAzMzgxOSwiZXhwIjoxNTY5ODA5ODE5fQ.rFIXY2-1kK3t-Vi_zFjmCYli3Qq1SAce8Jfe_mVDBpY",
    };

    const makeBasicToken = (header = requestHeader) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

    test("No refresh token.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                refresh_token: "",
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH408");
        done();
    });

    test("Authorization Success.", async done => {
        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                refresh_token: requestParam.refresh_token
            });

        const tokenPattern = /^.*\..*\..*$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            accessToken: expect.stringMatching(tokenPattern),
            accessTokenExpiresAt: expect.stringMatching(dateTimePattern),
        });
        done();
    });
});

// TODO :: add client credentials
describe('POST /v2/oauth/token - OAuth 2.0 Client Credentials Grant Type', () => {

    const requestHeader = {
        client_id: "r6pfwcdn6rJM19yzF2SK",
        client_secret: "ea4ab710bda3ce6fa1ee844410a5956af0fefaf777bd24ba133db566b37c7e1c"
    };

    const makeBasicToken = (header = requestHeader) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

    test("No basic token.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic `);

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH401");
        done();
    });

    test("No grant type.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH402");
        done();
    });

    test("Bad grant type.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: "test"
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH403");
        done();
    });

    test("No client id.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: "client_credentials",
                client_secret: requestHeader.client_secret
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH404");
        done();
    });

    test("No client secret.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: "client_credentials",
                client_id: requestHeader.client_id,
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH405");
        done();
    });

    test("Authorization Success.", async done => {

        const response = await request(app)
            .post('/v2/oauth/token')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: "client_credentials",
                client_id: requestHeader.client_id,
                client_secret: requestHeader.client_secret
            });

        const tokenPattern = /^.*\..*\..*$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            accessToken: expect.stringMatching(tokenPattern),
            accessTokenExpiresAt: expect.stringMatching(dateTimePattern)
        });

        done();
    });
});

describe("POST /v2/oauth/token/services/:service_id - OAuth 2.0 Password Grant Type", () => {

    const requestParam = {
        grant_type: "password",
        username: "serviceUserTest",
        password: "03AC674216F3E15C761EE1A5E255F067953623C8B388B4459E13F978D7C846F4",
    };

    const makeBasicToken = (header = requestHeader) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

    let service_id = '4FD4A09C9653467C9566346A0B635DA6';

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set("Accept", "application/json")
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Content-type must be x-www-form-urlencoded.");
        done();
    });

    test("No basic token.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded');

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH401");
        done();
    });

    test("No grant type.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH402");
        done();
    });

    test("Bad grant type.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: "test",
                username: requestParam.username,
                password: requestParam.password
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH403");
        done();
    });

    test("No client id.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken({
                client_id: "",
                client_secret: requestHeader.client_secret
            })}`)
            .send(requestParam);

        expect(response.status).toBe(400);
        done();
    });

    test("No client secret.", async done => {

        delete requestParam.client_secret;

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken({
                client_id: requestHeader.client_id,
                client_secret: ""
            })}`)
            .send(requestParam);

        expect(response.status).toBe(400);
        done();
    });

    test("No username.", async done => {

        delete requestParam.client_secret;

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                username: "",
                password: requestParam.password
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH406");
        done();
    });

    test("No password.", async done => {

        delete requestParam.client_secret;

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                username: requestParam.username,
                password: ""
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH407");
        done();
    });

    test("Authorization Success.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send(requestParam);

        const tokenPattern = /^.*\..*\..*$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            accessToken: expect.stringMatching(tokenPattern),
            accessTokenExpiresAt: expect.stringMatching(dateTimePattern),
            refreshToken: expect.stringMatching(tokenPattern),
            refreshTokenExpiresAt: expect.stringMatching(dateTimePattern),
        });

        globalRefreshToken = response.body.refreshToken;
        done();
    });

    test("No service id.", async done => {
        let wrong_service_id = '7E2713A0335B11E9944442010A9200022';

        const response = await request(app)
            .post(`/v2/oauth/token/services/${wrong_service_id}`)
            .set("Accept", "application/json")
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send(requestParam);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("Authorization Success with Parent id.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                username: "serviceUserChild",
                password: requestParam.password
            });

        const tokenPattern = /^.*\..*\..*$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            accessToken: expect.stringMatching(tokenPattern),
            accessTokenExpiresAt: expect.stringMatching(dateTimePattern),
            refreshToken: expect.stringMatching(tokenPattern),
            refreshTokenExpiresAt: expect.stringMatching(dateTimePattern),
        });

        let decoded = await jwt.verify(response.body.accessToken, config.get("web_token.verify.secret_key"));
        expect(decoded.userid).toBe(requestParam.username);
        done();
    });

    test("Authorization Success with pushkey.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                username: "serviceUserChild",
                password: requestParam.password,
                pushkey: "si32349dfs",
                os: "android"
            });

        const tokenPattern = /^.*\..*\..*$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            accessToken: expect.stringMatching(tokenPattern),
            accessTokenExpiresAt: expect.stringMatching(dateTimePattern),
            refreshToken: expect.stringMatching(tokenPattern),
            refreshTokenExpiresAt: expect.stringMatching(dateTimePattern),
        });

        let decoded = await jwt.verify(response.body.accessToken, config.get("web_token.verify.secret_key"));
        expect(decoded.userid).toBe(requestParam.username);
        done();
    });
});

describe('POST /v2/oauth/token/services/:service_id - OAuth 2.0 Refresh Token Grant Type', () => {

    const requestParam = {
        grant_type: "refresh_token",
        refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRpZCI6Ik54MFpkSk5uUHN4SUlKR2J4eG9GIiwic2VydmljZWlkIjoiNEZENEEwOUM5NjUzNDY3Qzk1NjYzNDZBMEI2MzVEQTYiLCJ1c2VyaWQiOiJzZXJ2aWNlVXNlclRlc3QiLCJpYXQiOjE1NjIwNDcwMTYsImV4cCI6MTU2OTgyMzAxNn0.8aWdWTyeG9vx-w-lT4Qp6bcn7JVNSWcFD8PDLl4w5Yo",
    };

    const makeBasicToken = (header = requestHeader) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

    let service_id = '4FD4A09C9653467C9566346A0B635DA6';

    test("No refresh token.", async done => {

        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                refresh_token: "",
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toMatch("AUTH408");
        done();
    });

    test("Authorization Success.", async done => {
        const response = await request(app)
            .post(`/v2/oauth/token/services/${service_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                grant_type: requestParam.grant_type,
                refresh_token: requestParam.refresh_token
            });

        const tokenPattern = /^.*\..*\..*$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            accessToken: expect.stringMatching(tokenPattern),
            accessTokenExpiresAt: expect.stringMatching(dateTimePattern),
        });
        done();
    });
});
