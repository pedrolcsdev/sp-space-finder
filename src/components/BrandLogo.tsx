import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  variant?: "full" | "compact" | "mark";
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 88"
      aria-hidden="true"
      className={cn("h-12 w-12 text-[#2E467E]", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M40 6 71 37.5 61 47.5 40 26.5 20.5 46 10.5 36 40 6Z"
        fill="currentColor"
      />
      <path
        d="M40.5 21 58 38.5 27.5 69 17 58.5 40.5 35 47.5 42 34.5 55 42 62.5 65 39.5 72.5 47 41.5 78 29 65.5 53.5 41 40.5 28Z"
        fill="currentColor"
      />
      <path d="M48.5 70.5 60.5 82.5 52.5 88 40.5 76 48.5 70.5Z" fill="currentColor" />
    </svg>
  );
}

export function BrandLogo({
  className,
  markClassName,
  textClassName,
  variant = "full",
}: BrandLogoProps) {
  if (variant === "mark") {
    return <BrandMark className={className} />;
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <BrandMark className={cn("h-12 w-12 shrink-0", markClassName)} />
        <div className={cn("leading-none", textClassName)}>
          <div className="pl-0.5 text-[0.62rem] font-light uppercase tracking-[0.7em] text-[#6F6F73] sm:text-xs">
            Grupo
          </div>
          <div className="mt-1 text-xl font-extralight uppercase tracking-[0.18em] text-[#6A6A6D] sm:text-2xl">
            São Paulo
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <BrandMark className={cn("h-20 w-20", markClassName)} />
      <div className={cn("mt-2 text-center leading-none", textClassName)}>
        <div className="text-[0.62rem] font-light uppercase tracking-[0.9em] text-[#6F6F73] sm:text-xs">
          Grupo
        </div>
        <div className="mt-2 text-[1.75rem] font-extralight uppercase tracking-[0.26em] text-[#6A6A6D] sm:text-[2.1rem]">
          São Paulo
        </div>
      </div>
    </div>
  );
}
