import { useToggleAnimation } from "@/hooks/use-toggle-animation";
import { SparkBurst, type SparkBurstHandle } from "@/components/spark-burst/spark-burst";
import { POP_KEYFRAMES, PRESS_KEYFRAMES, replay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useImperativeHandle, useRef, type Ref } from "react";

export type FavoriteHeartHandle = { arm: () => void };

type Props = {
  ref?: Ref<FavoriteHeartHandle>;
  active: boolean;
  className?: string;
};

// The favorite icon: a red heart when saved. Saving pops the heart and throws
// red sparks, the same burst the vote button uses. Call `arm()` from the click
// that toggles it.
export function FavoriteHeart({ ref, active, className }: Props) {
  const icon = useRef<SVGSVGElement>(null);
  const sparks = useRef<SparkBurstHandle>(null);
  const arm = useToggleAnimation(active, {
    onActivate() {
      replay(icon.current, POP_KEYFRAMES, { duration: 450, easing: "ease-out" });
      sparks.current?.burst();
    },
    onDeactivate() {
      replay(icon.current, PRESS_KEYFRAMES, { duration: 200, easing: "ease-out" });
    },
  });
  useImperativeHandle(ref, () => ({ arm }), [arm]);

  return (
    <span className="relative inline-flex">
      <Heart
        ref={icon}
        aria-hidden="true"
        className={cn(active && "fill-current text-red-500", className)}
      />
      <SparkBurst ref={sparks} delay={100} distance={20} className="text-red-500" />
    </span>
  );
}
