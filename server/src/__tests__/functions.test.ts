import { describe, it, expect, mock, beforeAll } from "bun:test"
import jwt from "jsonwebtoken"

// Set env before any imports that use JWT_SECRET
process.env.JWT_SECRET = "test-secret-key"

// Mock db module to avoid database connections during tests
mock.module("../../db", () => ({
    default: {
        authenticate: () => Promise.resolve(),
        sync: () => Promise.resolve(),
        define: () => ({}),
        literal: (val: string) => val
    }
}))

// Mock sequelize to prevent DB connections
mock.module("sequelize", () => {
    const actual = require("sequelize")
    return actual
})

// After mocking, import the functions under test
const {
    failRequest,
    hashPassword,
    decodeJwtToken,
    isUserIdFromTokenMatchingRequest,
    isObjectEmpty,
    isUserRelatedToTodo,
    isValidTodoStatus
} = await import("../utils/functions")

const TEST_SECRET = "test-secret-key"

// Helper: create a signed JWT token for tests
function createTestToken(userId: number): string {
    return jwt.sign({ id: userId }, TEST_SECRET)
}

// Helper: create a minimal mock Express response
function createMockResponse() {
    const response = {
        statusCode: 200,
        body: null as any,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: any) {
            this.body = data
            return this
        }
    }
    return response
}

describe("failRequest", () => {
    it("should set the correct status code and json body", () => {
        const mockRes = createMockResponse()
        failRequest(mockRes as any, 404, "Not found")
        expect(mockRes.statusCode).toBe(404)
        expect(mockRes.body).toEqual({ message: "Not found" })
    })

    it("should handle 500 internal server error", () => {
        const mockRes = createMockResponse()
        failRequest(mockRes as any, 500, "Internal server error")
        expect(mockRes.statusCode).toBe(500)
        expect(mockRes.body.message).toBe("Internal server error")
    })

    it("should handle 401 unauthorized", () => {
        const mockRes = createMockResponse()
        failRequest(mockRes as any, 401, "Unauthorized")
        expect(mockRes.statusCode).toBe(401)
        expect(mockRes.body.message).toBe("Unauthorized")
    })

    it("should handle 400 bad request", () => {
        const mockRes = createMockResponse()
        failRequest(mockRes as any, 400, "Bad request")
        expect(mockRes.statusCode).toBe(400)
    })

    it("should handle 418 teapot response", () => {
        const mockRes = createMockResponse()
        failRequest(mockRes as any, 418, "I'm a teapot")
        expect(mockRes.statusCode).toBe(418)
    })
})

describe("hashPassword", () => {
    it("should return a hashed string different from the input", async () => {
        const plainPassword = "mySecretPassword123"
        const hashed = await hashPassword(plainPassword)
        expect(hashed).not.toBe(plainPassword)
        expect(typeof hashed).toBe("string")
    })

    it("should produce a bcrypt hash (starts with $2a$ or $2b$)", async () => {
        const hashed = await hashPassword("testpassword")
        expect(hashed.startsWith("$2a$") || hashed.startsWith("$2b$")).toBe(true)
    })

    it("should produce different hashes for the same password (salting)", async () => {
        const password = "samePassword"
        const hash1 = await hashPassword(password)
        const hash2 = await hashPassword(password)
        expect(hash1).not.toBe(hash2)
    })

    it("should produce a hash of adequate length (bcrypt hashes are 60 chars)", async () => {
        const hashed = await hashPassword("anyPassword")
        expect(hashed.length).toBe(60)
    })
})

describe("decodeJwtToken", () => {
    it("should correctly decode a valid token", () => {
        const userId = 42
        const token = createTestToken(userId)
        const authHeader = `Bearer ${token}`

        const decoded = decodeJwtToken(authHeader, TEST_SECRET)

        expect(decoded.id).toBe(userId)
        expect(typeof decoded.iat).toBe("number")
    })

    it("should throw for an invalid token", () => {
        const authHeader = "Bearer invalid.token.here"
        expect(() => decodeJwtToken(authHeader, TEST_SECRET)).toThrow()
    })

    it("should throw for a token signed with a different secret", () => {
        const token = createTestToken(1)
        const authHeader = `Bearer ${token}`
        expect(() => decodeJwtToken(authHeader, "wrong-secret")).toThrow()
    })

    it("should handle multiple user IDs correctly", () => {
        const userIds = [1, 100, 9999]
        for(const userId of userIds) {
            const token = createTestToken(userId)
            const decoded = decodeJwtToken(`Bearer ${token}`, TEST_SECRET)
            expect(decoded.id).toBe(userId)
        }
    })
})

