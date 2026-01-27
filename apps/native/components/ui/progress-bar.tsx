import { cn } from "heroui-native";
import { View } from "react-native";

interface ProgressBarProps {
  progress: number;
  color?: string;
  className?: string;
}

export function ProgressBar({ progress, color = "bg-slate-900", className }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View className={cn("w-full h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden", className)}>
      <View
        className={cn("h-full rounded-full", color)}
        style={{ width: `${clampedProgress}%` }}
      />
    </View>
  );
}
