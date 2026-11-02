
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../backend/models/Booking", () => ({
    create: jest.fn(),
    find: jest.fn()
}));

jest.mock("../../backend/models/Property", () => ({
    findById: jest.fn(),
    find: jest.fn()
}));

const Booking = require("../../backend/models/Booking");
const Property = require("../../backend/models/Property");
const app = require("../../backend/server");

describe("Owner Dashboard API Tests", () => {
    const ownerId = "owner123";
    const studentId = "student123";

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: ownerId,
            role: "owner"
        });
    });

    test("Should successfully load owner dashboard", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([
                { title: "Green View PG", rent: 6500 },
                { title: "Sunrise PG", rent: 7000 }
            ])
        });

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue([
                { status: "Pending" },
                { status: "Pending" },
                { status: "Approved" },
                { status: "Rejected" }
            ])
        });

        const response = await request(app)
            .get("/api/bookings/owner-dashboard")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.dashboard.totalProperties).toBe(2);
        expect(response.body.dashboard.totalBookings).toBe(4);
        expect(response.body.dashboard.pendingBookings).toBe(2);
        expect(response.body.dashboard.approvedBookings).toBe(1);
        expect(response.body.dashboard.rejectedBookings).toBe(1);
        expect(response.body.dashboard.recentBookings).toHaveLength(4);
    });

    test("Should reject student access to owner dashboard", async () => {
        jwt.verify.mockReturnValue({
            id: studentId,
            role: "student"
        });

        const response = await request(app)
            .get("/api/bookings/owner-dashboard")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    test("Should reject access without authentication", async () => {
        const response = await request(app)
            .get("/api/bookings/owner-dashboard");

        expect(response.status).toBe(401);
    });

    test("Should return zero counts when owner has no properties or bookings", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
            .get("/api/bookings/owner-dashboard")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.dashboard.totalProperties).toBe(0);
        expect(response.body.dashboard.totalBookings).toBe(0);
        expect(response.body.dashboard.pendingBookings).toBe(0);
        expect(response.body.dashboard.approvedBookings).toBe(0);
        expect(response.body.dashboard.rejectedBookings).toBe(0);
    });

    test("Should return only the logged-in owner's data", async () => {
        Property.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue([])
        });

        await request(app)
            .get("/api/bookings/owner-dashboard")
            .set("Authorization", "Bearer testtoken");

        expect(Property.find).toHaveBeenCalledWith({
            owner: ownerId
        });

        expect(Booking.find).toHaveBeenCalledWith({
            owner: ownerId
        });
    });
});
