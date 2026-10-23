/**
 * XMax AI Realtime Cloud Video & Character Synthesis Client
 * Built accurately according to official XMax Quickstart specifications:
 * https://platform.xmax.ai/docs/quick-start
 *
 * Uses @xmaxai/sdk-global, models.realtime('x2.0'), stream resolution {1472, 832, 24fps},
 * and character replacement prompt formatting: '视频中角色替换成参考图中角色'.
 */

import type { RealtimeSession, XmaxClient } from "@xmaxai/sdk-global";

export const DEFAULT_XMAX_REF_IMAGE_PROMPT = "视频中角色替换成参考图中角色";

export function formatRealtimePrompt(prompt: string | undefined | null, hasRefImage: boolean): string {
  if (hasRefImage) {
    const raw = (prompt || "").trim();
    if (
      !raw ||
      raw === DEFAULT_XMAX_REF_IMAGE_PROMPT ||
      raw.toLowerCase() === "photorealistic portrait" ||
      raw.toLowerCase() === "photorealistic portrait, high quality, 8k" ||
      raw.toLowerCase() === "photorealistic portrait, high quality"
    ) {
      return DEFAULT_XMAX_REF_IMAGE_PROMPT;
    }
    if (raw.includes(DEFAULT_XMAX_REF_IMAGE_PROMPT)) {
      return raw;
    }
    return `${DEFAULT_XMAX_REF_IMAGE_PROMPT}, ${raw}`;
  }
  return (prompt || "").trim() || "photorealistic portrait, high quality, 8k";
}

export interface XmaxConnectOptions {
  stream: MediaStream;
  apiKey: string;
  prompt?: string;
  refImageUrl?: string | null;
  onRemoteStream?: (stream: MediaStream) => void;
  onFirstFrame?: () => void;
  onError?: (error: string) => void;
  onStateChange?: (state: string) => void;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

class XmaxSessionManager {
  private client: XmaxClient | null = null;
  private session: RealtimeSession | null = null;
  private remoteContainer: HTMLDivElement | null = null;
  private remoteVideo: HTMLVideoElement | null = null;
  private isConnecting = false;
  private isCancelled = false;
  private currentApiKey: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // 1. Remote container for SDK-managed WebRTC rendering
      this.remoteContainer = document.createElement("div");
      this.remoteContainer.id = "xmax-remote-container";
      this.remoteContainer.style.position = "fixed";
      this.remoteContainer.style.opacity = "0";
      this.remoteContainer.style.pointerEvents = "none";
      this.remoteContainer.style.width = "1px";
      this.remoteContainer.style.height = "1px";
      this.remoteContainer.style.bottom = "0";
      this.remoteContainer.style.right = "0";
      document.body.appendChild(this.remoteContainer);

