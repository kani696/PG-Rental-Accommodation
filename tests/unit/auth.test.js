const request = require("supertest");

jest.mock("../../backend/models/User", () => ({
    findOne: jest.fn(),
    create: jest.fn()
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn()
}));

const app = require("../../backend/server");
const User = require("../../backend/models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe("Authentication API Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Registration with valid details
    test("Should register a new user", async () => {

        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue("hashedPassword");

        User.create.mockResolvedValue({
            _id: "user123",
            name: "Test User",
            email: "test@gmail.com",
            role: "student"
        });

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "test@gmail.com",
                password: "password123",
                role: "student"
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(bcrypt.hash).toHaveBeenCalled();
    });

    // Missing registration fields
    test("Should reject registration with missing fields", async () => {

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User"
            });

        expect(response.status).toBe(400);
    });

    // Short password
    test("Should reject a short password", async () => {

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "test@gmail.com",
                password: "123",
                role: "student"
            });

        expect(response.status).toBe(400);
    });

    // Duplicate email
    test("Should reject an existing email", async () => {

        User.findOne.mockResolvedValue({
            email: "test@gmail.com"
        });

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "test@gmail.com",
                password: "password123",
                role: "student"
            });

        expect(response.status).toBe(409);
    });

    // Successful login
    test("Should login with valid credentials", async () => {

        User.findOne.mockResolvedValue({
            _id: "user123",
            name: "Test User",
            email: "test@gmail.com",
            password: "hashedPassword",
            role: "student"
        });

        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue("fake-jwt-token");

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@gmail.com",
                password: "password123"
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBe("fake-jwt-token");
    });

    // Incorrect password
    test("Should reject an incorrect password", async () => {

        User.findOne.mockResolvedValue({
            email: "test@gmail.com",
            password: "hashedPassword"
        });

        bcrypt.compare.mockResolvedValue(false);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@gmail.com",
                password: "wrongpassword"
            });

        expect(response.status).toBe(401);
    });

    // Missing login details
    test("Should reject login with missing fields", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@gmail.com"
            });

        expect(response.status).toBe(400);
    });

});