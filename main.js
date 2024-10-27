//whether it's black on white or white on black
let dark = false;
//whether the link options tray is hidden or shown
let linkOptionsVisible = false;
//the amount of precision after the decimal point in associated display modes
let decimals = 3n;
//the list of instructions in a JS friendly format
let instructions = [];
//the comments and locations
let comments = [];
//any repeats currently being dealt with
let repeats = [];
//the values shuffled on a stack
let values = [];
//the named variables
let aux = new Map();
//where we are in the instructions
let current = -1;
//whether the program is stepping manually or automatically
let allowRunning = true;
//the beating heart of this magnum opus
let timer;
//how fast are we going? 
let speedSelect = 0n;
//the time between update bursts
let speed = 500;
//the amount of updates per burst
let steps = 1;
//where "repeat" and "next" instructions are
let rnList = [];

function reset() {
    instructions = instructionInput.value.split("\n");
    instructions = instructions.map((s) => s.trim());
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
    for (let i = 0n; i < M.rows; i++) {
        h += "\n<tr>";
        if (M.rows == 1n) {
            h += "\n<td>[</td>";
        } else if (i == 0n) {
            h += "\n<td>⎡</td>";
        } else if (i == M.rows - 1n) {
            h += "\n<td>⎣</td>";
        } else {
            h += "\n<td>⎢ </td>";
        }
        for (let j = 0n; j < M.columns; j++) {
            h += "\n<td class=\"matrixIndex\">" + rationalAppearence(M.indices[i][j].clone()) + "</td>";
        }
        if (M.rows == 1n) {
            h += "\n<td>]</td>";
        } else if (i == 0n) {
            h += "\n<td>⎤</td>";
        } else if (i == M.rows - 1n) {
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
    switch (appearenceSelect.value) {
        case "fraction":
            str = rationalToTable(R, false);
            break;
        case "fractioncommas":
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
        return "<p>" + BigIntToString(R.numerator, commas) + "</p>";
    } else {
        return "<table>\n<tr>\n<td class=\"numerator\">" + BigIntToString(R.numerator, appearenceSelect.value == "fractioncommas") + "</td>\n</tr>\n<tr>\n<td class=\"denominator\">" + BigIntToString(R.denominator, appearenceSelect.value == "fractioncommas") + "</td>\n</tr>\n</table>";
    }
}

function rationalToDecimal(R, p, commas = false) {
    let RClone = R.clone();
    let neg = RClone.numerator < 0;
    if (neg) {
        RClone.mult(new Rational(-1n));
    }
    let s = RClone.toDecimal(p, 10n, ":");
    if (s.endsWith("[0]")) {
        s = s.substring(0, s.length - 3);
    }
    if (s.endsWith(":")) {
        s = s.substring(0, s.length - 1);
        if (commas) {
            for (let i = s.length - 3; i > 0; i -= 3) {
                s = s.substring(0, i) + ";" + s.substring(i);
            }
        }
    } else if (commas) {
        let int, decimal;
        let bracketIndex = s.indexOf("[");
        [int, decimal] = s.split(":");
        for (let i = int.length - 3; i > 0; i -= 3) {
            int = int.substring(0, i) + ";" + int.substring(i);
        }
        for (let i = 3; i < decimal.length - 2 * (bracketIndex != -1); i += 4) {
            let j = i;
            if (bracketIndex != -1 && i > bracketIndex) {
                j++;
            }
            decimal = decimal.substring(0, j) + ";" + decimal.substring(j);
        }
        s = int + ":" + decimal;
    }
    if (neg) {
        s = "-" + s;
    }
    return s.replaceAll(":", britishCheck.checked ? "," : ".").replaceAll(";", britishCheck.checked ? "." : ",");
}

function BigIntToString(I, commas = false) {
    let neg = I < 0;
    I = BigMathJS.abs(I);
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
    if (neg) {
        s = "-" + s;
    }
    return s
}

function updateUI() {
    let list = "";
    let indexRow = "";
    for (let i = (values.length - 1); i >= 0; i--) {
        if (!allowRunning) {
            indexRow += "<td>" + BigInt(i) + "</td>"
        }
        if (appearenceSelect.value == "latex") {
            valElem = "<img src=\"https://latex.codecogs.com/svg.image?" + (dark ? "%5Ccolor%7BWhite%7D" : "") + values[i].toLatex() + "\">";
        } else {
            if (values[i] instanceof Rational) {
                valElem = rationalAppearence(values[i].clone());
            } else if (values[i] instanceof Matrix) {
                valElem = matrixToTable(values[i].clone());
            }
        }
        if (allowRunning) {
            list += "<li>" + valElem + "</li>\n"
        } else {
            list += "<td>" + valElem + "</td>"
        }
    }
    if (allowRunning) {
        valueStack.innerHTML = list;
    } else {
        valueStack.innerHTML = "<li><table><tr class=\"index\">" + indexRow + "</tr><tr class=\"valRow\">" + list + "</tr></table></li>"
    }
    if (aux.keys().next().done) {
        // hide if empty
        auxillaryArray.parentElement.hidden = true;
    } else {
        list = ""
        for (let kv of aux.entries()) {
            list += "<li><p class=\"auxKey\">" + kv[0] + "</p><br>";
            if (appearenceSelect.value == "latex") {
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
        auxillaryArray.parentElement.hidden = false;
    }
    if (repeats.length == 0) {
        //hide if empty
        repeatPile.parentElement.hidden = true;
    } else {
        list = "";
        for (let i = 0; i < repeats.length; i++) {
            list += "<li>" + repeats[i][0].toString() + ", " + repeats[i][1].toString() + ", " + repeats[i][2].toString() + ", " + repeats[i][3].toString() + "</li>\n";
        }
        repeatPile.innerHTML = list;
        repeatPile.parentElement.hidden = false;
    }
    list = "";
    let c = comments.findIndex((e) => { return e[0] == 0; });
    if (c >= 0) {
        for (let j = 1; j < comments[c].length; j++) {
            list += "<li><p class=\"comment\">\"" + comments[c][j] + "\"</p></li>\n";
        }
    }
    for (let i = 0; i < instructions.length; i++) {
        list += "<li " + (i == current ? "class=\"curr\" >" : ">") + (allowRunning || current == -2 || current == -1 ? "" : "<p class=\"index\">" + BigInt(i - current) + "</p><br>") + instructions[i] + "</li>\n";
        let c = comments.findIndex((e) => { return e[0] == i + 1; });
        if (c >= 0) {
            for (let j = 1; j < comments[c].length; j++) {
                list += "<li><p class=\"comment\">\"" + comments[c][j] + "\"</p></li>\n";
            }
        }
    }
    instructionList.innerHTML = list;
}

function step() {
    if (allowRunning) {
        // a burst of instructions
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
            let refer = BigInt(I[i].substring(1));
            let parameter = values[refer];
            if (!parameter) {
                alert("out of bounds");
                current = -1;
                return true;
            }
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
            if (!parameter) {
                alert("out of bounds");
                current = -1;
                return true;
            }
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
    let index = 0n;
    switch (I.length) {
        case 1:
            switch (I[0]) {
                case "+":
                    if (values[0] instanceof Rational && values[1] instanceof Rational || values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        values[1].add(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "-":
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        values[1].sub(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "*":
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        values[1].mult(values[0]);
                        values.shift();
                    } else if (values[0] instanceof Matrix && values[1] instanceof Rational) {
                        values[0].scale(values[1]);
                        values.splice(1, 1);
                    } else if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                        values[1].scale(values[0]);
                        values.shift();
                    } else if (values[0] instanceof Matrix && values[1] instanceof Matrix && values[1].columns == values[0].rows) {
                        values[1].product(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "/":
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        if (values[0].numerator == 0) {
                            alert("division by zero!");
                            current = -2;
                            break;
                        }
                        values[1].div(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "gcd":
                    if (values[0] instanceof Rational && values[0].denominator == 1n && values[0] instanceof Rational && values[0].denominator == 1n) {
                        let A = BigMathJS.abs(values[0].numerator);
                        let B = BigMathJS.abs(values[1].numerator);
                        values.splice(0, 2, new Rational(BigMathJS.gcd(A, B)));
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "lcm":
                    if (values[0] instanceof Rational && values[0].denominator == 1n && values[0] instanceof Rational && values[0].denominator == 1n) {
                        if (values[0].numerator == 0n || values[1].numerator == 0n) {
                            values.splice(0, 2, new Rational(0n));
                        } else {
                            let A = BigMathJS.abs(values[0].numerator);
                            let B = BigMathJS.abs(values[1].numerator);
                            values.splice(0, 2, new Rational(BigMathJS.lcm(A, B)));
                        }
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "int":
                    if (values[0] instanceof Rational) {
                        values[0].integer();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "#":
                    values.unshift(new Rational(BigInt(values.length)));
                    break;
                case "floor":
                    if (values[0] instanceof Rational) {
                        values[0].floor();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "ceil":
                    if (values[0] instanceof Rational) {
                        values[0].ceiling();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "%":
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        if (values[0].numerator == 0n) {
                            alert("Division by zero!");
                            current = -2;
                            break;
                        }
                        let C = values[1].clone();
                        C.div(values[0]);
                        let D = C.clone();
                        D.integer();
                        if (C.compare(D) == -1n) {
                            D.sub(1n);
                        }
                        D.mult(values[0]);
                        values[1].sub(D);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "den":
                    if (values[0] instanceof Rational) {
                        values.splice(0, 1, new Rational(values[0].denominator));
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "step":
                    if (values[0] instanceof Rational) {
                        values.splice(0, 1, new Rational(BigInt(values[0].numerator >= 1n)));
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "compare":
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        values.splice(0, 2, new Rational(BigInt(values[1].compare(values[0]))));
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "next":
                    if (repeats.length >= 1) {
                        if (repeats[0][0] < repeats[0][1]) {
                            repeats[0][0]++;
                            current = repeats[0][2];
                        } else {
                            repeats.shift();
                        }
                    } else {
                        alert("not in a loop");
                        current = -2;
                    }
                    break;
                case "break":
                    if (repeats.length > 0) {
                        let n = repeats[0][3];
                        if (n > current) {
                            current = n;
                            repeats.shift();
                        } else {
                            alert("loop isn't closed!");
                            current = -2;
                        }
                    } else {
                        alert("not in a loop");
                        current = -2;
                    }
                    break;
                case "inv":
                    if (values[0] instanceof Rational) {
                        if (values[0].inverse() instanceof Error) {
                            alert("division by zero!");
                        }
                    } else if (values[0] instanceof Matrix) {
                        let e = values[0].inverse();
                        if (e instanceof Error) {
                            alert("matrix has determinate of 0");
                            current = -2;
                        }
                    }
                    break;
                case "T":
                    if (values[0] instanceof Matrix) {
                        values[0].transpose();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "ref":
                    if (values[0] instanceof Matrix) {
                        values[0].gaussianElimination();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "det":
                    if (values[0] instanceof Matrix) {
                        values.splice(0, 1, values[0].determinate());
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "aug":
                    if (values[0] instanceof Matrix && values[1] instanceof Matrix && values[0].rows == values[1].rows) {
                        values[1].augment(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "rip":
                    if (values[0] instanceof Matrix) {
                        let A = values[0].clone();
                        if (A.columns >= 2n) {
                            let col = [];
                            let B = []
                            for (let i = 0n; i < A.rows; i++) {
                                for (let j = 0n; j < A.columns - 1n; j++) {
                                    B.push(A.indices[i][j].clone());
                                }
                                col.push(A.indices[i][A.columns - 1n].clone());
                            }
                            values.splice(0, 1, new Matrix(1n, col.flat()), new Matrix(A.columns - 1n, B.flat()));
                        }
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "flip":
                    if (values[0] instanceof Matrix) {
                        let A = values[0].clone();
                        if (A.columns >= 2n) {
                            let B = [];
                            for (let i = 0n; i < A.rows; i++) {
                                for (let j = A.columns - 1n; j >= 0n; j--) {
                                    B.push(A.indices[i][j].clone())
                                }
                            }
                            values.splice(0, 1, new Matrix(A.columns, B.flat()));
                        }
                    }
                    break;
                case "dim":
                    if (values[0] instanceof Matrix) {
                        values.unshift(new Rational(values[0]), new Rational(values[0].columns));
                    }
                    break;
                case "dot":
                    if (values[0] instanceof Matrix && values[0].columns == 1 && values[1] instanceof Matrix && values[1].columns == 1) {
                        let A = values[1].clone();
                        values.splice(0, 2, A.dotProduct(values[0]));
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "hadamard":
                    if (values[0] instanceof Matrix && values[1] instanceof Matrix && values[0].rows == values[1].rows && values[0].cs == values[1].cs) {
                        values[1].hadamardProduct(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "kronecker":
                    if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        values[1].kroneckerProduct(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "outer":
                    if (values[0] instanceof Matrix && values[0].columns == 1 && values[1] instanceof Matrix && values[1].columns == 1) {
                        values[1].outerProduct(values[0]);
                        values.shift();
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                default:
                    if (/-?\d+[\.,]\d*\[\d+\]/.test(I[0])) {
                        let numComponents = I[0].split(/[,\.\[]/);
                        let int = new Rational(BigInt(numComponents[0]));
                        let frac = new Rational(BigInt(numComponents[1]), 10n ** BigInt(numComponents[1].length));
                        let rep = new Rational(BigInt(numComponents[2].slice(0, -1)), 10n ** BigInt(numComponents[1].length) * (10n ** (BigInt(numComponents[2].length) - 1n) - 1n));
                        frac.add(rep);
                        if (int.numerator >= 0n) {
                            int.add(frac);
                        } else {
                            int.sub(frac);
                        }
                        values.unshift(int);
                    } else if (/-?\d+[\.,]\d+/.test(I[0])) {
                        let numComponents = I[0].split(/[,\.]/);
                        let int = new Rational(BigInt(numComponents[0]));
                        let frac = new Rational(BigInt(numComponents[1]), 10n ** BigInt(numComponents[1].length));
                        if (int.numerator >= 0n) {
                            int.add(frac);
                        } else {
                            int.sub(frac);
                        }
                        values.unshift(int);
                    } else if (/-?\d+\/\d+/.test(I[0])) {
                        let numComponents = I[0].split("/");
                        values.unshift(new Rational(BigInt(numComponents[0]), BigInt(numComponents[1])));
                    } else if (/-?\d+/.test(I[0])) {
                        values.unshift(new Rational(BigInt(I[0])));
                    } else {
                        alert("invalid command");
                        current = -2;
                    }
                    break;
            }
            break;
        case 2:
            switch (I[0]) {
                case ">>":
                    let copiedVal = values[BigInt(I[1])];
                    if (copiedVal) {
                        values.unshift(copiedVal.clone());
                    } else {
                        alert("out of bounds");
                        current = -2;
                    }
                    break;
                case "del":
                    index = Number.parseInt(I[1]);
                    if (values[index]) {
                        values.splice(index, 1);
                    } else {
                        alert("out of bounds");
                        current = -2;
                    }
                    break;
                case "jmp":
                    let dist = Number.parseInt(I[1]);
                    if (dist != 0) {
                        current += dist - 1;
                    }
                    break;
                case "leap":
                    if (repeats.length > 0) {
                        let n = repeats[0][3];
                        if (n > current) {
                            let dist = Number.parseInt(I[1]);
                            if (dist <= 0) {
                                dist = 1;
                            }
                            current = n + dist - 1;
                            repeats.shift();
                        } else {
                            alert("loop isn't closed!");
                            current = -2;
                        }
                    } else {
                        alert("not in a loop");
                        current = -2;
                    }
                    break;
                case "->":
                    index = Number.parseInt(I[1]);
                    if (values[index]) {
                        values.unshift(values.splice(index, 1)[0]);
                    } else {
                        alert("out of bounds");
                        current = -2;
                    }
                    break;
                case "<-":
                    index = Number.parseInt(I[1]);
                    if (values[index]) {
                        values.splice(index, 0, values.shift());
                    } else {
                        alert("out of bounds");
                        current = -2;
                    }
                    break;
                case "repeat":
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
                    break;
                case ">>>":
                    if (repeats.length >= Number.parseInt(I[1])) {
                        values.unshift(new Rational(repeats[Number.parseInt(I[1])][0]));
                    } else {
                        alert("not deep enough");
                        current = -2;
                    }
                    break;
                case "scaleRow":
                    if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                        values[1].scaleRow(Number.parseInt(I[1]), values[0]);
                        values.shift();
                    } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                        values[0].scaleRow(Number.parseInt(I[1]), values[1]);
                        values.splice(1, 1);
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "hold":
                    if (values[0]) {
                        aux.set(I[1], values[0].clone());
                    } else {
                        alert("add something to the stack");
                    }
                    break;
                case "lose":
                    if (aux.has(I[1])) {
                        aux.delete(I[1]);
                    }
                    break;
                case "place":
                    if (aux.has(I[1])) {
                        values.unshift(aux.get(I[1]).clone());
                    } else {
                        alert("\"" + I[1] + "\" doesn't exist!");
                        current = -2;
                    }
                    break;
                case "exists":
                    if (aux.has(I[1])) {
                        values.unshift(new Rational(1n));
                    } else {
                        values.unshift(new Rational(0n));
                    }
                    break;
                default:
                    alert("invalid command");
                    current = -2;
                    break;
            }
            break;
        case 3:
            switch (I[0]) {
                case "m":
                    if (!values.slice(0, Number.parseInt(I[1]) * Number.parseInt(I[2])).map((e) => e instanceof Rational).includes(false)) {
                        let arg = values.splice(0, Number.parseInt(I[1]) * Number.parseInt(I[2]));
                        arg.reverse();
                        values.unshift(new Matrix(BigInt(I[1]), arg));
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "ind":
                    if (values[0] instanceof Matrix) {
                        let A = values[0].clone();
                        values.unshift(A.indices[Number.parseInt(I[2])][Number.parseInt(I[1])].clone());
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                case "addRow":
                    if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                        values[1].addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[0].clone());
                        values.shift();
                    } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                        values[0].addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[1].clone());
                        values.splice(1, 1);
                    } else {
                        alert("invalid arguments");
                        current = -2;
                    }
                    break;
                default:
                    alert("invalid command");
                    current = -2;
            }
            break;
    }
    current++;
    return false;
}