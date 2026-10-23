# Sage AI — Real-Time AI Persona Streaming Platform

A white-label, real-time AI video transformation platform built for live streamers (OBS Studio, Twitch, YouTube, Kick, TikTok, WhatsApp video calls) with a pay-as-you-stream credit billing engine and centralized administrator key management.

---

## 🚀 Live Demo & Quick Start

The application is currently running live at:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Creator Studio**: [http://localhost:3000/studio](http://localhost:3000/studio)
- **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin) *(Sign in as admin)*
- **User Registration**: [http://localhost:3000/register](http://localhost:3000/register)
- **Sign In**: [http://localhost:3000/login](http://localhost:3000/login) *(Includes 1-click Demo buttons)*
- **OBS Browser Source**: [http://localhost:3000/obs?key=sage_live_89d83](http://localhost:3000/obs?key=sage_live_89d83)
- **Credit Packs & Pricing**: [http://localhost:3000/pricing](http://localhost:3000/pricing)

To launch the dev server anytime:
```bash
cd C:\Users\odec\.gemini\antigravity\scratch\lumify-retailer
npm run dev
```

---

## 🔑 Pre-Seeded Accounts

| Role | Email | Password | Starting Credits | Access |
|---|---|---|---|---|
| **Master Administrator** | `admin@sage.ai` | `admin123` | 25,000 | Full `/admin` Portal + Studio |
| **Creator Streamer** | `alex@creator.tv` | `password123` | 0 | Studio + OBS Broadcast |

*Tip: The `/login` page includes 1-click quick-login buttons to immediately sign in as Admin or Creator without typing.*

---

## 🌟 Core Features

### 1. 🛡️ Centralized Admin Control Center (`/admin`)
- **Master XMax API Key**: Configured once by the administrator for the whole platform. All users automatically share this key for real-time video generation (`@xmaxai/sdk-global`). Normal creators are **never** asked to enter or purchase API keys.
- **Upstream Credit Monitoring**: Live inspection of XMax remaining credit balance, STS token verification, and RTC connection health.
- **User Management**:
  - View registered accounts, registration dates, and streaming time.
  - Create new accounts directly with custom initial credits and roles.
  - Add / Adjust credits for any creator (`+500`, `+1,000`, `+5,000`, or custom amount).
  - Promote or demote user roles (`admin` <-> `user`).
  - Delete user accounts.
- **Live Stream Monitor**: Real-time dashboard showing all active broadcasts, stream keys, elapsed time, and burn rates, with remote force-termination capability.
- **Platform Analytics**: Total users, total credits in wallets, total hours streamed, and upstream cloud balance.

### 2. 👤 User Registration & Authentication (`/register`, `/login`)
- Anyone can create an account in seconds.
- PBKDF2 crypto-salted password hashing with timing-safe validation.
- Persistent session tokens stored in secure HTTP-only cookies (`sage_session_token`).
- Dynamic navigation bar reflecting user avatar, balance, and role-based links.

### 3. 🎨 Sage AI Creator Studio (`/studio`)
- **6 Built-in Personas**: Anime Shonen, Cyberpunk 2099, 3D Pixar Avatar, Cinematic Noir, Retro Synthwave, Studio Hyper-Polish.
- **Real-Time Character Swapping**: Upload any reference photo to transform your face and clothing in real-time.
- **Default Prompt**: Automatically locks to `视频中角色替换成参考图中角色` for seamless XMax character swapping.
- **Black-Screen Connecting Animation**: High-tech connecting state with glowing particles while establishing WebRTC RTC room.
- **OBS Studio Output**: Clean 60 FPS borderless canvas at `/obs?key=[STREAM_KEY]`.

### 4. ⚡ Pay-As-You-Stream Credit Engine
- Active stream heartbeat meters **1 credit per second** (60 credits/minute).
- Real-time countdown timer showing remaining hours, minutes, and seconds, plus time used.
- Auto-stops the broadcast when wallet balance reaches zero.
- Interactive credit top-up modal supporting instant replenishment.

---

## 🎥 Connecting to OBS Studio

1. Open **OBS Studio**.
2. Under **Sources**, click **+** and select **Browser**.
3. Name it `Sage AI Persona`.
4. In the **URL** field, paste:
   ```
   http://localhost:3000/obs?key=sage_live_89d83
   ```
5. Set:
   - **Width**: `1920` (or `1280`)
   - **Height**: `1080` (or `720`)
   - **FPS**: `60`
6. Click **OK**.
7. In your Creator Studio, click **Start Streaming** — your persona will immediately broadcast directly inside OBS!
