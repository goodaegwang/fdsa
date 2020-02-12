const request = require("supertest");
const app = require('../src/app');
const config = require("config");
const fs = require('fs');

const requestParam = config.get("test.auth.requestParam");
const makeBasicToken = (header = config.get("test.auth.requestHeader")) => Buffer.from(`${header.client_id}:${header.client_secret}`).toString("base64");

let accessToken = null;

let identifier = "H38IEJGQ_f6747917";

beforeAll(async () => {

    const response = await request(app)
        .post('/v2/oauth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${makeBasicToken()}`)
        .send(requestParam);

    accessToken = response.body.accessToken;
});

describe("GET /v2/iot/timeline", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No identifier.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                offset: 0,
                limit: 10
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE401");
        done();
    });

    test("No offset.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                identifier: identifier,
                limit: 10
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE402");
        done();
    });

    test("No limit.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                identifier: identifier,
                offset: 0
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE403");
        done();
    });

    test("No action.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                identifier: identifier,
                offset: 0,
                limit: 10
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE404");
        done();
    });

    test("No orderBy.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                identifier: identifier,
                offset: 0,
                limit: 10,
                action: ""
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE405");
        done();
    });

    test("No startDate.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                identifier: identifier,
                offset: 0,
                limit: 10,
                action: "",
                orderBy: "",
                endDate: "2019-04-02"
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE406");
        done();
    });

    test("No endDate.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                identifier: identifier,
                offset: 0,
                limit: 10,
                action: "",
                orderBy: "",
                startDate: "2019-04-02"
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE407");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get('/v2/iot/timeline')
            .query({
                identifier: identifier,
                offset: 0,
                limit: 10,
                action: "",
                orderBy: ""
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/timelineList.json", JSON.stringify(response.body, null, 4, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

describe("POST /v2/iot/timeline", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post('/v2/iot/timeline')
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No identifier.", async done => {
        const response = await request(app)
            .post('/v2/iot/timeline')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                category: "1",
                action: "cloudIn",
                message: "디바이스가 클라우드에 성공적으로 연결하였습니다."
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE401");
        done();
    });

    test("No category.", async done => {
        const response = await request(app)
            .post('/v2/iot/timeline')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                identifier: identifier,
                level: "1",
                action: "cloudIn",
                message: "디바이스가 클라우드에 성공적으로 연결하였습니다."
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE408");
        done();
    });

    test("No level.", async done => {
        const response = await request(app)
            .post('/v2/iot/timeline')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                identifier: identifier,
                category: "1",
                action: "cloudIn",
                message: "디바이스가 클라우드에 성공적으로 연결하였습니다."
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE409");
        done();
    });

    test("No action.", async done => {
        const response = await request(app)
            .post('/v2/iot/timeline')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                identifier: identifier,
                category: "1",
                level: "1",
                message: "디바이스가 클라우드에 성공적으로 연결하였습니다."
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("TIMELINE404");
        done();
    });

    test("It should be 201 ok.", async done => {
        const response = await request(app)
            .post(`/v2/iot/timeline`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                identifier: identifier,
                category: "1",
                level: "1",
                action: "cloudIn",
                message: "디바이스가 클라우드에 성공적으로 연결하였습니다."
            });

        expect(response.type).toMatch("text/plain");
        expect(response.statusCode).toBe(201);
        done();
    });
});
