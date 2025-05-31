import { PathConstants } from "@/app/router";
import { UserButton } from "@/components/user-button/user-button";
import { useUser } from "@clerk/react-router";
import { Stack, Text } from "@mantine/core";
import { Navigate } from "react-router-dom";

export function Profile() {
  const { user } = useUser();
  const onboarded = user?.publicMetadata?.onboarded;

  if (!onboarded) return <Navigate to={PathConstants.onboarding} replace />;

  return (
    <Stack>
      <Text>Profile</Text>
      <UserButton />
    </Stack>
  );
}
