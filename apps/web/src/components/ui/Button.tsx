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
  const baseStyles = "font-headline font-bold uppercase tracking-tighter rounded-full transition-all active:scale-95 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100";
  
  const variants = {
    primary: "bg-primary-container text-on-primary-container shadow-xl shadow-primary-container/20 hover:bg-primary-fixed-dim",
    secondary: "bg-on-background text-background shadow-xl hover:opacity-90",
    outline: "border border-on-background/20 text-on-background hover:bg-on-background/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-12 py-6 text-xl",
    xl: "px-16 py-6 text-xl",
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
