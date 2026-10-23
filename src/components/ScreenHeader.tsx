import React from "react";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  isDisplay?: boolean;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  isDisplay = false,
  rightSlot,
}: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[#FFFFFF] px-5 pt-4 pb-3 border-b border-[#E5E7EB]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1
            className={
              isDisplay
                ? "text-[32px] font-black tracking-[-0.02em] leading-[1.15] text-[#111827] break-words"
                : "text-[24px] font-bold tracking-[-0.01em] leading-[1.2] text-[#111827] break-words"
            }
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mt-1 break-words">
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </header>
  );
}
