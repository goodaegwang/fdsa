const request = require("supertest");
const app = require("../src/app");
const config = require("config");
const fs = require('fs');
const path = require("path");
const _ = require("lodash");
const uuidv4 = require("uuid/v4");

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

describe("GET /v2/iot/clouddevices", () => {

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?includePublic=N&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No cloudPublic.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES401");
        done();
    });

    test("No offset.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=all&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES402");
        done();
    });

    test("No limit.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=all&offset=0`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                offset: 1,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES403");
        done();
    });

    test("No manufacturer.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=all&offset=0&limit=10`)
            .query({
                searchText: "아두이노"
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES404");
        done();
    });

    test("No searchText.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=all&offset=0&limit=10`)
            .query({
                manufacturer: "개발팀"
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES405");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=all&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                manufacturer: "",
                searchText: "아두이노"
            })

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/clouddeviceList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok with cloudPublic=ownerAll.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=ownerAll&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                manufacturer: "",
                searchText: "아두이노"
            })

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/clouddeviceList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok with cloudPublic=ownerPublic.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=ownerPublic&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                manufacturer: "",
                searchText: "아두이노"
            })

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/clouddeviceList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });

    test("It should be 200 ok with cloudPublic=ownerPrivate.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices?cloudPublic=ownerPrivate&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                manufacturer: "",
                searchText: "아두이노"
            })

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);

        fs.writeFile("./tests/resultsGET/cloudDeviceList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

describe("GET /v2/iot/clouddevices/:cloudDeviceId", () => {

    const cloudDeviceId = "C8CE2557333411E9944442010A920002";

    test("Invalid content-type.", async done => {

        const response = await request(app)
            .get(`/v2/iot/clouddevices?includePublic=N&offset=0&limit=10`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("Invalid cloud device id.", async done => {

        const wrong_cloudDeviceId = "C8CE2557333411E9944442010A9200022";
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${wrong_cloudDeviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                offset: 1,
            });

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({id: cloudDeviceId});

        fs.writeFile("./tests/resultsGET/cloudDeviceInfo.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

/**
 * 클라우드 디바이스 추가
 */
describe("POST /v2/iot/clouddevices", () => {

    const deviceType = "0007";
    const imagePath = path.join(process.cwd(), "/tests/assets/640x480.png");
    const uuidPattern = /^[0-f]{32}$/;

    test("Invalid content-type.", async done => {

        const response = await request(app)
            .get(`/v2/iot/clouddevices`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No product name", async done => {

        const response = await request(app)
            .post('/v2/iot/clouddevices')
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("deviceType", deviceType)
            .field("modelName", `안방등70W`)
            .field("manufacturer", `건너편기업`)
            .attach("files", imagePath);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES406");
        expect(response.body.message).toMatch("productName is missing.");
        done();
    });

    test("No device type", async done => {

        const response = await request(app)
            .post('/v2/iot/clouddevices')
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 ${Date.now()}`)
            .field("modelName", `안방등70W`)
            .field("manufacturer", `건너편기업`)
            .attach("files", imagePath);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES407");
        expect(response.body.message).toMatch("deviceType is missing.");
        done();
    });

    test("No model name", async done => {

        const response = await request(app)
            .post('/v2/iot/clouddevices')
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 ${Date.now()}`)
            .field("deviceType", deviceType)
            .field("manufacturer", `건너편기업`)
            .attach("files", imagePath);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES408");
        expect(response.body.message).toMatch("modelName is missing.");
        done();
    });

    test("No manufacturer", async done => {

        const response = await request(app)
            .post('/v2/iot/clouddevices')
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 ${Date.now()}`)
            .field("deviceType", deviceType)
            .field("modelName", `안방등70W`)
            .attach("files", imagePath);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES404");
        expect(response.body.message).toMatch("manufacturer is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {

        const response = await request(app)
            .post('/v2/iot/clouddevices')
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 ${Date.now()}`)
            .field("deviceType", deviceType)
            .field("modelName", `안방등70W`)
            .field("manufacturer", `건너편기업`)
            .attach("files", imagePath);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            "insertId": expect.stringMatching(uuidPattern)
        });
        done();
    });

    test("It should be 200 ok with description.", async done => {

        const response = await request(app)
            .post('/v2/iot/clouddevices')
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 ${Date.now()}`)
            .field("deviceType", deviceType)
            .field("modelName", `안방등70W`)
            .field("manufacturer", `건너편기업`)
            .field("description", `안방 등입니다.`)
            .attach("files", imagePath);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            "insertId": expect.stringMatching(uuidPattern)
        });
        done();
    });
});

/**
 *클라우드 디바이스 변경
 */
describe("PUT /v2/iot/clouddevices/:cloudDeviceId", async () => {

    const wrongCloudDeviceId = "3E7176291CF444A0AD6E8D5184A2D7BEE";
    const cloudDeviceId = "3E7176291CF444A0AD6E8D5184A2D7BE";
    const imagePath = path.join(process.cwd(), "/tests/assets/640x480.png");

    test("Invalid content-type.", async done => {

        const response = await request(app)
            .put(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("Not Found - cloud device.", async done => {

        const response = await request(app)
            .put(`/v2/iot/clouddevices/${wrongCloudDeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 수정${Date.now()}`)
            .field("modelName", `모델 수정${Date.now()}`)
            .field("manufacturer", `회사 수정${Date.now()}`)
            .field("description", `설명 수정${Date.now()}`)
            .field("deletedAttachments", [1])
            .attach("files", imagePath);

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch("The cloud device does not exist.");
        done();
    });

    test("No product name.", async done => {

        const response = await request(app)
            .put(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("modelName", `모델 수정${Date.now()}`)
            .field("manufacturer", `회사 수정${Date.now()}`)
            .field("deletedAttachments", [1]);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES406");
        expect(response.body.message).toMatch("product name is missing.");
        done();
    });

    test("No model name.", async done => {

        const response = await request(app)
            .put(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 수정${Date.now()}`)
            .field("manufacturer", `회사 수정${Date.now()}`)
            .field("deletedAttachments", [1]);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES408");
        expect(response.body.message).toMatch("model name is missing.");
        done();
    });

    test("No manufacturer.", async done => {

        const response = await request(app)
            .put(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 수정${Date.now()}`)
            .field("modelName", `모델 수정${Date.now()}`)
            .field("deletedAttachments", [1]);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES404");
        expect(response.body.message).toMatch("manufacturer is missing.");
        done();
    });

    test("No deletedAttachments.", async done => {

        const response = await request(app)
            .put(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 수정${Date.now()}`)
            .field("modelName", `모델 수정${Date.now()}`)
            .field("manufacturer", `회사 수정${Date.now()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDDEVICES409");
        expect(response.body.message).toMatch("deleted attachments is missing.");
        done();
    });

    test("It should be 200 ok.", async done => {

        const response = await request(app)
            .put(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "multipart/form-data")
            .set('Authorization', `Bearer ${accessToken}`)
            .field("productName", `이름 수정${Date.now()}`)
            .field("modelName", `모델 수정${Date.now()}`)
            .field("manufacturer", `회사 수정${Date.now()}`)
            .field("description", `설명 수정${Date.now()}`)
            .field("deletedAttachments", [0])
            .attach("createdAttachments", imagePath)
            .attach("files", imagePath);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            createdAttachmentIds: expect.any(Array),
        });
        done();
    });
});

/**
 * 클라우드 디바이스 삭제
 */
describe("DELETE /v2/iot/clouddevices/:cloudDeviceId", async () => {

    const cloudDeviceId = "0D382190A0F248EE9AB5A94C870D4BFD";
    const worngClouddeviceId = "0D382190A0F248EE9AB5A94C870D4BFDE";

    test("Invalid content-type.", async done => {

        const response = await request(app)
            .delete(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No cloud device", async done => {

        const response = await request(app)
            .delete(`/v2/iot/clouddevices/${worngClouddeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        done();
    });

    test("It should be 204 ok", async done => {

        const response = await request(app)
            .delete(`/v2/iot/clouddevices/${cloudDeviceId}`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(204);
        done();
    });
});

/**
 *클라우드에 배포
 */
describe("POST /v2/iot/clouddevices/:cloudDeviceId/publication", async () => {

    const cloudDeviceId = "0D382190A0F248EE9AB5A94C870D4BFD";
    const worngCloudDeviceId = "0D382190A0F248EE9AB5A94C870D4BFDE";

    test("Invalid content-type.", async done => {

        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/publication`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("It should be 200 ok.", async done => {

        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/publication`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            result: expect.any(Boolean),
        });
        done();
    });
});

/**
 * 유닛 리스트 가져오기
 */
describe("GET /v2/iot/clouddevices/:cloudDeviceId/units", () => {

    const cloudDeviceId = "C8CE2557333411E9944442010A920002";
    const wrongCloudDeviceId = "C8CE2557333411E9944442010A920002E";

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("No Found - cloud device.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${wrongCloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch("The cloud device does not exist.");
        done();
    });

    test("No offset.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                limit: 10,
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS401");
        done();
    });

    test("No limit.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                searchText: "",
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS402");
        done();
    });

    test("No searchText.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                orderBy: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS403");
        done();
    });

    test("No orderBy.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                searchText: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS404");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({
                offset: 0,
                limit: 10,
                searchText: "",
                orderBy: ""
            });

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(2);

        fs.writeFile("./tests/resultsGET/cloudUnitList.json", JSON.stringify(response.body, null, 4), function(err){
            if(err) throw err;
        });
        done();
    });
});

