/**
 * Game PIN encoding and decoding utility.
 * Generates clean, 6-character hexadecimal pins (e.g. "6bc434", "7e567f")
 * from database quiz IDs in a deterministic, fully-reversible way.
 */

const M = 16777216n; // 2^24 (fits 000000 to ffffff)
const A = 6271993n;
const A_INV = 3317321n;
const B = 5023817n;

/**
 * Encodes a numeric quiz ID into a 6-character hex PIN.
 * e.g. 1 -> "ac5c42", 2 -> "0c103b", 3 -> "6bc434"
 */
export function toGamePin(quizId: number | string): string {
  try {
    const idNum = typeof quizId === 'number' ? quizId : parseInt(quizId, 10);
    if (isNaN(idNum) || idNum <= 0) return String(quizId);
    const enc = (BigInt(idNum) * A + B) % M;
    return enc.toString(16).padStart(6, '0').toLowerCase();
  } catch {
    return String(quizId);
  }
}

/**
 * Decodes a 6-character hex PIN or raw ID back to the numeric quiz ID.
 * Works with uppercase, lowercase, "#" prefix, or directly entered numeric IDs.
 * e.g. "6bc434" -> 3, "#6BC434" -> 3, "3" -> 3
 */
export function parsePinToId(pinOrId: string | number | undefined | null): number | null {
  if (pinOrId === undefined || pinOrId === null) return null;
  const raw = String(pinOrId).trim().replace(/^#/, '');
  if (!raw) return null;

  // If already a small integer (e.g. "3", "42"), treat as direct ID
  if (/^\d+$/.test(raw) && raw.length < 6) {
    const directNum = parseInt(raw, 10);
    return isNaN(directNum) ? null : directNum;
  }

  // If 6-character hex code, invert the affine cipher
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    try {
      const num = BigInt(`0x${raw}`);
      let dec = (num - B) % M;
      if (dec < 0n) dec += M;
      const originalId = Number((dec * A_INV) % M);
      return originalId > 0 ? originalId : null;
    } catch {
      return null;
    }
  }

  // Fallback to integer parse
  const fallback = parseInt(raw, 10);
  return isNaN(fallback) ? null : fallback;
}

/**
 * Formats a quiz ID as a user-friendly PIN with "#" prefix (e.g. "#6bc434")
 */
export function formatGamePin(quizId: number | string): string {
  return `#${toGamePin(quizId)}`;
}
