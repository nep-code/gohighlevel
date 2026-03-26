/**
 * AEvent Placeholder Script
 * - Loads countdown.css externally (no embedded styles)
 * - Auto-adds all required AEvent classes to your existing countdown HTML
 * - Fills {!reg-*} merge tags with a future date
 * - Keeps timer perpetually running (never hits zero)
 * - Hides seconds at max-width: 350px
 */

(function () {
  "use strict";

  const LEAD_MS            = 24 * 60 * 60 * 1000;
  const RESET_THRESHOLD_MS = 60 * 1000;
  const TICK_MS            = 1000;

  // ─── EXTERNAL CSS ─────────────────────────────────────────────────────────────
  const CSS_URL = "countdown.css";

  function loadExternalCSS() {
    if (document.getElementById("aevent-placeholder-css")) return;
    const link = document.createElement("link");
    link.id   = "aevent-placeholder-css";
    link.rel  = "stylesheet";
    link.type = "text/css";
    link.href = CSS_URL;
    document.head.appendChild(link);

    // Small screen: hide seconds
    const style = document.createElement("style");
    style.id = "aevent-placeholder-mq";
    style.textContent = `
      @media (max-width: 350px) {
        .countdown-section-seconds { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── INLINE STYLE ─────────────────────────────────────────────────────────────
  const countdownAmount = document.querySelectorAll('.countdown-amount');
  const countdownPeriod = document.querySelectorAll('.countdown-period');

  function loadInlineStyle() {
    countdownAmount.forEach(el => {
        el.style.border = "none";
        el.style.color = "var(--accent, #000)";
        el.style.backgroundColor = "rgb(255, 255, 255)";
        el.style.borderRadius = "12px 12px 0px 0px";
        el.style.fontFamily = "sans-serif";
        el.style.fontWeight = "700";
        el.style.letterSpacing = "0px";
        el.style.textAlign = "center";
        el.style.padding = "0px";
    });

    countdownPeriod.forEach(el => {
        el.style.textTransform = "uppercase";
        el.style.borderBottomLeftRadius = "16px";
        el.style.borderBottomRightRadius = "16px";
        el.style.border = "none";
        el.style.padding = "0px";
        el.style.color = "rgb(255, 255, 255)";
        el.style.backgroundColor = "var(--accent-dark, #5d5d5d)";
        el.style.fontFamily = "sans-serif";
        el.style.fontWeight = "bold";
        el.style.fontSize = "10px";
        el.style.letterSpacing = "0px";
        el.style.textAlign = "center";
    });
  }

  // ─── AUTO-CLASS COUNTDOWN HTML ────────────────────────────────────────────────
  // Finds your .countdown-box and stamps all required AEvent classes onto it
  // without touching your own markup structure.
  const UNIT_ORDER = ["days", "hours", "minutes", "seconds"];

  function stampClasses() {
    const box = document.querySelector(".countdown-box");
    if (!box) return;

    // .countdown-row → add countdown-1
    const row = box.querySelector(".countdown-row");
    if (row) row.classList.add("countdown-1");

    // Each .countdown-section → stamp section + amount + period classes
    const sections = box.querySelectorAll(".countdown-section");
    sections.forEach((section, i) => {
      const unit = UNIT_ORDER[i];
      if (!unit) return;

      // Section wrapper
      section.classList.add("elCountdownColumn", "countdown-section-" + unit, "visible");

      // Amount element (the number)
      const amount = section.querySelector(".countdown-amount");
      if (amount) {
        amount.classList.add("elCountdownAmount", "countdown-amount-" + unit);
        amount.setAttribute("data-digit", "true");
      }

      // Period element (the label)
      const period = section.querySelector(".countdown-period");
      if (period) {
        period.classList.add("elCountdownPeriod", "countdown-period-" + unit);
        period.setAttribute("data-digit", "true");
        // Add label text if empty
        if (!period.textContent.trim()) {
          period.textContent = unit;
        }
      }
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function getTarget() {
    return Date.now() + LEAD_MS;
  }

  // ─── MERGE TAG REPLACEMENT ───────────────────────────────────────────────────
  function replaceMergeTags() {
    const future = new Date(getTarget());
    const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];

    let hour = future.getHours();
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const minute = pad(future.getMinutes());

    const replacements = {
      "{!reg-dayofweek}":  DAYS[future.getDay()],
      "{!reg-dayofmonth}": String(future.getDate()),
      "{!reg-month}":      MONTHS[future.getMonth()],
      "{!reg-year}":       String(future.getFullYear()),
      "{!reg-timeZone}":   hour + ":" + minute + " " + ampm,
      "{!reg-time}":       hour + ":" + minute + " " + ampm,
    };

    const walker = document.createTreeWalker(
      document.body, NodeFilter.SHOW_TEXT, null, false
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

  // ─── COUNTDOWN TICK ───────────────────────────────────────────────────────────
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

    const set = (sel, val) =>
      document.querySelectorAll(sel).forEach(el => el.textContent = val);

    // AEvent class selectors (stamped by stampClasses)
    set(".countdown-amount-days",    pad(d));
    set(".countdown-amount-hours",   pad(h));
    set(".countdown-amount-minutes", pad(m));
    set(".countdown-amount-seconds", pad(s));

    // Fallback: plain id selectors
    const byId = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    byId("days",    pad(d));
    byId("hours",   pad(h));
    byId("minutes", pad(m));
    byId("seconds", pad(s));

    // Keep wrappers visible
    document.querySelectorAll(".countdown-row, .countdown-box").forEach(el => {
      el.style.removeProperty("display");
      el.style.removeProperty("visibility");
      el.hidden = false;
    });

    window.wtlCountdown = { days: d, hours: h, minutes: m, seconds: s, target };
  }

  // ─── OVERRIDE AEVENT GLOBALS ──────────────────────────────────────────────────
  function overrideGlobals() {
    const futureISO = new Date(target).toISOString();
    window.wtl_end_time     = futureISO;
    window.webinarEndTime   = futureISO;
    window.aeventEndTime    = futureISO;
    window.countdownEndTime = futureISO;
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  function init() {
    loadExternalCSS();
    loadInlineStyle();
    stampClasses();
    replaceMergeTags();
    overrideGlobals();
    tick();
    setInterval(tick, TICK_MS);
    setInterval(overrideGlobals, 5000);
    console.info("[aevent-placeholder] Running. Target:", new Date(target).toLocaleString());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
