import { cn } from "@/lib/utils";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import {
  useLayoutEffect,
  useMemo,
  type ReactNode,
  type RefObject,
} from "react";

let openDialogCount = 0;
let lockedScrollY = 0;

function useDialogScrollLock(open: boolean) {
  const openingScrollY = useMemo(
    () => (open && typeof window !== "undefined" ? window.scrollY : 0),
    [open],
  );
  useLayoutEffect(() => {
    if (!open) return;

    if (openDialogCount === 0) {
      const root = document.documentElement;
      lockedScrollY = openingScrollY;
      const scrollbarWidth = Math.max(
        0,
        window.innerWidth - root.getBoundingClientRect().width,
      );
      root.style.setProperty("--hub-locked-scroll-y", `${lockedScrollY}px`);
      root.style.setProperty("--hub-scrollbar-width", `${scrollbarWidth}px`);
      root.classList.add("hub-dialog-scroll-locked");
    }
    openDialogCount += 1;

    return () => {
      openDialogCount -= 1;
      if (openDialogCount !== 0) return;

      const root = document.documentElement;
      root.classList.remove("hub-dialog-scroll-locked");
      root.style.removeProperty("--hub-locked-scroll-y");
      root.style.removeProperty("--hub-scrollbar-width");
      const restoreY = lockedScrollY;
      requestAnimationFrame(() => {
        if (openDialogCount === 0) window.scrollTo(0, restoreY);
      });
    };
  }, [open, openingScrollY]);
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  bodyClassName,
  dialogRef,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  dialogRef?: RefObject<HTMLDivElement | null>;
}) {
  useDialogScrollLock(open);
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-hub-dialog-backdrop
          className="fixed inset-y-0 left-0 z-[1200] w-screen bg-black/50 backdrop-blur-[2px]"
        />
        <DialogPrimitive.Viewport className="fixed inset-y-0 left-0 z-[1200] flex w-screen items-end justify-center overflow-y-auto md:items-center md:p-4">
          <DialogPrimitive.Popup
            ref={dialogRef}
            className={cn(
              "flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border bg-card text-card-foreground shadow-xl outline-none transition-transform duration-200 data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full motion-reduce:transition-none md:rounded-lg md:data-[starting-style]:translate-y-0 md:data-[ending-style]:translate-y-0",
              className,
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 md:px-5 md:py-4">
              <DialogPrimitive.Title className="text-lg font-semibold">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex size-11 shrink-0 items-center justify-center rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-8"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <div className={cn("min-h-0 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:p-5", bodyClassName)}>
              {children}
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
