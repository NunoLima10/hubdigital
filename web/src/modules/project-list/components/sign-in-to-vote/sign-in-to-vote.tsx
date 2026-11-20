import { SignInDialog } from "@/modules/auth/components/sign-in-dialog/sign-in-dialog";

type SignInToVoteProps = {
  opened: boolean;
  onClose: () => void;
};

/**
 * Clicking upvote while logged out used to fail silently with a 401. This turns
 * that dead end into the sign-in modal, and the caller replays the vote once a
 * session exists (the modal closes itself then: `opened` requires no session).
 */
export function SignInToVote({ opened, onClose }: SignInToVoteProps) {
  return (
    <SignInDialog
      open={opened}
      onClose={onClose}
      // Keep the pending vote: the caller closes this once the session arrives.
      onSignedIn={() => {}}
      title="Entra para votar"
      subtitle="Cada pessoa vota uma vez. Entra e o teu voto é registado automaticamente."
    />
  );
}
