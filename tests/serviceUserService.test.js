const mysqlManager = require("../src/common/mysqlManager");
const serviceUsersService = require("../src/services/serviceUsersService");
const _ = require("lodash");

beforeAll(() => {
    mysqlManager.init();
});
describe("call ServiceUsersService.isDuplicatedServiceUserId()", () => {

    test("No service.", async done => {
        
        const result = await serviceUsersService.isDuplicatedServiceUserId("1234", "test");

        expect(result).toBeNull();
        done();
    });

    test("No match.", async done => {
        const result = await serviceUsersService.isDuplicatedServiceUserId("4FD4A09C9653467C9566346A0B635DA6", "test");

        expect(result).toBe(false);
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.isDuplicatedServiceUserId("4FD4A09C9653467C9566346A0B635DA6", "unitTest");

        expect(result).toBe(true);
        done();
    });
});

describe("call ServiceUsersService.joinServiceUser()", () => {

    const user = {
        userId: _.random(1, 100000),
        password: _.random(1, 100000),
        name: _.random(1, 100000),
    }

    test("No service.", async done => {
        user.serviceId = "1234";

        const result = await serviceUsersService.joinServiceUser(user);

        expect(result).toBeNull();
        done();
    });

    test("Success.", async done => {
        user.serviceId = "4FD4A09C9653467C9566346A0B635DA6";
        const result = await serviceUsersService.joinServiceUser(user);

        expect(result).toBe(true);
        done();
    });
});

describe("call ServiceUsersService.getServiceUserList()", () => {

    test("No service.", async done => {
        const result = await serviceUsersService.getServiceUserList({
            serviceId: "1234",
            offset: 0,
            limit: 10
        });

        expect(result).toBeNull();
        done();
    });

    test("No user.", async done => {
        const result = await serviceUsersService.getServiceUserList({
            serviceId: "4FD4A09C9653467C9566346A0B635DA7",
            offset: 0,
            limit: 10
        });

        expect(result.cnt).toBeGreaterThanOrEqual(0);
        expect(_.isArray(result.result)).toBe(true);
        expect(result.result.length).toBe(0);
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.getServiceUserList({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            offset: 0,
            limit: 10
        });
        
        expect(result.cnt).toBeGreaterThan(0);
        expect(_.isArray(result.result)).toBe(true);
        expect(result.result.length).toBeGreaterThan(0);

        const uuidPattern = /^[0-f]{32}$/;
        const statusPattern = /^[0-9]$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

        expect(result.result).toContainEqual(
                expect.objectContaining({
                    "userId": expect.any(String),
                    "name": expect.any(String),
                    "status": expect.stringMatching(statusPattern),
                    "createdAt": expect.stringMatching(dateTimePattern),
                })
            );

        done();
    });
});

describe("call ServiceUsersService.getServiceUser()", () => {

    test("No service.", async done => {
        const result = await serviceUsersService.getServiceUser("1234", "1234");

        expect(result).toBeNull();
        done();
    });

    test("No user.", async done => {
        const result = await serviceUsersService.getServiceUser("4FD4A09C9653467C9566346A0B635DA6", "1234");

        expect(result).toBeNull();
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.getServiceUser("4FD4A09C9653467C9566346A0B635DA6", "unitTest");

        const uuidPattern = /^[0-F]{32}$/;
        const statusPattern = /^[0-9]$/;
        const dateTimePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

        expect(result).toMatchObject({
            "userId": expect.any(String),
            "name": expect.any(String),
            "status": expect.stringMatching(statusPattern),
            "createdAt": expect.stringMatching(dateTimePattern),
        });

        done();
    });
});

describe("call ServiceUsersService.updateServiceUser()", () => {

    const user = {
        password: "updateServiceUser()",
        tel: '',
        address: _.random(1, 100000),
        addressDesc: _.random(1, 1000000),
    };

    test("No service.", async done => {
        user.serviceId = "1234";
        user.userId = "asdf";
        const result = await serviceUsersService.updateServiceUser(user);

        expect(result).toBeNull();
        done();
    });

    test("No user.", async done => {
        user.serviceId = "4FD4A09C9653467C9566346A0B635DA6";
        user.userId = "asdf";
        const result = await serviceUsersService.updateServiceUser(user);

        expect(result).toBe(false);
        done();
    });

    test("Success.", async done => {
        user.serviceId = "4FD4A09C9653467C9566346A0B635DA6";
        user.userId = "unitTest";
        const result = await serviceUsersService.updateServiceUser(user);

        expect(result).toBe(true);
        done();
    });
});