      // 2. Direct video element for custom canvas rendering
      this.remoteVideo = document.createElement("video");
      this.remoteVideo.autoplay = true;
      this.remoteVideo.playsInline = true;
      this.remoteVideo.muted = true;
      this.remoteVideo.style.position = "fixed";
      this.remoteVideo.style.opacity = "0";
      this.remoteVideo.style.pointerEvents = "none";
      this.remoteVideo.style.width = "1px";
      this.remoteVideo.style.height = "1px";
      this.remoteVideo.style.bottom = "0";
      this.remoteVideo.style.right = "0";
      document.body.appendChild(this.remoteVideo);
    }
  }

  public getRemoteVideoElement(): HTMLVideoElement | null {
    if (this.remoteContainer) {
      const sdkVideo = this.remoteContainer.querySelector("video");
      if (sdkVideo && sdkVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        return sdkVideo;
      }
    }
    return this.remoteVideo;
  }

  public isLiveSessionActive(): boolean {
    return Boolean(!this.isCancelled && this.session && this.session.state === "running");
  }

  public hasLiveFrames(): boolean {
    const el = this.getRemoteVideoElement();
    return Boolean(
      this.isLiveSessionActive() &&
      el &&
      el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      !el.paused &&
      !el.ended &&
      (el.currentTime > 0 || (el.videoWidth > 0 && el.videoHeight > 0))
    );
  }

  /**
   * Uploads reference image to XMax Cloud Storage according to /docs/resources/file-upload
   */
  private async uploadReferenceImage(inputUrl: string): Promise<string | null> {
    if (!this.client || this.isCancelled) return null;
    try {
      if (inputUrl.startsWith("http://") || inputUrl.startsWith("https://")) {
        return inputUrl;
      }

      let fileToUpload: File | null = null;

      if (inputUrl.startsWith("data:")) {
        fileToUpload = dataUrlToFile(inputUrl, "character_avatar.jpg");
      } else if (inputUrl.startsWith("/")) {
        const fullPath = typeof window !== "undefined" ? window.location.origin + inputUrl : inputUrl;
        const res = await fetch(fullPath);
        if (res.ok) {
          const blob = await res.blob();
          fileToUpload = new File([blob], "character_avatar.jpg", { type: blob.type || "image/jpeg" });
        }
      }

      if (fileToUpload && !this.isCancelled) {
        console.log("Sage AI: Uploading reference image to XMax Cloud Storage...", fileToUpload.name);
        const uploadResult = await this.client.files.uploadImage(fileToUpload);
        console.log("Sage AI: Reference image uploaded successfully to XMax CDN:", uploadResult.url);
        return uploadResult.url;
      }
    } catch (err) {
      console.warn("Sage AI: Reference image upload note:", err);
    }
    return null;
  }

  public async connect(options: XmaxConnectOptions): Promise<RealtimeSession> {
    if (this.isConnecting) {
      throw new Error("XMax connection already in progress");
    }

    // Clean up existing session if active
    await this.disconnect();

    this.isCancelled = false;
    this.isConnecting = true;
    this.currentApiKey = options.apiKey;

    try {
      const { createXmaxClient, models } = await import("@xmaxai/sdk-global");

      if (this.isCancelled) {
        this.isConnecting = false;
        return null as unknown as RealtimeSession;
      }

      this.client = createXmaxClient({
        apiKey: options.apiKey,
        onError: (msg) => {
          if (this.isCancelled) return;
          console.error("Sage AI: XMax global error:", msg);
          options.onError?.(msg);
        },
      });

      console.log("Sage AI: Connecting to XMax AI Realtime Cloud RTC with model 'x2.0'...");
      options.onStateChange?.("connecting");

      // Resolve/Upload character reference image if provided
      let resolvedRefImage: string | undefined = undefined;
      if (options.refImageUrl) {
        const uploaded = await this.uploadReferenceImage(options.refImageUrl);
        if (this.isCancelled) {
          this.isConnecting = false;
          return null as unknown as RealtimeSession;
        }
        if (uploaded) {
          resolvedRefImage = uploaded;
        }
      }

      if (this.isCancelled) {
        this.isConnecting = false;
        return null as unknown as RealtimeSession;
      }

      // Format prompt: default strictly to '视频中角色替换成参考图中角色' when using ref image realtime swapping
      const effectivePrompt = formatRealtimePrompt(options.prompt, Boolean(resolvedRefImage || options.refImageUrl));

      console.log("Sage AI: Initializing XMax Realtime Session with:", {
        model: "x2.0",
        prompt: effectivePrompt,
        refImageUrl: resolvedRefImage,
      });

      const session = await this.client.realtime.connect(options.stream, {
        // Select the X2.0 realtime video generation model
        model: models.realtime("x2.0"),

        // Configure the published video width, height, and frame rate according to XMax quickstart
        stream: {
          width: 1472,
          height: 832,
          fps: 24,
        },

        // Set the prompt and reference image used for generation
        context: {
          prompt: effectivePrompt,
          refImageUrl: resolvedRefImage || undefined,
        },

        // Configure SDK-managed media rendering
        render: {
          remoteContainer: this.remoteContainer || undefined,
          mirror: false,
        },

        // Enable RTC diagnostic logs
        log: { rtc: true },

        // Start generation automatically after connecting
        autoStart: true,

        // Called when the remote stream becomes available or is rebound
        onRemoteStream: (remoteStream) => {
          if (this.isCancelled) return;
          console.log("Sage AI: XMax remote WebRTC stream ready!", remoteStream);
          if (this.remoteVideo) {
            this.remoteVideo.srcObject = remoteStream;
            this.remoteVideo.play().catch((err) => console.warn("XMax remote video autoplay note:", err));
          }
          options.onRemoteStream?.(remoteStream);
        },

        // Called when the first video frame arrives
        onRemoteVideoFirstFrame: (info) => {
          if (this.isCancelled) return;
          console.log("Sage AI: XMax remote first frame arrived:", info);
          options.onFirstFrame?.();
          options.onStateChange?.("streaming");
        },

        // Called when the session state changes
        onStateChange: (state) => {
          if (this.isCancelled) return;
          console.log("Sage AI: XMax session state changed:", state);
          options.onStateChange?.(state);
        },

        // Called for non-fatal SDK notices; the session continues normally
        onNotice: (notice) => {
          if (notice.code === "LOW_INPUT_RESOLUTION") {
            console.warn("Sage AI: XMax notice:", notice.message, notice.details);
          }
        },

        // Called when a connection or session operation fails
        onError: (message, error) => {
          if (this.isCancelled) return;
          console.error("Sage AI: XMax session error:", message, error);
          const errText = typeof message === "string" ? message : error?.message || "XMax RTC error";
          options.onError?.(errText);
        },

        // Called after an established session disconnects
        onDisconnect: (reason) => {
          if (this.isCancelled) return;
          console.log("Sage AI: XMax session disconnected:", reason);
          options.onStateChange?.("disconnected");
        },
      });

      if (this.isCancelled) {
        console.log("Sage AI: User stopped while XMax connect was resolving. Closing session immediately.");
        try {
          await session.disconnect();
        } catch {}
        await this.disconnect();
        return session;
      }

      this.session = session;
      return session;
    } catch (err: unknown) {
      if (this.isCancelled) {
        return null as unknown as RealtimeSession;
      }
      const errorMsg = err instanceof Error ? err.message : "Failed to establish XMax session";
      console.error("Sage AI: XMax connection failure:", errorMsg);
      options.onError?.(errorMsg);
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Update the prompt and reference image without reconnecting the camera
   */
  public async updateContext(prompt: string, refImageUrl?: string | null): Promise<void> {
    if (!this.session || !this.client || this.isCancelled) return;
    try {
      let resolvedRefImage: string | null | undefined = refImageUrl;
      if (refImageUrl) {
        resolvedRefImage = await this.uploadReferenceImage(refImageUrl);
      }

      // Format prompt: default strictly to '视频中角色替换成参考图中角色' when using ref image realtime swapping
      const effectivePrompt = formatRealtimePrompt(prompt, Boolean(resolvedRefImage || refImageUrl));

      console.log("Sage AI: Updating XMax condition context...", {
        prompt: effectivePrompt,
        refImageUrl: resolvedRefImage,
      });

      await this.session.set({
        prompt: effectivePrompt,
        refImageUrl: resolvedRefImage || null,
      });
    } catch (err) {
      console.error("Sage AI: Failed to update XMax context:", err);
    }
  }

  /**
   * Disconnect the realtime session and release all audio/video resources completely
   */
  public async disconnect(): Promise<void> {
    this.isCancelled = true;
    this.isConnecting = false;

    if (this.session) {
      try {
        await this.session.disconnect();
      } catch (err) {
        console.warn("Sage AI: XMax disconnect note:", err);
      } finally {
        this.session = null;
      }
    }

    if (this.remoteVideo) {
      if (this.remoteVideo.srcObject instanceof MediaStream) {
        this.remoteVideo.srcObject.getTracks().forEach((t) => t.stop());
      }
      this.remoteVideo.srcObject = null;
      this.remoteVideo.pause();
    }

    if (this.remoteContainer) {
      const mediaElements = this.remoteContainer.querySelectorAll("video, audio");
      mediaElements.forEach((el) => {
        const m = el as HTMLMediaElement;
        if (m.srcObject instanceof MediaStream) {
          m.srcObject.getTracks().forEach((t) => t.stop());
        }
        m.srcObject = null;
        m.pause();
      });
      this.remoteContainer.innerHTML = "";
    }
  }
}

// Global singleton instance for the browser session
let xmaxManagerInstance: XmaxSessionManager | null = null;

export function getXmaxManager(): XmaxSessionManager {
  if (typeof window === "undefined") {
    return new XmaxSessionManager();
  }
  if (!xmaxManagerInstance) {
    xmaxManagerInstance = new XmaxSessionManager();
  }
  return xmaxManagerInstance;
}
