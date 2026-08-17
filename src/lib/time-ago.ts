// Turns a real timestamp into a short "Ativo há X" label. Never fabricates a value —
// callers must pass an actual DateTime (e.g. the most recent Admin.lastLoginAt); when
// there isn't one, this returns a neutral fallback string instead of a fake number.
export function formatActiveAgoLabel(lastActiveAt: Date | null): string {
  if (!lastActiveAt) return "Ativo recentemente";

  const diffMs = Date.now() - lastActiveAt.getTime();
  if (diffMs < 0) return "Ativo recentemente";

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "Ativo agora";
  if (minutes < 60) return `Ativo há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Ativo há ${hours} ${hours === 1 ? "hora" : "horas"}`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Ativo há ${days} ${days === 1 ? "dia" : "dias"}`;

  return "Ativo recentemente";
}
