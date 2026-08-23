/*
 * Calculator engine: all arithmetic and keypad state, with no DOM access.
 * Kept free of browser APIs so the same file runs under Node for the tests.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.CalculatorEngine = factory();
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    var MAX_DIGITS = 12;
    var OP_SYMBOLS = { add: "+", sub: "\u2212", mul: "\u00d7", div: "\u00f7" };

    // Floating point leaks artefacts like 0.1 + 0.2 = 0.30000000000000004.
    // Doubles carry ~15-17 significant digits, so rounding to 12 discards the
    // noise while staying well inside what the 12-digit display can show.
    function sanitize(value) {
        if (!isFinite(value)) return null;
        if (value === 0) return 0;
        return parseFloat(value.toPrecision(12));
    }

    function apply(op, a, b) {
        switch (op) {
            case "add": return sanitize(a + b);
            case "sub": return sanitize(a - b);
            case "mul": return sanitize(a * b);
            case "div": return b === 0 ? null : sanitize(a / b);
            default: return b;
        }
    }

    function groupDigits(integerPart) {
        return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Formats a raw entry string, preserving a trailing "." the user just typed.
    function formatEntry(entry) {
        var negative = entry.charAt(0) === "-";
        var body = negative ? entry.slice(1) : entry;
        var dot = body.indexOf(".");
        var out;
        if (dot === -1) {
            out = groupDigits(body);
        } else {
            out = groupDigits(body.slice(0, dot)) + "." + body.slice(dot + 1);
        }
        return (negative ? "-" : "") + out;
    }

    function formatExponential(value) {
        return value
            .toExponential(8)
            .replace(/\.?0+e/, "e")
            .replace("e+", "e");
    }

    function formatValue(value) {
        if (value === null) return "Error";
        var magnitude = Math.abs(value);
        if (magnitude >= 1e12 || (value !== 0 && magnitude < 1e-9)) {
            return formatExponential(value);
        }
        return formatEntry(String(value));
    }

    function countDigits(entry) {
        var digits = entry.replace(/[^0-9]/g, "");
        // A bare "0" placeholder is replaced rather than appended to.
        return digits === "0" ? 0 : digits.length;
    }

    function Calculator() {
        this.reset();
    }

    Calculator.prototype.reset = function () {
        this.entry = "0";
        this.entryActive = false;
        this.accumulator = null;
        this.pendingOp = null;
        this.lastOp = null;
        this.lastOperand = null;
        this.error = false;
    };

    Calculator.prototype.value = function () {
        var parsed = parseFloat(this.entry);
        return isNaN(parsed) ? 0 : parsed;
    };

    Calculator.prototype.setValue = function (value) {
        if (value === null) {
            this.error = true;
            this.entry = "0";
            this.entryActive = false;
            this.accumulator = null;
            this.pendingOp = null;
            this.lastOp = null;
            this.lastOperand = null;
            return;
        }
        this.entry = String(value);
        this.entryActive = false;
    };

    Calculator.prototype.digit = function (d) {
        if (!this.entryActive) {
            this.entry = d === "0" ? "0" : d;
            this.entryActive = true;
            return;
        }
        if (countDigits(this.entry) >= MAX_DIGITS) return;
        if (this.entry === "0") this.entry = d;
        else if (this.entry === "-0") this.entry = "-" + d;
        else this.entry += d;
    };

    Calculator.prototype.decimal = function () {
        if (!this.entryActive) {
            this.entry = "0.";
            this.entryActive = true;
            return;
        }
        if (this.entry.indexOf(".") === -1) this.entry += ".";
    };

    Calculator.prototype.operator = function (op) {
        // Two operators in a row: the second one just replaces the first.
        if (this.pendingOp !== null && this.entryActive) {
            var result = apply(this.pendingOp, this.accumulator, this.value());
            this.setValue(result);
            if (this.error) return;
            this.accumulator = result;
        } else {
            this.accumulator = this.value();
        }
        this.pendingOp = op;
        this.entryActive = false;
    };

    Calculator.prototype.equals = function () {
        var operand;
        if (this.pendingOp !== null) {
            operand = this.value();
            this.lastOp = this.pendingOp;
            this.lastOperand = operand;
            this.setValue(apply(this.pendingOp, this.accumulator, operand));
            this.pendingOp = null;
            this.accumulator = null;
        } else if (this.lastOp !== null) {
            // Repeated "=" reapplies the previous operation, so 2 + 3 = = = counts by 3.
            this.setValue(apply(this.lastOp, this.value(), this.lastOperand));
        } else {
            this.entryActive = false;
        }
    };

    Calculator.prototype.negate = function () {
        if (this.entryActive) {
            this.entry = this.entry.charAt(0) === "-" ? this.entry.slice(1) : "-" + this.entry;
            return;
        }
        var value = this.value();
        this.entry = String(value === 0 ? 0 : -value);
    };

    Calculator.prototype.percent = function () {
        var value = this.value();
        // Matches the familiar phone-calculator reading of "%": in 50 + 10% the
        // 10% is taken of the 50, but in 200 x 10% it is simply 0.1.
        if ((this.pendingOp === "add" || this.pendingOp === "sub") && this.accumulator !== null) {
            this.setValue(sanitize((this.accumulator * value) / 100));
        } else {
            this.setValue(sanitize(value / 100));
        }
        this.entryActive = true;
    };

    Calculator.prototype.backspace = function () {
        if (this.entry.indexOf("e") !== -1) {
            this.entry = "0";
            this.entryActive = true;
            return;
        }
        var next = this.entry.slice(0, -1);
        if (next === "" || next === "-") next = "0";
        this.entry = next;
        this.entryActive = true;
    };

    Calculator.prototype.clear = function () {
        // Acts as "C" while an entry is in progress, otherwise as a full "AC".
        if (!this.error && this.entryActive && this.entry !== "0") {
            this.entry = "0";
            this.entryActive = false;
            return;
        }
        this.reset();
    };

    Calculator.prototype.press = function (key) {
        // Once errored, only a clear gets the calculator moving again.
        if (this.error && key !== "clear") return this.view();

        if (/^[0-9]$/.test(key)) this.digit(key);
        else if (key === ".") this.decimal();
        else if (key === "add" || key === "sub" || key === "mul" || key === "div") this.operator(key);
        else if (key === "eq") this.equals();
        else if (key === "neg") this.negate();
        else if (key === "pct") this.percent();
        else if (key === "back") this.backspace();
        else if (key === "clear") this.clear();

        return this.view();
    };

    Calculator.prototype.view = function () {
        var expression = "";
        if (this.pendingOp !== null && this.accumulator !== null) {
            expression = formatValue(this.accumulator) + " " + OP_SYMBOLS[this.pendingOp];
        }
        // While typing, the raw entry is shown so half-finished input such as
        // "0." survives; a settled value goes through the numeric formatter,
        // which can switch to exponential notation when it will not fit.
        var display = this.entryActive ? formatEntry(this.entry) : formatValue(this.value());
        return {
            display: this.error ? "Error" : display,
            expression: expression,
            activeOp: this.entryActive ? null : this.pendingOp,
            clearLabel: !this.error && this.entryActive && this.entry !== "0" ? "C" : "AC",
            error: this.error
        };
    };

    return {
        Calculator: Calculator,
        formatValue: formatValue,
        MAX_DIGITS: MAX_DIGITS
    };
});
