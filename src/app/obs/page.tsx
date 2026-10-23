"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Radio,
  AlertCircle,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  SwitchCamera,
  Volume2,
  Lock,
  Wifi,
  Signal,
  ChevronLeft,
  UserPlus,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
} from "lucide-react";
import { StreamBroadcastPayload, StreamViewMode } from "@/lib/videoEngine";

function ObsContent() {
  const searchParams = useSearchParams();
  const streamKey = searchParams.get("key") || "sage_live_default";
  const initialView = (searchParams.get("view") as StreamViewMode) || "desktop";
  const initialName = searchParams.get("name") || "Mom";
  const initialHud = searchParams.get("hud") !== "0";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [viewMode, setViewMode] = useState<StreamViewMode>(initialView);
  const [callerName, setCallerName] = useState(initialName);
  const [fps, setFps] = useState(0);
  const [personaId, setPersonaId] = useState("sage-neural");
  const [burnedOut, setBurnedOut] = useState(false);
  const [showHud, setShowHud] = useState(initialHud);
  const [callDuration, setCallDuration] = useState(0);
  const [clockTime, setClockTime] = useState("12:45");
  const [isMutedLocal, setIsMutedLocal] = useState(false);
  const [isCamOffLocal, setIsCamOffLocal] = useState(false);
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);

  const lastFrameTimeRef = useRef<number>(0);
  const latestImgRef = useRef<HTMLImageElement | null>(null);

  // Update digital clock for Android status bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setClockTime(`${hours}:${minutes}`);
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 10000);
    return () => clearInterval(clockTimer);
  }, []);

  // Update call duration timer when live
  useEffect(() => {
    if (!isLive) {
      setCallDuration(0);
      return;
    }
    const durationTimer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(durationTimer);
  }, [isLive]);

  // Format seconds to mm:ss
  const formatCallTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const drawFrame = useCallback((frameDataUrl: string) => {
    if (!latestImgRef.current) {
      latestImgRef.current = new Image();
    }
    const img = latestImgRef.current;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = frameDataUrl;
    lastFrameTimeRef.current = Date.now();
  }, []);

  // Dual frame reception: BroadcastChannel (low latency in-browser) + HTTP fallback (/api/session/frame for OBS CEF)
  useEffect(() => {
    const channel = new BroadcastChannel("sage_stream_channel");

    channel.onmessage = (event: MessageEvent<StreamBroadcastPayload>) => {
      const data = event.data;
      if (data.streamKey !== streamKey && streamKey !== "sage_live_default") return;

      if (data.type === "FRAME_DATA" && data.frameDataUrl) {
        setIsCameraActive(true);
        if (data.isLive) {
          setIsLive(true);
          setBurnedOut(false);
        }
        if (data.personaId) setPersonaId(data.personaId);
        if (data.fps) setFps(data.fps);
        if (data.viewMode && !searchParams.get("view")) {
          setViewMode(data.viewMode);
        }
        if (data.callerName && !searchParams.get("name")) {
          setCallerName(data.callerName);
        }

        drawFrame(data.frameDataUrl);
      } else if (data.type === "STREAM_END") {
        setIsLive(false);
      }
    };

    // Polling fallback for OBS Studio CEF browser source (cross-process)
    const pollServerFrame = async () => {
      // If we haven't received a BroadcastChannel message in the last 250ms, poll the server frame buffer
      if (Date.now() - lastFrameTimeRef.current > 250) {
        try {
          const res = await fetch(`/api/session/frame?key=${encodeURIComponent(streamKey)}`);
          if (res.ok) {
            const data: StreamBroadcastPayload = await res.json();
            if (data.frameDataUrl) {
              setIsCameraActive(true);
              if (data.isLive) {
                setIsLive(true);
                setBurnedOut(false);
              }
              if (data.personaId) setPersonaId(data.personaId);
              if (data.fps) setFps(data.fps);
              if (data.viewMode && !searchParams.get("view")) {
                setViewMode(data.viewMode);
              }
              if (data.callerName && !searchParams.get("name")) {
                setCallerName(data.callerName);
              }
              drawFrame(data.frameDataUrl);
            }
          }
        } catch {
          // Ignore network glitch
        }
      }
    };

    const framePollInterval = setInterval(pollServerFrame, 120);

    // Periodic check for balance burnout
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/session/obs?key=${encodeURIComponent(streamKey)}`);
        const json = await res.json();
        if (json.balance <= 0) {
          setBurnedOut(true);
          setIsLive(false);
        }
      } catch {
        // Ignore
      }
    };

    const statusInterval = setInterval(checkStatus, 3000);

    return () => {
      channel.close();
      clearInterval(framePollInterval);
      clearInterval(statusInterval);
    };
  }, [streamKey, searchParams, drawFrame]);

  // Is this an Android mobile layout?
  const isAndroidView =
    viewMode === "android_whatsapp" ||
    viewMode === "android_telegram" ||
    viewMode === "android_clean";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center select-none font-sans">
      {/* Blurred Ambient Video Background for mobile aspect ratio */}
      {isAndroidView && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 blur-3xl scale-125">
          <canvas
            ref={(node) => {
              // Mirror main canvas onto ambient blur background
              if (node && canvasRef.current) {
                const ctx = node.getContext("2d");
                if (ctx) ctx.drawImage(canvasRef.current, 0, 0, node.width, node.height);
              }
            }}
            width={320}
            height={180}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Container: Full screen for desktop, or authentic 9:16 Android Phone for mobile */}
      <div
        className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
          isAndroidView
            ? "w-full max-w-[440px] h-full max-h-[920px] aspect-[9/16] bg-zinc-950 sm:rounded-[36px] sm:shadow-2xl sm:shadow-cyan-950/40 sm:border-[8px] sm:border-zinc-900"
            : "w-full h-full"
        }`}
      >
        {/* Real-time Video Stream Canvas */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className={`w-full h-full object-cover ${
            isCameraActive || isLive ? "block" : "hidden"
          }`}
        />

        {/* STANDBY SCREEN: Displayed when creator's camera is NOT running */}
        {!isCameraActive && !isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07070b] text-white p-6 z-10">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px] shadow-2xl shadow-blue-500/20 mb-4 animate-pulse">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#0c0c14]">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            {burnedOut ? (
              <div className="text-center max-w-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20 mb-2">
                  <AlertCircle className="h-3.5 w-3.5" /> Credits Depleted
                </div>
                <h1 className="text-lg font-bold text-white tracking-wide">STREAM PAUSED</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Please top up your stream credits in the Sage Creator Studio to resume this live broadcast.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300 mb-2">
                  <Radio className="h-3.5 w-3.5 text-blue-400 animate-ping" />
                  OBS STANDBY MODE
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white font-mono">SAGE AI STREAM</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Waiting for creator to start stream or turn on camera in Sage Studio...
                </p>
                <div className="mt-4 text-[10px] text-zinc-400 font-mono bg-[#111118] px-3.5 py-1.5 rounded-lg border border-white/[0.08] inline-block">
                  Stream Key: {streamKey}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANDROID OVERLAYS (Status Bar, WhatsApp HUD, Telegram HUD, Navigation Bar) */}
        {(isCameraActive || isLive) && isAndroidView && showHud && (
          <>
            {/* 1. AUTHENTIC ANDROID STATUS BAR (Top) */}
            <div className="absolute top-0 inset-x-0 h-8 px-4 flex items-center justify-between z-30 pointer-events-none select-none text-white drop-shadow-md">
              {/* Left: Time and Notification Icon */}
              <div className="flex items-center gap-2 text-xs font-semibold tracking-tight">
                <span>{clockTime}</span>
                {viewMode === "android_whatsapp" && (
                  <span className="text-[10px] bg-emerald-500/80 text-white rounded-full px-1 font-mono font-bold">
                    WA
                  </span>
                )}
                {viewMode === "android_telegram" && (
                  <span className="text-[10px] bg-sky-500/80 text-white rounded-full px-1 font-mono font-bold">
                    TG
                  </span>
                )}
              </div>

              {/* Right: Network Signals and Battery */}
              <div className="flex items-center gap-2 text-xs">
                <Signal className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">5G</span>
                <Wifi className="h-3.5 w-3.5" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold font-mono">89%</span>
                  <div className="h-2.5 w-5 rounded-xs border border-white/80 p-0.5 flex items-center">
                    <div className="h-full w-3.5 bg-white rounded-2xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. WHATSAPP ANDROID VIDEO CALL HUD */}
            {viewMode === "android_whatsapp" && (
              <div className="absolute inset-0 flex flex-col justify-between z-20 pointer-events-auto">
                {/* WhatsApp Top Header */}
                <div className="pt-8 pb-12 px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className="p-1 rounded-full text-white/90 hover:text-white"
                      title="Back"
                    >
                      <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                    </button>
                    <div>
                      <h2 className="text-base font-semibold text-white tracking-tight leading-tight flex items-center gap-1.5">
                        {callerName}
                      </h2>
                      <p className="text-[11px] text-white/70 flex items-center gap-1 font-sans">
                        <Lock className="h-2.5 w-2.5" />
                        {isLive ? `WhatsApp Video (${formatCallTime(callDuration)})` : "WhatsApp Video Call"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-white/90">
                    <button className="p-1.5 rounded-full hover:bg-white/10" title="Add participant">
                      <UserPlus className="h-5 w-5" />
                    </button>
                    <button className="p-1.5 rounded-full hover:bg-white/10" title="Switch camera">
                      <SwitchCamera className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* WhatsApp Self-View Picture-in-Picture (PiP) Tile */}
                <div className="absolute right-4 top-24 w-24 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-zinc-900/90 z-20 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="h-10 w-10 rounded-full bg-emerald-700/80 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {callerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[9px] text-white/80 font-medium mt-1.5 z-10">You</span>
                </div>

                {/* WhatsApp Bottom Floating Controls Dock */}
                <div className="pb-8 px-4 flex flex-col items-center gap-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-12">
                  <div className="w-full max-w-[340px] bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full py-2.5 px-5 flex items-center justify-between shadow-2xl">
                    <button
                      onClick={() => setIsMutedLocal(!isMutedLocal)}
                      className={`p-3 rounded-full transition-all ${
                        isMutedLocal
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                      title={isMutedLocal ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMutedLocal ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => setIsCamOffLocal(!isCamOffLocal)}
                      className={`p-3 rounded-full transition-all ${
                        isCamOffLocal
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                      title={isCamOffLocal ? "Turn On Video" : "Turn Off Video"}
                    >
                      {isCamOffLocal ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </button>

                    <button
                      className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="h-5 w-5" />
                    </button>

                    {/* WhatsApp Big Red End Call Button */}
                    <button
                      className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform"
                      title="End WhatsApp Call"
                    >
                      <PhoneOff className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TELEGRAM ANDROID VIDEO CALL HUD */}
            {viewMode === "android_telegram" && (
              <div className="absolute inset-0 flex flex-col justify-between z-20 pointer-events-auto">
                {/* Telegram Top Header */}
                <div className="pt-8 pb-12 px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <button className="p-1 rounded-full text-white/90 hover:text-white" title="Back">
                      <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                    </button>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                        {callerName}
                      </h2>
                      <p className="text-[11px] text-emerald-400 font-mono font-medium">
                        {isLive ? formatCallTime(callDuration) : "Telegram Call · Ready"}
                      </p>
                    </div>
                  </div>

                  {/* Signature Telegram 4 Encryption Verification Emojis */}
                  <div
                    className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-sm shadow-sm"
                    title="Telegram End-to-End Encryption Verification Key"
                  >
                    <span>🍓</span>
                    <span>🥑</span>
                    <span>🍋</span>
                    <span>🍇</span>
                  </div>
                </div>

                {/* Telegram Bottom Floating Action Buttons */}
                <div className="pb-8 px-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-12">
                  <div className="flex items-center justify-center gap-5 w-full">
                    <button
                      onClick={() => setIsMutedLocal(!isMutedLocal)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        isMutedLocal
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-black/50 backdrop-blur-lg text-white border border-white/15 hover:bg-white/20"
                      }`}
                      title={isMutedLocal ? "Unmute" : "Mute"}
                    >
                      {isMutedLocal ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => setIsCamOffLocal(!isCamOffLocal)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        isCamOffLocal
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-black/50 backdrop-blur-lg text-white border border-white/15 hover:bg-white/20"
                      }`}
                      title={isCamOffLocal ? "Turn on Camera" : "Turn off Camera"}
                    >
                      {isCamOffLocal ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </button>

                    <button
                      className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-lg text-white border border-white/15 hover:bg-white/20 flex items-center justify-center transition-all"
                      title="Speaker"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>

                    <button
                      className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-lg text-white border border-white/15 hover:bg-white/20 flex items-center justify-center transition-all"
                      title="Flip Camera"
                    >
                      <SwitchCamera className="h-5 w-5" />
                    </button>

                    {/* Telegram Red End Call Button */}
                    <button
                      className="h-12 w-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-transform"
                      title="End Telegram Call"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Android 14 System Navigation Gesture Pill (Bottom) */}
            <div className="absolute bottom-1.5 inset-x-0 flex justify-center z-30 pointer-events-none">
              <div className="h-1 w-32 bg-white/70 rounded-full" />
            </div>
          </>
        )}

        {/* Live Status / Preview Watermark Badge (when not in full HUD) */}
        {(isCameraActive || isLive) && (
          <div className="absolute top-3 right-3 z-40 opacity-50 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-zinc-200">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isLive ? "bg-rose-500 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span>{isLive ? `LIVE ${formatCallTime(callDuration)}` : "PREVIEW"}</span>
              <span className="text-zinc-500">·</span>
              <span>{fps > 0 ? `${fps} FPS` : "60 FPS"}</span>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING OUTPUT CONTROLS & VIEW SWITCHER (Hover pill at bottom-right) */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {showModeSwitcher && (
          <div className="flex items-center gap-1.5 bg-zinc-900/95 backdrop-blur-xl border border-white/15 p-1.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* View Mode Buttons */}
            <button
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "desktop"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop (16:9)
            </button>

            <button
              onClick={() => setViewMode("android_whatsapp")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "android_whatsapp"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> WhatsApp Call
            </button>

            <button
              onClick={() => setViewMode("android_telegram")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "android_telegram"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Telegram Call
            </button>

            <button
              onClick={() => setViewMode("android_clean")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "android_clean"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Clean 9:16
            </button>

            {/* Toggle HUD Overlays on/off */}
            {isAndroidView && (
              <button
                onClick={() => setShowHud(!showHud)}
                className={`p-1.5 rounded-xl text-xs transition-colors ${
                  showHud ? "bg-white/15 text-white" : "text-zinc-400 hover:bg-white/10"
                }`}
                title={showHud ? "Hide HUD Overlays" : "Show HUD Overlays"}
              >
                {showHud ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}

        {/* Toggle View Menu Pill */}
        <button
          onClick={() => setShowModeSwitcher(!showModeSwitcher)}
          className="h-10 w-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/15 flex items-center justify-center shadow-xl backdrop-blur-md transition-all cursor-pointer"
          title="Switch Output View (Desktop / Android WhatsApp / Telegram)"
        >
          <Smartphone className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ObsBrowserSourcePage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#07070b] flex items-center justify-center text-zinc-400 text-xs font-mono">
          Loading Sage AI Stream Output...
        </div>
      }
    >
      <ObsContent />
    </Suspense>
  );
}
