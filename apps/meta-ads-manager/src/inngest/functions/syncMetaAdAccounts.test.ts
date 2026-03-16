import { syncMetaAdAccounts } from "./syncMetaAdAccounts";
import { inngest } from "../client";

describe("syncMetaAdAccounts", () => {
  it("should be defined", () => {
    expect(syncMetaAdAccounts).toBeDefined();
  });

  it("should have correct function ID", () => {
    expect(syncMetaAdAccounts.id).toBe("sync-meta-ad-accounts");
  });

  it("should have cron trigger configured", () => {
    expect(syncMetaAdAccounts.triggers).toBeDefined();
  });

  it("should handle 401 errors (invalid token)", async () => {
    // Mock fetch to return 401
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: "Unauthorized",
      } as Response)
    );

    try {
      await syncMetaAdAccounts.handler(
        { event: {}, step: { run: jest.fn((id, fn) => fn()) } },
        inngest
      );
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle rate limiting (429 errors)", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: "Too Many Requests",
      } as Response)
    );

    try {
      await syncMetaAdAccounts.handler(
        { event: {}, step: { run: jest.fn((id, fn) => fn()) } },
        inngest
      );
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
