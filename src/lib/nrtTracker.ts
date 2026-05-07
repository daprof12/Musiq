/**
 * NRT Tracker Service — Musiq Platform Integration
 *
 * Singleton wrapper around @daprof12/tracker.
 * Translates music-streaming concepts (track duration, bitrate) into
 * the NetReward tracking primitives (deviceId, campaignId, bytes).
 *
 * NOTE: We import from the local shim until the GitHub PAT is configured.
 * To switch to the real package:
 *   1. Add .npmrc with GitHub registry + PAT
 *   2. Run: npm install @daprof12/tracker
 *   3. Change the import below to: import { NetRewardTracker } from '@daprof12/tracker';
 *   4. Delete src/lib/daprof12-tracker-shim.ts
 */

import { NetRewardTracker } from './daprof12-tracker-shim';

// ── Constants ─────────────────────────────────────────────────────────────────


/** Fraction of traffic that is upstream (headers, heartbeats, control) */
const UPSTREAM_FRACTION = 0.05;

// ── Singleton instance ────────────────────────────────────────────────────────

let _tracker: NetRewardTracker | null = null;

function getTracker(): NetRewardTracker {
  if (!_tracker) {
    const apiKey = import.meta.env.VITE_NRT_API_KEY as string;
    // For HMAC signing of tracking events — must match webhook_secret in sp_api_keys
    const apiSecret = (import.meta.env.VITE_NRT_WEBHOOK_SECRET || import.meta.env.VITE_NRT_API_SECRET) as string;

    if (!apiKey || !apiSecret) {
      console.warn('[NrtTracker] VITE_NRT_API_KEY or VITE_NRT_API_SECRET not set. Tracking disabled.');
      // Return a no-op tracker so callers never crash
      return createNoopTracker();
    }

    const netrewardUrl = 'https://pmpeyfkbqipfnhokfksl.supabase.co';

    _tracker = new NetRewardTracker({
      apiKey,
      apiSecret,
      // Tracking endpoint is the NetReward project, not the local Musiq project
      endpoint: `${netrewardUrl}/functions/v1/tracking`,
      flushIntervalMs: 60_000,  // flush every 60 s
      maxBatchSize: 50,
    });
  }
  return _tracker;
}

// ── No-op fallback (env vars missing / disabled in dev) ───────────────────────

function createNoopTracker(): NetRewardTracker {
  return {
    startSession: () => {},
    endSession: () => {},
    reportUsage: () => {},
    destroy: () => {},
    pendingEvents: 0,
    startSimulation: () => {},
    stopSimulation: () => {},
  } as unknown as NetRewardTracker;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call this when a user starts playing a track.
 *
 * @param userId       The Musiq user ID (for logging only — deviceId drives NRT)
 * @param deviceId     A stable device identifier (persisted in localStorage)
 * @param campaignId   The active NetReward campaign ID for this SP
 */
export function trackPlayStart(userId: string, deviceId: string, campaignId: string): void {
  getTracker().startSession(deviceId, campaignId);
  console.log(`[NrtTracker] Play started — user:${userId} device:${deviceId} campaign:${campaignId}`);
}

/**
 * Call this when a track ends, pauses, or a new track is loaded.
 * Duration is used to estimate bytes consumed at 320 kbps.
 *
 * @param trackDurationSecs  How many seconds were actually played (not total track length)
 * @param bitrate            Optional override (bps). Defaults to 320 000.
 */
export function trackPlayEnd(trackDurationSecs: number, bitrate = 320_000): void {
  const bytesPerSec = bitrate / 8;
  const bytesDown   = Math.floor(trackDurationSecs * bytesPerSec);
  const bytesUp     = Math.floor(bytesDown * UPSTREAM_FRACTION);

  getTracker().reportUsage(bytesUp, bytesDown);
  getTracker().endSession();
  console.log(
    `[NrtTracker] Play ended — ${trackDurationSecs}s played ≈ ${(bytesDown / 1e6).toFixed(2)} MB down`,
  );
}

/**
 * One-shot helper: track a complete session inline.
 * Use when you already know the full duration (e.g. after a track completes).
 */
export function trackStreamingSession(
  userId: string,
  deviceId: string,
  campaignId: string,
  trackDurationSecs: number,
  bitrate = 320_000,
): void {
  trackPlayStart(userId, deviceId, campaignId);
  trackPlayEnd(trackDurationSecs, bitrate);
}

/**
 * Clean up the tracker singleton on app unmount.
 * Flushes any remaining buffered events before teardown.
 */
export function destroyTracker(): void {
  _tracker?.destroy();
  _tracker = null;
}

/** Returns number of events currently buffered (useful for debug UI). */
export function getPendingEventCount(): number {
  return _tracker?.pendingEvents ?? 0;
}

/**
 * Returns a stable device ID for this browser session.
 * Creates and persists one in localStorage on first call.
 */
export function getDeviceId(): string {
  const key = 'nrt_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Musiq's active NetReward campaign ID — set from the dashboard. */
export const MUSIQ_CAMPAIGN_ID = import.meta.env.VITE_NRT_CAMPAIGN_ID ?? 'musiq-default';

export default { trackPlayStart, trackPlayEnd, trackStreamingSession, destroyTracker, getPendingEventCount, getDeviceId };
