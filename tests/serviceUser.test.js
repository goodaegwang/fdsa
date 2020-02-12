const request = require("supertest");
const app = require('../src/app');
const config = require("config");
const fs = require('fs');
const {serviceUsersService} = require("../src/services");
const _ = require("lodash");

const requestParam = config.get("test.auth.requestParam");
const makeBasicToken = (header = config.get("test.auth.requestHeader")) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

let accessToken = null;

beforeAll(async () => {

    const response = await request(app)
        .post(`/v2/oauth/token`)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${makeBasicToken()}`)
        .send(requestParam);

    accessToken = response.body.accessToken;
});

// ID 중복확인
describe("POST /v2/services/:serviceId/users/check", () => {

    let userId = "unitTest";
    let serviceId = "4FD4A09C9653467C9566346A0B635DA6";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/check`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {
        let noServiceId = "test";

        const response = await request(app)
            .post(`/v2/services/${noServiceId}/users/check`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId: noServiceId,
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No match.", async done => {
        let invalidId = "test";

        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/check`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId: invalidId,
            });

        expect(response.statusCode).toBe(200);

        expect(response.body).toMatchObject({
            "result": false,
        });
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/check`)
            .set('Accept', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .set('Content-Type', 'application/json')
            .send({
                userId,
            });

        expect(response.statusCode).toBe(200);

        expect(response.body).toMatchObject({
            "result": true,
        });
        done();
    });
});

