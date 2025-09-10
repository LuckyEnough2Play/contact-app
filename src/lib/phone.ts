export function normalizeNumber(input: string | undefined | null): string {
  if (!input) return '';
  // Keep leading +, strip everything else non-digit
  let s = input.trim();
  const hasPlus = s.startsWith('+');
  s = s.replace(/[^0-9]/g, '');
  if (hasPlus && s.length > 0) return `+${s}`;
  return s;
}

export function numbersMatch(aRaw: string, bRaw: string): boolean {
  const a = normalizeNumber(aRaw);
  const b = normalizeNumber(bRaw);
  if (!a || !b) return false;
  if (a === b) return true;
  // Fallback: last 7 or 10 digits match
  const tail = (n: string, len: number) => (n.length >= len ? n.slice(-len) : n);
  const a7 = tail(a, 7);
  const b7 = tail(b, 7);
  if (a7 && b7 && a7 === b7) return true;
  const a10 = tail(a, 10);
  const b10 = tail(b, 10);
  return a10 && b10 && a10 === b10;
}

