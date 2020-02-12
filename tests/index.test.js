const request = require("supertest");
const app = require('../src/app');

describe("GET /", () => {
    test("It should be 301 redirect.", async done => {
        const response = await request(app).get('/');

        expect(response.statusCode).toBe(301);
        done();
    });
});

describe("GET /v2/", () => {
    test("It should be 200 ok.", async done => {
        const response = await request(app).get('/v2/');

        expect(response.type).toMatch("text/html");
        expect(response.statusCode).toBe(200);
        done();
    });
});
