const input = document.getElementById("input");
const darkButton = document.getElementById("darkModeButton");
const appearenceSelect = document.getElementById("visual");
const britishModeDiv = document.getElementById("britishDiv");
const britishCheck = document.getElementById("british");
const decimalDiv = document.getElementById("decimalDiv");
const decimalLength = document.getElementById("decimal");
const valueStack = document.getElementById("vs");
const auxillaryArray = document.getElementById("ax");
const repeatPile = document.getElementById("rp");
const instructionList = document.getElementById("is");
const resetButton = document.getElementById("reset");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const speedButton = document.getElementById("speed");
const link = document.getElementById("link");

let dark = false;
let appearence = "default";
let decimals = 3n;
let instructions = [];
let comments = [];
let repeats = [];
let values = [];
let aux = new Map();
let current = -1;
let allowRunning = true;
let timer;
let speedSelect = 0;
let speed = 500;
let steps = 1;
let rnList = [];

document.addEventListener("DOMContentLoaded", () => {
    let url = new URL(document.location);
    let params = url.search;
    params = params.substring(1).split("&");
    for (let parameter of params) {
        let p = parameter.split("=");
        switch (p[0]) {
            case "instr":
                let instr = p[1];
                instr = instr.replaceAll(" ", "");
                instr = instr.replaceAll("_", " ");
                instr = instr.replaceAll("\\n", "\n");
                instr = instr.replaceAll("%22", "\"");
                instr = instr.replaceAll("%23", "#");
                instr = instr.replaceAll("%24", "$");
                instr = instr.replaceAll("%27", "\'");
                instr = instr.replaceAll("%3C", "<");
                instr = instr.replaceAll("%3D", "=");
                instr = instr.replaceAll("%3E", ">");
                input.value = instr;
                break;
            default:
                break;
        }
    }
});

input.addEventListener("change", () => {
    let formatted = input.value;
    formatted = formatted.replaceAll("\n", "\\n");
    formatted = formatted.replaceAll(" ", "_");
    formatted = formatted.replaceAll("\"", "%22");
    formatted = formatted.replaceAll("#", "%23");
    formatted = formatted.replaceAll("$", "%24");
    formatted = formatted.replaceAll("\'", "%27");
    formatted = formatted.replaceAll("=", "%3D");
    link.textContent = "https://erikhaag.github.io/More-Math-rpn/?instr=" + formatted;
});

darkButton.addEventListener("click", () => {
    dark = !dark;
    darkButton.innerHTML = dark ? "&#x263D" : "&#x2609";
    document.getElementsByTagName("body")[0].className = dark ? "dark" : "light";
    updateUI()
});

appearenceSelect.addEventListener("change", () => {
    appearence = appearenceSelect.value;
    decimalDiv.hidden = !(appearence == "decimal" || appearence == "decimalcommas");
    britishModeDiv.hidden = !(appearence == "commas" || appearence == "decimal" || appearence == "decimalcommas");
    updateUI();
});

britishCheck.addEventListener("change", () => {
    updateUI();
});

decimalLength.addEventListener("change", () => {
    let d = decimalLength.value;
    if (d.includes(".") || d.includes("-") || d == "0" || d == "") {
        decimals = 1n;
        decimalLength.value = "1";
    } else {
        decimals = BigInt(d);
    }
    updateUI();
});

resetButton.addEventListener("click", () => {
    reset();
    current = -1;
    updateUI();
});

startButton.addEventListener("click", () => {
    if (allowRunning) {
        if (current >= 0) {
            clearTimeout(timer);
        }
        reset()
        current = 0;
        updateUI();
        timer = setTimeout(step, speed);
    } else {
        if (current == -1) {
            reset();
            current = 0;
            updateUI();
        } else {
            step();
        }
    }
});

stopButton.addEventListener("click", () => {
    allowRunning = !allowRunning;
    if (allowRunning) {
        startButton.innerHTML = "Start";
        stopButton.innerHTML = "Stop";
        resetButton.hidden = true;
        step();
    } else {
        startButton.innerHTML = "Step"
        stopButton.innerHTML = "Continue";
        resetButton.hidden = false;
    }
});

