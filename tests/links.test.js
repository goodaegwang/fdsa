const request = require("supertest");
const app = require('../src/app');
const config = require("config");
const uuidv4 = require("uuid/v4");
const fs = require("fs");

const requestParam = config.get("test.auth.requestParam");
const makeBasicToken = (header = config.get("test.auth.requestHeader")) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

let accessToken = null;

beforeAll(async () => {

    await new Promise((r) => setTimeout(r, 2000));

    const serviceId = "C6BCE62270C643959BB1E9628AFB3BBF";
    const response = await request(app)
        .post(`/v2/oauth/token/services/${serviceId}`)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${makeBasicToken()}`)
        .send({
            "grant_type": "password",
            "username": "winnie",
            "password": "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f"
        });

    accessToken = response.body.accessToken;
});

const service_id = '7E2713A0335B11E9944442010A920002';

let new_link_id = "";

describe("GET /v2/iot/links", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service id.", async done => {
        const response = await request(app)
            .get('/v2/iot/links?limit=10&offset=0')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS401");
        done();
    });

    test("No offset.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links?serviceId=${service_id}&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS402");
        done();
    });

    test("No limit.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links?serviceId=${service_id}&offset=0`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                offset: 1,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS403");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links?serviceId=${service_id}&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/linkList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok with type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links?serviceId=${service_id}&offset=0&limit=10&type=0006`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/linkListWithType.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok with searchText.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links?serviceId=${service_id}&offset=0&limit=10`)
            .query({searchText: "테스트"})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/linkListWithSearchText.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok with type and searchText.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links?serviceId=${service_id}&offset=0&limit=10&type=0006`)
            .query({searchText: "테스트"})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/linkListWithTypeAndSearchText.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

describe("GET /v2/iot/links/:link_id", () => {

    let link_id = "176AAA0A335D11E9944442010A920002";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No link id.", async done => {
        let wrong_link_id = "176AAA0A335D11E9944442010A920333";

        const response = await request(app)
            .get(`/v2/iot/links/${wrong_link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/linkInfo.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

describe("POST /v2/iot/links", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service id.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: "api테스트링크2",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4()
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS401");
        done();
    });

    test("No name.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('ri', `${service_id}`)
            .send({
                serviceId: service_id,
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4()
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS405");
        done();
    });

    test("No type.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                name: "api테스트링크2",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4()
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS406");
        done();
    });

    test("No protocol.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                name: "api테스트링크2",
                type: "0007",
                identificationPolicy: "3",
                identifier: uuidv4()
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS413");
        done();
    });

    test("No identification policy.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                name: "api테스트링크2",
                type: "0007",
                protocol: "MQTTS",
                identifier: uuidv4()
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS407");
        done();
    });

    test("No identifier.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                name: "api테스트링크2",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS408");
        done();
    });

    test("Duplicated identifier.", async done => {
        const response = await request(app)
            .post('/v2/iot/links')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                name: "api테스트링크2",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: '10',
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS101");
        expect(response.body.message).toMatch("The identifier is duplicated.");
        done();
    });

    test("It should be 201 ok.", async done => {
        const response = await request(app)
            .post(`/v2/iot/links`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                name: "api테스트링크",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4()
            });

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(201);
        new_link_id = response.body.insertId;
        done();
    });
});

