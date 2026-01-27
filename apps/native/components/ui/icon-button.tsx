import { cn } from "heroui-native";
import { Pressable, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IconButtonProps extends PressableProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  className?: string;
}

export function IconButton({
  icon,
  size = 24,
  color,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      className={cn(
        "items-center justify-center rounded-full w-10 h-10 bg-white dark:bg-white/10 border border-slate-100 dark:border-white/20",
        className
      )}
      {...props}
    >
      <Ionicons name={icon} size={size} color={color ?? "#64748b"} />
    </Pressable>
  );
}