describe("call ServiceUsersService.deleteServiceUsers()", () => {

    const user = {
        serviceId: "4FD4A09C9653467C9566346A0B635DA6",
        userId: _.random(1, 100000),
        password: _.random(1, 100000),
        name: _.random(1, 100000),
    };

    const user2 = {
        serviceId: "4FD4A09C9653467C9566346A0B635DA6",
        userId: _.random(1, 100000),
        password: _.random(1, 100000),
        name: _.random(1, 100000),
    };

    const user3 = {
        serviceId: "4FD4A09C9653467C9566346A0B635DA6",
        userId: _.random(1, 100000),
        password: _.random(1, 100000),
        name: _.random(1, 100000),
    };

    beforeAll(async () => {
        await serviceUsersService.joinServiceUser(user);
        await serviceUsersService.joinServiceUser(user2);
        await serviceUsersService.joinServiceUser(user3);
    });

    test("No service.", async done => {
        const result = await serviceUsersService.deleteServiceUsers({
            serviceId: "1234",
            userIds: ["asdf"]
        });

        expect(result).toBeNull();
        done();
    });

    test("No user.", async done => {
        const result = await serviceUsersService.deleteServiceUsers({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userIds: ["asdf"]
        });

        expect(result).toBe(false);
        done();
    });

    test("Successfully deleted a user.", async done => {

        const result = await serviceUsersService.deleteServiceUsers({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userIds: [user.userId]
        });

        expect(result).toBe(true);
        done();
    });

    test("Successfully deleted multiple users.", async done => {
        const result = await serviceUsersService.deleteServiceUsers({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userIds: [user2.userId, user3.userId]
        });

        expect(result).toBe(true);
        done();
    });
});

describe("call ServiceUsersService.findServiceUserIdByMobilePhone()", () => {

    test("No service.", async done => {
        const result = await serviceUsersService.findServiceUserIdByMobilePhone("1234", "단위테스트", "1234-5678");

        expect(result).toBeNull();
        done();
    });

    test("No matched user.", async done => {
        const result = await serviceUsersService.findServiceUserIdByMobilePhone("4FD4A09C9653467C9566346A0B635DA6", "단위테스트", "1234-5678");

        expect(result).toMatch("");
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.findServiceUserIdByMobilePhone("4FD4A09C9653467C9566346A0B635DA6", "단위테스트", "010-1234-5678");
        
        expect(typeof result).toMatch('string');
        done();
    });
});

describe("call ServiceUsersService.findServiceUserIdByEmail()", () => {

    test("No service.", async done => {
        const result = await serviceUsersService.findServiceUserIdByEmail("1234", "단위테스트", "unitTest@unitTest.org");

        expect(result).toBeNull();
        done();
    });

    test("No matched user.", async done => {
        const result = await serviceUsersService.findServiceUserIdByEmail("4FD4A09C9653467C9566346A0B635DA6", "단위테스트", "unitTest@unitTest.org");

        expect(result).toMatch("");
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.findServiceUserIdByEmail("4FD4A09C9653467C9566346A0B635DA6", "단위테스트", "unitTest@unitTest.com");
        
        expect(typeof result).toMatch('string');
        done();
    });
});

describe("call ServiceUsersService.changePassword()", () => {

    test("No service.", async done => {
        const result = await serviceUsersService.changePassword({
            serviceId: "1234",
            userId: "unitTest",
            password: "call ServiceUsersService.changePassword()",
        });

        expect(result).toBeNull();
        done();
    });

    test("No user.", async done => {
        const result = await serviceUsersService.changePassword({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userId: "test",
            password: "call ServiceUsersService.changePassword()",
        });

        expect(result).toBe(false);
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.changePassword({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userId: "unitTest",
            password: "call ServiceUsersService.changePassword()",
        });

        expect(result).toBe(true);
        done();
    });
});

describe("call ServiceUsersService.isRightPassword()", () => {

    test("No service.", async done => {
        const result = await serviceUsersService.isRightPassword({
            serviceId: "1234",
            userId: "unitTest",
            password: "call ServiceUsersService.isRightPassword()",
        });

        expect(result).toBeNull();
        done();
    });

    test("No user.", async done => {
        const result = await serviceUsersService.isRightPassword({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userId: "test",
            password: "call ServiceUsersService.isRightPassword()",
        });

        expect(result).toBe(false);
        done();
    });

    test("Wrong password.", async done => {
        const result = await serviceUsersService.isRightPassword({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userId: "unitTest",
            password: "call ServiceUsersService.isRightPassword()",
        });

        expect(result).toBe(false);
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.isRightPassword({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userId: "serviceUserTest",
            password: "03AC674216F3E15C761EE1A5E255F067953623C8B388B4459E13F978D7C846F4",
        });

        expect(result).toBe(true);
        done();
    });
});

describe("call ServiceUsersService.withdrawServiceUser()", () => {

    test("No service.", async done => {
        const result = await serviceUsersService.withdrawServiceUser({
            serviceId: "1234",
            userId: "withdrawalTest",
            password: "call ServiceUsersService.withdrawServiceUser()",
        });

        expect(result).toBeNull();
        done();
    });

    test("No user.", async done => {
        const result = await serviceUsersService.withdrawServiceUser({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userId: "test",
            password: "call ServiceUsersService.withdrawServiceUser()",
        });

        expect(result).toBe(false);
        done();
    });

    test("Success.", async done => {
        const result = await serviceUsersService.withdrawServiceUser({
            serviceId: "4FD4A09C9653467C9566346A0B635DA6",
            userId: "withdrawalTest",
        });

        expect(result).toBe(true);
        done();
    });
});
