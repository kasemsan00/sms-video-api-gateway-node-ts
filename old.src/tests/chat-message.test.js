import { it, beforeAll, describe, afterAll, expect } from "vitest";
import ChatService from "../src/Services/chat.service.js";
import { connectForTesting, closeConnection } from "../src/Services/db.service.js";

// Test data constants
const TEST_ROOM = "room1";
const TEST_IDENTITY = "identity1";
const TEST_CHAT_IDENTITY = "chat_identity1";

const createChatMessageData = (overrides = {}) => ({
  room: TEST_ROOM,
  identity: TEST_IDENTITY,
  chat_identity: TEST_CHAT_IDENTITY,
  userName: "test user",
  userType: "user",
  text: "test message",
  files: "",
  replyToMessageId: 0,
  replyToUserName: "test reply to user name",
  replyToText: "test reply to text",
  color: "#FF6363",
  ...overrides,
});

describe("Chat Message Service", () => {
  beforeAll(async () => {
    await connectForTesting();
  });

  afterAll(async () => {
    await closeConnection();
  });

  describe("saveChatMessage", () => {
    const testCases = [
      {
        description: "single chat message",
        overrides: {
          userName: "test user1",
          text: "Hello, this is a test message",
        },
      },
      {
        description: "first of multiple chat messages",
        overrides: {
          userName: "test user1",
          text: "First test message",
          color: "#FF6363",
        },
      },
      {
        description: "second of multiple chat messages",
        overrides: {
          userName: "test user2",
          text: "Second test message",
          color: "#A6D1E6",
        },
      },
    ];

    it.each(testCases)(
      "should successfully save %s",
      async ({ overrides }) => {
        const messageData = createChatMessageData(overrides);
        const result = await ChatService.saveChatMessage(messageData);

        expect(result).toBeDefined();
        expect(result.affectedRows).toBeGreaterThan(0);
      },
    );
  });

  describe("chatHistory", () => {
    it("should retrieve chat history for a room", async () => {
      const result = await ChatService.chatHistory({ room: TEST_ROOM });

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return an array even for empty rooms", async () => {
      const result = await ChatService.chatHistory({ room: TEST_ROOM });
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
