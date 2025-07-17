// components/ui/Button.tsx

"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "default",
  fullWidth = false,
  ...props
}: ButtonProps) {
  // Base classes for all buttons
  const baseClasses = `
    inline-flex items-center justify-center rounded-xl font-medium
    transition-all duration-200 focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
    disabled:pointer-events-none disabled:opacity-50
    ${fullWidth ? "w-full" : "w-auto"}
  `;

  // Size classes
  const sizeClasses = {
    default: "px-6 py-3 text-base",
    sm: "px-4 py-2 text-sm",
    lg: "px-8 py-4 text-lg",
  };

  // Variant classes
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl",
    secondary: "bg-slate-900 text-white hover:bg-slate-800 shadow-md",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
