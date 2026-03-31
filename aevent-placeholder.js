(function() {
    "use strict";

    const LEAD_MS = 3 * 24 * 60 * 60 * 1000;
    const RESET_THRESHOLD_MS = 60 * 1000;
    const TICK_MS = 1000;
    const BASE_URL = "https://nep-code.github.io/gohighlevel";
    //const BASE_URL = "";

    function url(path) {
        return BASE_URL ? `${BASE_URL}/${path}` : path;
    }

    // ========================
    //  EXTERNAL ASSETS
    // ========================
    function loadExternalCSS() {
        
        const CSS_FILES = [
            url("styles/countdown.css"),
            url("styles/flipclock.css"),
            url("styles/registration.css"),
            url("styles/intlTelInput.css")
        ];

        // Load CSS
        CSS_FILES.forEach((href, i) => {
            if (document.querySelector(`link[href="${href}"]`)) return;

            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.dataset.asset = "aevent-css-" + i;
            document.head.appendChild(link);
        });

        // Small screen tweak (keep yours)
        const style = document.createElement("style");
        style.id = "aevent-placeholder-mq";
        style.textContent = `
            @media (max-width: 350px) {
                .countdown-section-seconds { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================
    //  INLINE STYLE
    // ========================
    function loadInlineStyle() {
        const countdownAmount = document.querySelectorAll('.countdown-amount');
        const countdownPeriod = document.querySelectorAll('.countdown-period');

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
            el.style.backgroundColor = "var(--accent-dark, rgb(75, 85, 99))";
            el.style.fontFamily = "sans-serif";
            el.style.fontWeight = "bold";
            el.style.fontSize = "10px";
            el.style.letterSpacing = "0px";
            el.style.textAlign = "center";
        });
    }

    // ========================
    //  AUTO-CLASS COUNTDOWN HTML
    // ========================
    const UNIT_ORDER = ["days", "hours", "minutes", "seconds"];

    function stampClasses() {
        const boxes = document.querySelectorAll(".countdown-box");
        if(!boxes.length) return;

        boxes.forEach(box => {
            const rows = box.querySelectorAll(".countdown-row");

            rows.forEach(row => {
                row.classList.add("countdown-1");

                const sections = row.querySelectorAll(".countdown-section");

                sections.forEach((section, i) => {
                    const unit = UNIT_ORDER[i];
                    if(!unit) return;

                    section.classList.add(
                        "elCountdownColumn",
                        "countdown-section-" + unit,
                        "visible"
                    );

                    const amount = section.querySelector(".countdown-amount");
                    if(amount) {
                        amount.classList.add(
                            "elCountdownAmount",
                            "countdown-amount-" + unit
                        );
                        amount.setAttribute("data-digit", "true");
                    }

                    const period = section.querySelector(".countdown-period");
                    if(period) {
                        period.classList.add(
                            "elCountdownPeriod",
                            "countdown-period-" + unit
                        );
                        period.setAttribute("data-digit", "true");

                        if(!period.textContent.trim()) {
                            period.textContent = unit;
                        }
                    }
                });
            });
        });
    }

    // ========================
    //  HELPERS
    // ========================
    function pad(n) {
        return String(Math.max(0, n)).padStart(2, "0");
    }

    function getTarget() {
        return Date.now() + LEAD_MS;
    }

    // ========================
    //  MERGE TAG REPLACEMENT
    // ========================
    function replaceMergeTags() {
        const future = new Date(getTarget());
        const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const MONTHS = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        let hour = future.getHours();
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        const minute = pad(future.getMinutes());
        const pstDate = new Date().toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZoneName: "short"
        });

        const replacements = {
            "{!reg-dayofweek}": DAYS[future.getDay()],
            "{!reg-dayofmonth}": ordinal(future.getDate()),
            "{!reg-month}": MONTHS[future.getMonth()],
            "{!reg-year}": future.getFullYear(),
            "{!reg-timeZone}": pstDate,
            "{!reg-time}": hour + ":" + minute + " " + ampm,
            "{!joinurl}": "https://joinevent.link/{tenant}/{registrant}",
            "{!webinar-subject}": "Exclusive Masterclass",
            "{!webinar-body}": "Discover powerful ideas and actionable techniques in this in-depth masterclass created for individuals who want to grow and succeed. You’ll gain a clearer understanding of key concepts and how to apply them effectively in real-life situations. Walk away with practical knowledge you can use immediately to improve your results."
        };

        const walker = document.createTreeWalker(
            document.body, NodeFilter.SHOW_TEXT, null, false
        );
        let node;
        while((node = walker.nextNode())) {
            let val = node.nodeValue;
            let changed = false;
            for(const [token, replacement] of Object.entries(replacements)) {
                if(val.includes(token)) {
                    val = val.split(token).join(replacement);
                    changed = true;
                }
            }
            if(changed) node.nodeValue = val;
        }

        function ordinal(n) {
            const s = ["th","st","nd","rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        }
    }

    // ========================
    //  COUNTDOWN TICK
    // ========================
    let target = getTarget();

    function tick() {
        const diff = target - Date.now();
        if(diff <= RESET_THRESHOLD_MS) {
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
        set(".countdown-amount-days", pad(d));
        set(".countdown-amount-hours", pad(h));
        set(".countdown-amount-minutes", pad(m));
        set(".countdown-amount-seconds", pad(s));

        // Fallback: plain id selectors
        const byId = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.textContent = val;
        };
        byId("days", pad(d));
        byId("hours", pad(h));
        byId("minutes", pad(m));
        byId("seconds", pad(s));

        // Keep wrappers visible
        document.querySelectorAll(".countdown-row, .countdown-box").forEach(el => {
            el.style.removeProperty("display");
            el.style.removeProperty("visibility");
            el.hidden = false;
        });

        window.wtlCountdown = {
            days: d,
            hours: h,
            minutes: m,
            seconds: s,
            target
        };
    }

    // ========================
    //  OVERRIDE AEVENT GLOBALS
    // ========================
    function overrideGlobals() {
        const futureISO = new Date(target).toISOString();
        window.wtl_end_time = futureISO;
        window.webinarEndTime = futureISO;
        window.aeventEndTime = futureISO;
        window.countdownEndTime = futureISO;
    }

    // ========================
    //  OVERRIDE TEL INPUT
    // ========================
    function loadIntlTelInput(callback) {
        const src  = url("scripts/intlTelInput.js");
        console.log(src);
        if (window.intlTelInput) return callback(); // already loaded

        const script = document.createElement("script");
        script.src = src;
        script.onload = callback;
        document.body.appendChild(script);
    }

    function overrideTelInput() {
        loadIntlTelInput(() => {
            const input = document.querySelector("#phone");
            if (!input) return;

            const iti = window.intlTelInput(input, {
                initialCountry: "ph",
                utilsScript: url("scripts/utils.js")
            });

            input.form.addEventListener("submit", (e) => {
                e.preventDefault();
                alert("Full number: " + iti.getNumber());
            });
        });
    }

    // ========================
    //  INIT
    // ========================
    function init() {
        loadExternalCSS();
        loadInlineStyle();
        stampClasses();
        replaceMergeTags();
        overrideGlobals();        
        overrideTelInput();

        tick();
        setInterval(tick, TICK_MS);
        setInterval(overrideGlobals, 5000);
        //console.info("[aevent-placeholder] Running. Target:", new Date(target).toLocaleString());
    }

    if(document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        setTimeout(init, 250);
    }
})();