speedButton.addEventListener("click", () => {
    clearTimeout(timer);
    switch (speedSelect) {
        case 0:
            speed = 250;
            steps = 1;
            speedSelect = 1;
            speedButton.innerHTML = "&gt;&gt;";
            break;
        case 1:
            speed = 10;
            speedSelect = 2;
            steps = 1;
            speedButton.innerHTML = "&gt;&gt;&gt;";
            break;
        case 2:
            speed = 10;
            speedSelect = 3;
            steps = 5;
            speedButton.innerHTML = "&gt;&gt;&gt;&gt;";
            break;
        case 3:
            speed = 10;
            speedSelect = 4;
            steps = 10;
            speedButton.innerHTML = "&gt;&gt;&gt;&gt;&gt;";
            break;
        case 4:
            speed = 500;
            steps = 1;
            speedSelect = 0;
            speedButton.innerHTML = "&gt;"
    }
    if (allowRunning) {
        timer = setTimeout(step, speed);
    }
});

function reset() {
    instructions = input.value.split("\n");
    values = [];
    repeats = [];
    comments = [];
    aux = new Map();
    let cpos = [];
    for (let i = 0; i < instructions.length; i++) {
        if (instructions[i].startsWith("\"")) {
            cpos.push(i);
        }
    }
    for (let i = 0; i < cpos.length; i++) {
        if (i >= 1 && cpos[i] == cpos[i - 1] + 1) {
            let c = comments.pop();
            c.push(instructions[cpos[i]].substring(1));
            comments.push(c);
        } else {
            comments.push([cpos[i] - i, instructions[cpos[i]].substring(1)]);
        }
    }
    for (let i = cpos.length - 1; i >= 0; i--) {
        instructions.splice(cpos[i], 1);
    }
    rnList = instructions.map((s) => {
        if (s.startsWith("repeat")) {
            return 1;
        } else if (s == "next") {
            return 2;
        }
        return 0;
    });
}

function matrixToTable(M) {
    let h = "<table>"
    for (let i = 0; i < M.rows; i++) {
        h += "\n<tr>";
        if (M.rows == 1) {
            h += "\n<td>[</td>";
        } else if (i == 0) {
            h += "\n<td>⎡</td>";
        } else if (i == M.rows - 1) {
            h += "\n<td>⎣</td>";
        } else {
            h += "\n<td>⎢ </td>";
        }
        for (let j = 0; j < M.columns; j++) {
            h += "\n<td class=\"matrixIndex\">" + rationalAppearence(M.indices[i][j].clone()) + "</td>";
        }
        if (M.rows == 1) {
            h += "\n<td>]</td>";
        } else if (i == 0) {
            h += "\n<td>⎤</td>";
        } else if (i == M.rows - 1) {
            h += "\n<td>⎦</td>";
        } else {
            h += "\n<td>⎥</td>";
        }
        h += "\n</tr>";
    }
    return h + "\n</table>";
}

function rationalAppearence(R) {
    let str;
    switch (appearence) {
        case "default":
            str = rationalToTable(R, false);
            break;
        case "commas":
            str = rationalToTable(R, true);
            break;
        case "decimal":
            str = rationalToDecimal(R, decimals, false);
            break;
        case "decimalcommas":
            str = rationalToDecimal(R, decimals, true);
            break;
        default:
            str = "Huh?";
    }
    return str;
}

function rationalToTable(R, commas = false) {
    if (R.denominator == 1n) {
        return BigIntToString(R.numerator, commas);
    } else {
        return "<table>\n<tr>\n<td class=\"numerator\">" + BigIntToString(R.numerator, appearence == "commas") + "</td>\n</tr>\n<tr>\n<td class=\"denominator\">" + BigIntToString(R.denominator, appearence == "commas") + "</td>\n</tr>\n</table>";
    }
}

function rationalToDecimal(R, p, commas = false) {
    let RClone = R.clone();
    let neg = RClone.numerator < 0
    if (neg) {
        RClone.mult(new Rational(-1n));
    }
    let I = RClone.numerator / RClone.denominator;
    RClone.sub(new Rational(I));
    let POT = new Rational(10n);
    POT.pow(p);
    RClone.mult(POT);
    let d = RClone.numerator / RClone.denominator;
    let int = BigIntToString(I, commas);
    let dec = BigIntToString(d);
    let rep = p - BigInt(dec.length);
    for (let i = 0; i < rep; i++) {
        dec = "0" + dec;
    }
    for (let i = 0; i < p; i++) {
        if (dec.endsWith("0")) {
            dec = dec.substring(0, dec.length - 1);
        }
    }
    if (commas && dec.length >= 4) {
        let digitsArray = [];
        let excess = dec.length % 3;
        for (let i = 3; i - 1 <= dec.length - excess; i += 3) {
            digitsArray.push(dec.substring(i - 3, i));
        }
        if (excess >= 1) {
            digitsArray.push(dec.substring(dec.length - excess));
        }
        dec = digitsArray.join(britishCheck.checked ? "." : ",");
    }
    return (neg ? "-" + int : int) + (dec == "" ? "" : (britishCheck.checked ? "," : ".") + dec);
}

