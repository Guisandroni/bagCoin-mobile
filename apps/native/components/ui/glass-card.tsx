import { cn } from "heroui-native";
import { View, type ViewProps } from "react-native";

interface GlassCardProps extends ViewProps {
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <View
      className={cn(
        "bg-white/70 dark:bg-white/10 rounded-2xl border border-white/60 dark:border-white/20 p-4",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
