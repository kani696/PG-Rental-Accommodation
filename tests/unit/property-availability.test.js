
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../backend/models/Property", () => ({
    find: jest.fn(),
    findById: jest.fn()
}));

jest.mock("../../backend/models/ContactMessage", () => ({
    create: jest.fn()
}));

const Property = require("../../backend/models/Property");
const app = require("../../backend/server");

describe("Property Availability API Tests", () => {
    const ownerId = "owner123";
    const studentId = "student123";
    const propertyId = "6ac4df10e089363a97b422ce";

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });
    });

    // 1. Search available properties
    test("Should filter properties by Available status", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([
                {
                    _id: propertyId,
                    title: "Green View PG",
                    availability: "Available"
                }
            ])
        });

        const response = await request(app)
            .get("/api/properties/search?availability=Available");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);

        expect(Property.find).toHaveBeenCalledWith(
            expect.objectContaining({
                availability: {
                    $in: ["Available", null]
                }
            })
        );
    });

    // 2. Search unavailable properties
    test("Should filter properties by Not Available status", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([
                {
                    _id: propertyId,
                    title: "Green View PG",
                    availability: "Not Available"
                }
            ])
        });

        const response = await request(app)
            .get("/api/properties/search?availability=Not%20Available");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(Property.find).toHaveBeenCalledWith(
            expect.objectContaining({
                availability: "Not Available"
            })
        );
    });

    // 3. Reject invalid availability filter
    test("Should reject invalid availability filter", async () => {
        const response = await request(app)
            .get("/api/properties/search?availability=Unknown");

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // 4. Owner updates availability successfully
    test("Should allow owner to update their property availability", async () => {
        const property = {
            _id: propertyId,
            owner: {
                toString: () => ownerId
            },
            availability: "Available",
            save: jest.fn().mockResolvedValue(true)
        };

        Property.findById.mockResolvedValue(property);

        const response = await request(app)
            .put(`/api/properties/${propertyId}/availability`)
            .set("Authorization", "Bearer testtoken")
            .send({
                availability: "Not Available"
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(property.availability).toBe("Not Available");
        expect(property.save).toHaveBeenCalled();
    });

    // 5. Prevent student from updating availability
    test("Should reject student from updating availability", async () => {
        jwt.verify.mockReturnValue({
            id: studentId,
            role: "student"
        });

        const response = await request(app)
            .put(`/api/properties/${propertyId}/availability`)
            .set("Authorization", "Bearer testtoken")
            .send({
                availability: "Not Available"
            });

        expect(response.status).toBe(403);
        expect(Property.findById).not.toHaveBeenCalled();
    });

    // 6. Prevent owner from updating another owner's property
    test("Should prevent owner from updating another owner's property", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            owner: {
                toString: () => "anotherOwner123"
            },
            save: jest.fn()
        });

        const response = await request(app)
            .put(`/api/properties/${propertyId}/availability`)
            .set("Authorization", "Bearer testtoken")
            .send({
                availability: "Not Available"
            });

        expect(response.status).toBe(403);
    });

    // 7. Reject invalid availability status
    test("Should reject invalid availability status", async () => {
        const response = await request(app)
            .put(`/api/properties/${propertyId}/availability`)
            .set("Authorization", "Bearer testtoken")
            .send({
                availability: "Occupied"
            });

        expect(response.status).toBe(400);
        expect(Property.findById).not.toHaveBeenCalled();
    });

    // 8. Reject update when property does not exist
    test("Should return 404 when property does not exist", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .put(`/api/properties/${propertyId}/availability`)
            .set("Authorization", "Bearer testtoken")
            .send({
                availability: "Not Available"
            });

        expect(response.status).toBe(404);
    });

    // 9. Reject request without authentication
    test("Should reject availability update without authentication", async () => {
        const response = await request(app)
            .put(`/api/properties/${propertyId}/availability`)
            .send({
                availability: "Not Available"
            });

        expect(response.status).toBe(401);
    });

    // 10. Reject invalid property ID
    test("Should reject invalid property ID", async () => {
        const response = await request(app)
            .put("/api/properties/invalid123/availability")
            .set("Authorization", "Bearer testtoken")
            .send({
                availability: "Not Available"
            });

        expect(response.status).toBe(400);
    });
});
