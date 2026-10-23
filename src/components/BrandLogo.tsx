import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
  className?: string;
  badgeText?: string;
}

export function BrandLogo({
  size = "md",
  withLink = true,
  className = "",
  badgeText = "Live",
}: BrandLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-11 w-11 rounded-2xl",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const badgeSizes = {
    sm: "text-[10px] px-1.5 py-0.2",
    md: "text-[11px] px-2 py-0.5",
    lg: "text-xs px-2.5 py-0.5",
  };

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric SVG Brand Mark */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xs shrink-0 transition-transform ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[60%] w-[60%]"
        >
          <path
            d="M12 3C7.02944 3 3 7.02944 3 12C3 15.0805 4.54572 17.8016 6.9 19.45L9.8 16.55C8.7 15.45 8 13.9 8 12C8 9.79086 9.79086 8 12 8C13.9 8 15.45 8.7 16.55 9.8L19.45 6.9C17.8016 4.54572 15.0805 3 12 3Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M12 21C16.9706 21 21 16.9706 21 12C21 8.91946 19.4543 6.19838 17.1 4.55L14.2 7.45C15.3 8.55 16 10.1 16 12C16 14.2091 14.2091 16 12 16C10.1 16 8.55 15.3 7.45 14.2L4.55 17.1C6.19838 19.4543 8.91946 21 12 21Z"
            fill="#38bdf8"
          />
          <circle cx="12" cy="12" r="2" fill="white" />
        </svg>
      </div>

      {/* Typography & Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`font-extrabold tracking-tight text-slate-900 font-sans ${textSizes[size]}`}
        >
          SAGE
        </span>
        {badgeText && (
          <span
            className={`rounded-md bg-blue-50 font-semibold text-blue-700 border border-blue-200 uppercase tracking-wide ${badgeSizes[size]}`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-flex group transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
