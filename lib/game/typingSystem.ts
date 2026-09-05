import type { FallingEntity } from "./types";

export interface TypingResult {
  lockedId: string | null;
  hitEntityId: string | null; // entity whose typedLength advanced this keypress
  completedEntityId: string | null; // entity fully typed this keypress
  miss: boolean;
}

export function processKeyPress(
  key: string,
  entities: FallingEntity[],
  lockedId: string | null,
): TypingResult {
  const char = key.toLowerCase();
  if (char.length !== 1) {
    return { lockedId, hitEntityId: null, completedEntityId: null, miss: false };
  }

  let target = lockedId ? entities.find((e) => e.id === lockedId && !e.dead) : undefined;

  if (!target) {
    target = entities.find(
      (e) => !e.dead && e.displayText[0]?.toLowerCase() === char && e.typedLength === 0,
    );
    if (!target) {
      return { lockedId: null, hitEntityId: null, completedEntityId: null, miss: true };
    }
  }

  const nextChar = target.displayText[target.typedLength]?.toLowerCase();
  if (nextChar !== char) {
    return { lockedId: target.id, hitEntityId: null, completedEntityId: null, miss: true };
  }

  target.typedLength += 1;
  const completed = target.typedLength >= target.displayText.length;

  return {
    lockedId: completed ? null : target.id,
    hitEntityId: target.id,
    completedEntityId: completed ? target.id : null,
    miss: false,
  };
}
