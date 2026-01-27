import { cn } from "heroui-native";
import { View, Text } from "react-native";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  default: "bg-slate-100 dark:bg-white/10",
  success: "bg-emerald-50 dark:bg-emerald-500/20",
  warning: "bg-amber-50 dark:bg-amber-500/20",
  error: "bg-red-50 dark:bg-red-500/20",
};

const textStyles = {
  default: "text-slate-600 dark:text-slate-300",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <View className={cn("px-2 py-0.5 rounded-md", variantStyles[variant], className)}>
      <Text className={cn("text-xs font-bold", textStyles[variant])}>{children}</Text>
    </View>
  );
}
