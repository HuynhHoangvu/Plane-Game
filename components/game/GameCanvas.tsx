"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { WordData, PhraseData, BossData, SourceLang, CEFRLevel } from "@/lib/types";
import type { FallingEntity } from "@/lib/game/types";
import {
  findSpawnX,
  spawnRateForLevel,
  maxActiveForLevel,
  baseSpeedForLevel,
  speedForText,
} from "@/lib/game/spawnSystem";
import { processKeyPress } from "@/lib/game/typingSystem";
import { buildHint } from "@/lib/game/recallSystem";
import { playCorrectBeep, playErrorBeep, playExplosion, playWarning } from "@/lib/game/audio";
import { speakOffline, primeOfflineTts } from "@/lib/game/offlineTts";
import {
  loadMuted,
  saveMuted,
  loadProgress,
  saveProgress,
  addLeaderboardEntry,
} from "@/lib/storage";
import HeaderBar from "@/components/ui/HeaderBar";
import DeadlineLine from "@/components/ui/DeadlineLine";
import BossPanel from "@/components/ui/BossPanel";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  age: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  targetKind: "entity" | "boss";
}

const CANVAS_W = 960;
const CANVAS_H = 600;
const DEADLINE_Y = CANVAS_H - 50;
const MAX_HP = 3;
const PLANE_X = CANVAS_W / 2;
const PLANE_Y = DEADLINE_Y - 6;
const PROJECTILE_SPEED = 900;

