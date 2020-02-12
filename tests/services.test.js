const request = require("supertest");
const app = require('../src/app');
const config = require("config");
const fs = require('fs');
const _ = require("lodash");

const makeBasicToken = (header = config.get("test.auth.requestHeader")) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

let accessToken = null;

beforeAll(async () => {

    const loginParam = {
        grant_type: "password",
        username: "ohbright@daejindmp.co.kr",
        password: "EA74CD181E2643BFA77D52B1CD2EEB8C42F948752B52C4CED7F8E37D6F201BFB"
    };

    const response = await request(app)
        .post('/v2/oauth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${makeBasicToken()}`)
        .send(loginParam);

    accessToken = response.body.accessToken;
});

describe("GET /v2/services", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get('/v2/services')
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No offset.", async done => {
        const response = await request(app)
            .get('/v2/services?limit=10')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICES401");
        done();
    });

    test("No limit.", async done => {
        const response = await request(app)
            .get('/v2/services?offset=0')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                offset: 1,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICES402");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get('/v2/services?offset=0&limit=10')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/serviceList.json", JSON.stringify(response.body, null, 4, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

describe("GET /v2/services/:service_id", () => {

    let service_id = 'C6BCE62270C643959BB1E9628AFB3BBF';

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${service_id}`)
            .set("Accept", "application/json")
            .set('Content-Type', 'text/html')
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service id.", async done => {
        let wrong_service_id = '7E2713A0335B11E9944442010A9200022';

        const response = await request(app)
            .get(`/v2/services/${wrong_service_id}`)
            .set("Accept", "application/json")
            .set('Content-Type', 'application/json')
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                limit: 10,
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${service_id}`)
            .set("Accept", "application/json")
            .set('Content-Type', 'application/json')
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/serviceInfo.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});


// 서비스 전체 기기 목록 조회
describe("GET /v2/services/:serviceId/devices", () => {

    //const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const serviceId = "C6BCE62270C643959BB1E9628AFB3BBF";
    const noServiceId = "test";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(404);
        done();
    });

    test("Invalid user.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(404);
        done();
    });

    test("type is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER408");
        expect(response.body.message).toMatch("type is missing.");
        done();
    });

    test("wrong type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "test",
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER409");
        expect(response.body.message).toMatch("wrong type.");
        done();
    });

    test("searchText is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                orderBy: ""
            })

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER410");
        expect(response.body.message).toMatch("searchText is missing.");
        done();
    });

    test("orderBy is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
            })

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER411");
        expect(response.body.message).toMatch("orderBy is missing.");
        done();
    });

    test("offset is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER412");
        expect(response.body.message).toMatch("offset is missing.");
        done();
    });

    test("limit is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                type: "all",
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER413");
        expect(response.body.message).toMatch("limit is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            })

        expect(response.statusCode).toBe(200);

        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThanOrEqual(0);
        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(0);

        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        if (response.body.length > 0) {
            expect(response.body).toContainEqual(
                expect.objectContaining({
                    rownum: expect.any(Number),
                    linkName: expect.any(String),
                    identifier: expect.any(String),
                    deviceName: expect.any(String),
                    userId: expect.any(String),
                    userName: expect.any(String),
                    createdAt: expect.stringMatching(dateTimePattern),
                })
            );
        }

        done();
    });
});


// 서비스 전체 사용자의 앱 푸시키 목록 조회
describe("GET /v2/services/:serviceId/pushkeys", () => {

    //const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const serviceId = "C6BCE62270C643959BB1E9628AFB3BBF";
    const noServiceId = "test";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                os: "",
                cloudDeviceId: ""
            });

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {
        const response = await request(app)
            .get(`/v2/services/${noServiceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                os: "",
                cloudDeviceId: ""
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("offset is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                limit: 10,
                os: "",
                cloudDeviceId: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER412");
        expect(response.body.message).toMatch("offset is missing.");
        done();
    });

    test("limit is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                os: "",
                cloudDeviceId: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER413");
        expect(response.body.message).toMatch("limit is missing.");
        done();
    });

    test("os is missing", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                cloudDeviceId: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER422");
        expect(response.body.message).toMatch("os is missing.");
        done();
    });

    test("cloudDeviceId is missing", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                os: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER423");
        expect(response.body.message).toMatch("cloudDeviceId is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                os: "",
                cloudDeviceId: ""
            });

        expect(response.statusCode).toBe(200);
        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThanOrEqual(0);
        expect(_.isArray(response.body)).toBe(true);
        done();
    });

    test("It should be 200 ok with cloudDeviceId.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/pushkeys`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                os: "",
                cloudDeviceId: "7BDAE9E97CD44124996BDD3F01C89527"
            });

        expect(response.statusCode).toBe(200);
        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThanOrEqual(0);
        expect(_.isArray(response.body)).toBe(true);
        done();
    });
});
