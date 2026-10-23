/**
 * In-Memory & File-backed Store for Streamer Sessions & Credit Wallets
 * Connects with userStore for persistent account balances.
 */
import { userStore } from "./userStore";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  creditBalance: number;
  totalSecondsStreamed: number;
}

export interface StreamSession {
  sessionId: string;
  streamKey: string;
  userId: string;
  userName?: string;
  isLive: boolean;
  personaId: string;
  startedAt: number | null;
  lastHeartbeat: number;
  burnRatePerSecond: number; // 1 credit/sec default
  creditsSpentThisSession: number;
  secondsElapsed: number;
}

const globalStore = global as unknown as {
  _lumifySessions?: Map<string, StreamSession>;
};

if (!globalStore._lumifySessions) {
  globalStore._lumifySessions = new Map<string, StreamSession>();
}

export const sessionStore = {
  getUser(userId?: string): UserAccount {
    if (userId) {
      const u = userStore.getUserById(userId);
      if (u) {
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          creditBalance: u.creditBalance,
          totalSecondsStreamed: u.totalSecondsStreamed,
        };
      }
    }
    // Default fallback to first streamer
    const alex = userStore.getUserById("usr_alex_02") || userStore.getAllUsers()[0];
    if (alex) {
      return {
        id: alex.id,
        name: alex.name,
        email: alex.email,
        creditBalance: alex.creditBalance,
        totalSecondsStreamed: alex.totalSecondsStreamed,
      };
    }
    return {
      id: "usr_guest",
      name: "Guest Creator",
      email: "guest@sage.ai",
      creditBalance: 0,
      totalSecondsStreamed: 0,
    };
  },

  addCredits(amount: number, userId?: string): number {
    const targetUserId = userId || "usr_alex_02";
    const result = userStore.updateCredits(targetUserId, amount);
    if (result.success && typeof result.newBalance === "number") {
      return result.newBalance;
    }
    return 0;
  },

  deductCredits(amount: number, userId?: string): { success: boolean; newBalance: number } {
    const targetUserId = userId || "usr_alex_02";
    const user = userStore.getUserById(targetUserId);
    if (!user || user.creditBalance < amount) {
      if (user) {
        userStore.setCredits(targetUserId, 0);
      }
      return { success: false, newBalance: 0 };
    }
    const result = userStore.updateCredits(targetUserId, -amount);
    return { success: true, newBalance: result.newBalance ?? 0 };
  },

  getOrCreateSession(streamKey: string, userId?: string, userName?: string): StreamSession {
    let session = globalStore._lumifySessions!.get(streamKey);
    const targetUserId = userId || "usr_alex_02";
    const user = userStore.getUserById(targetUserId);

    if (!session) {
      session = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        streamKey,
        userId: targetUserId,
        userName: userName || user?.name || "Creator",
        isLive: false,
        personaId: "anime-shonen",
        startedAt: null,
        lastHeartbeat: Date.now(),
        burnRatePerSecond: 1,
        creditsSpentThisSession: 0,
        secondsElapsed: 0,
      };
      globalStore._lumifySessions!.set(streamKey, session);
    } else {
      session.burnRatePerSecond = 1;
      if (userId) session.userId = userId;
      if (userName) session.userName = userName;
    }
    return session;
  },

  startStream(
    streamKey: string,
    personaId: string,
    userId?: string,
    userName?: string
  ): { success: boolean; session?: StreamSession; error?: string } {
    const targetUserId = userId || "usr_alex_02";
    const user = userStore.getUserById(targetUserId);
    const balance = user?.creditBalance ?? 0;

    if (balance <= 0) {
      return { success: false, error: "Insufficient credits to start real-time swap. Please top up your wallet." };
    }

    const session = this.getOrCreateSession(streamKey, targetUserId, userName);
    session.burnRatePerSecond = 1;
    session.isLive = true;
    session.personaId = personaId;
    session.startedAt = Date.now();
    session.lastHeartbeat = Date.now();
    session.secondsElapsed = 0;
    session.creditsSpentThisSession = 0;
    return { success: true, session };
  },

  stopStream(streamKey: string): StreamSession | null {
    const session = globalStore._lumifySessions!.get(streamKey);
    if (session) {
      session.isLive = false;
    }
    return session || null;
  },

  processHeartbeat(
    streamKey: string,
    secondsElapsed: number = 2
  ): {
    isLive: boolean;
    balance: number;
    creditsDeducted: number;
    burnedOut: boolean;
  } {
    const session = globalStore._lumifySessions!.get(streamKey);
    if (!session || !session.isLive) {
      const user = userStore.getUserById(session?.userId || "usr_alex_02");
      return {
        isLive: false,
        balance: user?.creditBalance ?? 0,
        creditsDeducted: 0,
        burnedOut: false,
      };
    }

    session.burnRatePerSecond = 1;
    const creditsToDeduct = session.burnRatePerSecond * secondsElapsed;
    const { success, newBalance } = this.deductCredits(creditsToDeduct, session.userId);

    session.lastHeartbeat = Date.now();
    session.creditsSpentThisSession += creditsToDeduct;
    session.secondsElapsed += secondsElapsed;
    userStore.recordStreamTime(session.userId, secondsElapsed);

    if (!success || newBalance <= 0) {
      session.isLive = false;
      return {
        isLive: false,
        balance: 0,
        creditsDeducted: creditsToDeduct,
        burnedOut: true,
      };
    }

    return {
      isLive: true,
      balance: newBalance,
      creditsDeducted: creditsToDeduct,
      burnedOut: false,
    };
  },

  getActiveSessions(): StreamSession[] {
    const sessions: StreamSession[] = [];
    const now = Date.now();
    for (const session of globalStore._lumifySessions!.values()) {
      // If no heartbeat for > 15 seconds, consider inactive
      if (session.isLive && now - session.lastHeartbeat < 15000) {
        sessions.push(session);
      } else if (session.isLive && now - session.lastHeartbeat >= 15000) {
        session.isLive = false;
      }
    }
    return sessions;
  },

  terminateSession(streamKey: string): boolean {
    const session = globalStore._lumifySessions!.get(streamKey);
    if (session) {
      session.isLive = false;
      return true;
    }
    return false;
  },
};
