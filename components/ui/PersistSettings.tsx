"use client";

import { useEffect } from "react";
import type { CEFRLevel } from "@/lib/types";
import { saveLastSettings } from "@/lib/storage";

interface PersistSettingsProps {
  level: CEFRLevel;
  speed: string;
  mode: "normal" | "recall";
}

// Lưu lựa chọn Settings gần nhất vào localStorage để trang chủ (QuickPlayButton)
// đọc lại — tránh bug chọn C1 ở Settings nhưng bấm Play ở trang chủ lại về A1.
export default function PersistSettings({ level, speed, mode }: PersistSettingsProps) {
  useEffect(() => {
    saveLastSettings({ level, speed, mode });
  }, [level, speed, mode]);

  return null;
}
