export function buildHint(word: string, typedLength: number): string {
  const chars = word.split("");
  return chars
    .map((ch, i) => {
      if (ch === " ") return " ";
      if (i === 0 || i < typedLength) return chars[i];
      return "_";
    })
    .join(" ");
}
