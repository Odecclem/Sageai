"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useId } from "react";
import { Navbar } from "@/components/Navbar";
import { TopUpModal } from "@/components/TopUpModal";
import { PERSONA_PRESETS, Persona, SAMPLE_CHARACTERS } from "@/lib/store";
import { VideoTransformationEngine, FilterType, StreamViewMode } from "@/lib/videoEngine";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Radio,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Settings,
  AlertTriangle,
  ExternalLink,
  Zap,
  Info,
  Upload,
  X,
  User,
  PhoneCall,
  Maximize2,
  HelpCircle,
  ShieldCheck,
  Flame,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Hourglass,
  Clock,
  Timer,
  Lock,
  LogIn,
  UserPlus,
  UserCheck,
  ArrowRight,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getXmaxManager, DEFAULT_XMAX_REF_IMAGE_PROMPT } from "@/lib/xmaxClient";

export default function CreatorStudioPage() {
  const fileInputId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<VideoTransformationEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONA_PRESETS[0]);
  const [intensity, setIntensity] = useState(0.85);
  const [customPrompt, setCustomPrompt] = useState("");

  // Custom Character Image State
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string | null>(null);
  const [micVolume, setMicVolume] = useState(0);

  // Prank Guide Modal & Tabs
  const [isPrankGuideOpen, setIsPrankGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"personas" | "characters">("personas");

  const [streamKey, setStreamKey] = useState("sage_live_89d83");
  const [copiedObs, setCopiedObs] = useState(false);
  const [viewMode, setViewMode] = useState<StreamViewMode>("desktop");
  const [callerName, setCallerName] = useState("Mom");
  const [showObsInstructions, setShowObsInstructions] = useState(false);

  // Metering & Wallet
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string; creditBalance: number } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggingInDemo, setLoggingInDemo] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamStartBalance, setStreamStartBalance] = useState<number>(0);
  const [fps, setFps] = useState(60);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upstream settings modal & Provider
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [provider, setProvider] = useState<"local" | "xmax" | "fal">("local");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [falStatus, setFalStatus] = useState<{
    configured: boolean;
    valid?: boolean;
    userName?: string;
    email?: string;
    isLocked?: boolean;
    lockReason?: string;
  } | null>(null);

  // XMax AI Cloud State
  const [xmaxStatus, setXmaxStatus] = useState<{
    configured: boolean;
    valid?: boolean;
    apiKey?: string;
    actualApiKey?: string;
    maskedKey?: string;
    remainingCredits?: number | null;
    balance?: number | null;
    userId?: string | null;
    error?: string;
  } | null>(null);
  const [showStudioKey, setShowStudioKey] = useState(false);
  const [copiedStudioKey, setCopiedStudioKey] = useState(false);
  const [xmaxKeyInput, setXmaxKeyInput] = useState("");
  const [activeXmaxKey, setActiveXmaxKey] = useState<string>("");
  const [isSavingXmaxKey, setIsSavingXmaxKey] = useState(false);
  const [xmaxSessionState, setXmaxSessionState] = useState<string>("idle");

  const [isPendingStream, setIsPendingStream] = useState(false);
  const isPendingStreamRef = useRef(false);
  const isLiveRef = useRef(false);
  const isCameraActiveRef = useRef(false);
  const isExplicitlyStoppedRef = useRef(false);
  const creditBalanceRef = useRef(creditBalance);
  const startLiveStreamRef = useRef<(balanceOverride?: number) => Promise<boolean>>(async () => false);
  const stopLiveStreamRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    isCameraActiveRef.current = isCameraActive;
  }, [isCameraActive]);

  useEffect(() => {
    isPendingStreamRef.current = isPendingStream;
  }, [isPendingStream]);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    creditBalanceRef.current = creditBalance;
  }, [creditBalance]);

  const fetchXmaxStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/xmax/status");
      const data = await res.json();
      setXmaxStatus(data);
      if (data.configured && data.valid) {
        setProvider("xmax");
        const keyToUse = data.actualApiKey || data.apiKey;
        if (keyToUse) {
          setActiveXmaxKey(keyToUse);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchXmaxStatus();
  }, [fetchXmaxStatus]);

  useEffect(() => {
    fetch("/api/fal/status")
      .then((res) => res.json())
      .then((data) => setFalStatus(data))
      .catch(() => {});
  }, []);

  // Connect to XMax Cloud Realtime WebRTC
  const connectXmaxRealtime = useCallback(async (keyOverride?: string) => {
    if (!engineRef.current) return;
    const stream = engineRef.current.getStream();
    if (!stream) return;

    const keyToUse = keyOverride || activeXmaxKey || process.env.NEXT_PUBLIC_XMAX_API_KEY;
    if (!keyToUse) {
      setErrorMessage("Neural Stream engine is currently initializing. Live feed will use the Built-in Neural Cam.");
      setProvider("local");
      return;
    }

    try {
      setXmaxSessionState("connecting");
      engineRef.current?.setCloudConnecting(true, "Connecting Real-time Swap...");
      const xmax = getXmaxManager();
      const defaultPrompt = customImageSrc
        ? DEFAULT_XMAX_REF_IMAGE_PROMPT
        : (currentPersona.description || "photorealistic portrait");

      await xmax.connect({
        stream,
        apiKey: keyToUse,
        prompt: customPrompt.trim() || defaultPrompt,
        refImageUrl: customImageSrc || null,
        onRemoteStream: () => {
          // Note: WebRTC remote tracks bound; do NOT mark streaming or deduct credits here.
          // Credits only start once the XMax GPU starts delivering actual video frames.
          console.log("Sage AI: XMax remote WebRTC media tracks bound.");
          engineRef.current?.setRemoteVideo(xmax.getRemoteVideoElement());
        },
        onFirstFrame: () => {
          if (isExplicitlyStoppedRef.current) {
            console.log("Sage AI: First frame arrived after user stopped. Ignoring.");
            return;
          }
          console.log("Sage AI: XMax remote first frame arrived from GPU inference! Starting credit countdown now.");
          engineRef.current?.setRemoteVideo(xmax.getRemoteVideoElement());
          engineRef.current?.setCloudConnecting(false);
          setXmaxSessionState("streaming");

          if (isPendingStreamRef.current && !isLiveRef.current) {
            console.log("Sage AI: Starting live credit countdown in exact lockstep with XMax GPU!");
            startLiveStreamRef.current(creditBalanceRef.current);
          }
        },
        onStateChange: (state) => {
          if (isExplicitlyStoppedRef.current) return;
          console.log("Sage AI: XMax session state changed:", state);
          setXmaxSessionState(state);
          if (state === "streaming") {
            engineRef.current?.setCloudConnecting(false);
          } else if (state === "connecting") {
            engineRef.current?.setCloudConnecting(true, "Connecting Real-time Swap...");
          } else if (state === "disconnected") {
            engineRef.current?.setCloudConnecting(false);
            if (isLiveRef.current) {
              console.warn("Sage AI: XMax disconnected while live, pausing credit meter");
            }
          }
        },
        onError: (err) => {
          if (isExplicitlyStoppedRef.current) return;
          console.warn("Neural Stream error note:", err);

          // 1. Immediately fall back to built-in local engine so video feed NEVER freezes, drops, or dies
          engineRef.current?.setRemoteVideo(null);
          engineRef.current?.setCloudConnecting(false);

          const errStr = typeof err === "string" ? err : String(err || "");
          const isInterrupted =
            errStr.includes("interrupted") ||
            errStr.includes("stalled") ||
            errStr.includes("overloaded") ||
            errStr.includes("Network connection failed");

          // 2. If it is an intermittent WebRTC interruption, keep local swap active and attempt auto-reconnect in background
          if (isInterrupted && isCameraActiveRef.current && !isExplicitlyStoppedRef.current) {
            console.log("Sage AI: Intermittent WebRTC notice detected. Live swap smoothly maintained by local engine. Auto-reconnecting in background...");
            setXmaxSessionState("connecting");
            setTimeout(() => {
              if (isCameraActiveRef.current && !isExplicitlyStoppedRef.current) {
                connectXmaxRealtime();
              }
            }, 1800);
          } else {
            setErrorMessage(`Neural Stream notice: ${errStr}`);
            setXmaxSessionState("error");
            setIsPendingStream(false);
            isPendingStreamRef.current = false;
          }
        },
      });
    } catch (err: unknown) {
      if (isExplicitlyStoppedRef.current) return;
      const msg = err instanceof Error ? err.message : "Failed to connect to Neural Cloud Engine";
      console.warn("Neural Stream connect note:", msg);
      engineRef.current?.setRemoteVideo(null);
      engineRef.current?.setCloudConnecting(false);
      setXmaxSessionState("error");
      setIsPendingStream(false);
      isPendingStreamRef.current = false;
    }
  }, [customImageSrc, customPrompt, currentPersona.description, activeXmaxKey]);

  const handleSaveXmaxKey = async (key: string) => {
    if (!key.trim()) return;
    setIsSavingXmaxKey(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/xmax/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setXmaxStatus({ configured: true, valid: true, apiKey: data.maskedKey });
        setProvider("xmax");
        setXmaxKeyInput("");
        setIsSettingsOpen(false);
        if (isCameraActive) {
          connectXmaxRealtime(key.trim());
        }
      } else {
        setErrorMessage(data.error || "Failed to verify Neural Engine key");
      }
    } catch {
      setErrorMessage("Network error while verifying Neural Engine key");
    } finally {
      setIsSavingXmaxKey(false);
    }
  };

  const handleSwitchProvider = async (newProvider: "local" | "xmax" | "fal") => {
    setProvider(newProvider);
    if (newProvider === "xmax") {
      if (xmaxStatus?.valid) {
        if (isCameraActive) {
          connectXmaxRealtime();
        }
      } else {
        if (currentUser?.role === "admin") {
          setIsSettingsOpen(true);
        } else {
          setErrorMessage("Neural Stream engine is currently initializing. Please contact support.");
        }
      }
    } else {
      await getXmaxManager().disconnect();
      engineRef.current?.setRemoteVideo(null);
      setXmaxSessionState("idle");
      if (customImageSrc) {
        engineRef.current?.setCustomCharacterImage(customImageSrc);
      } else {
        engineRef.current?.setFilter(currentPersona.filterMode as FilterType, intensity, customPrompt);
      }
    }
  };

  // Initialize engine
  useEffect(() => {
    engineRef.current = new VideoTransformationEngine();
    return () => {
      engineRef.current?.stopCamera();
      getXmaxManager().disconnect();
    };
  }, []);

  // Fetch initial balance & current user
  const refreshUser = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authData.authenticated && authData.user) {
        setCurrentUser(authData.user);
        setCreditBalance(authData.user.creditBalance);
      } else {
        const res = await fetch("/api/user");
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setCreditBalance(data.user.creditBalance);
        } else {
          setCurrentUser(null);
          setCreditBalance(0);
        }
      }
    } catch {
      setCurrentUser(null);
      setCreditBalance(0);
    } finally {
      setAuthChecked(true);
    }
  };

  const quickLoginAsCreator = async () => {
    try {
      setLoggingInDemo(true);
      setErrorMessage(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alex@creator.tv", password: "password123" }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setCreditBalance(data.user.creditBalance);
      } else {
        setErrorMessage(data.error || "Failed to sign in as demo creator");
      }
    } catch {
      setErrorMessage("Network error during demo login");
    } finally {
      setLoggingInDemo(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Stop Live Real-time Swapping, Camera, and Metering
  const stopLiveStream = useCallback(async () => {
    isExplicitlyStoppedRef.current = true;
    isLiveRef.current = false;
    isPendingStreamRef.current = false;
    isCameraActiveRef.current = false;

    setIsLive(false);
    setIsPendingStream(false);
    setIsCameraActive(false);

    try {
      await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamKey, action: "stop" }),
      });
    } catch {
      // Ignore
    }

    // 1. Notify OBS stream channel that stream has ended
    engineRef.current?.broadcastStreamEnd(streamKey);

    // 2. Shut off camera hardware and clear video tracks
    engineRef.current?.stopCamera();

    // 3. Directly stop and release all tracks on local video element
    if (videoRef.current) {
      if (videoRef.current.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }

    // 4. Clear preview canvas completely
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // 5. Disconnect XMax AI neural stream and release all remote tracks
    await getXmaxManager().disconnect();
    engineRef.current?.setRemoteVideo(null);
    engineRef.current?.setCloudConnecting(false);
    setXmaxSessionState("idle");

    // 6. Reset stream duration
    setStreamDuration(0);
  }, [streamKey]);

  useEffect(() => {
    stopLiveStreamRef.current = stopLiveStream;
  }, [stopLiveStream]);

  const startLiveStream = useCallback(async (balanceOverride?: number) => {
    const bal = balanceOverride !== undefined ? balanceOverride : creditBalance;
    if (bal <= 0) {
      setErrorMessage("You have 0 credits remaining. Please top up your wallet to start real-time swap countdown metering.");
      setIsTopUpOpen(true);
      return false;
    }

    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamKey,
          personaId: customImageSrc ? "custom-character" : currentPersona.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to start swap session");
        if (res.status === 402) {
          setIsTopUpOpen(true);
        }
        return false;
      }

      setIsLive(true);
      isLiveRef.current = true;
      setIsPendingStream(false);
      isPendingStreamRef.current = false;
      setStreamStartBalance(bal);
      setStreamDuration(0);
      return true;
    } catch {
      setErrorMessage("Server connection error");
      return false;
    }
  }, [creditBalance, currentPersona.id, customImageSrc, streamKey]);

  useEffect(() => {
    startLiveStreamRef.current = startLiveStream;
  }, [startLiveStream]);

  // Start Live Real-time Swap: activates camera + connects AI face swap + starts countdown metering
  const requestStartLiveSwap = async () => {
    if (creditBalance <= 0) {
      setErrorMessage("0 credits remaining. Top up your wallet to activate real-time swap countdown metering.");
      setIsTopUpOpen(true);
      return;
    }

    isExplicitlyStoppedRef.current = false;
    setErrorMessage(null);

    // 1. Activate Camera hardware if not already active
    if (!isCameraActiveRef.current) {
      try {
        if (!engineRef.current || !videoRef.current || !canvasRef.current) return;
        await engineRef.current.startCamera(videoRef.current, canvasRef.current);
        setIsCameraActive(true);
        isCameraActiveRef.current = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to access webcam";
        setErrorMessage(`Camera error: ${msg}. Please allow webcam permission in your browser.`);
        return;
      }
    }

    // 2. Apply Custom Image or AI Persona filter
    if (customImageSrc) {
      engineRef.current?.setCustomCharacterImage(customImageSrc);
    } else {
      engineRef.current?.setFilter(currentPersona.filterMode as FilterType, intensity, customPrompt);
    }

    // 3. Connect Engine
    const keyToUse = activeXmaxKey || process.env.NEXT_PUBLIC_XMAX_API_KEY;
    if (provider === "xmax" && (xmaxStatus?.valid || keyToUse)) {
      const xmax = getXmaxManager();
      const isXmaxReady = xmaxSessionState === "streaming" && xmax.hasLiveFrames();

      if (isXmaxReady) {
        // Frames already streaming from XMax, immediately start live metering
        await startLiveStream();
      } else {
        // Put in pending state: credit countdown will ONLY start once XMax delivers 1st video frame
        setIsPendingStream(true);
        isPendingStreamRef.current = true;
        connectXmaxRealtime(keyToUse);
      }
    } else {
      // Local Built-in Neural Cam: starts live metering immediately
      await startLiveStream();
    }
  };

  // Camera toggle button (under video preview): syncs directly with live swap
  const toggleCamera = async () => {
    if (isCameraActive || isLive || isPendingStream) {
      await stopLiveStream();
    } else {
      await requestStartLiveSwap();
    }
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    engineRef.current?.setMuted(next);
  };

  // Change Persona Preset
  const handleSelectPersona = (persona: Persona) => {
    setCurrentPersona(persona);
    setCustomImageSrc(null);
    setCustomImageName(null);
    if (engineRef.current) {
      engineRef.current.setCustomCharacterImage(null);
      engineRef.current.setFilter(persona.filterMode as FilterType, intensity, customPrompt);
    }
  };

  // Handle Custom Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file (.png, .jpg, .webp)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomImageSrc(result);
      setCustomImageName(file.name);
      if (!customPrompt || customPrompt === currentPersona.description) {
        setCustomPrompt(DEFAULT_XMAX_REF_IMAGE_PROMPT);
      }
      if (provider !== "xmax" && engineRef.current) {
        engineRef.current.setCustomCharacterImage(result);
      }
      if (provider === "xmax" && isCameraActive) {
        if (xmaxSessionState !== "streaming") {
          connectXmaxRealtime();
        } else {
          engineRef.current?.setCloudConnecting(true, "Updating character swap...");
          getXmaxManager().updateContext(DEFAULT_XMAX_REF_IMAGE_PROMPT, result).then(() => {
            setTimeout(() => {
              engineRef.current?.setCloudConnecting(false);
            }, 800);
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Sample Character Selection
  const handleSelectSampleCharacter = (char: (typeof SAMPLE_CHARACTERS)[0]) => {
    setCustomImageSrc(char.imageUrl);
    setCustomImageName(char.name);
    if (!customPrompt || customPrompt === currentPersona.description) {
      setCustomPrompt(DEFAULT_XMAX_REF_IMAGE_PROMPT);
    }
    if (provider !== "xmax" && engineRef.current) {
      engineRef.current.setCustomCharacterImage(char.imageUrl);
    }
    if (provider === "xmax" && isCameraActive) {
      if (xmaxSessionState !== "streaming") {
        connectXmaxRealtime();
      } else {
        engineRef.current?.setCloudConnecting(true, "Updating character swap...");
        getXmaxManager().updateContext(DEFAULT_XMAX_REF_IMAGE_PROMPT, char.imageUrl).then(() => {
          setTimeout(() => {
            engineRef.current?.setCloudConnecting(false);
          }, 800);
        });
      }
    }
  };

  // Clear Custom Image
  const handleClearCustomImage = () => {
    setCustomImageSrc(null);
    setCustomImageName(null);
    if (customPrompt === DEFAULT_XMAX_REF_IMAGE_PROMPT) {
      setCustomPrompt("");
    }
    if (engineRef.current) {
      engineRef.current.setCustomCharacterImage(null);
      engineRef.current.setFilter(currentPersona.filterMode as FilterType, intensity, "");
    }
    if (provider === "xmax" && xmaxSessionState === "streaming") {
      getXmaxManager().updateContext(currentPersona.description || "photorealistic portrait", null);
    }
  };

  // Update Intensity, Prompt, or XMax context
  useEffect(() => {
    if (engineRef.current && !customImageSrc) {
      engineRef.current.setFilter(currentPersona.filterMode as FilterType, intensity, customPrompt);
    }
    if (provider === "xmax" && xmaxSessionState === "streaming") {
      const defaultPrompt = customImageSrc
        ? DEFAULT_XMAX_REF_IMAGE_PROMPT
        : (currentPersona.description || "photorealistic portrait");

      getXmaxManager().updateContext(
        customPrompt.trim() || defaultPrompt,
        customImageSrc || null
      );
    }
  }, [intensity, customPrompt, currentPersona, customImageSrc, provider, xmaxSessionState]);

  // Heartbeat interval while LIVE (deducts 1 credit per second, synced every 2 seconds)
  useEffect(() => {
    // Only meter credits if stream is live AND if using xmax, xmax is confirmed running and actively delivering video frames
    const isActivelyStreaming = isLive && (provider !== "xmax" || (xmaxSessionState === "streaming" && getXmaxManager().hasLiveFrames()));
    if (!isActivelyStreaming) return;

    // Second-by-second countdown and stream timer (ticks only when AI swap frames are actively rendering)
    const timer = setInterval(() => {
      setStreamDuration((prev) => prev + 1);
      setCreditBalance((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          stopLiveStream();
          setIsTopUpOpen(true);
        }
        return next;
      });
    }, 1000);

    let heartbeatCount = 0;
    const heartbeatTimer = setInterval(async () => {
      try {
        const hasFrames = provider !== "xmax" ? true : (getXmaxManager().hasLiveFrames() && xmaxSessionState === "streaming");
        const res = await fetch("/api/session/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streamKey,
            seconds: 2,
            isStreaming: hasFrames,
            provider,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setCreditBalance(data.balance);
          if (data.burnedOut || !data.isLive || data.balance <= 0) {
            stopLiveStream();
            setIsTopUpOpen(true);
          }
        }

        // Periodically refresh XMax balance reading from upstream API to keep in sync
        heartbeatCount++;
        if (provider === "xmax" && heartbeatCount % 5 === 0) {
          fetchXmaxStatus();
        }
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeatTimer);
    };
  }, [isLive, provider, xmaxSessionState, streamKey, stopLiveStream, fetchXmaxStatus]);

  // Broadcast frame to OBS Channel on animation frame
  useEffect(() => {
    let frameId: number;
    const broadcastLoop = () => {
      if (engineRef.current && isCameraActive) {
        if (provider === "xmax") {
          const xmaxVideo = getXmaxManager().getRemoteVideoElement();
          if (xmaxVideo && xmaxVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            engineRef.current.setRemoteVideo(xmaxVideo);
          }
        }
        engineRef.current.broadcastToObs(
          streamKey,
          isLive,
          customImageSrc ? "custom-character" : currentPersona.id,
          viewMode,
          callerName
        );
        setFps(engineRef.current.currentFps || 60);
        setMicVolume(engineRef.current.currentSpeechVolume || 0);
      }
      frameId = requestAnimationFrame(broadcastLoop);
    };
    frameId = requestAnimationFrame(broadcastLoop);
    return () => cancelAnimationFrame(frameId);
  }, [isCameraActive, isLive, streamKey, currentPersona.id, customImageSrc, provider, viewMode, callerName]);

  // Copy OBS URL (Lumify /output endpoint)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const obsUrl = mounted && typeof window !== "undefined"
    ? `${window.location.origin}/output?key=${streamKey}&view=${viewMode}&name=${encodeURIComponent(callerName)}`
    : `/output?key=${streamKey}&view=${viewMode}&name=${encodeURIComponent(callerName)}`;

  const copyObsLink = () => {
    navigator.clipboard.writeText(obsUrl);
    setCopiedObs(true);
    setTimeout(() => setCopiedObs(false), 2000);
  };

  const popOutObsWindow = () => {
    if (typeof window !== "undefined") {
      const isMobile = viewMode.startsWith("android_");
      const width = isMobile ? 420 : 1280;
      const height = isMobile ? 860 : 720;
      window.open(
        obsUrl,
        "SageStreamOutput",
        `width=${width},height=${height},menubar=no,toolbar=no,status=no,location=no`
      );
    }
  };

  const formatCountdown = (totalSec: number) => {
    const safeSec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(safeSec / 3600);
    const m = Math.floor((safeSec % 3600) / 60);
    const s = safeSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTime = (seconds: number) => {
    return formatCountdown(seconds);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10">
        <Navbar onOpenTopUp={() => setIsTopUpOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Verifying creator session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authChecked && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10 relative overflow-hidden">
        <Navbar onOpenTopUp={() => setIsTopUpOpen(true)} />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center relative z-10">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs text-center relative overflow-hidden">
            {/* Lock Icon Badge */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-xs">
              <Lock className="h-7 w-7 text-blue-600" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Creator Authentication Required
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
              Sign In to Access Creator Studio
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto mb-8">
              Live AI face reenactment, webcam neural filters, OBS stream feeds, and wallet metering are reserved for registered creators. Sign in or create an account to start streaming.
            </p>

            {errorMessage && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Features preview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold mb-1">
                  <Sparkles className="h-3.5 w-3.5" /> Real-Time Swapping
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  24+ FPS neural face reenactment powered by Neural Cloud GPU.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold mb-1">
                  <Radio className="h-3.5 w-3.5" /> OBS & Calls
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Direct browser source feeds for OBS Virtual Cam, Discord & WhatsApp.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold mb-1">
                  <Timer className="h-3.5 w-3.5" /> Fair Metering
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Pay-as-you-stream at 1 credit/sec with live countdown guidance.
                </p>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Link
                href="/login"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Studio</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>

              <Link
                href="/register"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all cursor-pointer shadow-xs"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Free Account</span>
              </Link>
            </div>

            {/* 1-Click Demo Login for effortless evaluation */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">Want to test the studio instantly?</span>
              <button
                onClick={quickLoginAsCreator}
                disabled={loggingInDemo}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all font-semibold cursor-pointer disabled:opacity-50"
              >
                {loggingInDemo ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                )}
                <span>1-Click Demo Streamer Login (Alex)</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              <span>Back to Homepage</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10">
      <Navbar onOpenTopUp={() => setIsTopUpOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Creator Studio</h1>
              {isLive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> LIVE TO OBS (1 CRED/S)
                </span>
              ) : isPendingStream ? (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-600" /> CONNECTING ENGINE (TIMER PAUSED)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> READY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transform your live webcam with real-time AI personas. Pay as you stream, straight into OBS Studio.
            </p>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all shadow-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>Admin Controls</span>
              </Link>
            )}

            <button
              onClick={() => setIsPrankGuideOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
              <span>OBS & Call Guide</span>
            </button>

            {isLive ? (
              <button
                onClick={stopLiveStream}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
              >
                <Radio className="h-4 w-4" /> Stop Live Swap Metering
              </button>
            ) : isPendingStream ? (
              <button
                onClick={stopLiveStream}
                className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                title="Click to cancel connection and stop"
              >
                <RefreshCw className="h-4 w-4 animate-spin text-white" /> Connecting Stream (Click to Stop)...
              </button>
            ) : (
              <button
                onClick={requestStartLiveSwap}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
              >
                <Radio className="h-4 w-4" /> Start Live Swap Metering (1 cred/sec)
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Grid: Video Stage & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Feeds (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Live Transformation Canvas */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg flex items-center justify-center">
              <video ref={videoRef} playsInline muted className="hidden" />

              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className={`h-full w-full object-cover ${isCameraActive ? "block" : "hidden"}`}
              />

              {/* Cinematic Black Screen Connecting Animation Overlay for Realtime Swap */}
              {isCameraActive && provider === "xmax" && (xmaxSessionState === "connecting" || isPendingStream) && (
                <div className="absolute inset-0 z-30 bg-[#050508] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                  {/* Glowing Background Radial Highlights */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2)_0%,rgba(6,182,212,0.1)_40%,transparent_75%)] pointer-events-none" />

                  {/* Dual Animated Orbit Rings */}
                  <div className="relative mb-6 flex items-center justify-center">
                    <div className="h-28 w-28 rounded-full border-2 border-dashed border-blue-500/60 animate-spin [animation-duration:8s]" />
                    <div className="absolute h-20 w-20 rounded-full border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin [animation-direction:reverse] [animation-duration:3s]" />
                    <div className="absolute h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Connecting Status Headline */}
                  <div className="relative z-10 space-y-2 max-w-md">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 px-3 py-1 text-[11px] font-mono text-blue-200">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>REAL-TIME NEURAL SWAP</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white tracking-tight uppercase">
                      Connecting Real-Time Swap
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Establishing low-latency peer connection with Cloud GPU. Initializing real-time neural face reenactment.
                    </p>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Timer Paused: 0 Credits Deducted · Starts strictly on 1st AI video frame</span>
                    </div>

                    {/* Pipeline Stage Pills */}
                    <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-mono">
                      <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="h-3 w-3" /> Camera Ready
                      </span>
                      <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                        <Zap className="h-3 w-3 text-cyan-300" /> WebRTC Handshake
                      </span>
                      <span className="bg-zinc-900/80 text-zinc-400 border border-zinc-700/40 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Radio className="h-3 w-3" /> Neural Stream
                      </span>
                    </div>

                    {/* Animated Progress Shimmer Bar */}
                    <div className="pt-3 w-64 mx-auto">
                      <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden relative border border-white/5">
                        <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full w-full animate-pulse" />
                      </div>
                    </div>

                    {/* Cancel & Stop Button on Connecting Screen */}
                    <div className="pt-3">
                      <button
                        onClick={stopLiveStream}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer border border-white/15"
                      >
                        <X className="h-3.5 w-3.5" /> Stop & Cancel Connection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isCameraActive && (
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-3 text-zinc-400">
                    <Camera className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Camera is Turned Off</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    Enable your laptop webcam to start real-time AI face transformation and lip-syncing!
                  </p>
                  <button
                    onClick={toggleCamera}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                  >
                    <Camera className="h-3.5 w-3.5" /> Turn On Camera & Start Live Swap
                  </button>
                </div>
              )}

              {/* Video Overlay HUD */}
              {isCameraActive && (
                <>
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-zinc-200 border border-white/10">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isLive ? "bg-rose-500 animate-pulse" : "bg-emerald-400"
                        }`}
                      />
                      {isLive ? `LIVE ${formatTime(streamDuration)}` : "PREVIEW"}
                    </div>

                    {/* Live Credit Countdown Pill */}
                    {isLive && (
                      <div
                        className={`flex items-center gap-1.5 rounded-full backdrop-blur-md px-2.5 py-1 text-[11px] font-mono border transition-all ${
                          creditBalance < 120
                            ? "bg-rose-950/80 text-rose-200 border-rose-500/60 animate-pulse shadow-md shadow-rose-500/30"
                            : "bg-black/70 text-cyan-300 border-cyan-500/30"
                        }`}
                        title="Remaining time before purchased credits run out (1 credit = 1 second)"
                      >
                        <Hourglass className={`h-3 w-3 ${creditBalance < 120 ? "text-rose-400 animate-spin" : "text-cyan-400"}`} />
                        <span>REMAINING: {formatCountdown(creditBalance)}</span>
                      </div>
                    )}

                    {isPendingStream && (
                      <div
                        className="flex items-center gap-1.5 rounded-full backdrop-blur-md px-2.5 py-1 text-[11px] font-mono border bg-amber-950/80 text-amber-200 border-amber-500/50 animate-pulse shadow-sm shadow-amber-500/20"
                        title="Neural Cloud GPU is connecting; your credit countdown will start once video streams"
                      >
                        <RefreshCw className="h-3 w-3 animate-spin text-amber-300" />
                        <span>INITIALIZING STREAM · TIMER PAUSED</span>
                      </div>
                    )}
                    {provider === "xmax" ? (
                      <div
                        className={`flex items-center gap-1.5 rounded-full backdrop-blur-md px-2.5 py-1 text-[11px] font-mono border ${
                          xmaxSessionState === "streaming"
                            ? "bg-blue-950/80 text-blue-200 border-blue-500/50 shadow-sm shadow-blue-500/30"
                            : xmaxSessionState === "connecting"
                            ? "bg-amber-950/80 text-amber-200 border-amber-500/50 animate-pulse"
                            : "bg-zinc-900/80 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        <Zap className="h-3 w-3 text-cyan-400" />
                        <span>
                          {xmaxSessionState === "streaming"
                            ? "NEURAL STREAM (RTC)"
                            : xmaxSessionState === "connecting"
                            ? "CONNECTING ENGINE..."
                            : "NEURAL ENGINE"}
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-zinc-300 border border-white/10">
                        {fps} FPS
                      </div>
                    )}

                    {customImageSrc && (
                      <div className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono border border-white/10">
                        <Mic className={`h-3 w-3 ${micVolume > 8 ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
                        <span className="text-zinc-300">Lip-Sync:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((bar) => (
                            <span
                              key={bar}
                              className={`w-1 rounded-full transition-all duration-75 ${
                                micVolume > bar * 12 ? "h-3 bg-emerald-400" : "h-1 bg-zinc-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    {customImageName ? `Avatar: ${customImageName}` : currentPersona.name}
                  </div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-lg px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <button
                      onClick={toggleCamera}
                      className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title={isCameraActive ? "Stop Camera" : "Start Camera"}
                    >
                      {isCameraActive ? (
                        <Camera className="h-4 w-4" />
                      ) : (
                        <CameraOff className="h-4 w-4 text-rose-400" />
                      )}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff className="h-4 w-4 text-rose-400" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* OBS & Mobile Video Call Stream Output Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Header with Status Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs flex items-center justify-center">
                    OBS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      OBS & Mobile Call Output
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isLive
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isCameraActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {isLive ? "LIVE BROADCASTING" : isCameraActive ? "PREVIEW READY" : "IDLE"}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Connect to OBS Virtual Camera, Telegram, WhatsApp, Discord, or Zoom.
                    </p>
                  </div>
                </div>

                {/* Quick Help Accordion Toggle */}
                <button
                  onClick={() => setShowObsInstructions(!showObsInstructions)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>How to connect?</span>
                  {showObsInstructions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Instructions Callout (Collapsible) */}
              {showObsInstructions && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5 animate-in fade-in duration-200">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    How to stream clean Android calls to WhatsApp or Telegram:
                  </div>

                  <div className="space-y-2 text-[11px] text-slate-600">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <strong>Option 1 (Best & 100% Clean): OBS Browser Source</strong>
                      <p className="mt-0.5 text-emerald-800">
                        In OBS Studio, click <code>+</code> under Sources &rarr; select <strong>Browser</strong> &rarr; paste the copied URL. Set Width: <code>720</code>, Height: <code>1280</code>. This directly renders the video inside OBS with <strong>zero window borders, zero browser URL bar, and 100% clean output!</strong>
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                      <strong>Option 2: Pop Out Window + Window Capture</strong>
                      <p className="mt-0.5 text-blue-800">
                        Click <strong>Pop Out Window</strong> &rarr; double-click anywhere inside the window or press <strong>F</strong> to enter <strong>Borderless Fullscreen</strong> (instantly hides browser address bar and tabs). In OBS, capture the window with Window Capture.
                      </p>
                    </div>

                    <div className="pt-1">
                      <strong>Connecting to WhatsApp / Telegram Calls:</strong>
                      <ol className="list-decimal list-inside space-y-0.5 pl-1 mt-1">
                        <li>In OBS Studio, click <strong>&quot;Start Virtual Camera&quot;</strong> (bottom-right controls).</li>
                        <li>Open <strong>WhatsApp Desktop</strong> or <strong>Telegram Desktop</strong> &rarr; Settings &rarr; Video &rarr; select <strong>&quot;OBS Virtual Camera&quot;</strong>.</li>
                        <li>Call someone: your simulated Android call screen will display live to them!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* View Mode Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Stream View & Device Mode:</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {viewMode.startsWith("android_") ? "Android 9:16 Portrait" : "Widescreen 16:9"}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setViewMode("desktop")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      viewMode === "desktop"
                        ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs ring-1 ring-blue-300"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Desktop (16:9)</span>
                  </button>

                  <button
                    onClick={() => setViewMode("android_whatsapp")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      viewMode === "android_whatsapp"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-1 ring-emerald-300"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp Call</span>
                  </button>

                  <button
                    onClick={() => setViewMode("android_telegram")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      viewMode === "android_telegram"
                        ? "bg-sky-50 border-sky-300 text-sky-800 shadow-xs ring-1 ring-sky-300"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-sky-600" />
                    <span>Telegram Call</span>
                  </button>

                  <button
                    onClick={() => setViewMode("android_clean")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      viewMode === "android_clean"
                        ? "bg-purple-50 border-purple-300 text-purple-800 shadow-xs ring-1 ring-purple-300"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                    <span>Clean 9:16</span>
                  </button>
                </div>
              </div>

              {/* Caller Name Input (when in WhatsApp or Telegram Android call mode) */}
              {viewMode.startsWith("android_") && viewMode !== "android_clean" && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      Incoming Caller Name:
                    </label>
                    <span className="text-[10px] text-slate-400">Renders on Android call HUD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      placeholder="e.g. Mom, Girlfriend, FBI, Jessica"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {/* Quick Preset Chips */}
                    <div className="hidden sm:flex items-center gap-1">
                      {["Mom", "Jessica", "Police", "Drake", "Boss"].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setCallerName(preset)}
                          className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                            callerName === preset
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* URL Display Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">Direct Stream URL:</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                    Key: {streamKey}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 overflow-hidden">
                  <span className="text-slate-400 select-none">GET</span>
                  <span className="truncate flex-1 select-all">{obsUrl}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={copyObsLink}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {copiedObs ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>URL Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy OBS URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={popOutObsWindow}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer"
                  title="Pop out standalone stream window for OBS Window Capture or screen sharing"
                >
                  <Maximize2 className="h-4 w-4 text-slate-600" />
                  <span>Pop Out Window</span>
                </button>

                <a
                  href={obsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3.5 py-2.5 text-xs font-semibold transition-colors"
                  title="Open stream output preview in a new browser tab"
                >
                  <ExternalLink className="h-4 w-4 text-slate-600" />
                  <span>Open Preview Tab</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Controls, Custom Image Upload & Personas (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Live Countdown & Stream Consumption Guide Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Hourglass className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                      Credit Countdown & Meter
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Real-time burn consumption guide
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  <Zap className="h-3 w-3 text-blue-600" />
                  <span>1 cred / sec</span>
                </div>
              </div>

              {/* Connecting Safeguard Banner: Shows user they are NOT charged during connection */}
              {isPendingStream && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2.5">
                  <RefreshCw className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-900 block">
                      Connecting Neural Cloud GPU (Timer Paused)
                    </span>
                    <span className="text-amber-800/90 leading-relaxed block">
                      Low-latency WebRTC connection and neural character model are initializing. You are NOT being charged. The credit countdown will automatically begin once real-time swapping starts rendering.
                    </span>
                  </div>
                </div>
              )}

              {/* Dual Digital Timer Clocks: Time Remaining & Time Used */}
              <div className="grid grid-cols-2 gap-3">
                {/* Time Remaining (Countdown) */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  creditBalance < 120
                    ? "bg-rose-50 border-rose-200 shadow-xs"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Hourglass className="h-3 w-3 text-blue-600" />
                      Time Remaining
                    </span>
                    {isLive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                    )}
                    {isPendingStream && (
                      <span className="text-[9px] font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                        PAUSED (0 CRED)
                      </span>
                    )}
                  </div>
                  <div className={`text-2xl font-mono font-extrabold tracking-tight ${
                    creditBalance < 120 ? "text-rose-600 animate-pulse" : "text-blue-600"
                  }`}>
                    {formatCountdown(creditBalance)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{creditBalance.toLocaleString()} credits left</span>
                    <span className="text-slate-400">
                      (~{(creditBalance / 60).toFixed(1)}m)
                    </span>
                  </div>
                </div>

                {/* Time Used (This Stream) */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Timer className="h-3 w-3 text-blue-600" />
                      Time Used
                    </span>
                    {isLive && (
                      <span className="text-[9px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 font-semibold">
                        LIVE
                      </span>
                    )}
                    {isPendingStream && (
                      <span className="text-[9px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                        WAITING
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-slate-900 tracking-tight">
                    {formatCountdown(streamDuration)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{streamDuration} credits used</span>
                    <span className="text-slate-400">
                      {isLive ? "ticking" : isPendingStream ? "paused" : "ready"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fuel Gauge / Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Credit Capacity Gauge</span>
                  <span className="font-mono text-xs text-slate-700">
                    {creditBalance.toLocaleString()} / {Math.max(creditBalance, streamStartBalance || 3600).toLocaleString()} cr
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      creditBalance < 120
                        ? "bg-rose-500"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          (creditBalance / Math.max(creditBalance, streamStartBalance || 3600)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sage AI Cloud Neural GPU Infrastructure (Admin Only) */}
              {currentUser?.role === "admin" && provider === "xmax" && (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-blue-600" />
                      Sage Neural Cloud Infrastructure (Admin)
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                      isLive && xmaxSessionState === "streaming"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : isPendingStream || xmaxSessionState === "connecting"
                        ? "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isLive && xmaxSessionState === "streaming"
                          ? "bg-emerald-500 animate-ping"
                          : isPendingStream || xmaxSessionState === "connecting"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }`} />
                      {isLive && xmaxSessionState === "streaming"
                        ? "Reading Active"
                        : isPendingStream || xmaxSessionState === "connecting"
                        ? "Standby · 0 Creds"
                        : "Ready"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <div>
                      <div className="text-xl font-mono font-extrabold text-blue-900">
                        {typeof xmaxStatus?.balance === "number" ? `${xmaxStatus.balance.toLocaleString()} Units` : "Active"}
                      </div>
                      <div className="text-[10px] text-blue-700/80">
                        Upstream Cloud GPU compute reserve
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-700">
                        {isLive && xmaxSessionState === "streaming"
                          ? "1 credit / sec"
                          : "0 credit / sec"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isLive && xmaxSessionState === "streaming"
                          ? "Synchronized burn"
                          : "No burn while idle"}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10.5px] text-slate-600 bg-white/90 rounded-lg p-2 border border-blue-100 flex items-start gap-1.5 leading-snug">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      {isLive && xmaxSessionState === "streaming"
                        ? "Timer and credit burn are synchronized with live Cloud GPU video delivery."
                        : "Synchronized with Neural GPU: Credits only start counting when the AI begins generating video frames."}
                    </span>
                  </div>
                </div>
              )}

              {/* Low Credit Warning Alert if under 2 minutes */}
              {creditBalance < 120 && creditBalance > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-900 block">
                      Low Credit Warning (Under 2 Minutes Left)
                    </span>
                    <span className="text-amber-800/90 leading-relaxed block">
                      Your purchased credits are almost finished. Top up to ensure uninterrupted live swapping.
                    </span>
                  </div>
                </div>
              )}

              {/* Zero Credit Alert Banner */}
              {creditBalance <= 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-rose-900 block">
                      Wallet Empty (0 Credits)
                    </span>
                    <span className="text-rose-800/90 leading-relaxed block">
                      The countdown timer needs credits to run. Top up below or add credits in the Admin portal to start live real-time swapping.
                    </span>
                  </div>
                </div>
              )}

              {/* Credit Consumption Guide Explanation Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-600" />
                  <span>How Credit Consumption Works:</span>
                </div>
                <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[10.5px]">
                  <li>
                    <strong className="text-slate-800">1 credit per second:</strong> Exact 1:1 burn rate while streaming (60 credits = 1 minute).
                  </li>
                  <li>
                    <strong className="text-slate-800">Countdown timer:</strong> Shows exactly how many seconds/minutes remain until credits finish.
                  </li>
                  <li>
                    <strong className="text-slate-800">Zero overages:</strong> Streams auto-pause safely when credits hit 0, never incurring extra debt.
                  </li>
                </ul>
              </div>

              {/* Live Swap Metering Controls */}
              {creditBalance > 0 && (
                isLive ? (
                  <button
                    onClick={stopLiveStream}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Radio className="h-3.5 w-3.5" /> Stop Live Swap Metering
                  </button>
                ) : isPendingStream ? (
                  <button
                    onClick={stopLiveStream}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 py-2.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                    title="Click to cancel and stop"
                  >
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Connecting Stream (Click to Stop)...
                  </button>
                ) : (
                  <button
                    onClick={requestStartLiveSwap}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Radio className="h-3.5 w-3.5" /> Start Live Swap Metering
                  </button>
                )
              )}

              {/* Top Up Button */}
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-white" /> Top Up Credits
              </button>
            </div>



            {/* Persona & Character Selection Tabs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col gap-4">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => {
                    setActiveTab("personas");
                    handleClearCustomImage();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "personas" && !customImageSrc
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>AI Personas</span>
                </button>
                <button
                  onClick={() => setActiveTab("characters")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "characters" || customImageSrc
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>Upload & Avatars</span>
                </button>
              </div>

              {/* TAB 1: AI STYLE PERSONAS */}
              {activeTab === "personas" && !customImageSrc && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Live Webcam Personas
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold">6 Real-Time Styles</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {PERSONA_PRESETS.map((p) => {
                      const isSelected = currentPersona.id === p.id && !customImageSrc;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPersona(p)}
                          className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-500 bg-blue-50/60 shadow-xs"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {p.badge && (
                            <span className="absolute top-2 right-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold text-blue-700">
                              {p.badge}
                            </span>
                          )}
                          <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${p.color} mb-2`} />
                          <span className="text-xs font-bold text-slate-900 tracking-tight">{p.name}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{p.category}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD & VIRAL PRANK AVATARS */}
              {(activeTab === "characters" || customImageSrc) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Character Photo Morph
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Reenactment
                    </span>
                  </div>

                  {/* Upload input */}
                  <input
                    ref={fileInputRef}
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {customImageSrc ? (
                    <div className="relative rounded-xl border border-blue-200 bg-blue-50/60 p-3 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-blue-400 shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={customImageSrc}
                            alt="Custom character"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block truncate max-w-[170px]">
                            {customImageName || "Active Character"}
                          </span>
                          <span className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5 font-medium">
                            <Check className="h-3 w-3" /> Live Reenactment Active
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer shadow-xs"
                        >
                          Change
                        </button>
                        <button
                          onClick={handleClearCustomImage}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Switch back to Personas"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor={fileInputId}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-blue-50/20 mb-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1.5 border border-blue-100">
                        <Upload className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">Upload Any Picture / Face</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WEBP front-facing portrait</span>
                    </label>
                  )}

                  {/* Character Quick-Pick Cards */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                      Or click a pre-loaded avatar:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {SAMPLE_CHARACTERS.map((char) => {
                        const isSelected = customImageSrc === char.imageUrl;
                        return (
                          <button
                            key={char.id}
                            onClick={() => handleSelectSampleCharacter(char)}
                            className={`group relative flex flex-col items-center rounded-xl p-1.5 border transition-all cursor-pointer ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 shadow-xs"
                                : "border-slate-200 bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            {char.badge && (
                              <span className="absolute top-1 right-1 z-10 rounded-full bg-blue-600 text-white px-1.5 py-0.2 text-[7px] font-bold">
                                {char.badge}
                              </span>
                            )}
                            <div className="relative h-14 w-full rounded-lg overflow-hidden mb-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={char.imageUrl}
                                alt={char.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 truncate w-full text-center">
                              {char.name}
                            </span>
                            <span className="text-[8px] text-slate-500 line-clamp-1">{char.category}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Intensity & Steering Controls */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Sliders className="h-3 w-3 text-slate-500" /> Morph Intensity
                    </span>
                    <span className="font-mono text-blue-600 font-semibold">{Math.round(intensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={intensity}
                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span>Subtle Effect</span>
                    <span>Balanced</span>
                    <span>Max Transformation</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-slate-600 font-medium">Prompt Guidance</label>
                    {customImageSrc && (
                      <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Default: 视频中角色替换成参考图中角色
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={
                      customImageSrc
                        ? DEFAULT_XMAX_REF_IMAGE_PROMPT
                        : `e.g. ${currentPersona.promptExample}`
                    }
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono"
                  />
                  {customImageSrc && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Realtime face swapping prompt is locked by default to{" "}
                      <span className="text-blue-600 font-mono font-medium">视频中角色替换成参考图中角色</span>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* WhatsApp / Telegram Prank Call Setup Guide Modal */}
      {isPrankGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  How to Prank Call on WhatsApp, Telegram & Zoom
                </h3>
              </div>
              <button
                onClick={() => setIsPrankGuideOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Follow these 4 simple steps to send your real-time AI avatar directly into any WhatsApp video call, Telegram call, or Discord stream:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  1
                </span>
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900 block mb-0.5">Copy Your Sage OBS Stream Link</strong>
                  Click <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">Copy Link</span> in the OBS section above.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  2
                </span>
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900 block mb-0.5">Add Browser Source in OBS Studio</strong>
                  Open OBS Studio on your laptop, click the <strong>+</strong> under Sources, select <strong>Browser</strong>, and paste your URL. Set width: <strong>1280</strong>, height: <strong>720</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  3
                </span>
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900 block mb-0.5">Click &ldquo;Start Virtual Camera&rdquo; in OBS</strong>
                  In OBS Studio (bottom-right panel), click <strong>Start Virtual Camera</strong>. This turns your AI feed into a universal system webcam.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  4
                </span>
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900 block mb-0.5">Select &ldquo;OBS Virtual Camera&rdquo; in WhatsApp/Telegram</strong>
                  Open WhatsApp Desktop (or Telegram, Zoom, Discord) &gt; Settings &gt; Video/Audio &gt; Camera: Select <strong>OBS Virtual Camera</strong>! Now start your video call!
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={popOutObsWindow}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Pop-Out 1080p Window
              </button>
              <button
                onClick={() => setIsPrankGuideOpen(false)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                Got It, Let&apos;s Stream!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={(newBal) => {
          setCreditBalance(newBal);
          if (isCameraActive && !isLive && newBal > 0) {
            requestStartLiveSwap();
          }
        }}
      />

      {/* Upstream Provider Modal (Restricted Exclusively to Platform Administrators) */}
      {isSettingsOpen && currentUser?.role === "admin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Upstream AI Video Engine</h3>
            <p className="text-xs text-slate-500 mb-4">
              Choose which engine transforms the webcam video stream.
            </p>

            <div className="space-y-2 mb-4">
              {/* Option 1: Sage AI Ultra-HD Neural Cloud */}
              <label
                onClick={() => handleSwitchProvider("xmax")}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  provider === "xmax" ? "border-blue-600 bg-blue-50/60 shadow-xs" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Sage AI Ultra-HD Neural Cloud</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      Standard
                    </span>
                    {xmaxStatus?.configured && xmaxStatus.valid && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200">
                        Connected
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Photorealistic cloud GPU reenactment (Ultra-low latency Neural Stream)
                  </div>
                </div>
                {provider === "xmax" && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
              </label>

              {/* Option 2: Built-in Full Body Cam */}
              <label
                onClick={() => handleSwitchProvider("local")}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  provider === "local" ? "border-blue-600 bg-blue-50/60 shadow-xs" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Full Body AI Cam (Built-in MediaPipe)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Zero API key needed · 60 FPS sub-10ms latency</div>
                </div>
                {provider === "local" && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
              </label>

              {/* Option 3: Fal.ai Cloud */}
              <label
                onClick={() => handleSwitchProvider("fal")}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  provider === "fal" ? "border-blue-600 bg-blue-50/60 shadow-xs" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Fal.ai Cloud LivePortrait</span>
                    {falStatus?.configured && falStatus.valid && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200">
                        Connected
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {falStatus?.userName
                      ? `Active: ${falStatus.userName} (${falStatus.email})`
                      : "Low-latency cloud diffusion with global edge"}
                  </div>
                </div>
                {provider === "fal" && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
              </label>
            </div>

            {/* Neural Cloud Engine Configuration Box */}
            {provider === "xmax" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 mb-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">Platform Neural Engine Status:</span>
                  {xmaxStatus?.valid ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> System Key Active
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Master Key Standby</span>
                  )}
                </div>

                {xmaxStatus?.valid ? (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>System Master Key:</span>
                      <span className="font-mono text-blue-600 font-semibold select-all">
                        {xmaxStatus.actualApiKey ? xmaxStatus.actualApiKey.slice(0, 8) + "..." + xmaxStatus.actualApiKey.slice(-4) : "Configured by Admin"}
                      </span>
                    </div>
                    {currentUser?.role === "admin" && xmaxStatus.remainingCredits !== undefined && xmaxStatus.remainingCredits !== null && (
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <span>Cloud GPU Reserve:</span>
                        <span className={`font-mono font-bold flex items-center gap-1 ${xmaxStatus.remainingCredits > 0 ? "text-blue-600" : "text-rose-600"}`}>
                          <Zap className="h-3 w-3 text-blue-600" />
                          <span>{xmaxStatus.remainingCredits.toLocaleString()} credits</span>
                        </span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      Engine: <code className="text-blue-600 font-mono">Sage Neural Stream v2.0</code> · Sub-second WebRTC
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed space-y-1">
                    <div>The platform master neural engine key has not been connected yet.</div>
                    {currentUser?.role === "admin" ? (
                      <Link
                        href="/admin"
                        className="text-blue-600 hover:text-blue-700 font-semibold underline inline-flex items-center gap-1 mt-1"
                      >
                        <span>Go to Admin Panel to Add Master Key</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <div className="text-slate-500">
                        Please notify the platform administrator to activate cloud swapping.
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-200 pt-2">
                  Sage AI automatically provisions and shares upstream inference with all creators. No personal keys required.
                </div>
              </div>
            )}

            {provider === "fal" && falStatus?.configured && falStatus.valid && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-4 text-xs">
                <div className="flex items-center justify-between text-slate-700 mb-1">
                  <span>Server Status:</span>
                  <span className="text-emerald-700 font-semibold">API Key Verified</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] mb-2">
                  <span>Account:</span>
                  <span className="font-mono text-slate-700">{falStatus.email}</span>
                </div>
                {falStatus.isLocked && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                    <strong>Note:</strong> Fal account balance is currently 0. Top up $5 or $10 at{" "}
                    <a
                      href="https://fal.ai/dashboard/billing"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-amber-900 hover:text-blue-600"
                    >
                      fal.ai/dashboard/billing
                    </a>{" "}
                    to unlock cloud GPU inference. In the meantime, the Built-in Full Body AI Cam will run for free!
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
            >
              Save Engine Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
