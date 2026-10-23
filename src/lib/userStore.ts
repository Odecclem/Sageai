import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // "salt:hash"
  role: "admin" | "user";
  creditBalance: number;
  totalSecondsStreamed: number;
  createdAt: string;
  lastLoginAt?: string;
}

export type SafeUser = Omit<User, "passwordHash">;

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
}

function ensureDataFile(): User[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    // Seed default admin and sample streamer
    const initialUsers: User[] = [
      {
        id: "usr_admin_01",
        name: "Platform Administrator",
        email: "admin@sage.ai",
        passwordHash: hashPassword("admin123"),
        role: "admin",
        creditBalance: 25000,
        totalSecondsStreamed: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_alex_02",
        name: "Alex Streamer",
        email: "alex@creator.tv",
        passwordHash: hashPassword("password123"),
        role: "user",
        creditBalance: 0,
        totalSecondsStreamed: 0,
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), "utf-8");
    return initialUsers;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export const userStore = {
  getAllUsers(): SafeUser[] {
    const users = ensureDataFile();
    return users.map(({ passwordHash: _hash, ...safe }) => safe);
  },

  getUserById(id: string): User | null {
    const users = ensureDataFile();
    return users.find((u) => u.id === id) || null;
  },

  getSafeUserById(id: string): SafeUser | null {
    const user = this.getUserById(id);
    if (!user) return null;
    const { passwordHash: _hash, ...safe } = user;
    return safe;
  },

  getUserByEmail(email: string): User | null {
    const users = ensureDataFile();
    const clean = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === clean) || null;
  },

  createUser(params: {
    name: string;
    email: string;
    password: string;
    role?: "admin" | "user";
    initialCredits?: number;
  }): { success: boolean; user?: SafeUser; error?: string } {
    const users = ensureDataFile();
    const cleanEmail = params.email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: "An account with this email already exists" };
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: params.name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(params.password),
      role: params.role || "user",
      creditBalance: typeof params.initialCredits === "number" ? params.initialCredits : 0,
      totalSecondsStreamed: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Write-through to Supabase if configured
    try {
      const { supabaseDb } = require("./supabaseDb");
      if (supabaseDb.isConfigured()) {
        supabaseDb.createUser(newUser).catch((err: unknown) => {
          console.error("[Supabase Sync Error] createUser:", err);
        });
      }
    } catch {
      // Ignore if supabaseDb not yet ready
    }

    const { passwordHash: _hash, ...safe } = newUser;
    return { success: true, user: safe };
  },

  updateCredits(userId: string, delta: number): { success: boolean; newBalance?: number; error?: string } {
    const users = ensureDataFile();
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: "User not found" };

    user.creditBalance = Math.max(0, user.creditBalance + delta);
    saveUsers(users);

    try {
      const { supabaseDb } = require("./supabaseDb");
      if (supabaseDb.isConfigured()) {
        supabaseDb.updateCredits(userId, delta).catch((err: unknown) => {
          console.error("[Supabase Sync Error] updateCredits:", err);
        });
      }
    } catch {}

    return { success: true, newBalance: user.creditBalance };
  },

  setCredits(userId: string, newBalance: number): { success: boolean; newBalance?: number; error?: string } {
    const users = ensureDataFile();
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: "User not found" };

    user.creditBalance = Math.max(0, newBalance);
    saveUsers(users);

    try {
      const { supabaseDb } = require("./supabaseDb");
      if (supabaseDb.isConfigured()) {
        supabaseDb.setCredits(userId, newBalance).catch((err: unknown) => {
          console.error("[Supabase Sync Error] setCredits:", err);
        });
      }
    } catch {}

    return { success: true, newBalance: user.creditBalance };
  },

  updateRole(userId: string, newRole: "admin" | "user"): { success: boolean; error?: string } {
    const users = ensureDataFile();
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: "User not found" };

    user.role = newRole;
    saveUsers(users);

    try {
      const { supabaseDb } = require("./supabaseDb");
      if (supabaseDb.isConfigured()) {
        supabaseDb.updateRole(userId, newRole).catch((err: unknown) => {
          console.error("[Supabase Sync Error] updateRole:", err);
        });
      }
    } catch {}

    return { success: true };
  },

  recordStreamTime(userId: string, seconds: number) {
    const users = ensureDataFile();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.totalSecondsStreamed += seconds;
      saveUsers(users);

      try {
        const { supabaseDb } = require("./supabaseDb");
        if (supabaseDb.isConfigured()) {
          supabaseDb.recordStreamTime(userId, seconds).catch((err: unknown) => {
            console.error("[Supabase Sync Error] recordStreamTime:", err);
          });
        }
      } catch {}
    }
  },

  updatePassword(userId: string, newPassword: string): boolean {
    const users = ensureDataFile();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.passwordHash = hashPassword(newPassword);
    saveUsers(users);
    return true;
  },

  deleteUser(userId: string): { success: boolean; error?: string } {
    const users = ensureDataFile();
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length === users.length) {
      return { success: false, error: "User not found" };
    }
    saveUsers(filtered);

    try {
      const { supabaseDb } = require("./supabaseDb");
      if (supabaseDb.isConfigured()) {
        supabaseDb.deleteUser(userId).catch((err: unknown) => {
          console.error("[Supabase Sync Error] deleteUser:", err);
        });
      }
    } catch {}

    return { success: true };
  },

  recordLogin(userId: string) {
    const users = ensureDataFile();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      saveUsers(users);
    }
  },

  getStats() {
    const users = ensureDataFile();
    const totalUsers = users.length;
    const totalCredits = users.reduce((acc, u) => acc + u.creditBalance, 0);
    const totalStreamSeconds = users.reduce((acc, u) => acc + u.totalSecondsStreamed, 0);
    const adminCount = users.filter((u) => u.role === "admin").length;

    return {
      totalUsers,
      totalCredits,
      totalStreamSeconds,
      adminCount,
      activeUsers: users.length,
    };
  },
};
