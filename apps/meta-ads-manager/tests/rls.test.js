describe("RLS Implementation", () => {
  it("should have migration file created", () => {
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "../migrations/002_create_users_and_rls.sql");
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("should have RLS helpers created", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    expect(fs.existsSync(helperPath)).toBe(true);
  });

  it("should have API endpoint created", () => {
    const fs = require("fs");
    const path = require("path");
    const apiPath = path.join(__dirname, "../src/pages/api/accounts/index.ts");
    expect(fs.existsSync(apiPath)).toBe(true);
  });

  it("should have Supabase client created", () => {
    const fs = require("fs");
    const path = require("path");
    const clientPath = path.join(__dirname, "../src/lib/supabase.ts");
    expect(fs.existsSync(clientPath)).toBe(true);
  });

  it("should have auth helpers created", () => {
    const fs = require("fs");
    const path = require("path");
    const authPath = path.join(__dirname, "../src/lib/auth.ts");
    expect(fs.existsSync(authPath)).toBe(true);
  });

  it("should have types defined", () => {
    const fs = require("fs");
    const path = require("path");
    const typesPath = path.join(__dirname, "../src/types/index.ts");
    expect(fs.existsSync(typesPath)).toBe(true);
  });
});

describe("Migration SQL Content", () => {
  it("should have users table creation", () => {
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "../migrations/002_create_users_and_rls.sql");
    const content = fs.readFileSync(migrationPath, "utf8");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS user_account_access");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS access_logs");
  });

  it("should have RLS enabled", () => {
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "../migrations/002_create_users_and_rls.sql");
    const content = fs.readFileSync(migrationPath, "utf8");
    expect(content).toContain("ALTER TABLE users ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("ALTER TABLE user_account_access ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY");
  });

  it("should have RLS policies defined", () => {
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "../migrations/002_create_users_and_rls.sql");
    const content = fs.readFileSync(migrationPath, "utf8");
    expect(content).toContain("CREATE POLICY");
    expect(content).toContain("auth.uid()");
  });

  it("should have indexes for performance", () => {
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "../migrations/002_create_users_and_rls.sql");
    const content = fs.readFileSync(migrationPath, "utf8");
    expect(content).toContain("CREATE INDEX");
  });

  it("should have triggers for updated_at", () => {
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "../migrations/002_create_users_and_rls.sql");
    const content = fs.readFileSync(migrationPath, "utf8");
    expect(content).toContain("CREATE TRIGGER");
  });
});

describe("RLS Helpers Functions", () => {
  it("should export getUserAccounts function", () => {
    // Check if function is exported in the helper file
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function getUserAccounts");
  });

  it("should export hasAccountAccess function", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function hasAccountAccess");
  });

  it("should export logAccess function", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function logAccess");
  });

  it("should export grantAccountAccess function", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function grantAccountAccess");
  });

  it("should export revokeAccountAccess function", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function revokeAccountAccess");
  });

  it("should export getAccessLogs function", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function getAccessLogs");
  });

  it("should export upsertUser function", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function upsertUser");
  });

  it("should export getUser function", () => {
    const fs = require("fs");
    const path = require("path");
    const helperPath = path.join(__dirname, "../src/lib/supabase-rls.ts");
    const content = fs.readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function getUser");
  });
});

describe("API Endpoint", () => {
  it("should handle GET requests", () => {
    const fs = require("fs");
    const path = require("path");
    const apiPath = path.join(__dirname, "../src/pages/api/accounts/index.ts");
    const content = fs.readFileSync(apiPath, "utf8");
    expect(content).toContain('req.method !== "GET"');
  });

  it("should require authentication", () => {
    const fs = require("fs");
    const path = require("path");
    const apiPath = path.join(__dirname, "../src/pages/api/accounts/index.ts");
    const content = fs.readFileSync(apiPath, "utf8");
    expect(content).toContain("requireAuth");
  });

  it("should call getUserAccounts", () => {
    const fs = require("fs");
    const path = require("path");
    const apiPath = path.join(__dirname, "../src/pages/api/accounts/index.ts");
    const content = fs.readFileSync(apiPath, "utf8");
    expect(content).toContain("getUserAccounts");
  });

  it("should log access", () => {
    const fs = require("fs");
    const path = require("path");
    const apiPath = path.join(__dirname, "../src/pages/api/accounts/index.ts");
    const content = fs.readFileSync(apiPath, "utf8");
    expect(content).toContain("logAccess");
  });
});

describe("Auth Helpers", () => {
  it("should export requireAuth function", () => {
    const fs = require("fs");
    const path = require("path");
    const authPath = path.join(__dirname, "../src/lib/auth.ts");
    const content = fs.readFileSync(authPath, "utf8");
    expect(content).toContain("export async function requireAuth");
  });

  it("should export getUserFromRequest function", () => {
    const fs = require("fs");
    const path = require("path");
    const authPath = path.join(__dirname, "../src/lib/auth.ts");
    const content = fs.readFileSync(authPath, "utf8");
    expect(content).toContain("export async function getUserFromRequest");
  });
});

describe("Types", () => {
  it("should define User interface", () => {
    const fs = require("fs");
    const path = require("path");
    const typesPath = path.join(__dirname, "../src/types/index.ts");
    const content = fs.readFileSync(typesPath, "utf8");
    expect(content).toContain("export interface User");
  });

  it("should define MetaAccount interface", () => {
    const fs = require("fs");
    const path = require("path");
    const typesPath = path.join(__dirname, "../src/types/index.ts");
    const content = fs.readFileSync(typesPath, "utf8");
    expect(content).toContain("export interface MetaAccount");
  });

  it("should define UserAccountAccess interface", () => {
    const fs = require("fs");
    const path = require("path");
    const typesPath = path.join(__dirname, "../src/types/index.ts");
    const content = fs.readFileSync(typesPath, "utf8");
    expect(content).toContain("export interface UserAccountAccess");
  });

  it("should define AccessLog interface", () => {
    const fs = require("fs");
    const path = require("path");
    const typesPath = path.join(__dirname, "../src/types/index.ts");
    const content = fs.readFileSync(typesPath, "utf8");
    expect(content).toContain("export interface AccessLog");
  });

  it("should define ApiResponse interface", () => {
    const fs = require("fs");
    const path = require("path");
    const typesPath = path.join(__dirname, "../src/types/index.ts");
    const content = fs.readFileSync(typesPath, "utf8");
    expect(content).toContain("export interface ApiResponse");
  });
});
