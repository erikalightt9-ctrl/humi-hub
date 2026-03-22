/**
 * Thin service layer for leaderboard operations.
 * The actual computation lives in quiz.repository (getCourseLeaderboard).
 * This file exists so the attempt route can call updateCourseLeaderboard()
 * as a non-blocking fire-and-forget hook without importing the repository directly.
 */

// Currently a no-op: the leaderboard is computed on-demand from quiz_attempts.
// If a cached leaderboard model is added in the future, refresh logic goes here.
export async function updateCourseLeaderboard(_courseId: string): Promise<void> {
  // intentional no-op — leaderboard is always computed live from quiz_attempts
}
