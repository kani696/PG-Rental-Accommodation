
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../backend/models/Booking", () => ({
    create: jest.fn(),
    find: jest.fn()
}));

jest.mock("../../backend/models/Property", () => ({
    findById: jest.fn()
}));

const Booking = require("../../backend/models/Booking");
const Property = require("../../backend/models/Property");
const app = require("../../backend/server");

describe("Booking API Tests", () => {
    const studentId = "student123";
    const propertyId = "6ac4df10e089363a97b422ce";
    const ownerId = "owner123";

    const futureDate = "2027-01-20";

    const validBooking = {
        propertyId,
        moveInDate: futureDate,
        message: "I am interested in this PG."
    };

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: studentId,
            role: "student"
        });
    });

    test("Should successfully create a booking request", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            owner: ownerId
        });

        Booking.create.mockResolvedValue({
            _id: "booking123",
            student: studentId,
            property: propertyId,
            owner: ownerId,
            moveInDate: new Date(futureDate),
            message: validBooking.message,
            status: "Pending"
        });

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send(validBooking);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(Booking.create).toHaveBeenCalled();
    });

    test("Should reject booking when required fields are missing", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("Should reject an invalid property ID", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send({
                propertyId: "invalid123",
                moveInDate: futureDate
            });

        expect(response.status).toBe(400);
    });

    test("Should reject an invalid move-in date", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send({
                propertyId,
                moveInDate: "invalid-date"
            });

        expect(response.status).toBe(400);
    });

    test("Should reject a past move-in date", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send({
                propertyId,
                moveInDate: "2020-01-01"
            });

        expect(response.status).toBe(400);
    });

    test("Should reject booking without authentication", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send(validBooking);

        expect(response.status).toBe(401);
    });

    test("Should reject booking by an owner", async () => {
        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send(validBooking);

        expect(response.status).toBe(403);
    });

    test("Should reject booking when property does not exist", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send(validBooking);

        expect(response.status).toBe(404);
    });

    test("Should prevent a student from booking their own property", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            owner: studentId
        });

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer testtoken")
            .send(validBooking);

        expect(response.status).toBe(403);
    });

    test("Should retrieve the logged-in student's bookings", async () => {
        const bookings = [
            {
                _id: "booking123",
                property: {
                    title: "Green View PG",
                    location: "Coimbatore",
                    rent: 6500
                },
                status: "Pending"
            }
        ];

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(bookings)
        });

        const response = await request(app)
            .get("/api/bookings/my-bookings")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
    });
});