export default function GameCanvas({
  sourceLang,
  cefrLevel,
  fallSpeedMultiplier = 0.8,
  gameMode = "normal",
}: {
  sourceLang: SourceLang;
  cefrLevel: CEFRLevel;
  fallSpeedMultiplier?: number;
  gameMode?: "normal" | "recall";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [level, setLevel] = useState(1);
  const [topic] = useState(cefrLevel);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const [words, setWords] = useState<WordData[]>([]);
  const [phrases, setPhrases] = useState<PhraseData[]>([]);
  const [bossList, setBossList] = useState<BossData[]>([]);
  const [boss, setBoss] = useState<BossData | null>(null);
  const [bossActive, setBossActive] = useState(false);
  const [bossTypedLength, setBossTypedLength] = useState(0);
  const [bossTimeLeft, setBossTimeLeft] = useState(0);
  const [bossTotalTime, setBossTotalTime] = useState(0);
  const [bossReveal, setBossReveal] = useState(false);
  const [bossSpawnsIn, setBossSpawnsIn] = useState(40);

  const entitiesRef = useRef<FallingEntity[]>([]);
  const lockedIdRef = useRef<string | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const lastSpawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const spawnCountRef = useRef(0);

  const pausedRef = useRef(paused);
  const bossActiveRef = useRef(bossActive);
  const bossRef = useRef<BossData | null>(null);
  const levelRef = useRef(level);
  const mutedRef = useRef(muted);
  const lastWarningRef = useRef(0);
  const scoreRef = useRef(score);
  const bossListRef = useRef<BossData[]>([]);
  const planeAngleRef = useRef(0);
  const planeRecoilRef = useRef(0);
  const bossSpawnsInRef = useRef(40);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    bossActiveRef.current = bossActive;
  }, [bossActive]);
  useEffect(() => {
    bossRef.current = boss;
  }, [boss]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    bossListRef.current = bossList;
  }, [bossList]);

  useEffect(() => {
    // Reading localStorage must happen post-mount to avoid SSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(loadMuted());
  }, []);

  useEffect(() => {
    primeOfflineTts(sourceLang);
  }, [sourceLang]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBestScore(loadProgress(sourceLang, cefrLevel).highScore);
  }, [sourceLang, cefrLevel]);

  useEffect(() => {
    fetch(`/api/words?lang=${sourceLang}&level=${cefrLevel}`).then((r) => r.json()).then(setWords);
    fetch(`/api/phrases?lang=${sourceLang}`).then((r) => r.json()).then(setPhrases);
    fetch(`/api/boss?lang=${sourceLang}`)
      .then((r) => r.json())
      .then((list: BossData[]) => {
        setBossList(list);
        setBoss(list[Math.floor(Math.random() * list.length)] ?? null);
      });
  }, [sourceLang, cefrLevel]);

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * (60 + Math.random() * 80),
        vy: Math.sin(angle) * (60 + Math.random() * 80),
        life: 1,
        color,
      });
    }
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (mutedRef.current) return;
      speakOffline(text, sourceLang);
    },
    [sourceLang],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      saveMuted(next);
      return next;
    });
  }, []);

  const fireProjectile = useCallback((targetId: string, targetKind: "entity" | "boss") => {
    projectilesRef.current.push({
      id: `${Date.now()}-${Math.random()}`,
      x: PLANE_X,
      y: PLANE_Y,
      targetId,
      targetKind,
    });

    let targetX = CANVAS_W / 2;
    let targetY = 60;
    if (targetKind === "entity") {
      const target = entitiesRef.current.find((e) => e.id === targetId);
      if (target) {
        targetX = target.x + target.width / 2;
        targetY = target.y - 6;
      }
    }
    const dx = targetX - PLANE_X;
    const dy = targetY - PLANE_Y;
    const angle = Math.max(-0.35, Math.min(0.35, Math.atan2(dx, -dy)));
    planeAngleRef.current = angle;
    planeRecoilRef.current = 5;
  }, []);

  const spawnEntity = useCallback(() => {
    const wordsPool = words;
    const phrasesPool = phrases;
    if (wordsPool.length === 0) return;

    spawnCountRef.current += 1;
    const useElite = spawnCountRef.current % 5 === 0 && phrasesPool.length > 0;
    const useRecall = gameMode === "recall" && !useElite;

    const ctx = ctxRef.current;
    let text: string;
    let meaning: string;
    let kind: FallingEntity["kind"] = "minion";

    if (useElite) {
      const p = phrasesPool[Math.floor(Math.random() * phrasesPool.length)];
      text = p.text;
      meaning = p.translations["vi"] ?? "";
      kind = "elite";
    } else {
      const w = wordsPool[Math.floor(Math.random() * wordsPool.length)];
      text = w.word;
      meaning = w.translations["vi"] ?? "";
      kind = useRecall ? "recall" : "minion";
    }

    if (ctx) ctx.font = "28px sans-serif";
    const width = ctx ? ctx.measureText(text).width : text.length * 16;

    const baseSpeed = baseSpeedForLevel(levelRef.current, CANVAS_H, fallSpeedMultiplier);
    let speed = speedForText(baseSpeed, text.length);
    if (kind === "elite") speed *= 0.6;

    const x = findSpawnX(width, CANVAS_W, entitiesRef.current);

    entitiesRef.current.push({
      id: `${Date.now()}-${Math.random()}`,
      kind,
      displayText: text,
      meaningText: meaning,
      typedLength: 0,
      x,
      y: -20,
      speed,
      createdAt: performance.now(),
      width,
      dead: false,
      isRecall: kind === "recall",
    });
  }, [words, phrases, fallSpeedMultiplier, gameMode]);

  const triggerBoss = useCallback(() => {
    const list = bossListRef.current;
    if (list.length === 0) return;
    const nextBoss =
      list.length > 1
        ? list.filter((b) => b.boss_id !== bossRef.current?.boss_id)[
            Math.floor(Math.random() * (list.length - 1))
          ]
        : list[0];
    const comfortableTime = nextBoss.text.length * 0.55 + 8;
    const timeLimit = Math.max(nextBoss.time_limit_seconds, comfortableTime);

    entitiesRef.current = [];
    lockedIdRef.current = null;
    projectilesRef.current = [];
    spawnCountRef.current += 1;

    setBoss(nextBoss);
    setBossActive(true);
    setBossTypedLength(0);
    setBossTimeLeft(timeLimit);
    setBossTotalTime(timeLimit);
  }, []);

  const handleMiss = useCallback(() => {
    setCombo(0);
    if (!mutedRef.current) playErrorBeep();
  }, []);

  const handleHit = useCallback(() => {
    setCombo((c) => c + 1);
    if (!mutedRef.current) playCorrectBeep();
  }, []);

  const handleEntityComplete = useCallback(
    (entity: FallingEntity) => {
      setScore((s) => s + (entity.kind === "elite" ? 150 : 50));
      spawnParticles(entity.x + entity.width / 2, entity.y, entity.kind === "elite" ? "#facc15" : "#22d3ee");
      if (!mutedRef.current) playExplosion();
      speakText(entity.displayText);
      if (entity.meaningText) {
        floatingTextsRef.current.push({
          id: entity.id,
          x: entity.x + entity.width / 2,
          y: entity.y,
          text: entity.meaningText,
          age: 0,
        });
      }
    },
    [spawnParticles, speakText],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current || gameOver) return;

      if (e.key === "Escape") {
        if (!bossActiveRef.current) {
          const target = entitiesRef.current.find((en) => en.id === lockedIdRef.current);
          if (target) target.typedLength = 0;
          lockedIdRef.current = null;
        }
        return;
      }

      if (bossActiveRef.current && bossRef.current) {
        const text = bossRef.current.text;
        const char = e.key.toLowerCase();
        if (char.length !== 1) return;
        setBossTypedLength((prevLen) => {
          const nextChar = text[prevLen]?.toLowerCase();
          if (nextChar !== char) {
            handleMiss();
            return prevLen;
          }
          handleHit();
          fireProjectile("boss", "boss");
          const newLen = prevLen + 1;
          if (newLen >= text.length) {
            setScore((s) => s + bossRef.current!.base_score);
            speakText(text);
            setTimeout(() => {
              setBossReveal(true);
              setPaused(true);
            }, 300);
          }
          return newLen;
        });
        return;
      }

      const result = processKeyPress(e.key, entitiesRef.current, lockedIdRef.current);
      lockedIdRef.current = result.lockedId;
      if (result.miss) {
        handleMiss();
        return;
      }
      if (result.hitEntityId) {
        handleHit();
        fireProjectile(result.hitEntityId, "entity");
      }
      if (result.completedEntityId) {
        const entity = entitiesRef.current.find((en) => en.id === result.completedEntityId);
        if (entity) {
          entity.dead = true;
          handleEntityComplete(entity);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameOver, handleMiss, handleHit, handleEntityComplete, fireProjectile, speakText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext("2d");
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const tick = (time: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#05050f";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.strokeStyle = "rgba(239,68,68,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, DEADLINE_Y);
      ctx.lineTo(CANVAS_W, DEADLINE_Y);
      ctx.stroke();

      if (pausedRef.current) {
        return;
      }

      if (!bossActiveRef.current) {
        lastSpawnRef.current += dt;
        const spawnRate = spawnRateForLevel(levelRef.current);
        const maxActive = maxActiveForLevel(levelRef.current);
        const aliveCount = entitiesRef.current.filter((e) => !e.dead).length;
        if (lastSpawnRef.current >= spawnRate && aliveCount < maxActive) {
          lastSpawnRef.current = 0;
          spawnEntity();
        }

        let hpLost = false;
        let nearDeadline = false;
        for (const entity of entitiesRef.current) {
          if (entity.dead) continue;
          entity.y += entity.speed * dt;
          if (entity.y >= DEADLINE_Y - 60) nearDeadline = true;
          if (entity.y >= DEADLINE_Y) {
            entity.dead = true;
            hpLost = true;
            spawnParticles(entity.x + entity.width / 2, DEADLINE_Y, "#ef4444");
          }
        }
        if (nearDeadline && !mutedRef.current && time - lastWarningRef.current > 900) {
          lastWarningRef.current = time;
          playWarning();
        }
        if (hpLost) {
          setHp((h) => {
            const next = h - 1;
            if (next <= 0) {
              setGameOver(true);
              const finalScore = scoreRef.current;
              saveProgress(sourceLang, cefrLevel, { highScore: finalScore, maxLevel: levelRef.current });
              addLeaderboardEntry({ score: finalScore, lang: sourceLang, level: cefrLevel, date: new Date().toISOString() });
              setBestScore((b) => Math.max(b, finalScore));
            }
            return Math.max(0, next);
          });
          setCombo(0);
        }

        entitiesRef.current = entitiesRef.current.filter((e) => !e.dead);
      }

      for (const entity of entitiesRef.current) {
        const isRecall = entity.isRecall;
        ctx.font = "28px sans-serif";
        const drawText = isRecall
          ? buildHint(entity.displayText, entity.typedLength)
          : entity.displayText;

        if (entity.id === lockedIdRef.current) {
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#facc15";
          ctx.shadowBlur = 10;
          ctx.strokeRect(entity.x - 8, entity.y - 26, entity.width + 16, 36);
          ctx.shadowBlur = 0;
        }

        const hintTokens = isRecall ? drawText.split(" ") : null;
        for (let i = 0; i < entity.displayText.length; i++) {
          const charToDraw = hintTokens ? hintTokens[i] ?? "_" : entity.displayText[i];
          const typed = i < entity.typedLength;
          ctx.fillStyle = typed ? "#4ade80" : "#f8fafc";
          const prevWidth = ctx.measureText(entity.displayText.slice(0, i)).width;
          ctx.fillText(charToDraw, entity.x + prevWidth, entity.y);
        }

        if (!isRecall && entity.meaningText && entity.kind !== "elite") {
          ctx.font = "14px sans-serif";
          ctx.fillStyle = "rgba(148,163,184,0.8)";
          ctx.fillText(entity.meaningText, entity.x, entity.y + 18);
        }
        if (isRecall && entity.meaningText) {
          ctx.font = "14px sans-serif";
          ctx.fillStyle = "rgba(250,204,21,0.9)";
          ctx.fillText(`[ ${entity.meaningText} ]`, entity.x, entity.y - 16);
        }
      }

      particlesRef.current.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1.5;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      particlesRef.current.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      floatingTextsRef.current.forEach((f) => (f.age += dt));
      floatingTextsRef.current = floatingTextsRef.current.filter((f) => f.age < 2.5);
      floatingTextsRef.current.forEach((f) => {
        ctx.globalAlpha = Math.max(0, 1 - f.age / 2.5);
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#facc15";
        ctx.fillText(f.text, f.x - 20, f.y - 30 - f.age * 15);
        ctx.globalAlpha = 1;
      });

      const newBossSpawnsIn = spawnCountRef.current > 0 ? 40 - (spawnCountRef.current % 40) : 40;
      if (newBossSpawnsIn !== bossSpawnsInRef.current) {
        bossSpawnsInRef.current = newBossSpawnsIn;
        setBossSpawnsIn(newBossSpawnsIn);
      }

      if (
        !bossActiveRef.current &&
        bossRef.current &&
        spawnCountRef.current > 0 &&
        spawnCountRef.current % 40 === 0
      ) {
        triggerBoss();
      }

      projectilesRef.current.forEach((proj) => {
        let targetX = CANVAS_W / 2;
        let targetY = 60;
        if (proj.targetKind === "entity") {
          const target = entitiesRef.current.find((e) => e.id === proj.targetId);
          if (target) {
            targetX = target.x + target.width / 2;
            targetY = target.y - 6;
          }
        }
        const dx = targetX - proj.x;
        const dy = targetY - proj.y;
        const dist = Math.hypot(dx, dy) || 1;
        const step = PROJECTILE_SPEED * dt;
        if (step >= dist) {
          proj.x = targetX;
          proj.y = targetY;
        } else {
          proj.x += (dx / dist) * step;
          proj.y += (dy / dist) * step;
        }
      });
      projectilesRef.current = projectilesRef.current.filter((proj) => {
        let targetX = CANVAS_W / 2;
        let targetY = 60;
        if (proj.targetKind === "entity") {
          const target = entitiesRef.current.find((e) => e.id === proj.targetId);
          if (target) {
            targetX = target.x + target.width / 2;
            targetY = target.y - 6;
          }
        }
        const arrived = Math.hypot(targetX - proj.x, targetY - proj.y) < 6;
        if (arrived) {
          spawnParticles(proj.x, proj.y, "#38bdf8");
        }
        return !arrived;
      });
      projectilesRef.current.forEach((proj) => {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y + 10);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      planeAngleRef.current *= Math.max(0, 1 - dt * 6);
      planeRecoilRef.current *= Math.max(0, 1 - dt * 8);

      ctx.save();
      ctx.translate(
        PLANE_X + Math.sin(planeAngleRef.current) * planeRecoilRef.current * -1,
        PLANE_Y + planeRecoilRef.current,
      );
      ctx.rotate(planeAngleRef.current);
      ctx.fillStyle = "#22d3ee";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(16, 12);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(0, -6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [gameOver, spawnEntity, spawnParticles, triggerBoss, sourceLang, cefrLevel]);

  useEffect(() => {
    if (!bossActive || paused) return;
    const interval = setInterval(() => {
      setBossTimeLeft((t) => {
        if (t <= 0.1) {
          setBossActive(false);
          setHp((h) => Math.max(0, h - 1));
          return 0;
        }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [bossActive, paused]);

  const continueAfterBoss = () => {
    setBossReveal(false);
    setBossActive(false);
    setPaused(false);
    setLevel((l) => {
      const next = l + 1;
      saveProgress(sourceLang, cefrLevel, { highScore: scoreRef.current, maxLevel: next });
      return next;
    });
  };

  const restart = () => {
    entitiesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    projectilesRef.current = [];
    spawnCountRef.current = 0;
    lockedIdRef.current = null;
    setScore(0);
    setCombo(0);
    setHp(MAX_HP);
    setLevel(1);
    setGameOver(false);
    setBossActive(false);
    setBossReveal(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-[960px] select-none">
      <HeaderBar
        level={level}
        topic={topic}
        score={score}
        combo={combo}
        hp={hp}
        maxHp={MAX_HP}
        bossSpawnsIn={bossSpawnsIn}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        muted={muted}
        onToggleMute={toggleMute}
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-cyan-950/40">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="block w-full" />
        <DeadlineLine />

        {bossActive && boss && (
          <BossPanel
            boss={boss}
            typedLength={bossTypedLength}
            timeLeft={bossTimeLeft}
            totalTime={bossTotalTime}
          />
        )}

        {bossReveal && boss && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 p-8 text-center backdrop-blur-sm">
            <p className="text-sm uppercase tracking-widest text-cyan-400">Boss Defeated</p>
            <p className="max-w-xl text-lg font-medium text-amber-300 [animation:fadeIn_1s_ease-in]">
              {boss.translations["vi"]}
            </p>
            <button
              onClick={continueAfterBoss}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2 font-semibold text-white shadow-lg shadow-fuchsia-900/40 transition hover:scale-105"
            >
              Nhấn để tiếp tục
            </button>
          </div>
        )}

        {paused && !bossReveal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/70 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">Tạm dừng</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaused(false)}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2 font-semibold text-white shadow-lg transition hover:scale-105"
              >
                Tiếp tục
              </button>
              <Link
                href="/"
                className="rounded-full border border-white/20 px-6 py-2 font-semibold text-white/80 transition hover:bg-white/10"
              >
                Thoát
              </Link>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85">
            <p className="text-3xl font-bold text-rose-400">Game Over</p>
            <p className="text-white/80">Điểm: {score}</p>
            <p className="text-sm text-amber-300">Kỷ lục: {Math.max(bestScore, score)}</p>
            <div className="flex gap-3">
              <button
                onClick={restart}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2 font-semibold text-white shadow-lg transition hover:scale-105"
              >
                Chơi lại
              </button>
              <Link
                href="/leaderboard"
                className="rounded-full border border-white/20 px-6 py-2 font-semibold text-white/80 transition hover:bg-white/10"
              >
                Bảng xếp hạng
              </Link>
              <Link
                href="/"
                className="rounded-full border border-white/20 px-6 py-2 font-semibold text-white/80 transition hover:bg-white/10"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-white/30">
        Nhấn <span className="text-white/60">Esc</span> để hủy khóa mục tiêu hiện tại
      </p>
    </div>
  );
}