function BigIntToString(I, commas = false) {
    let s = I.toString();
    let digits = s.length;
    if (commas) {
        let digitsArray = [];
        for (var i = 1; 3 * i <= digits - 1; i++) {
            digitsArray.unshift(s.substring(digits - 3 * i, digits - 3 * i + 3));
        }
        digitsArray.unshift(s.substring(0, digits - 3 * i + 3));
        s = digitsArray.join(britishCheck.checked ? "." : ",");
    }
    return s
}

function updateUI() {
    let list = "";
    for (let i = (values.length - 1); i >= 0; i--) {
        if (appearence == "latex") {
            list += "<li><img src=\"https://latex.codecogs.com/svg.image?" + (dark ? "%5Ccolor%7BWhite%7D" : "") + values[i].toLatex() + "\"></li>";
        } else {
            if (values[i] instanceof Rational) {
                list += "<li>" + rationalAppearence(values[i].clone()) + "</li>\n";
            } else if (values[i] instanceof Matrix) {
                list += "<li>" + matrixToTable(values[i].clone()) + "</li>\n";
            }
        }
    }
    valueStack.innerHTML = list;
    list = ""
    for (let kv of aux.entries()) {
        list += "<li><b>" + kv[0] + "</b><br>";
        if (appearence == "latex") {
            list += "<img src=\"https://latex.codecogs.com/svg.image?" + (dark ? "%5Ccolor%7BWhite%7D" : "") + kv[1].toLatex() + "\"></li>";
        } else {
            if (kv[1] instanceof Rational) {
                list += rationalAppearence(kv[1].clone()) + "</li>\n";
            } else if (kv[1] instanceof Matrix) {
                list += matrixToTable(kv[1].clone()) + "</li>\n";
            }
        }
    }
    auxillaryArray.innerHTML = list;
    list = "";
    for (let i = 0; i < repeats.length; i++) {
        list += "<li>" + repeats[i][0].toString() + ", " + repeats[i][1].toString() + ", " + repeats[i][2].toString() + ", " + repeats[i][3].toString() + "</li>\n";
    }
    repeatPile.innerHTML = list;
    list = "";
    let c = comments.findIndex((e) => { return e[0] == 0; });
    if (c >= 0) {
        for (let j = 1; j < comments[c].length; j++) {
            list += "<li><p title=\"" + comments[c][j] + "\">\"</p></li>\n";
        }
    }
    for (let i = 0; i < instructions.length; i++) {
        list += "<li " + (i == current ? "class=\"curr\" >" : ">") + instructions[i] + "</li>\n";
        let c = comments.findIndex((e) => { return e[0] == i + 1; });
        if (c >= 0) {
            for (let j = 1; j < comments[c].length; j++) {
                list += "<li><p title=\"" + comments[c][j] + "\">\"</p></li>\n";
            }
        }
    }
    instructionList.innerHTML = list;
}

function step() {
    clearTimeout(timer);
    if (allowRunning) {
        for (let i = 0; i < steps; i++) {
            if (doInstruction()) break;
        }
    } else {
        doInstruction();
    }
    updateUI();
    if (allowRunning && current != -1) {
        timer = setTimeout(step, speed);
    }
}

