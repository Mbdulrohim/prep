import React from "react";
import { cn } from "@/lib/utils"; // Utility for classNames concatenation

interface ProgressProps {
  value: number; // Progress percentage (0-100)
  className?: string;
  barClassName?: string;
  label?: string | boolean; // Custom label or true for percentage label
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "red" | "indigo" | "orange" | "custom";
}

export function Progress({
  value,
  className,
  barClassName,
  label,
  size = "md",
  color = "blue",
}: ProgressProps) {
  // Determine height based on size
  const heightClass = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }[size];

  // Color mapping for the progress bar
  const colorClasses = {
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    green: "bg-gradient-to-r from-green-500 to-green-600",
    red: "bg-gradient-to-r from-red-500 to-red-600",
    indigo: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    orange: "bg-gradient-to-r from-orange-500 to-orange-600",
    custom: "",
  }[color];

  // Calculate percentage with bounds
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {/* Label above progress bar */}
      {label && (
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{typeof label === "string" ? label : "Progress"}</span>
          <span>{percentage}%</span>
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={cn(
          "w-full bg-slate-200 rounded-full overflow-hidden",
          heightClass
        )}
      >
        {/* Animated progress bar */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses,
            barClassName
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Optional inner label for larger bars */}
          {size === "lg" && percentage > 20 && (
            <span className="text-xs text-white font-medium px-2 float-right">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
