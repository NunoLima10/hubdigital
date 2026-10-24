// A publish action and its destination live on different routes, so the
// celebration marker survives navigation and is consumed exactly once.
const pending = new Set<number>();

export function celebrateLaunch(projectId: number) {
  pending.add(projectId);
}

export function takeLaunchCelebration(projectId: number) {
  return pending.delete(projectId);
}
