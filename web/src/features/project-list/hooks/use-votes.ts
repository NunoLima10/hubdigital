import { useLocalStorage } from "@mantine/hooks";

// Votos guardados no browser até existir autenticação na API:
// impede votos repetidos do mesmo visitante, mas não é partilhado entre visitantes.
export function useVotes() {
  const [votes, setVotes] = useLocalStorage<string[]>({
    key: "hubdigital:votes",
    defaultValue: [],
  });

  function hasVoted(slug: string) {
    return votes.includes(slug);
  }

  function toggleVote(slug: string) {
    setVotes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  return { hasVoted, toggleVote };
}
