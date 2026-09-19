import { Alert, Text } from "@mantine/core";
import { IconSpeakerphone } from "@tabler/icons-react";
import { usePublicSettings } from "../../hooks/use-public-settings";

/** Renders nothing at all until staff set an announcement in the admin app. */
export function AnnouncementBanner() {
  const { data } = usePublicSettings();

  const text = data?.["announcement.text"];

  if (!text) return null;

  return (
    <Alert
      variant="light"
      color="primary"
      radius={0}
      icon={<IconSpeakerphone size={18} />}
      py="xs"
    >
      <Text size="sm">{text}</Text>
    </Alert>
  );
}
