/* Wires the calculator engine up to the keypad, keyboard and display. */
(function () {
    "use strict";

    var calculator = new window.CalculatorEngine.Calculator();

    var keypad = document.getElementById("keypad");
    var displayEl = document.getElementById("display");
    var expressionEl = document.getElementById("expression");
    var hintEl = document.getElementById("hint");
    var clearKey = keypad.querySelector('[data-role="clear"]');

    var KEYBOARD_MAP = {
        "+": "add",
        "-": "sub",
        "*": "mul",
        "x": "mul",
        "X": "mul",
        "/": "div",
        "=": "eq",
        "Enter": "eq",
        "Escape": "clear",
        "Delete": "clear",
        "Backspace": "back",
        "%": "pct",
        "n": "neg",
        "N": "neg"
    };

    // Steps the display font down until the number fits the available width.
    var FIT_STEPS = [1, 0.86, 0.74, 0.64, 0.55, 0.48];

    function fitDisplay() {
        for (var i = 0; i < FIT_STEPS.length; i++) {
            displayEl.style.setProperty("--fit", FIT_STEPS[i]);
            if (displayEl.scrollWidth <= displayEl.clientWidth) return;
        }
    }

    function render(view) {
        displayEl.textContent = view.display;
        displayEl.classList.toggle("is-error", view.error);
        expressionEl.textContent = view.expression;
        clearKey.textContent = view.clearLabel;
        clearKey.setAttribute("aria-label", view.clearLabel === "C" ? "Clear entry" : "All clear");

        var operators = keypad.querySelectorAll(".key--operator");
        for (var i = 0; i < operators.length; i++) {
            var key = operators[i].dataset.key;
            operators[i].classList.toggle("is-active", key === view.activeOp);
        }

        fitDisplay();
    }

    function flash(button) {
        if (!button) return;
        button.classList.add("is-pressed");
        setTimeout(function () {
            button.classList.remove("is-pressed");
        }, 110);
    }

    var hintDismissed = false;

    function dismissHint() {
        if (hintDismissed) return;
        hintDismissed = true;
        hintEl.classList.add("is-hidden");
    }

    function press(key) {
        render(calculator.press(key));
    }

    keypad.addEventListener("click", function (event) {
        var button = event.target.closest(".key");
        if (button) press(button.dataset.key);
    });

    // Paints the pressed state on touch-down rather than waiting for the click,
    // which is what makes rapid entry feel responsive.
    keypad.addEventListener("pointerdown", function (event) {
        var button = event.target.closest(".key");
        if (button) button.classList.add("is-pressed");
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach(function (type) {
        keypad.addEventListener(type, function (event) {
            var button = event.target.closest(".key");
            if (button) button.classList.remove("is-pressed");
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        // A focused key already responds to Enter and Space on its own.
        var onKey = event.target && event.target.closest && event.target.closest(".key");
        if (onKey && (event.key === "Enter" || event.key === " ")) return;

        var key = null;
        if (/^[0-9]$/.test(event.key)) key = event.key;
        else if (event.key === "." || event.key === ",") key = ".";
        else if (Object.prototype.hasOwnProperty.call(KEYBOARD_MAP, event.key)) key = KEYBOARD_MAP[event.key];
        if (key === null) return;

        event.preventDefault();
        press(key);
        flash(keypad.querySelector('[data-key="' + key + '"]'));
        if (key === "back") dismissHint();
    });

    // Swipe across the number to delete a digit, matching the gesture iOS users
    // already expect from the built-in calculator.
    (function enableSwipeToDelete() {
        var startX = null;
        var startY = null;
        var deleted = false;
        var STEP = 34;

        displayEl.addEventListener("pointerdown", function (event) {
            startX = event.clientX;
            startY = event.clientY;
            deleted = false;
        });

        displayEl.addEventListener("pointermove", function (event) {
            if (startX === null) return;
            var dx = event.clientX - startX;
            if (Math.abs(dx) < STEP || Math.abs(event.clientY - startY) > STEP) return;
            startX = event.clientX;
            deleted = true;
            dismissHint();
            press("back");
        });

        ["pointerup", "pointercancel", "pointerleave"].forEach(function (type) {
            displayEl.addEventListener(type, function () {
                startX = null;
                startY = null;
            });
        });

        // Suppress the click that follows a swipe so nothing else reacts to it.
        displayEl.addEventListener("click", function (event) {
            if (deleted) event.preventDefault();
        });
    })();

    // "Add to Home Screen" only exists in Safari, so the tip is pointless once
    // the app is already running from the home screen.
    (function maybeShowInstallTip() {
        var tip = document.getElementById("installTip");
        var close = document.getElementById("installTipClose");
        var STORAGE_KEY = "calculator:install-tip-dismissed";

        var isIOS = /iP(hone|od|ad)/.test(navigator.platform) ||
            /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        var isStandalone = window.navigator.standalone === true ||
            window.matchMedia("(display-mode: standalone)").matches;

        var dismissed = false;
        try {
            dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
        } catch (error) {
            // Private browsing can refuse storage; showing the tip again is harmless.
        }

        if (!isIOS || isStandalone || dismissed) return;

        tip.hidden = false;
        close.addEventListener("click", function () {
            tip.hidden = true;
            try {
                window.localStorage.setItem(STORAGE_KEY, "1");
            } catch (error) {
                // Nothing to do: the tip simply reappears next launch.
            }
        });
    })();

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("sw.js").catch(function () {
                // Offline support is a bonus; the app works without it.
            });
        });
    }

    render(calculator.view());
})();
