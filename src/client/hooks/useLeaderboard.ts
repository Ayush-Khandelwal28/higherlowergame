import React from 'react';
import type { LeaderboardEntry, LeaderboardGetResponse, LeaderboardMode, LeaderboardSubmitResponse } from '../../shared/types/api';

export interface UseLeaderboardOptions {
  mode: LeaderboardMode;
  limit?: number;
  pollMs?: number; // optional polling
}

export interface UseLeaderboardState {
  loading: boolean;
  error: string | null;
  entries: LeaderboardEntry[];
  user: LeaderboardGetResponse['user'];
  fetchedAt: string | null;
}

export interface UseLeaderboardReturn extends UseLeaderboardState {
  refresh: () => void;
  submit: (score: number) => Promise<LeaderboardSubmitResponse | null>;
  ensureSubmitted: (score: number) => Promise<void>;
  submitting: boolean;
}

export function useLeaderboard(opts: UseLeaderboardOptions): UseLeaderboardReturn {
  const { mode, limit = 25, pollMs } = opts;
  const [state, setState] = React.useState<UseLeaderboardState>({
    loading: false,
    error: null,
    entries: [],
    user: null,
    fetchedAt: null,
  });
  const inFlightRef = React.useRef<Promise<void> | null>(null);
  const lastSubmittedRef = React.useRef<number | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchBoard = React.useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const url = `/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LeaderboardGetResponse = await res.json();
      setState({
        loading: false,
        error: null,
        entries: data.entries,
        user: data.user ?? null,
        fetchedAt: data.fetchedAt,
      });
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'error' }));
    }
  }, [mode, limit]);

  React.useEffect(() => { fetchBoard(); }, [fetchBoard]);

  React.useEffect(() => {
    if (!pollMs) return;
    const id = window.setInterval(fetchBoard, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, fetchBoard]);

  const submit = React.useCallback(async (score: number) => {
    try {
      if (typeof score !== 'number' || score <= 0) return null;
      setSubmitting(true);
      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, score }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LeaderboardSubmitResponse = await res.json();
      // refresh after submit if accepted
      if (data.accepted) fetchBoard();
      lastSubmittedRef.current = Math.max(lastSubmittedRef.current ?? 0, score);
      return data;
    } catch (_e) {
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [mode, fetchBoard]);

  const ensureSubmitted = React.useCallback(async (score: number) => {
    if (typeof score !== 'number' || score <= 0) return;
    if (lastSubmittedRef.current != null && lastSubmittedRef.current >= score) return;
    if (inFlightRef.current) {
      await inFlightRef.current;
      if (lastSubmittedRef.current != null && lastSubmittedRef.current >= score) return;
    }
    const p = (async () => {
      await submit(score);
    })().finally(() => { inFlightRef.current = null; });
    inFlightRef.current = p;
    await p;
  }, [submit]);

  return { ...state, refresh: fetchBoard, submit, ensureSubmitted, submitting };
}