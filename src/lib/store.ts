export interface Persona {
  id: string;
  name: string;
  category: string;
  description: string;
  badge?: string;
  filterMode: "cyberpunk" | "anime" | "toon3d" | "noir" | "synthwave" | "studio" | "custom-image";
  color: string;
  icon: string;
  promptExample: string;
  imageUrl?: string;
}

export const SAMPLE_CHARACTERS = [
  {
    id: "char-sophia",
    name: "Sophia (Model)",
    category: "Viral Prank",
    badge: "Most Popular",
    imageUrl: "/characters/sophia.jpg",
    description: "Ultra-realistic European model portrait with natural studio lighting for video calls.",
  },
  {
    id: "char-tycoon",
    name: "Tech Tycoon (Elon Style)",
    category: "Celebrity",
    badge: "Trending",
    imageUrl: "/characters/tycoon.jpg",
    description: "High-status corporate tycoon in a tailored suit, perfect for prank pitch calls.",
  },
  {
    id: "char-sarah",
    name: "Sarah (Cosplay VTuber)",
    category: "VTuber",
    badge: "New 60FPS",
    imageUrl: "/characters/sarah.jpg",
    description: "Dynamic gaming aesthetic with vibrant lighting, ideal for live streams and Twitch.",
  },
  {
    id: "char-david",
    name: "David (Anchor Host)",
    category: "Professional",
    badge: "HD Broadcast",
    imageUrl: "/characters/david.jpg",
    description: "Polished corporate news anchor portrait with authoritative presence and studio rim light.",
  },
  {
    id: "char-kai",
    name: "Kai (Esports Gamer)",
    category: "Gaming",
    badge: "Streamer Pick",
    imageUrl: "/characters/kai.jpg",
    description: "Competitive gaming creator setup with dramatic key light and headset silhouette.",
  },
  {
    id: "char-olivia",
    name: "Olivia (Classic Film)",
    category: "Glamour",
    badge: "Trending",
    imageUrl: "/characters/olivia.jpg",
    description: "Warm golden-hour portrait with cinematic depth-of-field and expressive features.",
  },
  {
    id: "char-chloe",
    name: "Chloe (Webcam Natural)",
    category: "Real Person",
    badge: "1080p HD",
    imageUrl: "/characters/chloe.jpg",
    description: "Friendly casual girl-next-door look with realistic bedroom webcam lighting.",
  },
  {
    id: "char-alexander",
    name: "Alexander (Wall St)",
    category: "Luxury",
    badge: "Executive",
    imageUrl: "/characters/alexander.jpg",
    description: "Young venture capitalist with confident expression and penthouse background.",
  },
  {
    id: "char-marcus",
    name: "Marcus (Urban Stylist)",
    category: "Influencer",
    imageUrl: "/characters/marcus.jpg",
    description: "Stylish streetwear influencer with natural head tilt and expressive smile.",
  },
  {
    id: "char-elena",
    name: "Elena (Glamour Influencer)",
    category: "Model",
    imageUrl: "/characters/elena.jpg",
    description: "High-definition blonde influencer with warm lighting and expressive eyes.",
  },
];

export const PERSONA_PRESETS: Persona[] = [
  {
    id: "anime-shonen",
    name: "Anime Shonen",
    category: "Stylized",
    description: "Vibrant cel-shaded anime look with ink outlines and eye glow.",
    badge: "Popular",
    filterMode: "anime",
    color: "from-amber-500 to-rose-500",
    icon: "Sparkles",
    promptExample: "heroic shonen anime protagonist, studio ghibli lighting, sharp eyes",
  },
  {
    id: "cyberpunk-neo",
    name: "Cyberpunk 2099",
    category: "Sci-Fi",
    description: "Futuristic neon highlights, subtle chromatic aberration & visor glow.",
    badge: "Trending",
    filterMode: "cyberpunk",
    color: "from-cyan-400 to-fuchsia-500",
    icon: "Zap",
    promptExample: "cyberpunk netrunner, neon reflections, augmented neural cyberware",
  },
  {
    id: "toon-3d",
    name: "3D Pixar Avatar",
    category: "Character",
    description: "Smooth 3D animated studio render with soft specular skin.",
    filterMode: "toon3d",
    color: "from-emerald-400 to-teal-500",
    icon: "Smile",
    promptExample: "3D animated movie character, Disney Pixar render style, friendly smile",
  },
  {
    id: "cinematic-noir",
    name: "Cinematic Noir",
    category: "Aesthetic",
    description: "High-contrast monochrome film with 35mm grain and anamorphic mood.",
    filterMode: "noir",
    color: "from-zinc-400 to-zinc-700",
    icon: "Film",
    promptExample: "dramatic film noir lighting, black and white 35mm photograph, heavy shadows",
  },
  {
    id: "synthwave-retro",
    name: "Retro Synthwave",
    category: "Retro",
    description: "1980s VHS tape scanlines with saturated magenta and cyan duotone.",
    filterMode: "synthwave",
    color: "from-pink-500 to-indigo-500",
    icon: "Radio",
    promptExample: "outrun synthwave aesthetic, 80s arcade neon glow, retro grid horizon",
  },
  {
    id: "studio-real",
    name: "Studio Hyper-Polish",
    category: "Enhancement",
    description: "Professional three-point lighting, clean skin tone, and DSLR lens blur.",
    filterMode: "studio",
    color: "from-blue-500 to-indigo-600",
    icon: "Camera",
    promptExample: "ultra sharp 8k streamer webcam, high-end cinema prime lens, bokeh background",
  },
];

export interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  minutesApprox: number;
  priceUsd: number;
  priceNgn: number;
  popular?: boolean;
  savings?: string;
  features: string[];
}

export const PRICING_PACKS: PricingPlan[] = [
  {
    id: "pack-starter",
    name: "Starter Pack",
    credits: 500,
    minutesApprox: 8.3,
    priceUsd: 10,
    priceNgn: 11500,
    features: [
      "500 Stream Credits (1 cred/sec = ~8.3 min)",
      "Access all 6+ Persona Presets & Image Uploads",
      "Direct OBS Browser Source link",
      "Credits never expire",
    ],
  },
  {
    id: "pack-creator",
    name: "Creator Pack",
    credits: 1500,
    minutesApprox: 25,
    priceUsd: 25,
    priceNgn: 28000,
    popular: true,
    savings: "Save 16%",
    features: [
      "1,500 Stream Credits (1 cred/sec = 25 min)",
      "Custom Character Image Face-Morphing",
      "Ultra-low latency 60 FPS output",
      "Direct OBS & TikTok Live support",
      "Priority GPU inference queue",
    ],
  },
  {
    id: "pack-pro",
    name: "Pro Streamer Pack",
    credits: 5000,
    minutesApprox: 83.3,
    priceUsd: 75,
    priceNgn: 85000,
    savings: "Save 25%",
    features: [
      "5,000 Stream Credits (1 cred/sec = ~1.4 hrs)",
      "Unlimited Custom Character Image Uploads",
      "Custom LoRA & Character weights",
      "Zero WebRTC latency priority queue",
      "Dedicated bandwidth & OBS streaming",
    ],
  },
];
