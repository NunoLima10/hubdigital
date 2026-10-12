// Publishing from the submit form navigates to the releases list, so the
// celebration has to survive the route change. The form marks the project
// here; the matching releases item takes the mark once and plays it.
const pending = new Set<number>();

export function celebrateLaunch(projectId: number) {
  pending.add(projectId);
}

export function takeLaunchCelebration(projectId: number) {
  return pending.delete(projectId);
}
