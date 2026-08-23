/*
 * Run with: node --test calculator/tests/
 * No dependencies: uses the test runner and assertions built into Node.
 */
const test = require("node:test");
const assert = require("node:assert");
const { Calculator } = require("../engine.js");

// Presses a sequence of keys on a fresh calculator and returns the final view.
function press(...keys) {
    const calc = new Calculator();
    let view = calc.view();
    for (const key of keys) view = calc.press(key);
    return view;
}

function display(...keys) {
    return press(...keys).display;
}

test("adds and subtracts", () => {
    assert.equal(display("1", "2", "add", "3", "eq"), "15");
    assert.equal(display("5", "sub", "1", "0", "eq"), "-5");
});

test("multiplies and divides", () => {
    assert.equal(display("6", "mul", "7", "eq"), "42");
    assert.equal(display("9", "div", "2", "eq"), "4.5");
});

test("chains operations from left to right", () => {
    // A phone-style calculator has no operator precedence: (2 + 3) x 4.
    assert.equal(display("2", "add", "3", "mul", "4", "eq"), "20");
    assert.equal(display("2", "add", "3", "mul"), "5", "the running total shows as you go");
});

test("hides binary floating point noise", () => {
    assert.equal(display(".", "1", "add", ".", "2", "eq"), "0.3");
    assert.equal(display("1", ".", "1", "mul", "3", "eq"), "3.3");
});

test("reports division by zero and locks until cleared", () => {
    const calc = new Calculator();
    ["1", "div", "0", "eq"].forEach((key) => calc.press(key));
    assert.equal(calc.view().display, "Error");
    assert.equal(calc.view().error, true);

    assert.equal(calc.press("7").display, "Error", "keys are ignored while errored");
    assert.equal(calc.press("clear").display, "0");
    assert.equal(calc.view().error, false);
    assert.equal(calc.press("8").display, "8", "usable again after clearing");
});

test("repeats the last operation on further presses of equals", () => {
    assert.equal(display("2", "add", "3", "eq", "eq"), "8");
    assert.equal(display("2", "add", "3", "eq", "eq", "eq"), "11");
    assert.equal(display("2", "mul", "3", "eq", "eq"), "18");
});

test("equals with nothing pending leaves the entry alone", () => {
    assert.equal(display("7", "eq"), "7");
});

test("a second operator replaces the first", () => {
    assert.equal(display("5", "add", "mul", "3", "eq"), "15");
});

test("continues from a result", () => {
    assert.equal(display("2", "add", "3", "eq", "mul", "2", "eq"), "10");
    assert.equal(display("2", "add", "3", "eq", "9"), "9", "a digit starts a new entry");
});

test("takes percentages the way phone calculators do", () => {
    assert.equal(display("5", "0", "pct"), "0.5");
    assert.equal(display("5", "0", "add", "1", "0", "pct"), "5", "10% of 50");
    assert.equal(display("5", "0", "add", "1", "0", "pct", "eq"), "55");
    assert.equal(display("2", "0", "0", "sub", "2", "5", "pct", "eq"), "150");
    assert.equal(display("2", "0", "0", "mul", "1", "0", "pct", "eq"), "20", "plain /100 for x");
});

test("toggles sign of an entry and of a result", () => {
    assert.equal(display("5", "neg"), "-5");
    assert.equal(display("5", "neg", "neg"), "5");
    assert.equal(display("2", "add", "3", "eq", "neg"), "-5");
    assert.equal(display("neg"), "0", "never shows a negative zero");
    assert.equal(display("5", "neg", "add", "2", "eq"), "-3");
});

test("deletes the last character", () => {
    assert.equal(display("1", "2", "3", "back"), "12");
    assert.equal(display("1", "back"), "0");
    assert.equal(display("1", "back", "back"), "0");
    assert.equal(display("1", ".", "5", "back", "back"), "1");
    assert.equal(display("5", "neg", "back"), "0", "deleting the last digit drops the sign too");
    assert.equal(display("2", "add", "3", "eq", "back"), "0", "a result can be edited down");
});

test("accepts only one decimal point", () => {
    assert.equal(display("1", ".", ".", "5"), "1.5");
    assert.equal(display("."), "0.");
    assert.equal(display("1", ".", "5", "add", "2", ".", "5", "eq"), "4");
});

test("replaces a leading zero", () => {
    assert.equal(display("0", "0", "5"), "5");
    assert.equal(display("0", ".", "5"), "0.5");
});

test("groups thousands", () => {
    assert.equal(display("1", "2", "3", "4"), "1,234");
    assert.equal(display("1", "2", "3", "4", "5", "6", "7"), "1,234,567");
    assert.equal(display("1", "2", "3", "4", ".", "5", "6"), "1,234.56", "no grouping after the point");
    assert.equal(display("1", "0", "0", "0", "mul", "1", "0", "0", "0", "eq"), "1,000,000");
});

test("caps the entry length", () => {
    const thirteenOnes = Array(13).fill("1");
    assert.equal(display(...thirteenOnes), "111,111,111,111");
});

test("falls back to exponential notation for extreme results", () => {
    assert.equal(display("9", "9", "9", "9", "9", "9", "9", "9", "9", "mul", "9", "9", "9", "9", "9", "9", "9", "9", "9", "eq"), "9.99999998e17");
    assert.equal(display("1", "div", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "eq"), "1e-11");
});

test("clear acts as C mid-entry and AC otherwise", () => {
    const calc = new Calculator();
    ["1", "2", "add", "3", "4"].forEach((key) => calc.press(key));
    assert.equal(calc.view().clearLabel, "C");

    assert.equal(calc.press("clear").display, "0", "C wipes the entry");
    assert.equal(calc.view().clearLabel, "AC");
    assert.equal(calc.view().expression, "12 +", "but keeps the pending operation");

    assert.equal(calc.press("5").display, "5");
    assert.equal(calc.press("eq").display, "17");

    calc.press("clear");
    assert.equal(calc.view().display, "0");
    assert.equal(calc.view().expression, "");
});

test("previews the pending operation", () => {
    assert.equal(press("1", "2", "add").expression, "12 +");
    assert.equal(press("1", "2", "add").activeOp, "add");
    assert.equal(press("1", "2", "add", "3").activeOp, null, "clears once typing resumes");
    assert.equal(press("1", "2", "add", "3", "eq").expression, "");
    assert.equal(press("1", "0", "0", "0", "div").expression, "1,000 \u00f7");
});
