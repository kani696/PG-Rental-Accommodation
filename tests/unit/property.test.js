
const request = require("supertest");

jest.mock("../../backend/models/Property", () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn()
}));

jest.mock("../../backend/models/ContactMessage", () => ({
    create: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
    verify: jest.fn()
}));

const app = require("../../backend/server");
const Property = require("../../backend/models/Property");
const ContactMessage = require("../../backend/models/ContactMessage");
const jwt = require("jsonwebtoken");

describe("Property API Tests", () => {

    const propertyData = {
        title: "Green Valley PG",
        description: "Clean and comfortable accommodation",
        location: "Coimbatore",
        rent: 6000,
        roomType: "Single",
        amenities: ["WiFi", "Food"],
        contactNumber: "9876543210"
    };

    const propertyId = "64a4df10e089363a97b422ce";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. Successful property submission
    test("Should allow an owner to add a property", async () => {
        jwt.verify.mockReturnValue({
            id: "owner123",
            role: "owner"
        });

        Property.create.mockResolvedValue({
            ...propertyData,
            owner: "owner123"
        });

        const response = await request(app)
            .post("/api/properties")
            .set("Authorization", "Bearer fake-token")
            .send(propertyData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(Property.create).toHaveBeenCalled();
    });

    // 2. Missing required fields
    test("Should reject property with missing fields", async () => {
        jwt.verify.mockReturnValue({
            id: "owner123",
            role: "owner"
        });

        const response = await request(app)
            .post("/api/properties")
            .set("Authorization", "Bearer fake-token")
            .send({
                title: "Green Valley PG"
            });

        expect(response.status).toBe(400);
    });

    // 3. Student cannot add property
    test("Should reject property submission by a student", async () => {
        jwt.verify.mockReturnValue({
            id: "student123",
            role: "student"
        });

        const response = await request(app)
            .post("/api/properties")
            .set("Authorization", "Bearer fake-token")
            .send(propertyData);

        expect(response.status).toBe(403);
    });

    // 4. Negative rent
    test("Should reject negative rent", async () => {
        jwt.verify.mockReturnValue({
            id: "owner123",
            role: "owner"
        });

        const response = await request(app)
            .post("/api/properties")
            .set("Authorization", "Bearer fake-token")
            .send({
                ...propertyData,
                rent: -1000
            });

        expect(response.status).toBe(400);
    });

    // 5. Missing authentication
    test("Should reject property submission without a token", async () => {
        const response = await request(app)
            .post("/api/properties")
            .send(propertyData);

        expect(response.status).toBe(401);
    });

    // 6. Search by title
    test("Should search properties by title", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([
                {
                    title: "Green Valley PG",
                    location: "Coimbatore",
                    rent: 6000
                }
            ])
        });

        const response = await request(app)
            .get("/api/properties/search?search=Green");

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1);

        expect(Property.find).toHaveBeenCalledWith({
            $or: [
                {
                    title: {
                        $regex: "Green",
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: "Green",
                        $options: "i"
                    }
                }
            ]
        });
    });

    // 7. Search by location
    test("Should search properties by location", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([
                {
                    title: "City PG",
                    location: "Coimbatore"
                }
            ])
        });

        const response = await request(app)
            .get("/api/properties/search?search=Coimbatore");

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1);
    });

    // 8. No matching properties
    test("Should return empty results when no properties match", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
            .get("/api/properties/search?search=UnknownPlace");

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(0);
        expect(response.body.properties).toEqual([]);
    });

    // 9. Filter by maximum rent
    test("Should filter properties by maximum rent", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
            .get("/api/properties/search?maxRent=7000");

        expect(response.status).toBe(200);

        expect(Property.find).toHaveBeenCalledWith({
            $or: [
                {
                    title: {
                        $regex: "",
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: "",
                        $options: "i"
                    }
                }
            ],
            rent: { $lte: 7000 }
        });
    });

    // 10. Filter by room type
    test("Should filter properties by room type", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
            .get("/api/properties/search?roomType=Single");

        expect(response.status).toBe(200);

        expect(Property.find).toHaveBeenCalledWith({
            $or: [
                {
                    title: {
                        $regex: "",
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: "",
                        $options: "i"
                    }
                }
            ],
            roomType: "Single"
        });
    });

    // 11. Filter using multiple conditions
    test("Should apply rent and room type filters together", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
            .get("/api/properties/search?search=Coimbatore&maxRent=7000&roomType=Single");

        expect(response.status).toBe(200);

        expect(Property.find).toHaveBeenCalledWith({
            $or: [
                {
                    title: {
                        $regex: "Coimbatore",
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: "Coimbatore",
                        $options: "i"
                    }
                }
            ],
            rent: { $lte: 7000 },
            roomType: "Single"
        });
    });

    // 12. Invalid maximum rent
    test("Should reject invalid maximum rent", async () => {
        const response = await request(app)
            .get("/api/properties/search?maxRent=invalid");

        expect(response.status).toBe(400);
        expect(Property.find).not.toHaveBeenCalled();
    });

    // 13. View property details
    test("Should return property details for a valid ID", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            title: "Green View PG",
            location: "Coimbatore",
            rent: 6500,
            roomType: "Single"
        });

        const response = await request(app)
            .get(`/api/properties/${propertyId}`);

        expect(response.status).toBe(200);
        expect(Property.findById).toHaveBeenCalledWith(propertyId);
    });

    // 14. Property not found
    test("Should return 404 when property does not exist", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .get(`/api/properties/${propertyId}`);

        expect(response.status).toBe(404);
    });

    // 15. Invalid property ID
    test("Should handle an invalid property ID", async () => {
        const response = await request(app)
            .get("/api/properties/invalid-id");

        // Current controller returns 404 for invalid IDs.
        expect([400, 404]).toContain(response.status);
    });

    // 16. Successful contact inquiry
    test("Should save a contact inquiry successfully", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            owner: "owner123"
        });

        ContactMessage.create.mockResolvedValue({
            _id: "inquiry123"
        });

        const response = await request(app)
            .post(`/api/properties/${propertyId}/contact`)
            .send({
                senderName: "Mint",
                senderEmail: "mint.test@example.com",
                message: "I am interested in this PG."
            });

        expect(response.status).toBe(201);
        expect(ContactMessage.create).toHaveBeenCalled();
    });

    // 17. Missing contact fields
    test("Should reject contact inquiry with missing fields", async () => {
        const response = await request(app)
            .post(`/api/properties/${propertyId}/contact`)
            .send({
                senderName: "Mint"
            });

        expect(response.status).toBe(400);
        expect(ContactMessage.create).not.toHaveBeenCalled();
    });

    // 18. Contact inquiry for nonexistent property
    test("Should return 404 when contacting a nonexistent property", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .post(`/api/properties/${propertyId}/contact`)
            .send({
                senderName: "Mint",
                senderEmail: "mint.test@example.com",
                message: "I am interested."
            });

        expect(response.status).toBe(404);
        expect(ContactMessage.create).not.toHaveBeenCalled();
    });

});
