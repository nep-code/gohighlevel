/**
 * AEvent Placeholder Script
 * Mimics AEvent's getscript behavior for development/testing.
 * Keeps the countdown timer perpetually running so the confirmation
 * page never auto-hides or collapses the timer section.
 *
 * Usage (drop-in replacement):
 *   <script defer type="application/javascript" src="aevent-placeholder.js"></script>
 *
 * What it does:
 *   - Finds any AEvent-style countdown elements on the page
 *   - Sets the target time 24 hours ahead (always in the future)
 *   - Ticks every second so the display stays live
 *   - Prevents AEvent's "hide on zero" behavior by resetting
 *     the target whenever it gets close to expiry
 */

(function () {
  "use strict";

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  // How far ahead (in ms) the fake webinar target should be.
  // 24 hours keeps it safely "in the future" no matter when the page loads.
  const LEAD_MS = 24 * 60 * 60 * 1000;

  // When the remaining time drops below this threshold (ms), reset the target.
  // This prevents any "end of countdown" logic from firing.
  const RESET_THRESHOLD_MS = 60 * 1000; // 1 minute safety buffer

  // Tick interval
  const TICK_MS = 1000;

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function getTarget() {
    return Date.now() + LEAD_MS;
  }

  // ─── SELECTORS ───────────────────────────────────────────────────────────────
  // AEvent uses these class/id patterns. We target all of them.
  const SELECTORS = {
    days:    "[class*='days'][class*='count'], #wtl-days,    .wtl-days",
    hours:   "[class*='hours'][class*='count'], #wtl-hours,  .wtl-hours",
    minutes: "[class*='minutes'][class*='count'], #wtl-mins, .wtl-minutes",
    seconds: "[class*='seconds'][class*='count'], #wtl-secs, .wtl-seconds",
    // AEvent wraps the whole timer in one of these
    wrapper: ".wtl-timer, .aevent-timer, [class*='countdown'], [id*='countdown']",
  };

  // ─── CORE ────────────────────────────────────────────────────────────────────
  let target = getTarget();

  function tick() {
    const diff = target - Date.now();

    // Safety reset — never let it reach zero
    if (diff <= RESET_THRESHOLD_MS) {
      target = getTarget();
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    // Push values to any matching elements
    document.querySelectorAll(SELECTORS.days).forEach(el => {
      el.textContent = pad(d);
    });
    document.querySelectorAll(SELECTORS.hours).forEach(el => {
      el.textContent = pad(h);
    });
    document.querySelectorAll(SELECTORS.minutes).forEach(el => {
      el.textContent = pad(m);
    });
    document.querySelectorAll(SELECTORS.seconds).forEach(el => {
      el.textContent = pad(s);
    });

    // Keep timer wrappers visible — override any AEvent hide attempts
    document.querySelectorAll(SELECTORS.wrapper).forEach(el => {
      el.style.removeProperty("display");
      el.style.removeProperty("visibility");
      el.style.removeProperty("opacity");
      el.hidden = false;
    });

    // Also expose values as globals in case page JS reads them directly
    window.wtlCountdown = { days: d, hours: h, minutes: m, seconds: s, target };
  }

  // ─── INTERCEPT AEvent GLOBALS ────────────────────────────────────────────────
  // AEvent scripts sometimes set window.wtl_end_time or window.webinarEndTime.
  // Override them so any page-level hide logic also stays fooled.
  function overrideGlobals() {
    const futureISO = new Date(target).toISOString();
    window.wtl_end_time     = futureISO;
    window.webinarEndTime   = futureISO;
    window.aeventEndTime    = futureISO;
    window.countdownEndTime = futureISO;
  }

  // ─── INIT ────────────────────────────────────────────────────────────────────
  function init() {
    overrideGlobals();
    tick(); // immediate first paint
    setInterval(tick, TICK_MS);

    // Re-override globals every 5 s in case a late-loading real script rewrites them
    setInterval(overrideGlobals, 5000);

    console.info(
      "[aevent-placeholder] Running. Target:", new Date(target).toLocaleString()
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