// 회원가입
describe("POST /v2/services/:serviceId/users", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service", async done => {
        let noServiceId = "test";

        const response = await request(app)
            .post(`/v2/services/${noServiceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId: _.random(1, 10000),
                password: _.random(1, 10000),
                name: _.random(1, 10000),
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("User ID is missing.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                password: _.random(1, 10000),
                name: _.random(1, 10000),
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER401");
        expect(response.body.message).toMatch("User ID is missing.");
        done();
    });

    test("Password is missing.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId: _.random(1, 10000),
                name: _.random(1, 10000),
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER402");
        expect(response.body.message).toMatch("Password is missing.");
        done();
    });

    test("Name is missing.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId: _.random(1, 10000),
                password: _.random(1, 10000),
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER403");
        expect(response.body.message).toMatch("Name is missing.");
        done();
    });

    test("It should be 201 ok.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId: _.random(1, 10000),
                password: _.random(1, 10000),
                name: _.random(1, 10000),
            });

        expect(response.statusCode).toBe(201);
        done();
    });
});

// 사용자 전체 조회
describe("GET /v2/services/:serviceId/users", () => {

    let serviceId = "4FD4A09C9653467C9566346A0B635DA6";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users?type=all&searchText=`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {
        let noServiceId = "test";

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            })

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No user.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(200);

        expect(parseInt(response.headers["pagination-count"])).toBe(0);
        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);

        done();
    });

    test("No type.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                searchText: "",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER408");
        expect(response.body.message).toMatch("type is missing.");
        done();
    });

    test("Wrong type.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "test",
                searchText: "",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER409");
        expect(response.body.message).toMatch("wrong type.");
        done();
    });

    test("No searchText.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER410");
        expect(response.body.message).toMatch("searchText is missing.");
        done();
    });

    test("No orderBy.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER411");
        expect(response.body.message).toMatch("orderBy is missing.");
        done();
    });

    test("No status.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "",
                orderBy: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER421");
        expect(response.body.message).toMatch("status is missing.");
        done();
    });

    test("No offset.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "",
                orderBy: "",
                status: "",
                limit: 10,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER412");
        expect(response.body.message).toMatch("offset is missing.");
        done();
    });

    test("No limit.", async done => {
        let serviceIdWithNoUser = "4FD4A09C9653467C9566346A0B635DA7";

        const response = await request(app)
            .get(`/v2/services/${serviceIdWithNoUser}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "",
                orderBy: "",
                status: "",
                offset: 0,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER413");
        expect(response.body.message).toMatch("limit is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(200);

        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThan(0);
        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        const uuidPattern = /^[0-f]{32}$/;
        const statusPattern = /^[0-9]$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

        expect(response.body).toContainEqual(
            expect.objectContaining({
                "rownum": expect.any(Number),
                "userId": expect.any(String),
                "name": expect.any(String),
                "status": expect.stringMatching(statusPattern),
                "createdAt": expect.stringMatching(dateTimePattern),
            })
        );

        fs.writeFile("./tests/resultsGET/serviceUserList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok. - With searching name", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "all",
                searchText: "test",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(200);

        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThanOrEqual(0);
        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(0);

        const uuidPattern = /^[0-f]{32}$/;
        const statusPattern = /^[0-9]$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

        if (response.body.length > 0) {
            expect(response.body).toContainEqual(
                expect.objectContaining({
                    "rownum": expect.any(Number),
                    "userId": expect.any(String),
                    "name": expect.any(String),
                    "status": expect.stringMatching(statusPattern),
                    "createdAt": expect.stringMatching(dateTimePattern),
                })
            );
        }

        done();
    });

    test("It should be 200 ok. - With searching user ID.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                type: "id",
                searchText: "user",
                orderBy: "",
                status: "",
                offset: 0,
                limit: 10
            });

        expect(response.statusCode).toBe(200);

        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThanOrEqual(0);
        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(0);

        const uuidPattern = /^[0-f]{32}$/;
        const statusPattern = /^[0-9]$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

        if (response.body.length > 0) {
            expect(response.body).toContainEqual(
                expect.objectContaining({
                    "rownum": expect.any(Number),
                    "userId": expect.any(String),
                    "name": expect.any(String),
                    "status": expect.stringMatching(statusPattern),
                    "createdAt": expect.stringMatching(dateTimePattern),
                })
            );
        }

        done();
    });
});

// 사용자 조회
describe("GET /v2/services/:serviceId/users/:userId", () => {

    let serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    let userId = "unitTest";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {
        let noServiceId = "test";

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/${userId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No user.", async done => {
        let noUserId = "test";

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${noUserId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(200);

        const uuidPattern = /^[0-f]{32}$/;
        const statusPattern = /^[0-9]$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

        expect(response.body).toMatchObject({
            "userId": expect.any(String),
            "name": expect.any(String),
            "status": expect.stringMatching(statusPattern),
            "createdAt": expect.stringMatching(dateTimePattern),
        });

        done();
    });
});

// 사용자 정보 변경
describe("PATCH /v2/services/:serviceId/users/:userId", () => {

    let serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    let userId = "unitTest";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/${userId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        let noServiceId = "test";

        const response = await request(app)
            .patch(`/v2/services/${noServiceId}/users/${userId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password: "updateServiceUser()",
                tel: '',
                address: _.random(1, 100000),
                addressDesc: _.random(1, 1000000),
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No user.", async done => {

        let noUserId = "test";

        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/${noUserId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password: "updateServiceUser()",
                tel: '',
                address: _.random(1, 100000),
                addressDesc: _.random(1, 1000000),
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 204 ok.", async done => {

        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/${userId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password: "updateServiceUser()",
                tel: '',
                address: _.random(1, 100000),
                addressDesc: _.random(1, 1000000),
            });

        expect(response.statusCode).toBe(204);
        done();
    });
});


