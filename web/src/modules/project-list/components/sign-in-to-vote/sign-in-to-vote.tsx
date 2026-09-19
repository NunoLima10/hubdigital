import { LoginButton } from "@/components/login-button/login-button";
import { Modal, Stack, Text } from "@mantine/core";

type SignInToVoteProps = {
  opened: boolean;
  onClose: () => void;
};

/**
 * Clicking upvote while logged out used to fail silently with a 401. This turns
 * that dead end into the sign-in prompt, and the caller replays the vote once a
 * session exists.
 */
export function SignInToVote({ opened, onClose }: SignInToVoteProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Entra para votar" centered>
      <Stack>
        <Text size="sm">
          Os votos definem o ranking da semana, por isso cada pessoa vota uma
          vez. Entra na tua conta e o teu voto é registado automaticamente.
        </Text>
        <LoginButton />
      </Stack>
    </Modal>
  );
}
