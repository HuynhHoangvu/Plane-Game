import type { FallingEntity } from "./types";

const MIN_GAP_PX = 24;

export function findSpawnX(
  textWidth: number,
  canvasWidth: number,
  activeEntities: FallingEntity[],
  recentTopY = 80,
): number {
  const margin = 16;
  const maxX = Math.max(margin, canvasWidth - textWidth - margin);
  const recent = activeEntities.filter((e) => e.y < recentTopY);

  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = margin + Math.random() * (maxX - margin);
    const overlaps = recent.some((e) => {
      const aStart = candidate;
      const aEnd = candidate + textWidth;
      const bStart = e.x;
      const bEnd = e.x + e.width;
      return aStart < bEnd + MIN_GAP_PX && bStart < aEnd + MIN_GAP_PX;
    });
    if (!overlaps) return candidate;
  }
  return margin + Math.random() * (maxX - margin);
}

export function spawnRateForLevel(level: number): number {
  const start = 2.7;
  const end = 0.9;
  const t = Math.min(1, (level - 1) / 19);
  return start + (end - start) * t;
}

export function maxActiveForLevel(level: number): number {
  const start = 5;
  const end = 10;
  const t = Math.min(1, (level - 1) / 19);
  return Math.round(start + (end - start) * t);
}

export function baseSpeedForLevel(
  level: number,
  canvasHeight: number,
  speedMultiplier = 1,
): number {
  const fallTimeStart = 13;
  const fallTimeEnd = 5.5;
  const t = Math.min(1, (level - 1) / 9);
  const fallTime = fallTimeStart + (fallTimeEnd - fallTimeStart) * t;
  return (canvasHeight / fallTime) * speedMultiplier;
}

export function speedForText(baseSpeed: number, textLength: number): number {
  if (textLength <= 4) return baseSpeed;
  if (textLength >= 8) return baseSpeed * 0.87;
  const t = (textLength - 4) / 4;
  return baseSpeed * (1 - 0.13 * t);
}
