const request = require("supertest");
const app = require('../src/app');
const config = require("config");
const fs = require('fs');

const requestParam = config.get("test.auth.requestParam");
const makeBasicToken = (header = config.get("test.auth.requestHeader")) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

let accessToken = null;

beforeAll(async () => {

    const response = await request(app)
        .post('/v2/oauth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${makeBasicToken()}`)
        .send(requestParam);

    accessToken = response.body.accessToken;
});

const link_id = '176AAA0A335D11E9944442010A920002';

let new_device_id = "";

describe("GET /v2/iot/devices", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/devices?linkId=${link_id}&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No link id.", async done => {
        const response = await request(app)
            .get(`/v2/iot/devices?offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DEVICES401");
        done();
    });

    test("No offset.", async done => {
        const response = await request(app)
            .get(`/v2/iot/devices?linkId=${link_id}&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DEVICES402");
        done();
    });

    test("No limit.", async done => {
        const response = await request(app)
            .get(`/v2/iot/devices?linkId=${link_id}&offset=0`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                offset: 1,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DEVICES403");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/devices?linkId=${link_id}&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/deviceList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

describe("GET /v2/iot/devices/:device_id", () => {

    let device_id = "8A940ABE335D11E9944442010A920002";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/devices/${device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No device id.", async done => {
        let wrong_device_id = "8A940ABE335D11E9944442010A9200022";

        const response = await request(app)
            .get(`/v2/iot/devices/${wrong_device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/devices/${device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/deviceInfo.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

describe("POST /v2/iot/devices", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post('/v2/iot/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No link id.", async done => {
        const response = await request(app)
            .post('/v2/iot/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: "api테스트디바이스",
                cloudDeviceId: "C8CE2557333411E9944442010A920002"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DEVICES401");
        done();
    });

    test("No name.", async done => {
        const response = await request(app)
            .post('/v2/iot/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                linkId: link_id,
                cloudDeviceId: "C8CE2557333411E9944442010A920002"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DEVICES404");
        done();
    });

    test("No cloud device id.", async done => {
        const response = await request(app)
            .post('/v2/iot/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                linkId: link_id,
                name: "api테스트디바이스"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DEVICES405");
        done();
    });

    test("It should be 201 ok.", async done => {
        const response = await request(app)
            .post(`/v2/iot/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                linkId: link_id,
                name: "api테스트디바이스",
                cloudDeviceId: "C8CE2557333411E9944442010A920002"
            });

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(201);
        new_device_id = response.body.insertId;
        done();
    });
});

describe("PATCH /v2/iot/devices/:device_id", () => {

    let device_id = "8A940ABE335D11E9944442010A920002";
    test("Invalid content-type.", async done => {
        const response = await request(app)
            .patch(`/v2/iot/devices/${device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No device id.", async done => {

        let wrong_device_id = "7BBD93255F7344FCB22B6861EF24DBA32";
        const response = await request(app)
            .patch(`/v2/iot/devices/${wrong_device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: "api테스트디바이스수정",
                cloudDeviceId: "C8CE2557333411E9944442010A920002",
                identifier: "SIM1"
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No name.", async done => {
        const response = await request(app)
            .patch(`/v2/iot/devices/${device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                cloudDeviceId: "C8CE2557333411E9944442010A920002",
                identifier: "SIM1"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DEVICES404");
        done();
    });

    test("It should be 204 ok.", async done => {
        const response = await request(app)
            .patch(`/v2/iot/devices/${device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: "api테스트디바이스수정",
                cloudDeviceId: "C8CE2557333411E9944442010A920002",
                identifier: "SIM1"
            });

        expect(response.statusCode).toBe(204);
        done();
    });
});

describe("DELETE /v2/iot/devices/:device_id", () => {

    let device_id = "";
    beforeAll(async () => {

        const response = await request(app)
            .post(`/v2/iot/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                linkId: link_id,
                name: "api테스트디바이스",
                cloudDeviceId: "C8CE2557333411E9944442010A920002"
            });

        device_id = response.body.insertId;
    });
    test("Invalid content-type.", async done => {
        const response = await request(app)
            .delete(`/v2/iot/devices/${device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No device id.", async done => {

        let wrong_device_id = "7BBD93255F7344FCB22B6861EF24DBA32";
        const response = await request(app)
            .delete(`/v2/iot/devices/${wrong_device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 204 ok.", async done => {
        const response = await request(app)
            .delete(`/v2/iot/devices/${device_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(204);
        done();
    });
});
