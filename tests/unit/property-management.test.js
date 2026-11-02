
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../backend/models/Property", () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

jest.mock("../../backend/models/ContactMessage", () => ({
    create: jest.fn()
}));

const Property = require("../../backend/models/Property");
const app = require("../../backend/server");

describe("Property Management API Tests", () => {
    const ownerId = "owner123";
    const otherOwnerId = "otherOwner123";
    const propertyId = "6ac4df10e089363a97b422ce";

    const propertyData = {
        title: "Green View PG",
        description: "Comfortable accommodation",
        location: "Coimbatore",
        rent: 7000,
        roomType: "Single",
        amenities: ["WiFi", "Food"],
        contactNumber: "9876543210"
    };

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });
    });

    test("Should retrieve the owner's property listings", async () => {
        const properties = [
            {
                _id: propertyId,
                ...propertyData,
                owner: ownerId
            }
        ];

        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(properties)
        });

        const response = await request(app)
            .get("/api/properties/my-listings")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
        expect(Property.find).toHaveBeenCalledWith({
            owner: ownerId
        });
    });

    test("Should reject students from viewing owner listings", async () => {
        jwt.verify.mockReturnValue({
            id: "student123",
            role: "student"
        });

        const response = await request(app)
            .get("/api/properties/my-listings")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(403);
        expect(Property.find).not.toHaveBeenCalled();
    });

    test("Should reject unauthenticated listing requests", async () => {
        const response = await request(app)
            .get("/api/properties/my-listings");

        expect(response.status).toBe(401);
    });

    test("Should successfully update an owner's property", async () => {
        const property = {
            _id: propertyId,
            owner: ownerId,
            ...propertyData,
            save: jest.fn().mockResolvedValue(true)
        };

        Property.findById.mockResolvedValue(property);

        const response = await request(app)
            .put(`/api/properties/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                title: "Updated Green View PG",
                rent: 7500
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(property.title).toBe("Updated Green View PG");
        expect(property.rent).toBe(7500);
        expect(property.save).toHaveBeenCalled();
    });

    test("Should prevent another owner from updating the property", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            owner: otherOwnerId,
            save: jest.fn()
        });

        const response = await request(app)
            .put(`/api/properties/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                title: "Unauthorized Update"
            });

        expect(response.status).toBe(403);
    });

    test("Should reject invalid property ID during update", async () => {
        const response = await request(app)
            .put("/api/properties/invalid123")
            .set("Authorization", "Bearer testtoken")
            .send({
                title: "Updated PG"
            });

        expect(response.status).toBe(400);
        expect(Property.findById).not.toHaveBeenCalled();
    });

    test("Should successfully delete an owner's property", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            owner: ownerId
        });

        Property.findByIdAndDelete.mockResolvedValue({
            _id: propertyId
        });

        const response = await request(app)
            .delete(`/api/properties/${propertyId}`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Property.findByIdAndDelete)
            .toHaveBeenCalledWith(propertyId);
    });

    test("Should prevent another owner from deleting the property", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            owner: otherOwnerId
        });

        const response = await request(app)
            .delete(`/api/properties/${propertyId}`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(403);
        expect(Property.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test("Should return 404 when deleting a property that does not exist", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .delete(`/api/properties/${propertyId}`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(404);
    });

    test("Should reject students from updating properties", async () => {
        jwt.verify.mockReturnValue({
            id: "student123",
            role: "student"
        });

        const response = await request(app)
            .put(`/api/properties/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                title: "Updated PG"
            });

        expect(response.status).toBe(403);
        expect(Property.findById).not.toHaveBeenCalled();
    });

    test("Should reject students from deleting properties", async () => {
        jwt.verify.mockReturnValue({
            id: "student123",
            role: "student"
        });

        const response = await request(app)
            .delete(`/api/properties/${propertyId}`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(403);
        expect(Property.findById).not.toHaveBeenCalled();
    });
});
