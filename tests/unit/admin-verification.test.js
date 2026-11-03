
const request = require("supertest");

jest.mock("../../backend/models/Property", () => ({
    find: jest.fn(),
    findById: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
    verify: jest.fn()
}));

const app = require("../../backend/server");
const Property = require("../../backend/models/Property");
const jwt = require("jsonwebtoken");

describe("Admin Property Verification Tests", () => {

    const adminId = "admin123";
    const ownerId = "owner123";
    const propertyId = "64a4df10e089363a97b422ce";

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: adminId,
            role: "admin"
        });
    });

    // 1. Admin can view all listings
    test("Should allow admin to view all property listings", async () => {
        Property.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([
                    {
                        _id: propertyId,
                        title: "Green View PG",
                        verificationStatus: "Pending"
                    }
                ])
            })
        });

        const response = await request(app)
            .get("/api/properties/admin/listings")
            .set("Authorization", "Bearer admin-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
        expect(Property.find).toHaveBeenCalledWith({});
    });

    // 2. Owner cannot access admin listings
    test("Should prevent owner from viewing admin listings", async () => {
        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });

        const response = await request(app)
            .get("/api/properties/admin/listings")
            .set("Authorization", "Bearer owner-token");

        expect(response.status).toBe(403);
        expect(Property.find).not.toHaveBeenCalled();
    });

    // 3. Admin can approve a property
    test("Should allow admin to approve a property", async () => {
        const property = {
            _id: propertyId,
            verificationStatus: "Pending",
            save: jest.fn().mockResolvedValue(true)
        };

        Property.findById.mockResolvedValue(property);

        const response = await request(app)
            .patch(`/api/properties/${propertyId}/verification`)
            .set("Authorization", "Bearer admin-token")
            .send({
                status: "Approved"
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(property.verificationStatus).toBe("Approved");
        expect(property.save).toHaveBeenCalled();
    });

    // 4. Admin can reject a property
    test("Should allow admin to reject a property", async () => {
        const property = {
            _id: propertyId,
            verificationStatus: "Pending",
            save: jest.fn().mockResolvedValue(true)
        };

        Property.findById.mockResolvedValue(property);

        const response = await request(app)
            .patch(`/api/properties/${propertyId}/verification`)
            .set("Authorization", "Bearer admin-token")
            .send({
                status: "Rejected"
            });

        expect(response.status).toBe(200);
        expect(property.verificationStatus).toBe("Rejected");
        expect(property.save).toHaveBeenCalled();
    });

    // 5. Owner cannot approve a property
    test("Should prevent owner from approving a property", async () => {
        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });

        const response = await request(app)
            .patch(`/api/properties/${propertyId}/verification`)
            .set("Authorization", "Bearer owner-token")
            .send({
                status: "Approved"
            });

        expect(response.status).toBe(403);
        expect(Property.findById).not.toHaveBeenCalled();
    });

    // 6. Student cannot approve a property
    test("Should prevent student from approving a property", async () => {
        jwt.verify.mockReturnValue({
            id: "student123",
            role: "student"
        });

        const response = await request(app)
            .patch(`/api/properties/${propertyId}/verification`)
            .set("Authorization", "Bearer student-token")
            .send({
                status: "Approved"
            });

        expect(response.status).toBe(403);
    });

    // 7. Reject invalid verification status
    test("Should reject invalid verification status", async () => {
        const response = await request(app)
            .patch(`/api/properties/${propertyId}/verification`)
            .set("Authorization", "Bearer admin-token")
            .send({
                status: "Pending"
            });

        expect(response.status).toBe(400);
        expect(Property.findById).not.toHaveBeenCalled();
    });

    // 8. Property does not exist
    test("Should return 404 when property does not exist", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .patch(`/api/properties/${propertyId}/verification`)
            .set("Authorization", "Bearer admin-token")
            .send({
                status: "Approved"
            });

        expect(response.status).toBe(404);
    });

    // 9. Invalid property ID
    test("Should reject invalid property ID", async () => {
        const response = await request(app)
            .patch("/api/properties/invalid-id/verification")
            .set("Authorization", "Bearer admin-token")
            .send({
                status: "Approved"
            });

        expect(response.status).toBe(400);
        expect(Property.findById).not.toHaveBeenCalled();
    });

    // 10. Unauthenticated user cannot verify listings
    test("Should reject verification without authentication", async () => {
        const response = await request(app)
            .patch(`/api/properties/${propertyId}/verification`)
            .send({
                status: "Approved"
            });

        expect(response.status).toBe(401);
    });

});
