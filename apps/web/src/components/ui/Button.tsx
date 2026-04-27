import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const baseStyles = "font-body font-semibold rounded-full transition-all duration-150 btn-scale flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100";

  const variants = {
    primary: "bg-wise-green text-dark-green hover:bg-pastel-green",
    secondary: "bg-near-black text-white hover:bg-warm-dark",
    outline: "border border-near-black/15 text-near-black hover:bg-light-surface",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
    xl: "px-10 py-5 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
