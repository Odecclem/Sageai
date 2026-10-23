"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Radio, AlertCircle } from "lucide-react";
import { StreamBroadcastPayload } from "@/lib/videoEngine";

function ObsContent() {
  const searchParams = useSearchParams();
  const streamKey = searchParams.get("key") || "sage_live_default";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [personaId, setPersonaId] = useState("anime-shonen");
  const [fps, setFps] = useState(0);
  const [burnedOut, setBurnedOut] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel("sage_stream_channel");
    const img = new Image();

    channel.onmessage = (event: MessageEvent<StreamBroadcastPayload>) => {
      const data = event.data;
      if (data.streamKey !== streamKey && streamKey !== "sage_live_default") return;

      if (data.type === "FRAME_DATA" && data.frameDataUrl) {
        setIsLive(true);
        setBurnedOut(false);
        setPersonaId(data.personaId);
        setFps(data.fps);

        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = data.frameDataUrl;
      } else if (data.type === "STREAM_END") {
        setIsLive(false);
      }
    };

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
      clearInterval(statusInterval);
    };
  }, [streamKey]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent flex items-center justify-center select-none font-sans">
      {/* OBS Clean Canvas Output */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`w-full h-full object-contain ${isLive ? "block" : "hidden"}`}
      />

      {/* Standby screen when stream is NOT broadcasting */}
      {!isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6">
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
              <p className="text-xs text-zinc-400 mt-1">Waiting for creator to start stream from Sage Studio...</p>
              <div className="mt-4 text-[10px] text-zinc-400 font-mono bg-[#111118] px-3.5 py-1.5 rounded-lg border border-white/[0.08] inline-block">
                Stream Key: {streamKey}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discreet OBS watermark indicator */}
      {isLive && (
        <div className="absolute bottom-3 right-4 opacity-40 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {fps > 0 ? `${fps} FPS` : "LIVE"} · {personaId}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ObsBrowserSourcePage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center text-zinc-400 text-xs font-mono">
          Loading OBS Stream...
        </div>
      }
    >
      <ObsContent />
    </Suspense>
  );
}