describe("isUserIdFromTokenMatchingRequest", () => {
    it("should return true when token userId matches request id", () => {
        const userId = 7
        const token = createTestToken(userId)
        const authHeader = `Bearer ${token}`

        const result = isUserIdFromTokenMatchingRequest(authHeader, userId)
        expect(result).toBe(true)
    })

    it("should return false when token userId does not match request id", () => {
        const token = createTestToken(7)
        const authHeader = `Bearer ${token}`

        const result = isUserIdFromTokenMatchingRequest(authHeader, 99)
        expect(result).toBe(false)
    })

    it("should return false when authHeader is empty string", () => {
        const result = isUserIdFromTokenMatchingRequest("", 1)
        expect(result).toBe(false)
    })

    it("should return false when authHeader is undefined", () => {
        const result = isUserIdFromTokenMatchingRequest(undefined as any, 1)
        expect(result).toBe(false)
    })

    it("should return false when authHeader doesn't start with 'Bearer '", () => {
        const token = createTestToken(5)
        const result = isUserIdFromTokenMatchingRequest(`Token ${token}`, 5)
        expect(result).toBe(false)
    })
})

describe("isObjectEmpty", () => {
    it("should return true for an empty object", () => {
        expect(isObjectEmpty({})).toBe(true)
    })

    it("should return false for an object with one key", () => {
        expect(isObjectEmpty({ key: "value" })).toBe(false)
    })

    it("should return false for an object with multiple keys", () => {
        expect(isObjectEmpty({ a: 1, b: 2, c: 3 })).toBe(false)
    })

    it("should return false for an object with undefined values", () => {
        expect(isObjectEmpty({ key: undefined })).toBe(false)
    })

    it("should return false for an object with null values", () => {
        expect(isObjectEmpty({ key: null })).toBe(false)
    })
})

describe("isValidTodoStatus", () => {
    it("should return true for 'not_started'", () => {
        expect(isValidTodoStatus("not_started")).toBe(true)
    })

    it("should return true for 'in_progress'", () => {
        expect(isValidTodoStatus("in_progress")).toBe(true)
    })

    it("should return true for 'done'", () => {
        expect(isValidTodoStatus("done")).toBe(true)
    })

    it("should return false for an invalid status string", () => {
        expect(isValidTodoStatus("pending")).toBe(false)
    })

    it("should return false for an empty string", () => {
        expect(isValidTodoStatus("")).toBe(false)
    })

    it("should return false for a status with different casing", () => {
        expect(isValidTodoStatus("NOT_STARTED")).toBe(false)
        expect(isValidTodoStatus("Done")).toBe(false)
    })

    it("should return false for random strings", () => {
        expect(isValidTodoStatus("completed")).toBe(false)
        expect(isValidTodoStatus("todo")).toBe(false)
    })

    it("should work with all TodoStatus enum values", () => {
        const allStatuses = ["not_started", "in_progress", "done"]
        for(const status of allStatuses) {
            expect(isValidTodoStatus(status)).toBe(true)
        }
    })
})

describe("isUserRelatedToTodo", () => {
    it("should return true when user is the assignee", async () => {
        const user = { id: 1, hasGroup: async () => false }
        const todo = { assignee_id: 1, author_id: 2, group_id: null }

        const result = await isUserRelatedToTodo(user, todo, 1)
        expect(result).toBe(true)
    })

    it("should return true when user is the author", async () => {
        const user = { id: 2, hasGroup: async () => false }
        const todo = { assignee_id: 1, author_id: 2, group_id: null }

        const result = await isUserRelatedToTodo(user, todo, 2)
        expect(result).toBe(true)
    })

    it("should return true when user is in the group", async () => {
        const user = { id: 3, hasGroup: async (groupId: number) => groupId === 5 }
        const todo = { assignee_id: 1, author_id: 2, group_id: 5 }

        const result = await isUserRelatedToTodo(user, todo, 3)
        expect(result).toBe(true)
    })

    it("should return false when user has no relation to the todo", async () => {
        const user = { id: 99, hasGroup: async () => false }
        const todo = { assignee_id: 1, author_id: 2, group_id: 5 }

        const result = await isUserRelatedToTodo(user, todo, 99)
        expect(result).toBe(false)
    })

    it("should use user.id as userId when userId param is null", async () => {
        const user = { id: 1, hasGroup: async () => false }
        const todo = { assignee_id: 1, author_id: 2, group_id: null }

        const result = await isUserRelatedToTodo(user, todo, null)
        expect(result).toBe(true)
    })

    it("should return false when todo has no group and user is unrelated", async () => {
        const user = { id: 10, hasGroup: async () => false }
        const todo = { assignee_id: 3, author_id: 4, group_id: null }

        const result = await isUserRelatedToTodo(user, todo, 10)
        expect(result).toBe(false)
    })
})