// 사용자 삭제
describe("post /v2/services/:serviceId/users/deletion", () => {

    const user = {
        serviceId: "4FD4A09C9653467C9566346A0B635DA6",
        userId: _.random(1, 10000),
        password: _.random(1, 10000),
        name: _.random(1, 10000),
    };

    const user2 = {
        serviceId: "4FD4A09C9653467C9566346A0B635DA6",
        userId: _.random(1, 10000),
        password: _.random(1, 10000),
        name: _.random(1, 10000),
    };

    const user3 = {
        serviceId: "4FD4A09C9653467C9566346A0B635DA6",
        userId: _.random(1, 10000),
        password: _.random(1, 10000),
        name: _.random(1, 10000),
    };

    beforeAll(async () => {
        await serviceUsersService.joinServiceUser(user);
    });

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/services/${user.serviceId}/users/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("user IDs are missing.", async done => {

        const response = await request(app)
            .post(`/v2/services/${user.serviceId}/users/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER414");
        expect(response.body.message).toMatch("user IDs are missing.");
        done();
    });

    test("No service.", async done => {

        const noServiceId = "test";

        const response = await request(app)
            .post(`/v2/services/${noServiceId}/users/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                userIds: [user.userId],
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No user.", async done => {

        const response = await request(app)
            .post(`/v2/services/${user.serviceId}/users/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                userIds: ["test"],
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 204 ok. - delete a user.", async done => {

        const response = await request(app)
            .post(`/v2/services/${user.serviceId}/users/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                userIds: [user.userId],
            });

        expect(response.statusCode).toBe(204);
        done();
    });

    // test("It should be 204 ok. - delete multiple users.", async done => {
    //
    //     const response = await request(app)
    //         .post(`/v2/services/${user.serviceId}/users/deletion`)
    //         .set('Accept', 'application/json')
    //         .set('Content-Type', 'application/json')
    //         .set('Authorization', `Bearer ${accessToken}`)
    //         .send({
    //             userIds: [user2.userId, user3.userId],
    //         });
    //
    //     expect(response.statusCode).toBe(204);
    //     done();
    // });
});

// 아이디 찾기(휴대폰 인증)
describe("GET /v2/services/:serviceId/users/idInquery/phone", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";

    const name = encodeURIComponent("단위테스트");
    const mobilePhone = encodeURIComponent("010-1234-5678");

    const wrongName = "test";
    const wrongMobilePhone = "test";

    const noServiceId = "test";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/phone`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {
        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/idInquery/phone?name=${name}&mobilePhone=${mobilePhone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("Name is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/phone?mobilePhone=${mobilePhone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER403");
        expect(response.body.message).toMatch("Name is missing.");
        done();
    });

    test("Mobile phone is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/phone?name=${name}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER404");
        expect(response.body.message).toMatch("Mobile phone is missing.");
        done();
    });

    test("SERVICEUSER101 - Wrong name.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/phone?name=${wrongName}&mobilePhone=${mobilePhone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER101");
        expect(response.body.message).toMatch("No matched user.");
        done();
    });

    test("SERVICEUSER101 - Wrong phone.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/phone?name=${name}&mobilePhone=${wrongMobilePhone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER101");
        expect(response.body.message).toMatch("No matched user.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/phone?name=${name}&mobilePhone=${mobilePhone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            id: expect.any(String),
        });
        done();
    });
});

// 아이디 찾기(이메일 인증)
describe("GET /v2/services/:serviceId/users/idInquery/email", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";

    const name = encodeURIComponent("단위테스트");
    const email = encodeURIComponent("unitTest@unitTest.com");

    const wrongName = "test";
    const wrongEmail = "test";

    const noServiceId = "test";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/idInquery/email?name=${name}&email=${email}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                name,
                email,
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("Name is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/email?email=${email}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER403");
        expect(response.body.message).toMatch("Name is missing.");
        done();
    });

    test("Email is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/email?name=${name}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER405");
        expect(response.body.message).toMatch("Email is missing.");
        done();
    });

    test("SERVICEUSER101 - Wrong name.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/email?name=${wrongName}&email=${email}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER101");
        expect(response.body.message).toMatch("No matched user.");
        done();
    });

    test("SERVICEUSER101 - Wrong email.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/email?name=${name}&email=${wrongEmail}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER101");
        expect(response.body.message).toMatch("No matched user.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/idInquery/email?name=${name}&email=${email}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            id: expect.any(String),
        });
        done();
    });
});

// 비밀번호 변경
describe("PATCH /v2/services/:serviceId/users/security", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const userId = "unitTest";
    const password = "PATCH /v2/services/:serviceId/users/security";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/security`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Basic ${makeBasicToken()}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const noServiceId = "test";

        const response = await request(app)
            .patch(`/v2/services/${noServiceId}/users/security`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId,
                password,
            })

        expect(response.statusCode).toBe(404);
        done();
    });

    test("User ID is missing.", async done => {

        const noUserId = "test";

        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/security`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                password,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER401");
        expect(response.body.message).toMatch("User ID is missing.");
        done();
    });

    test("Password is missing.", async done => {

        const noUserId = "test";

        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/security`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER402");
        expect(response.body.message).toMatch("Password is missing.");
        done();
    });

    test("No matched user.", async done => {

        const noUserId = "test";

        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/security`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId: noUserId,
                password,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER101");
        expect(response.body.message).toMatch("No matched user.");
        done();
    });

    test("It should be 204 ok.", async done => {
        const response = await request(app)
            .patch(`/v2/services/${serviceId}/users/security`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${makeBasicToken()}`)
            .send({
                userId,
                password,
            });

        expect(response.statusCode).toBe(204);
        done();
    });
});

