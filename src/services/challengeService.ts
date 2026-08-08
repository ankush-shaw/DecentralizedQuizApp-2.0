import type { ChallengePayload, CustomQuiz } from '../types/challenge';
import type { Question, QuizCategory } from '../types';

// ─── Challenge Code Engine ────────────────────────────────────────────────────
// Encodes a CustomQuiz into a compact shareable string (base64url) and decodes
// it back. The code format is: DQ-<6char hash>  (for display) while the full
// payload is stored in localStorage keyed by that hash.

const CHALLENGE_STORAGE_KEY = 'dquiz_challenges';
const ATTEMPT_STORAGE_KEY = 'dquiz_challenge_attempts';

/** Generate a short 6-character alphanumeric hash from a string */
function shortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
  let result = '';
  let absHash = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    result += chars[absHash % chars.length];
    absHash = Math.floor(absHash / chars.length);
  }
  return result;
}

/** Encode a CustomQuiz into a compact ChallengePayload */
export function encodeQuiz(quiz: CustomQuiz): ChallengePayload {
  return {
    t: quiz.title.slice(0, 60),
    c: quiz.category,
    tp: quiz.timePerQuestion,
    q: quiz.questions.map((q) => {
      const correctIndex = q.options.indexOf(q.correctAnswer);
      return [q.text, q.options[0], q.options[1], q.options[2], q.options[3], correctIndex >= 0 ? correctIndex : 0] as [string, string, string, string, string, number];
    }),
    cr: quiz.creatorAddress,
  };
}

/** Decode a ChallengePayload back into a Question array */
export function decodePayload(payload: ChallengePayload): { title: string; category: QuizCategory; timePerQuestion: number; questions: Question[]; creator: string } {
  return {
    title: payload.t,
    category: (payload.c || 'All') as QuizCategory,
    timePerQuestion: payload.tp || 15,
    creator: payload.cr || 'Unknown',
    questions: payload.q.map((tuple, i) => {
      const options = [tuple[1], tuple[2], tuple[3], tuple[4]];
      return {
        id: 1000 + i,
        text: tuple[0],
        options,
        correctAnswer: options[tuple[5]] || options[0],
        category: (payload.c || 'All') as QuizCategory,
      };
    }),
  };
}

/** Generate a challenge code for a quiz and store it */
export function generateChallengeCode(quiz: CustomQuiz): string {
  const payload = encodeQuiz(quiz);
  const jsonStr = JSON.stringify(payload);
  const code = shortHash(jsonStr + quiz.id + Date.now());

  // Store the full payload keyed by code
  const stored = getAllChallenges();
  stored[code] = {
    payload,
    quizId: quiz.id,
    createdAt: quiz.createdAt,
    attemptCount: 0,
  };
  localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(stored));

  return `DQ-${code}`;
}

/** Look up a challenge by its code (with or without DQ- prefix) */
export function lookupChallenge(code: string): { payload: ChallengePayload; quizId: string; createdAt: string; attemptCount: number } | null {
  const cleanCode = code.replace(/^DQ-/i, '').toUpperCase().trim();
  const stored = getAllChallenges();
  return stored[cleanCode] || null;
}

/** Get all stored challenges */
export function getAllChallenges(): Record<string, { payload: ChallengePayload; quizId: string; createdAt: string; attemptCount: number }> {
  try {
    return JSON.parse(localStorage.getItem(CHALLENGE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Increment attempt count for a challenge */
export function incrementAttemptCount(code: string): void {
  const cleanCode = code.replace(/^DQ-/i, '').toUpperCase().trim();
  const stored = getAllChallenges();
  if (stored[cleanCode]) {
    stored[cleanCode].attemptCount++;
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(stored));
  }
}

// ─── Attempt Tracking ─────────────────────────────────────────────────────────

export interface StoredAttempt {
  challengeCode: string;
  quizTitle: string;
  playerAddress: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

/** Save an attempt record */
export function saveAttempt(attempt: StoredAttempt): void {
  const attempts = getAllAttempts();
  attempts.push(attempt);
  localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempts));
}

/** Get all attempts */
export function getAllAttempts(): StoredAttempt[] {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPT_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/** Get attempts for a specific challenge code */
export function getAttemptsForChallenge(code: string): StoredAttempt[] {
  const cleanCode = code.replace(/^DQ-/i, '').toUpperCase().trim();
  return getAllAttempts().filter((a) => a.challengeCode.replace(/^DQ-/i, '').toUpperCase() === cleanCode);
}

/** Get attempts by a specific player */
export function getAttemptsForPlayer(address: string): StoredAttempt[] {
  return getAllAttempts().filter((a) => a.playerAddress === address);
}
