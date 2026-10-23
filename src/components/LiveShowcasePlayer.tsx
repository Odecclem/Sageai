"use client";

import { useRef, useState, useEffect } from "react";
import { Radio, Eye, Layers, ArrowRight, Video } from "lucide-react";
import Link from "next/link";

export function LiveShowcasePlayer() {
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const aiVideoRef = useRef<HTMLVideoElement | null>(null);

  const [viewMode, setViewMode] = useState<"side-by-side" | "split" | "ai-only">("side-by-side");
  const [splitPos, setSplitPos] = useState(50); // percentage 0-100

  // Sync playback between camera video and AI video
  useEffect(() => {
    const cam = cameraVideoRef.current;
    const ai = aiVideoRef.current;
    if (!cam || !ai) return;

    const handleTimeUpdate = () => {
      // Keep within 0.15s sync
      if (Math.abs(cam.currentTime - ai.currentTime) > 0.15) {
        ai.currentTime = cam.currentTime;
      }
    };

    cam.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      cam.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 pl-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
          </div>
          <span className="ml-2 text-xs font-semibold text-slate-700 font-mono tracking-wide flex items-center gap-2">
            <span>SAGE AI ENGINE</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 font-bold">REAL-TIME TRANSFORMATION PREVIEW</span>
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setViewMode("side-by-side")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "side-by-side"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode("ai-only")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "ai-only"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-blue-600" />
            <span>AI Stream Only</span>
          </button>
        </div>
      </div>

      {/* Video Viewport Area */}
      {viewMode === "side-by-side" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Left: Input Webcam Stream */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-200 shadow-inner group">
            <video
              ref={cameraVideoRef}
              src="/videos/demo_input.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Overlay badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono font-medium text-slate-200 border border-white/10">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> RAW INPUT CAM
              </span>
            </div>
            <div className="absolute bottom-3 left-3 text-[10px] text-slate-300 font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
              Standard 720p Laptop Webcam
            </div>
          </div>

          {/* Right: Real-time Transformed AI Output */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-blue-500/30 shadow-inner group">
            <video
              ref={aiVideoRef}
              src="/videos/demo_output.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-blue-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono font-semibold text-white shadow-sm">
                <span className="h-2 w-2 rounded-full bg-white" /> AI OUTPUT (LIVE)
              </span>
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
              60 FPS · SUB-SECOND
            </div>
            <div className="absolute bottom-3 left-3 text-[10px] text-white font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
              Persona: Anime Shonen (Live Mesh)
            </div>
          </div>
        </div>
      )}

      {viewMode === "split" && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-200 shadow-inner select-none">
          {/* Base Layer: AI Transformed Video */}
          <video
            ref={aiVideoRef}
            src="/videos/demo_output.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Top Layer: Raw Cam Video (Clipped by split percentage) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${splitPos}%` }}
          >
            <video
              ref={cameraVideoRef}
              src="/videos/demo_input.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Vertical Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] cursor-ew-resize z-20"
            style={{ left: `${splitPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center text-[10px] font-bold">
              ↔
            </div>
          </div>

          {/* Interactive Range Input Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={(e) => setSplitPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />

          {/* Labels */}
          <div className="absolute bottom-3 left-3 text-[11px] font-mono font-bold bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-md z-10">
            RAW CAMERA ({splitPos}%)
          </div>
          <div className="absolute bottom-3 right-3 text-[11px] font-mono font-bold bg-blue-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-md z-10">
            AI OUTPUT ({100 - splitPos}%)
          </div>
        </div>
      )}

      {viewMode === "ai-only" && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-blue-500/30 shadow-inner">
          <video
            ref={aiVideoRef}
            src="/videos/demo_output.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-mono font-bold text-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-white" /> AI BROADCAST
            </span>
            <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
              60 FPS · 1080p
            </span>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 pt-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-blue-600" />
          <span>Real-time reenactment · Facial mesh tracking · Sub-100ms WebRTC pipeline</span>
        </div>

        <Link
          href="/studio"
          className="flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <span>Try with your own webcam in Studio</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
