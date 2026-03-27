import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "mark" | "wordmark" | "full";
  tone?: "default" | "light";
  className?: string;
};

const sourceMap = {
  default: {
    mark: "/brand/bountive-mark.svg",
    wordmark: "/brand/bountive-wordmark.svg",
    full: "/brand/bountive-logo.svg"
  },
  light: {
    mark: "/brand/bountive-mark-light.svg",
    wordmark: "/brand/bountive-wordmark-light.svg",
    full: "/brand/bountive-logo-light.svg"
  }
} as const;

const altMap = {
  mark: "Bountive icon",
  wordmark: "Bountive wordmark",
  full: "Bountive logo"
} as const;

const sizeMap = {
  mark: { width: 40, height: 40 },
  wordmark: { width: 164, height: 32 },
  full: { width: 186, height: 40 }
} as const;

export function BrandLogo({
  variant = "full",
  tone = "default",
  className
}: BrandLogoProps) {
  const source = sourceMap[tone][variant];
  const size = sizeMap[variant];

  return (
    <Image
      src={source}
      alt={altMap[variant]}
      width={size.width}
      height={size.height}
      className={cn("block h-auto", className)}
      priority={variant === "full"}
    />
  );
}
