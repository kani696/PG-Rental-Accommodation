
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../backend/models/Favourite", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndDelete: jest.fn()
}));

jest.mock("../../backend/models/Property", () => ({
    findById: jest.fn()
}));

const Favourite = require("../../backend/models/Favourite");
const Property = require("../../backend/models/Property");
const app = require("../../backend/server");

describe("Favourite API Tests", () => {
    const studentId = "student123";
    const ownerId = "owner123";
    const propertyId = "6ac4df10e089363a97b422ce";
    const favouriteId = "6ac4df10e089363a97b422cd";

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: studentId,
            role: "student"
        });
    });

    // 1. Add favourite successfully
    test("Should successfully add a property to favourites", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId
        });

        Favourite.findOne.mockResolvedValue(null);

        Favourite.create.mockResolvedValue({
            _id: favouriteId,
            student: studentId,
            property: propertyId
        });

        const response = await request(app)
            .post("/api/favourites")
            .set("Authorization", "Bearer testtoken")
            .send({ propertyId });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(Favourite.create).toHaveBeenCalled();
    });

    // 2. Prevent duplicate favourites
    test("Should prevent duplicate favourite properties", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId
        });

        Favourite.findOne.mockResolvedValue({
            _id: favouriteId,
            student: studentId,
            property: propertyId
        });

        const response = await request(app)
            .post("/api/favourites")
            .set("Authorization", "Bearer testtoken")
            .send({ propertyId });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(Favourite.create).not.toHaveBeenCalled();
    });

    // 3. Reject invalid property ID
    test("Should reject an invalid property ID", async () => {
        const response = await request(app)
            .post("/api/favourites")
            .set("Authorization", "Bearer testtoken")
            .send({ propertyId: "invalid123" });

        expect(response.status).toBe(400);
    });

    // 4. Reject when property does not exist
    test("Should reject a property that does not exist", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/favourites")
            .set("Authorization", "Bearer testtoken")
            .send({ propertyId });

        expect(response.status).toBe(404);
    });

    // 5. Only students can add favourites
    test("Should reject favourite request from an owner", async () => {
        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });

        const response = await request(app)
            .post("/api/favourites")
            .set("Authorization", "Bearer testtoken")
            .send({ propertyId });

        expect(response.status).toBe(403);
    });

    // 6. Reject request without authentication
    test("Should reject request without authentication", async () => {
        const response = await request(app)
            .post("/api/favourites")
            .send({ propertyId });

        expect(response.status).toBe(401);
    });

    // 7. Get student's favourites
    test("Should retrieve the logged-in student's favourites", async () => {
        const favourites = [
            {
                _id: favouriteId,
                property: {
                    title: "Green View PG",
                    location: "Coimbatore",
                    rent: 6500
                }
            }
        ];

        Favourite.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(favourites)
        });

        const response = await request(app)
            .get("/api/favourites/my-favourites")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
    });

    // 8. Reject owner from viewing favourites
    test("Should reject owner from viewing favourites", async () => {
        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });

        const response = await request(app)
            .get("/api/favourites/my-favourites")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(403);
    });

    // 9. Remove favourite successfully
    test("Should successfully remove a favourite", async () => {
        Favourite.findOne.mockResolvedValue({
            _id: favouriteId,
            student: studentId,
            property: propertyId
        });

        Favourite.findOneAndDelete.mockResolvedValue({
            _id: favouriteId
        });

        const response = await request(app)
            .delete(`/api/favourites/${favouriteId}`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Favourite.findOneAndDelete).toHaveBeenCalled();
    });

    // 10. Prevent removing another student's favourite
    test("Should not remove another student's favourite", async () => {
        Favourite.findOne.mockResolvedValue(null);

        const response = await request(app)
            .delete(`/api/favourites/${favouriteId}`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(404);
        expect(Favourite.findOneAndDelete).not.toHaveBeenCalled();
    });

    // 11. Reject invalid favourite ID
    test("Should reject an invalid favourite ID while removing", async () => {
        const response = await request(app)
            .delete("/api/favourites/invalid123")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(400);
    });
});