// 비밀번호 확인
describe("PATCH /v2/services/:serviceId/users/:userId/password", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const userId = "serviceUserTest";
    const password = "03AC674216F3E15C761EE1A5E255F067953623C8B388B4459E13F978D7C846F4";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/${userId}/password`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const noServiceId = "test";

        const response = await request(app)
            .post(`/v2/services/${noServiceId}/users/${userId}/password`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password,
            })

        expect(response.statusCode).toBe(404);
        done();
    });

    test("Password is missing.", async done => {

        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/${userId}/password`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER402");
        expect(response.body.message).toMatch("Password is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/${userId}/password`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            result: expect.any(Boolean),
        });
        done();
    });
});

// 사용자 탈퇴
describe("PATCH /v2/services/:serviceId/users/:userId/withdrawal", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const userId = "withdrawalTest";
    const password = "03AC674216F3E15C761EE1A5E255F067953623C8B388B4459E13F978D7C846F4";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/${userId}/withdrawal`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const noServiceId = "test";

        const response = await request(app)
            .post(`/v2/services/${noServiceId}/users/${userId}/withdrawal`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password,
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No user.", async done => {

        const noUserId = "test";

        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/${noUserId}/withdrawal`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 204 ok.", async done => {
        const response = await request(app)
            .post(`/v2/services/${serviceId}/users/${userId}/withdrawal`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password,
            });

        expect(response.statusCode).toBe(204);
        done();
    });
});

// 사용자 멤버 조회
describe("GET /v2/services/:serviceId/users/:userId/members", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const userId = "unitTest";

    const noServiceId = "test";
    const invalidUserId = "test";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/userId/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("Invalid user.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/${invalidUserId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("type is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER408");
        expect(response.body.message).toMatch("type is missing.");
        done();
    });

    test("wrong type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "test",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER409");
        expect(response.body.message).toMatch("wrong type.");
        done();
    });

    test("searchText is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER410");
        expect(response.body.message).toMatch("searchText is missing.");
        done();
    });

    test("orderBy is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER411");
        expect(response.body.message).toMatch("orderBy is missing.");
        done();
    });

    test("offset is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER412");
        expect(response.body.message).toMatch("offset is missing.");
        done();
    });

    test("limit is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER413");
        expect(response.body.message).toMatch("limit is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/members`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(200);

        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThanOrEqual(0);
        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(0);

        const uuidPattern = /^[0-f]{32}$/;
        const statusPattern = /^[0-9]$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

        if (response.body.length > 0) {
            expect(response.body).toContainEqual(
                expect.objectContaining({
                    "rownum": expect.any(Number),
                    "parentId": expect.any(String),
                    "userId": expect.any(String),
                    "name": expect.any(String),
                    "status": expect.stringMatching(statusPattern),
                    "createdAt": expect.stringMatching(dateTimePattern),
                })
            );
        }

        done();
    });
});

