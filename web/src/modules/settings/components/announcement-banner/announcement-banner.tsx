import { Megaphone } from "lucide-react";
import { usePublicSettings } from "../../hooks/use-public-settings";

/** Renders nothing at all until staff set an announcement in the admin app. */
export function AnnouncementBanner() {
  const { data } = usePublicSettings();

  const text = data?.["announcement.text"];

  if (!text) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-primary/10 px-4 py-2 text-center text-sm text-primary"
    >
      <Megaphone className="size-4" />
      {text}
    </div>
  );
}