function doInstruction() {
    if (current == -1) {
        return true;
    }
    if (current == instructions.length) {
        current = -1;
        return true;
    }
    let I = instructions[current].split(" ");
    for (let i = 1; i < I.length; i++) {
        if (I[i].startsWith("]")) {
            let refer = Number.parseInt(I[i].substring(1));
            let parameter = values[refer];
            if (parameter instanceof Rational) {
                I.splice(i, 1, (parameter.numerator / parameter.denominator).toString());
            } else {
                alert("parameter must be Rational");
                current = -1;
                return true;
            }
        } else if (I[i].startsWith("[")) {
            let refer = values.length - Number.parseInt(I[i].substring(1)) - 1;
            let parameter = values[refer];
            if (parameter instanceof Rational) {
                I.splice(i, 1, (parameter.numerator / parameter.denominator).toString());
            } else {
                alert("parameter must be Rational");
                current = -1;
                return true;
            }
        } else if (I[i].startsWith("$")) {
            let key = I[i].substring(1);
            if (aux.has(key)) {
                let parameter = aux.get(key).clone();
                if (parameter instanceof Rational) {
                    I.splice(i, 1, (parameter.numerator / parameter.denominator).toString());
                } else {
                    alert("parameter must be Rational.\nTry place");
                    current = -1;
                    return true;
                }
            } else {
                alert("\"" + I[1] + "\" doesn't exist!");
                current = -1;
                return true;
            }
        }
    }
    switch (I.length) {
        case 1:
            if (I[0] == "+") {
                if (values[0] instanceof Rational && values[1] instanceof Rational) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    A.add(B);
                    values.splice(0, 2, A.clone());
                } else if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    A.add(B)
                    values.splice(0, 2, A.clone());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "-") {
                if (values[0] instanceof Rational && values[1] instanceof Rational) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    A.sub(B);
                    values.splice(0, 2, A.clone());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "*") {
                if (values[0] instanceof Rational && values[1] instanceof Rational) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    A.mult(B);
                    values.splice(0, 2, A.clone());
                } else if (values[0] instanceof Matrix && values[1] instanceof Rational) {
                    let A = values[0].clone();
                    let B = values[1].clone();
                    A.scale(B)
                    values.splice(0, 2, A.clone());
                } else if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    A.scale(B)
                    values.splice(0, 2, A.clone());
                } else if (values[0] instanceof Matrix && values[1] instanceof Matrix && values[1].columns == values[0].rows) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    values.splice(0, 2, A.product(B));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "/") {
                if (values[0] instanceof Rational && values[1] instanceof Rational) {
                    let A = values[1].clone();
                    if (values[0].numerator == 0) {
                        alert("Division by zero!");
                        current = -2;
                        break;
                    }
                    let B = values[0].cloneInverse();
                    A.mult(B);
                    values.splice(0, 2, A.clone());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "gcd") {
                if (values[0] instanceof Rational && values[0].denominator == 1n && values[0] instanceof Rational && values[0].denominator == 1n) {
                    values.splice(0, 2, new Rational(MathJS.gcd(values[0].numerator, values[1].numerator)));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "lcm") {
                if (values[0] instanceof Rational && values[0].denominator == 1n && values[0] instanceof Rational && values[0].denominator == 1n) {
                    if (values[0].numerator == 0n || values[1].numerator == 0n) {
                        values.splice(0, 2, new Rational(0n));
                    } else {
                        let A = MathJS.abs(values[0].numerator);
                        let B = MathJS.abs(values[1].numerator);
                        let C = MathJS.gcd(A, B);
                        A = A * B / C;
                        values.splice(0, 2, new Rational(A));
                    }
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "int") {
                if (values[0] instanceof Rational) {
                    let A = values[0].clone();
                    values.splice(0, 1, new Rational(A.numerator / A.denominator));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "#") {
                values.unshift(new Rational(BigInt(values.length)));
            } else if (I[0] == "floor") {
                if (values[0] instanceof Rational) {
                    let A = values[0].clone();
                    let B = new Rational(A.numerator / A.denominator);
                    if (A.compare(B) == -1) {
                        B.sub(new Rational(1n));
                    }
                    values.splice(0, 1, B);
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "ceil") {
                if (values[0] instanceof Rational) {
                    let A = values[0].clone();
                    let B = new Rational(A.numerator / A.denominator);
                    if (A.compare(B) == 1) {
                        B.add(new Rational(1n));
                    }
                    values.splice(0, 1, B);
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "%") {
                if (values[0] instanceof Rational && values[1] instanceof Rational) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    if (values[0].numerator == 0) {
                        alert("Division by zero!");
                        current = -2;
                        break;
                    }
                    let C = A.clone();
                    C.div(B);
                    let D = new Rational(C.numerator / C.denominator);
                    if (C.compare(D) == -1) {
                        D.sub(new Rational(1n));
                    }
                    D.mult(B);
                    A.sub(D);
                    values.splice(0, 2, A.clone());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "den") {
                if (values[0] instanceof Rational) {
                    values.splice(0, 1, new Rational(values[0].denominator));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "step") {
                if (values[0] instanceof Rational) {
                    let A = 0n;
                    if (values[0].numerator >= 1n) {
                        A = 1n;
                    }
                    values.splice(0, 1, new Rational(A));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "compare") {
                if (values[0] instanceof Rational && values[1] instanceof Rational) {
                    let A = values[1].clone();
                    let B = values[0].clone();
                    values.splice(0, 2, new Rational(BigInt(A.compare(B))));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "next") {
                if (repeats.length >= 1) {
                    if (repeats[0][0] < repeats[0][1]) {
                        repeats[0][0]++;
                        current = repeats[0][2];
                    } else {
                        repeats.shift();
                    }
                } else {
                    current = -2;
                    alert("not in a loop");
                }
            } else if (I[0] == "break") {
                let n = repeats[repeats.length - 1][3];
                if (repeats.length > 0) {
                    if (n > current) {
                        current = n;
                        repeats.shift();
                    } else {
                        current = -2;
                        alert("loop isn't closed!");
                    }
                } else {
                    current = -2;
                    alert("not in a loop");
                }
            } else if (I[0] == "inv") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    values.splice(0, 1, A.inverse());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "T") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    values.splice(0, 1, A.transpose());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "ref") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    A.gaussianElimination();
                    values.splice(0, 1, A);
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "det") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    values.splice(0, 1, A.determinate());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "aug") {
                if (values[0] instanceof Matrix && values[1] instanceof Matrix && values[0].rows == values[1].rows) {
                    let A = values[1].clone();
                    values.splice(0, 2, A.augment(values[0]));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "rip") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    if (A.columns >= 2) {
                        let col = [];
                        let B = []
                        for (let i = 0; i < A.rows; i++) {
                            for (let j = 0; j < A.columns - 1; j++) {
                                B.push(A.indices[i][j].clone());
                            }
                            col.push(A.indices[i][A.columns - 1].clone());
                        }
                        values.splice(0, 1, new Matrix(1, ...col), new Matrix(A.columns - 1, ...B));
                    }
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "flip") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    if (A.columns >= 2) {
                        let B = [];
                        for (let i = 0; i < A.rows; i++) {
                            for (let j = A.columns - 1; j >= 0; j--) {
                                B.push(A.indices[i][j].clone())
                            }
                        }
                        values.splice(0, 1, new Matrix(A.columns, ...B));
                    }
                }
            } else if (I[0] == "dim") {
                if (values[0] instanceof Matrix) {
                    values.unshift(new Rational(BigInt(values[0].rows)), new Rational(BigInt(values[0].columns)));
                }
            } else if (I[0] == "dot") {
                if (values[0] instanceof Matrix && values[0].columns == 1 && values[1] instanceof Matrix && values[1].columns == 1) {
                    let A = values[1].clone();
                    values.splice(0, 2, A.dotProduct(values[0]));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "hadamard") {
                if (values[0] instanceof Matrix && values[1] instanceof Matrix && values[0].rows == values[1].rows && values[0].cs == values[1].cs) {
                    let A = values[1].clone();
                    values.splice(0, 2, A.hadamardProduct(values[0]));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "kronecker") {
                if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    values.splice(0, 2, A.kroneckerProduct(values[0]));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "outer") {
                if (values[0] instanceof Matrix && values[0].columns == 1 && values[1] instanceof Matrix && values[1].columns == 1) {
                    let A = values[1].clone();
                    values.splice(0, 2, A.outerProduct(values[0]));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (/-?\d+/.test(I[0])) {
                values.unshift(new Rational(strToBigInt(I[0])));
            } else {
                alert("invalid command");
                current = -2;
            }
            break;
        case 2:
            if (I[0] == ">>") {
                values.unshift(values[strToBigInt(I[1])]);
            } else if (I[0] == "del") {
                values.splice(Number.parseInt(I[1]), 1);
            } else if (I[0] == "jmp") {
                let dist = Number.parseInt(I[1]);
                if (dist != 0) {
                    current += dist - 1;
                }
            } else if (I[0] == "leap") {
                if (repeats.length > 0) {
                    let n = repeats[repeats.length - 1][3];
                    if (n > current) {
                        let dist = Number.parseInt(I[1]);
                        if (dist <= 0) {
                            dist = 1;
                        }
                        current = n + dist - 1;
                        repeats.shift();
                    } else {
                        current = -2;
                        alert("loop isn't closed!");
                    }
                } else {
                    current = -2;
                    alert("not in a loop");
                }
            } else if (I[0] == "->") {
                values.unshift(values.splice(Number.parseInt(I[1]), 1)[0]);
            } else if (I[0] == "<-") {
                values.splice(Number.parseInt(I[1]), 0, values.shift());
            } else if (I[0] == "repeat") {
                let depth = 1;
                let scan = current;
                while (depth >= 1 && scan + 1 < instructions.length) {
                    let nextNext = rnList.indexOf(2, scan + 1);
                    if (nextNext == -1) {
                        // if no next statement...
                        scan = instructions.length;
                        break;
                    }
                    let nextRepeat = rnList.indexOf(1, scan + 1);
                    if (nextRepeat != -1 && nextRepeat < nextNext) {
                        scan = nextRepeat;
                        depth++;
                    } else {
                        scan = nextNext;
                        depth--;
                    }
                }
                if (BigInt(I[1]) <= 0n) {
                    current = scan;
                } else {
                    repeats.unshift([1n, BigInt(I[1]), current, scan]);
                }
            } else if (I[0] == ">>>") {
                if (repeats.length >= Number.parseInt(I[1])) {
                    values.unshift(new Rational(repeats[Number.parseInt(I[1])][0]));
                } else {
                    current = -2;
                    alert("not deep enough");
                }
            } else if (I[0] == "scaleRow") {
                if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    A.scaleRow(Number.parseInt(I[1]), values[0]);
                    values.splice(0, 2, A.clone());
                } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    A.scaleRow(Number.parseInt(I[1]), values[1]);
                    values.splice(0, 2, A.clone);
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "hold") {
                aux.set(I[1], values[0].clone());
            } else if (I[0] == "lose") {
                if (aux.has(I[1])) {
                    aux.delete(I[1]);
                }
            } else if (I[0] == "place") {
                if (aux.has(I[1])) {
                    values.unshift(aux.get(I[1]).clone());
                } else {
                    alert("\"" + I[1] + "\" doesn't exist!");
                    current = -2;
                }
            } else if (I[0] == "exists") {
                if (aux.has(I[1])) {
                    values.unshift(new Rational(1n));
                } else {
                    values.unshift(new Rational(0n));
                }
            } else {
                alert("invalid command");
                current = -2;
            }
            break;
        case 3:
            if (I[0] == "m") {
                if (!values.slice(0, Number.parseInt(I[1]) * Number.parseInt(I[2])).map((e) => e instanceof Rational).includes(false)) {
                    let arg = values.splice(0, Number.parseInt(I[1]) * Number.parseInt(I[2]));
                    arg.reverse();
                    arg.unshift(Number.parseInt(I[1]));
                    values.unshift(new Matrix(...arg));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "ind") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    values.unshift(A.indices[Number.parseInt(I[2])][Number.parseInt(I[1])].clone());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] = "addRow") {
                if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    A.addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[0].clone());
                    values.splice(0, 2, A);
                } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    A.addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[1].clone());
                    values.splice(0, 2, A);
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else {
                alert("invalid command");
                current = -2;
            }
            break;
    }
    current++;
    return false;
}

function strToBigInt(s) {
    let int = 0n;
    let neg = s.startsWith("-");
    for (let i = neg ? 1 : 0; i < s.length; i++) {
        int *= 10n;
        switch (s.substring(i, i + 1)) {
            case "0":
                break;
            case "1":
                int += 1n;
                break;
            case "2":
                int += 2n;
                break;
            case "3":
                int += 3n;
                break;
            case "4":
                int += 4n;
                break;
            case "5":
                int += 5n;
                break;
            case "6":
                int += 6n;
                break;
            case "7":
                int += 7n;
                break;
            case "8":
                int += 8n;
                break;
            case "9":
                int += 9n;
                break;
            default:
                return (neg ? -1n : 1n) * int / 10n;
        }
    }
    return (neg ? -1n : 1n) * int;
}