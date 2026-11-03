
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../backend/models/Notification", () => ({
    find: jest.fn(),
    findOneAndUpdate: jest.fn()
}));

const Notification = require("../../backend/models/Notification");
const app = require("../../backend/server");

describe("Notification API Tests", () => {
    const userId = "student123";
    const notificationId = "notification123";

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: userId,
            role: "student"
        });
    });

    test("Should retrieve logged-in user's notifications", async () => {
        const notifications = [
            {
                _id: notificationId,
                message: "Your booking request has been approved.",
                type: "Booking Approved",
                isRead: false
            }
        ];

        Notification.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(notifications)
        });

        const response = await request(app)
            .get("/api/notifications")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(Notification.find).toHaveBeenCalledWith({
            recipient: userId
        });
    });

    test("Should return empty array when no notifications exist", async () => {
        Notification.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
            .get("/api/notifications")
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test("Should mark notification as read", async () => {
        const notification = {
            _id: notificationId,
            recipient: userId,
            isRead: true
        };

        Notification.findOneAndUpdate.mockResolvedValue(notification);

        const response = await request(app)
            .put(`/api/notifications/${notificationId}/read`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(200);
        expect(response.body.notification.isRead).toBe(true);

        expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: notificationId,
                recipient: userId
            },
            { isRead: true },
            { new: true }
        );
    });

    test("Should reject notification belonging to another user", async () => {
        Notification.findOneAndUpdate.mockResolvedValue(null);

        const response = await request(app)
            .put(`/api/notifications/${notificationId}/read`)
            .set("Authorization", "Bearer testtoken");

        expect(response.status).toBe(404);
    });

    test("Should reject unauthenticated notification requests", async () => {
        const response = await request(app)
            .get("/api/notifications");

        expect(response.status).toBe(401);
    });
});
