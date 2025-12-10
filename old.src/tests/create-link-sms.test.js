import { it, beforeAll, describe, afterAll, expect } from "vitest";
import LinkService from "../src/Services/link.service.js";
import { connectForTesting, closeConnection } from "../src/Services/db.service.js";
import RoomService from "../src/Services/room.service.js";
import CaseService from "../src/Services/case.service.js";
import randomString from "randomstring";

const mobile = "0812345678";
const SERVICE = 999;
const ROOM = randomString.generate({
  length: 6,
  charset: String(process.env.CUSTOM_CHARSET),
});
const USER_AGENT = "vite-test";

describe("Create case, link sms", () => {
  beforeAll(async () => {
    await connectForTesting();
  });

  afterAll(async () => {
    await closeConnection();
  });

  it("should create a case and room", async () => {
    const respRoom = await RoomService.createRoom({
      room: ROOM,
      identity: "test identity",
      chat_identity: "test chat identity",
      userName: "test user name",
      userType: "user",
      text: "test text",
      files: "",
      replyToMessageId: 0,
      replyToUserName: "test reply to user name",
      replyToText: "test reply to text",
      color: "#FF6363",
    });
    const roomId = respRoom.insertId;
    console.log("Room", JSON.stringify(respRoom));

    const lastCaseId = await CaseService.getLastCaseId({ service: SERVICE });
    expect(lastCaseId).toBeDefined();
    expect(typeof lastCaseId).toBe("number");

    const respLinkAdmin = await LinkService.createLink({
      mobile: "-",
      room: ROOM,
      isAdmin: 1,
      crmSender: "test",
      userName: "test user admin",
      userType: "admin",
      linkType: "video",
      userAgent: USER_AGENT,
    });
    console.log("Link Admin", JSON.stringify(respLinkAdmin));
    expect(respLinkAdmin).toBeDefined();

    const respLinkUser = await LinkService.createLink({
      mobile: mobile,
      room: ROOM,
      isAdmin: 0,
      crmSender: "test",
      userName: mobile,
      userType: "user",
      linkType: "video",
      userAgent: USER_AGENT,
    });
    console.log("Link User", JSON.stringify(respLinkUser));
    expect(respLinkUser).toBeDefined();

    const respCase = await CaseService.create({
      caseId: lastCaseId + 1,
      service: SERVICE,
      roomId: roomId,
      userName: "test user name",
      mobileCreated: mobile,
      caseType: "video",
      organization: "test organization",
    });
    console.log("Case", JSON.stringify(respCase));
    expect(respCase).toBeDefined();

    const respLinkGuest = await LinkService.createLink({
      share: 1,
      room: ROOM,
      isAdmin: 0,
      userName: "Guest",
      userType: "user",
      linkType: "video",
      userAgent: USER_AGENT,
    });
    console.log("Link Guest", JSON.stringify(respLinkGuest));
    expect(respLinkGuest).toBeDefined();

    const respLinkViewer = await LinkService.createLink({
      share: 1,
      room: ROOM,
      isAdmin: 0,
      userName: "Viewer",
      userType: "viewer",
      linkType: "video",
      userAgent: USER_AGENT,
    });
    console.log("Link Viewer", JSON.stringify(respLinkViewer));
    expect(respLinkViewer).toBeDefined();
  });
});
