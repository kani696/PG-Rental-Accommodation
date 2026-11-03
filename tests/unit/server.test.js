const request = require("supertest");
const app = require("../../backend/server");

describe("PG Accommodation Finder - Server Tests", () => {

    test("Server responds successfully", async () => {

        const response = await request(app).get("/");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "PG Rental Accommodation Finder API is running"
        });

    });

});