describe("POST /v2/iot/links/devices", () => {

    let cloudDeviceId = "1FB7064718D146558D21A1A368C82D7B";
    const uuidPattern = /^[0-f]{32}$/;

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service id.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS401");
        done();
    });

    test("No link name.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('ri', `${service_id}`)
            .send({
                serviceId: service_id,
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS409");
        done();
    });

    test("No type.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS406");
        done();
    });

    test("No protocol.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS413");
        done();
    });

    test("No identification policy.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS407");
        done();
    });

    test("No identifier.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS408");
        done();
    });

    test("No device name.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS410");
        done();
    });

    test("No cloud device id.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS411");
        done();
    });

    test("No service code.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS412");
        done();
    });

    test("Duplicated identifier.", async done => {
        const response = await request(app)
            .post('/v2/iot/links/devices')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: '10',
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS101");
        expect(response.body.message).toMatch("The identifier is duplicated.");
        done();
    });

    test("It should be 201 ok.", async done => {
        const response = await request(app)
            .post(`/v2/iot/links/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username
            });

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(201);

        expect(response.body).toMatchObject({
            "insertLinkId": expect.stringMatching(uuidPattern),
            "insertDeviceId": expect.stringMatching(uuidPattern)
        });

        new_link_id = response.body.insertLinkId;
        done();
    });

    test("It should be 201 ok with address.", async done => {
        const response = await request(app)
            .post(`/v2/iot/links/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "apiDirectLink",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "api다이렉트링크디바이스",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "JTAE1QH9",
                ownerId: requestParam.username,
                userId: requestParam.username,
                address: "서울특별시 금천구 가산디지털1로 558"
            });

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(201);

        expect(response.body).toMatchObject({
            "insertLinkId": expect.stringMatching(uuidPattern),
            "insertDeviceId": expect.stringMatching(uuidPattern)
        });
        done();
    });

    test("It should be 201 ok with address and location name.", async done => {
        const response = await request(app)
            .post(`/v2/iot/links/devices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                linkName: "추가조명 1",
                type: "0007",
                protocol: "MQTTS",
                identificationPolicy: "3",
                identifier: uuidv4(),
                deviceName: "색온도640",
                cloudDeviceId: cloudDeviceId,
                serviceCode: "10004O3P",
                ownerId: "ssomi7",
                userId: "ssomi7",
                address: "서울특별시 금천구 가산디지털1로 226",
                locationName: "우리 집"
            });

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(201);

        expect(response.body).toMatchObject({
            "insertLinkId": expect.stringMatching(uuidPattern),
            "insertDeviceId": expect.stringMatching(uuidPattern)
        });
        done();
    });
});

describe("GET /v2/iot/links/identifier/:identifier", () => {

    const serviceId = "00B9FA37385C47F9BE6EA11D826492F5";
    const identifier = "F932423433";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links/identifier/${identifier}?serviceId=${serviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service id.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links/identifier/${identifier}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS401");
        expect(response.body.message).toMatch("serviceId is missing.");
        done();
    });

    test("Not exist service id.", async done => {
        let wrongServiceId = "00B9FA37385C47F9BE6EA11D826492F522";

        const response = await request(app)
            .get(`/v2/iot/links/identifier/${identifier}?serviceId=${wrongServiceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links/identifier/${identifier}?serviceId=${serviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            isDuplicated: expect.any(Boolean),
        });
        done();
    });
});

describe("PATCH /v2/iot/links/:link_id", () => {

    let link_id = "176AAA0A335D11E9944442010A920002";
    test("Invalid content-type.", async done => {
        const response = await request(app)
            .patch(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No link id.", async done => {

        let wrong_link_id = "7BBD93255F7344FCB22B6861EF24DBA32";
        const response = await request(app)
            .patch(`/v2/iot/links/${wrong_link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: "api테스트링크2",
                identifier: uuidv4(),
                syncStatus: "1"
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("No name.", async done => {
        const response = await request(app)
            .patch(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                identifier: uuidv4(),
                syncStatus: "1"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("LINKS405");
        done();
    });

    test("It should be 204 ok.", async done => {
        const response = await request(app)
            .patch(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: "api테스트링크수정",
                identifier: uuidv4(),
                syncStatus: "1"
            });

        expect(response.statusCode).toBe(204);
        done();
    });
});

describe("DELETE /v2/iot/links/:link_id", () => {

    let link_id = "";
    beforeAll(async () => {

        const response = await request(app)
            .post(`/v2/iot/links`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId: service_id,
                name: "api테스트링크",
                type: "0007",
                identificationPolicy: "3",
                identifier: uuidv4()
            });

        link_id = response.body.insertId;
    });

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .delete(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No link id.", async done => {

        let wrong_link_id = "7BBD93255F7344FCB22B6861EF24DBA32";
        const response = await request(app)
            .delete(`/v2/iot/links/${wrong_link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 204 ok.", async done => {
        const response = await request(app)
            .delete(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(204);
        done();
    });
});

describe("GET /v2/iot/links/:link_id/connection", () => {

    let link_id = "176AAA0A335D11E9944442010A920002";

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);
        done();
    });

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/links/${link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No link id.", async done => {
        let wrong_link_id = "176AAA0A335D11E9944442010A920333";

        const response = await request(app)
            .get(`/v2/iot/links/${wrong_link_id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });
});
