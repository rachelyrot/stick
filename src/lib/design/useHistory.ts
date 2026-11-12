"use client";

import { useCallback, useRef, useState } from "react";

/**
 * היסטוריית ביטול/חזרה.
 * - commit(next): שינוי רגיל — נשמר בהיסטוריה.
 * - begin() + preview(next): לשינויים רציפים (גרירה/סליידר) — נקודת שמירה אחת בתחילת הפעולה.
 */
export function useHistory<T>(initial: T, limit = 80) {
  const [present, setPresent] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const presentRef = useRef(present);
  presentRef.current = present;
  const [, force] = useState(0);

  const push = (snapshot: T) => {
    past.current.push(snapshot);
    if (past.current.length > limit) past.current.shift();
    future.current = [];
  };

  const commit = useCallback((next: T | ((p: T) => T)) => {
    const value = typeof next === "function" ? (next as (p: T) => T)(presentRef.current) : next;
    push(presentRef.current);
    presentRef.current = value;
    setPresent(value);
  }, []);

  const begin = useCallback(() => {
    push(presentRef.current);
    force((n) => n + 1);
  }, []);

  const preview = useCallback((next: T | ((p: T) => T)) => {
    const value = typeof next === "function" ? (next as (p: T) => T)(presentRef.current) : next;
    presentRef.current = value;
    setPresent(value);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (prev === undefined) return;
    future.current.push(presentRef.current);
    presentRef.current = prev;
    setPresent(prev);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(presentRef.current);
    presentRef.current = next;
    setPresent(next);
  }, []);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    presentRef.current = value;
    setPresent(value);
  }, []);

  return {
    present,
    commit,
    begin,
    preview,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
