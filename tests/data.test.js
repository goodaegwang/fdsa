const request = require("supertest");
const app = require("../src/app");
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

describe("GET /v2/data/latest", () => {

    const serviceId = "E2FC603241E04582B1A1A64AB504780E";
    const deviceId = "DBD00A9B0A6D49769394A854C29B97FF";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/data/latest?serviceId=${serviceId}&deviceId=${deviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service id.", async done => {
        const response = await request(app)
            .get(`/v2/data/latest?deviceId=${deviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA401");
        done();
    });

    test("No device id.", async done => {
        const response = await request(app)
            .get(`/v2/data/latest?serviceId=${serviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA402");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/data/latest?serviceId=${serviceId}&deviceId=${deviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/latest.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok. no data.", async done => {

        const nodataDeviceId = "7EDEB2F36E284D4B8B731B4E5C223DAC";
        const response = await request(app)
            .get(`/v2/data/latest?serviceId=${serviceId}&deviceId=${deviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({});
        done();
    });
});

describe("GET /v2/data/statistics", () => {

    const serviceId = "E2FC603241E04582B1A1A64AB504780E";
    const deviceId = "DBD00A9B0A6D49769394A854C29B97FF";
    const unitNumbers = "1,2,3,4,5";
    const dataType = "avg";
    const startDate = "2019-04-10";
    const endDate = "2019-04-11";
    const interval = "1h";
    const timezone = "Asia/Seoul";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No service id.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?deviceId=${deviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA401");
        done();
    });

    test("No device id.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA402");
        done();
    });

    test("No unit numbers.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA403");
        done();
    });

    test("No data type.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&unitNumbers=${unitNumbers}&startDate=${startDate}&endDate=${endDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA404");
        done();
    });

    test("No start date.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&endDate=${endDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA405");
        done();
    });

    test("No end date.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&startDate=${startDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA406");
        done();
    });

    test("No interval.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA407");
        done();
    });

    test("No timezone.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}&interval=${interval}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("DATA408");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/data/statistics?serviceId=${serviceId}&deviceId=${deviceId}&unitNumbers=${unitNumbers}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}&interval=${interval}&timezone=${timezone}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        const localDateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}$/;

        if (response.body.length > 0) {
            expect(response.body).toContainEqual(
                expect.objectContaining({
                    "units": expect.any(Object),
                    "date": expect.stringMatching(localDateTimePattern),
                })
            );
        }
        done();
    });
});
