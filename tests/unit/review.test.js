
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

jest.mock("../../backend/models/Review", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn()
}));

jest.mock("../../backend/models/Property", () => ({
    findById: jest.fn()
}));

const Review = require("../../backend/models/Review");
const Property = require("../../backend/models/Property");
const app = require("../../backend/server");

describe("Review API Tests", () => {
    const studentId = "student123";
    const propertyId = "507f1f77bcf86cd799439011";

    beforeEach(() => {
        jest.clearAllMocks();

        jwt.verify.mockReturnValue({
            id: studentId,
            role: "student"
        });
    });

    test("Should successfully submit a review", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            verificationStatus: "Approved"
        });

        Review.findOne.mockResolvedValue(null);

        Review.create.mockResolvedValue({
            rating: 5,
            comment: "Excellent accommodation"
        });

        const response = await request(app)
            .post(`/api/reviews/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                rating: 5,
                comment: "Excellent accommodation"
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(Review.create).toHaveBeenCalled();
    });

    test("Should reject rating below 1", async () => {
        const response = await request(app)
            .post(`/api/reviews/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                rating: 0,
                comment: "Bad"
            });

        expect(response.status).toBe(400);
    });

    test("Should reject rating above 5", async () => {
        const response = await request(app)
            .post(`/api/reviews/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                rating: 6,
                comment: "Good"
            });

        expect(response.status).toBe(400);
    });

    test("Should reject empty review comment", async () => {
        const response = await request(app)
            .post(`/api/reviews/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                rating: 4,
                comment: "   "
            });

        expect(response.status).toBe(400);
    });

    test("Should prevent duplicate reviews", async () => {
        Property.findById.mockResolvedValue({
            _id: propertyId,
            verificationStatus: "Approved"
        });

        Review.findOne.mockResolvedValue({
            rating: 4,
            comment: "Already reviewed"
        });

        const response = await request(app)
            .post(`/api/reviews/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                rating: 5,
                comment: "Another review"
            });

        expect(response.status).toBe(409);
    });

    test("Should reject review for unavailable property", async () => {
        Property.findById.mockResolvedValue(null);

        const response = await request(app)
            .post(`/api/reviews/${propertyId}`)
            .set("Authorization", "Bearer testtoken")
            .send({
                rating: 5,
                comment: "Good"
            });

        expect(response.status).toBe(404);
    });

    test("Should retrieve property reviews and average rating", async () => {
        const reviews = [
            { rating: 5, comment: "Excellent" },
            { rating: 3, comment: "Average" }
        ];

        Property.findById.mockResolvedValue({
            _id: propertyId
        });

        Review.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(reviews)
        });

        const response = await request(app)
            .get(`/api/reviews/${propertyId}`);

        expect(response.status).toBe(200);
        expect(response.body.totalReviews).toBe(2);
        expect(response.body.averageRating).toBe(4);
    });

    test("Should reject unauthenticated review submission", async () => {
        const response = await request(app)
            .post(`/api/reviews/${propertyId}`)
            .send({
                rating: 5,
                comment: "Good"
            });

        expect(response.status).toBe(401);
    });
});