/**
 * 유닛 추가하기
 */
describe("POST /v2/iot/clouddevices/:cloudDeviceId/units", () => {

    const cloudDeviceId = "3E7176291CF444A0AD6E8D5184A2D7BE";
    const wrongCloudDeviceId = "3E7176291CF444A0AD6E8D5184A2D7BEE";
    const commandType = ["0", "1", "2", "3"];

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("Not Found - cloud device id.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${wrongCloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                units: [{
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: _.random(1, 3),
                }, {
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                }]
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch("The cloud device does not exist.");
        done();
    });

    test("Not units.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS405");
        done();
    });

    test("Not units array type.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                units:{
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                },
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS406");
        done();
    });

    test("No unit name.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                units: [{
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                }, {
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                }]
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS407");
        done();
    });

    test("No unit number.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                units: [{
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                }, {
                    name: `이름 ${uuidv4()}`,
                    commandType: commandType[_.random(1, 3)],
                }]
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS408");
        done();
    });

    test("No commandType.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                units: [{
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                }, {
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                }]
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS409");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                units: [{
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                }, {
                    name: `이름 ${uuidv4()}`,
                    number: _.random(1, 100),
                    commandType: commandType[_.random(1, 3)],
                }]
            });

        expect(response.type).toMatch("text/plain");
        expect(response.statusCode).toBe(201);
        done();
    });
});