// 사용자 등록 디바이스 조회
describe("GET /v2/services/:serviceId/users/:userId/devices", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const userId = "unitTest";

    const noServiceId = "test";
    const invalidUserId = "test";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/userId/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("Invalid user.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/${invalidUserId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("type is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER408");
        expect(response.body.message).toMatch("type is missing.");
        done();
    });

    test("wrong type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "test",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER409");
        expect(response.body.message).toMatch("wrong type.");
        done();
    });

    test("searchText is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER410");
        expect(response.body.message).toMatch("searchText is missing.");
        done();
    });

    test("orderBy is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER411");
        expect(response.body.message).toMatch("orderBy is missing.");
        done();
    });

    test("offset is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER412");
        expect(response.body.message).toMatch("offset is missing.");
        done();
    });

    test("limit is missing.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER413");
        expect(response.body.message).toMatch("limit is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/${userId}/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                type: "all",
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(200);

        expect(parseInt(response.headers["pagination-count"])).toBeGreaterThanOrEqual(0);
        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(0);

        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/;

        if (response.body.length > 0) {
            expect(response.body).toContainEqual(
                expect.objectContaining({
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

// 사용자 수 통계 조회
describe("GET /v2/services/:serviceId/users/statistics", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const noServiceId = "test";
    const defaultParameter = {
        type: "total",
        startDate: "2019-04-22",
        endDate: "2019-05-01",
        interval: "1h",
    };

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(defaultParameter);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(defaultParameter);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("type is missing.", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        delete parameter.type;

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER408");
        expect(response.body.message).toMatch("type is missing.");
        done();
    });

    test("wrong type.", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        parameter.type = "test";

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER409");
        expect(response.body.message).toMatch("wrong type.");
        done();
    });

    test("startDate is missing.", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        delete parameter.startDate;

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER415");
        expect(response.body.message).toMatch("startDate is missing.");
        done();
    });

    test("startDate must be in the format [YYYY-MM-DD].", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        parameter.startDate = "1234.01.01";

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER416");
        expect(response.body.message).toMatch("startDate must be in the format [YYYY-MM-DD].");
        done();
    });

    test("endDate is missing.", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        delete parameter.endDate;

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER417");
        expect(response.body.message).toMatch("endDate is missing.");
        done();
    });

    test("endDate must be in the format [YYYY-MM-DD].", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        parameter.endDate = "1234.010.01";

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER418");
        expect(response.body.message).toMatch("endDate must be in the format [YYYY-MM-DD].");
        done();
    });

    test("interval is missing.", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        delete parameter.interval;

        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER419");
        expect(response.body.message).toMatch("interval is missing.");
        done();
    });

    test("wrong interval.", async done => {

        const parameter = _.cloneDeep(defaultParameter);
        parameter.interval = "test";
        
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(parameter);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("SERVICEUSER420");
        expect(response.body.message).toMatch("wrong interval.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/statistics`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query(defaultParameter);

        expect(response.statusCode).toBe(200);

        expect(_.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(0);

        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}$/;

        if (response.body.length > 0) {
            expect(response.body).toContainEqual(
                expect.objectContaining({
                    cnt: expect.any(Number),
                    date: expect.stringMatching(dateTimePattern),
                })
            );
        }

        done();
    });
});

// 사용자 수 통계 조회
describe("GET /v2/services/:serviceId/users/count", () => {

    const serviceId = "4FD4A09C9653467C9566346A0B635DA6";
    const noServiceId = "test";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/count`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service.", async done => {

        const response = await request(app)
            .get(`/v2/services/${noServiceId}/users/count`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/services/${serviceId}/users/count`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(200);

        expect(response.body).toMatchObject({
            total: expect.any(Number),
            new: expect.any(Number),
            withdrawal: expect.any(Number),
        });

        done();
    });
});
