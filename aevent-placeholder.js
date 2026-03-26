/**
 * AEvent Placeholder Script
 * - Fills {!reg-*} merge tags with a fixed future date
 * - Drives countdown using id="days/hours/minutes/seconds"
 * - Keeps timer perpetually running (never hits zero)
 */

(function () {
  "use strict";

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  const LEAD_MS = 24 * 60 * 60 * 1000;       // target = 24h from now
  const RESET_THRESHOLD_MS = 60 * 1000;       // reset if < 1 min remains
  const TICK_MS = 1000;

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function getTarget() {
    return Date.now() + LEAD_MS;
  }

  // ─── MERGE TAG REPLACEMENT ───────────────────────────────────────────────────
  // Builds a fake "registration date" 24 h from now and replaces {!reg-*} tokens
  // in all text nodes on the page.
  function replaceMergeTags() {
    const future = new Date(getTarget());

    const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];

    // Format hour as 12h with AM/PM
    let hour = future.getHours();
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const minute = pad(future.getMinutes());

    const replacements = {
      "{!reg-dayofweek}":  DAYS[future.getDay()],
      "{!reg-dayofmonth}": future.getDate(),
      "{!reg-month}":      MONTHS[future.getMonth()],
      "{!reg-year}":       future.getFullYear(),
      "{!reg-timeZone}":   `${hour}:${minute} ${ampm}`,
      "{!reg-time}":       `${hour}:${minute} ${ampm}`,
    };

    // Walk all text nodes and replace any tokens found
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      let val = node.nodeValue;
      let changed = false;
      for (const [token, replacement] of Object.entries(replacements)) {
        if (val.includes(token)) {
          val = val.split(token).join(replacement);
          changed = true;
        }
      }
      if (changed) node.nodeValue = val;
    }
  }

  // ─── COUNTDOWN ───────────────────────────────────────────────────────────────
  let target = getTarget();

  function tick() {
    const diff = target - Date.now();

    if (diff <= RESET_THRESHOLD_MS) {
      target = getTarget();
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    // Target the exact IDs used in your countdown HTML
    const els = {
      days:    document.getElementById("days"),
      hours:   document.getElementById("hours"),
      minutes: document.getElementById("minutes"),
      seconds: document.getElementById("seconds"),
    };

    if (els.days)    els.days.textContent    = pad(d);
    if (els.hours)   els.hours.textContent   = pad(h);
    if (els.minutes) els.minutes.textContent = pad(m);
    if (els.seconds) els.seconds.textContent = pad(s);

    // Also cover other AEvent-style selectors as fallback
    document.querySelectorAll(".wtl-days, [class*='days'][class*='count']")
      .forEach(el => el.textContent = pad(d));
    document.querySelectorAll(".wtl-hours, [class*='hours'][class*='count']")
      .forEach(el => el.textContent = pad(h));
    document.querySelectorAll(".wtl-mins, .wtl-minutes, [class*='minutes'][class*='count']")
      .forEach(el => el.textContent = pad(m));
    document.querySelectorAll(".wtl-secs, .wtl-seconds, [class*='seconds'][class*='count']")
      .forEach(el => el.textContent = pad(s));

    // Keep countdown wrapper visible
    document.querySelectorAll(".countdown-box, .wtl-timer, .aevent-timer, [class*='countdown']")
      .forEach(el => {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.hidden = false;
      });

    // Expose globals
    window.wtlCountdown = { days: d, hours: h, minutes: m, seconds: s, target };
  }

  // ─── OVERRIDE AEVENT GLOBALS ─────────────────────────────────────────────────
  function overrideGlobals() {
    const futureISO = new Date(target).toISOString();
    window.wtl_end_time     = futureISO;
    window.webinarEndTime   = futureISO;
    window.aeventEndTime    = futureISO;
    window.countdownEndTime = futureISO;
  }

  // ─── INIT ────────────────────────────────────────────────────────────────────
  function init() {
    replaceMergeTags();
    overrideGlobals();
    tick();
    setInterval(tick, TICK_MS);
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