/**
 * 유닛 정보 조회하기
 */
describe("GET /v2/iot/clouddevices/:cloudDeviceId/units/:unitNumber", () => {

    // const cloudDeviceId = "C8CE2557333411E9944442010A920002";
    const cloudDeviceId = "9EBF2CB63B964649A60C032CA0162C4E";
    const wrongCloudDeviceId = "C8CE2557333411E9944442010A920002E";
    const unitNumber = 2;
    const wrongUnitNumber = 3;
    const typePattern = /^[0-9]{1}$/;

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units/${unitNumber}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("Not Found - cloud device.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${wrongCloudDeviceId}/units/${unitNumber}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch("The cloud device does not exist.");
        done();
    });

    test("Not Found - unit number", async done => {

        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units/${wrongUnitNumber}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch("The cloud unit does not exist.");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .get(`/v2/iot/clouddevices/${cloudDeviceId}/units/${unitNumber}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.type).toMatch("application/json");
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            "number": expect.any(Number),
            "name": expect.any(String),
            "commandType": expect.stringMatching(typePattern),
        });

        fs.writeFile("./tests/resultsGET/cloudUnitInfo.json", JSON.stringify(response.body, null, 4), function (err) {
            if (err) throw err;
        });
        done();
    });
});

/**
 * 클라우드 유닛 수정
 */
describe("PATCH /v2/iot/clouddevices/:cloudDeviceId/units/:unitNumber", async () => {

    const cloudDeviceId = "C8CE2557333411E9944442010A920002";
    const wrongCloudDeviceId = "C8CE2557333411E9944442010A920002E";
    const unitNumber = 0;
    const wrongUnitNumber = 3;

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .patch(`/v2/iot/clouddevices/${cloudDeviceId}/units/${unitNumber}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("CLOUDUNITS407 - name is missing.", async done => {

        const response = await request(app)
            .patch(`/v2/iot/clouddevices/${cloudDeviceId}/units/${unitNumber}`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                number: unitNumber,
                commandType: _.random(1, 3),
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS407");
        expect(response.body.message).toMatch("unit name is missing.");
        done();
    });

    test("CLOUDUNITS409 - commandType is missing.", async done => {

        const response = await request(app)
            .patch(`/v2/iot/clouddevices/${cloudDeviceId}/units/${unitNumber}`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                number: unitNumber,
                name: `이름 ${uuidv4()}`,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS409");
        expect(response.body.message).toMatch("unit commandType is missing.");
        done();
    });

    test("PATCH Success.", async done => {

        const response = await request(app)
            .patch(`/v2/iot/clouddevices/${cloudDeviceId}/units/${unitNumber}`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                number: unitNumber,
                name: `이름 ${uuidv4()}`,
                commandType: _.random(1, 3),
            });

        expect(response.statusCode).toBe(204);
        done();
    });

    test("PATCH Success with not required data.", async done => {

        const response = await request(app)
            .patch(`/v2/iot/clouddevices/${cloudDeviceId}/units/${unitNumber}`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                number: unitNumber,
                name: `이름 ${uuidv4()}`,
                commandType: _.random(1, 3),
                measure: "kg",
                description: "설명 추가합니다."
            });

        expect(response.statusCode).toBe(204);
        done();
    });
});

/**
 * 유닛 삭제하기
 */
describe("POST /v2/iot/clouddevices/:cloudDeviceId/units/deletion", () => {

    const cloudDeviceId = "3E7176291CF444A0AD6E8D5184A2D7BE";
    const wrongCloudDeviceId = "3E7176291CF444A0AD6E8D5184A2D7BEE";
    const unitNumber = 0;
    const wrongUnitNumber = 5;

    test("Invalid content-type.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'text/html')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(415);
        expect(response.body.message).toMatch("Invalid content-type.");
        done();
    });

    test("Not Found - cloud device.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${wrongCloudDeviceId}/units/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                unitNumbers: [unitNumber]
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toMatch("The cloud device does not exist.");
        done();
    });

    test("No unitNumbers.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS410");
        done();
    });

    test("Wrong type - unitNumbers", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                unitNumbers: unitNumber
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toMatch("CLOUDUNITS411");
        done();
    });

    test("It should be 200 ok.", async done => {
        const response = await request(app)
            .post(`/v2/iot/clouddevices/${cloudDeviceId}/units/deletion`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                unitNumbers: [unitNumber]
            });

        expect(response.type).toMatch("text/plain");
        expect(response.statusCode).toBe(200);
        done();
    });
});
