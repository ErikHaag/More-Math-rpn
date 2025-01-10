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
//output data
let outputList = [];
//the most recent error message
let lastError = "";

const texts = {
    errors: {
        argument: "Error: Invalid argument(s).",
        command: "Error: Invalid command.",
        det0: "Error: Matrix has determinate of zero.",
        div0: "Error: Division by zero.",
        invalidEscapeCharacter: "Invalid escape character.",
        jumpedOutOfLoop: "Error: Outside of current loop.",
        matrixDim: "Error: Matrices have incompatible sizes.",
        missingVariable: ["Error: Variable \"", "\" doesn't exist."],
        negative: "Error: Non-negative expected.",
        notInLoop: "Error: Not in a loop.",
        outOfBounds: "Error: Out of bounds.",
        parameterNotRational: "Error: A parameter wasn't a rational or integer.",
        parameterNotString: "Error: A parameter wasn't a string",
        parameterMatrix: "Error: Parameters are rationals or strings.",
        parameterNotVector: "Error: A parameter wasn't a vector.",
        shortStack: "Error: The stack doesn't have enough items.",
        tooDeep: "Error: Too deep.",
        unclosedString: "Error: Unclosed string.",
        variableName: "Error: Variable names can't start with quotes",
        variableParameterMatrix: "Error: Parameters are rationals or strings, try using place"
    },
    input: {
        rational: "Input an integer, rational, decimal, or recurring decimal:",
        text: "Input some text:"
    }
};

function reset() {
    instructions = instructionInput.value.split("\n");
    instructions = instructions.map((s) => s.trim());
    values = [];
    repeats = [];
    comments = [];
    outputList = [];
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

function toHTML(o) {
    if (appearenceSelect.value == "latex") {
        return "<img src=\"https://latex.codecogs.com/svg.image?" + (dark ? "%5Ccolor%7BWhite%7D" : "") + o.toLatex() + "\">";
    } else if (o instanceof Rational) {
        return rationalAppearence(o.clone());
    } else if (o instanceof Matrix) {
        return matrixToTable(o.clone());
    }
    return "";
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
    let neg = R.numerator < 0;
    if (neg) {
        R.mult(new Rational(-1n));
    }
    let s = R.toDecimal(p, 10n, ":");
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
        let bracketIndex = s.indexOf("[") - 1;
        [int, decimal] = s.split(":");
        for (let i = int.length - 3; i > 0; i -= 3) {
            int = int.substring(0, i) + ";" + int.substring(i);
        }
        for (let i = 3; i < decimal.length - 2 * (bracketIndex != -1); i += 4) {
            let j = i;
            if (bracketIndex != -1 && i >= bracketIndex) {
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

function interpretStringToRational(str, isInput = false) {
    if (/-?\d+[\.,]\d*\[\d+\]/.test(str)) {
        let numComponents = str.split(/[,\.\[]/);
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
    } else if (/-?\d+[\.,]\d+/.test(str)) {
        let numComponents = str.split(/[,\.]/);
        let int = new Rational(BigInt(numComponents[0]));
        let frac = new Rational(BigInt(numComponents[1]), 10n ** BigInt(numComponents[1].length));
        if (int.numerator >= 0n) {
            int.add(frac);
        } else {
            int.sub(frac);
        }
        values.unshift(int);
    } else if (/-?\d+\/\d+/.test(str)) {
        let numComponents = str.split("/");
        values.unshift(new Rational(BigInt(numComponents[0]), BigInt(numComponents[1])));
        values[0].add(new Rational(0n));
    } else if (/-?\d+/.test(str)) {
        values.unshift(new Rational(BigInt(str)));
    } else if (isInput) {
        return false;
    } else {
        lastError = texts.errors.command
        return false;
    }
    return true;
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
    output.innerHTML = "";
    let list = document.createElement("ol");
    for (const o of outputList) {
        let item = document.createElement("li");
        if (typeof o == "string") {
            if (o.startsWith("\n")) {
                output.appendChild(list);
                list = document.createElement("ol");
                if (o.length == 1) {
                    item.remove();
                    continue;
                }
                item.innerText = o.substring(1);
            } else {
                item.innerText = o
            }
        } else {
            item.innerHTML = toHTML(o);
        }
        list.appendChild(item);
    }
    output.appendChild(list);
    if (stateDisplay.hidden) return;
    list = "";
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

function appendToOutput(message) {
    if (typeof outputList.at(-1) == "string" && typeof message == "string") {
        message = outputList.pop() + message;
    }
    if (typeof message == "string") {
        if (!message) return;
        let n = message.indexOf("\n", 1);
        while (n > 0) {
            outputList.push(message.substring(0, n));
            message = message.substring(n);
            n = message.indexOf("\n", 1);
        }
        outputList.push(message);
    } else {
        outputList.push(message);
    }

}

function step() {
    let e;
    if (allowRunning) {
        // a burst of instructions
        for (let i = 0; i < steps; i++) {
            e = doInstruction();
            if (!e) break;
        }
    } else {
        e = doInstruction();
    }
    if (current != -1) {
        if (e === false) {
            updateUI();
            allowRunning = false;
            updateControls();
            output.innerHTML += (output.innerHTML.length == 0 ? "" : "<br>") + "<span class=error>" + lastError + "</span";
            current = -1;
        } else if (current == instructions.length) {
            current = -1;
            updateUI();
        } else if (allowRunning) {
            updateUI();
            timer = setTimeout(step, speed);
        } else {
            updateUI();
        }
    }
}

function doInstruction() {
    if (current == -1 || current == instructions.length) {
        return;
    }
    let I = instructions[current].split(" ");
    for (let i = 1; i < I.length; i++) {
        if (I[i].startsWith("]")) {
            let refer = BigInt(I[i].substring(1));
            let parameter = values[refer];
            if (!parameter) {
                lastError = texts.errors.outOfBounds;
                return false;
            }
            if (parameter instanceof Rational) {
                I.splice(i, 1, (parameter.numerator / parameter.denominator).toString());
            } else {
                lastError = texts.errors.parameterMatrix;
                return false;
            }
        } else if (I[i].startsWith("[")) {
            let refer = values.length - Number.parseInt(I[i].substring(1)) - 1;
            let parameter = values[refer];
            if (!parameter) {
                lastError = texts.errors.outOfBounds;
                return false;
            }
            if (parameter instanceof Rational) {
                I.splice(i, 1, (parameter.numerator / parameter.denominator).toString());
            } else {
                lastError = texts.errors.parameterMatrix;
                return false;
            }
        } else if (I[i].startsWith("$")) {
            let key = I[i].substring(1);
            if (aux.has(key)) {
                let parameter = aux.get(key).clone();
                if (parameter instanceof Rational) {
                    I.splice(i, 1, (parameter.numerator / parameter.denominator).toString());
                } else {
                    lastError = texts.errors.variableParameterMatrix;
                    return false;
                }
            } else {
                lastError = texts.errors.missingVariable.toSpliced(1, 0, I[i].substring(1)).join("");
                return false;
            }
        } else if (I[i].startsWith("\"")) {
            if (I[i].length == 1 || !I[i].endsWith("\"") || /(?:^|[^\\])(?:\\\\)*\\"$/.test(I[i])) {
                if (i + 1 < I.length) {
                    I.splice(i, 2, I[i] + " " + I[i + 1]);
                    i--;
                } else {
                    lastError = texts.errors.unclosedString;
                    return false;
                }
            } else {
                for (let j = 0; j < I[i].length; j++) {
                    if (I[i][j] == "\\") {
                        let replaced = "";
                        switch (I[i][j + 1]) {
                            case "n":
                                replaced = "\n";
                                break;
                            case "\\":
                                replaced = "\\";
                                break;
                            case "\"":
                                replaced = "\"";
                                break;
                            default:
                                lastError = texts.errors.invalidEscapeCharacter;
                                return false;
                        }
                        I[i] = I[i].substring(0, j) + replaced + I[i].substring(j + 2);
                    }
                }
            }
        }
    }
    const intRegex = /^-?\d+$/;
    const strRegex = /^"[\s\S]*"$/;
    switch (I.length) {
        case 1:
            switch (I[0]) {
                case "#":
                    values.unshift(new Rational(BigInt(values.length)));
                    break;
                case "%":
                    {
                        if (values.length < 2) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (values[0] instanceof Rational && values[1] instanceof Rational) {
                            if (values[0].numerator == 0n) {
                                lastError = texts.errors.div0;
                                return false;
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
                            lastError = texts.errors.argument;
                            return false;
                        }
                        break;
                    }
                case "*":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        values[1].mult(values[0]);
                        values.shift();
                    } else if (values[0] instanceof Matrix && values[1] instanceof Rational) {
                        values[0].scale(values[1]);
                        values.splice(1, 1);
                    } else if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                        values[1].scale(values[0]);
                        values.shift();
                    } else if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        if (values[1].columns != values[0].rows) {
                            lastError = texts.errors.matrixDim;
                            return false;
                        }
                        values[1].product(values[0]);
                        values.shift();
                    } else {
                        //Impossible to get here, but fits the pattern!
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "+":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false; ``
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Rational || values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        values[1].add(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "-":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        values[1].sub(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "/":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        if (values[0].numerator == 0) {
                            lastError = texts.errors.div0;
                            return false;
                        }
                        values[1].div(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "aug":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        if (values[0].rows != values[1].rows) {
                            lastError = texts.errors.matrixDim;
                            return false;
                        }
                        values[1].augment(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "break":
                    {
                        if (repeats.length > 0) {
                            lastError = texts.errors.notInLoop;
                            return false;
                        }
                        let r = repeats[0][2];
                        let n = repeats[0][3];
                        if (r < current && current < n) {
                            current = n;
                            repeats.shift();
                        } else {
                            lastError = texts.errors.jumpedOutOfLoop;
                            return false;
                        }
                        break;
                    }
                case "ceil":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational) {
                        values[0].ceiling();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "compare":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        values.splice(0, 2, new Rational(BigInt(values[1].compare(values[0]))));
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "den":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational) {
                        values.splice(0, 1, new Rational(values[0].denominator));
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "det":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix) {
                        values.splice(0, 1, values[0].determinate());
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "dim":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix) {
                        values.unshift(new Rational(values[0].rows), new Rational(values[0].columns));
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "dot":
                    {
                        if (values.length < 2) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                            if (values[0].columns != 1 || values[1].columns != 1) {
                                lastError = texts.errors.argumentNotVector;
                                return false;
                            }
                            if (values[0].rows != values[1].rows) {
                                lastError = texts.errors.matrixDim;
                                return false;
                            }
                            let A = values[1].clone();
                            values.splice(0, 2, A.dotProduct(values[0]));
                        } else {
                            lastError = texts.errors.argument;
                            return false;
                        }
                        break;
                    }
                case "floor":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational) {
                        values[0].floor();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "flip":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
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
                    }
                case "gcd":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[0].denominator == 1n && values[0] instanceof Rational && values[0].denominator == 1n) {
                        values.splice(0, 2, new Rational(BigMathJS.gcd(values[0].numerator, values[1].numerator)));
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "hadamard":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        if (values[0].rows != values[1].rows || values[0].columns != values[1].columns) {
                            lastError = texts.errors.matrixDim;
                            return false;
                        }
                        values[1].hadamardProduct(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "inputR":
                    while (!interpretStringToRational(prompt(texts.input.rational, "0"), true));
                    break;
                case "inputS":
                    {
                        let s = prompt(texts.input.text);
                        if (s == null) s = "";
                        for (let i = s.length - 1; i >= 0; i--) {
                            values.unshift(new Rational(BigInt(s.charCodeAt(i))));
                        }
                        values.unshift(new Rational(BigInt(s.length)));
                        break;
                    }
                case "int":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational) {
                        values[0].integer();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "inv":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        let A = values[0].clone();
                        if (A.inverse() instanceof Error) {
                            if (values[0] instanceof Rational) {
                                lastError = texts.errors.div0;
                            } else if (values[0] instanceof Matrix) {
                                lastError = texts.errors.det0;
                            }
                            return false;
                        }
                        values.splice(0, 1, A);
                    }
                    break;
                case "kronecker":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        values[1].kroneckerProduct(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "lcm":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[0].denominator == 1n && values[0] instanceof Rational && values[0].denominator == 1n) {
                        if (values[0].numerator == 0n || values[1].numerator == 0n) {
                            values.splice(0, 2, new Rational(0n));
                        } else {
                            values.splice(0, 2, new Rational(BigMathJS.lcm(values[0].numerator, values[1].numerator)));
                        }
                    } else {
                        lastError = texts.errors.argument;
                        return false;
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
                        lastError = texts.errors.notInLoop;
                        return false;
                    }
                    break;
                case "outer":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        if (values[0].columns != 1 || values[1].columns != 1) {
                            lastError = texts.errors.parameterNotVector;
                            return false;
                        }
                        values[1].outerProduct(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "outputV":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    appendToOutput(values.shift());
                    break;
                case "ref":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix) {
                        values[0].gaussianElimination();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "rip":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
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
                            lastError = texts.errors.argument;
                            return false;
                        }
                        break;
                    }
                case "step":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational) {
                        values.splice(0, 1, new Rational(BigInt(values[0].numerator >= 1n)));
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "T":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix) {
                        values[0].transpose();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                default:
                    if (!interpretStringToRational(I[0])) return false;
                    break;
            }
            break;
        case 2:
            switch (I[0]) {
                case "->":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (!intRegex.test(I[1])) {
                        lastError = texts.errors.parameterNotRational;
                        return false;
                    }
                    index = Number.parseInt(I[1]);
                    if (values[index]) {
                        values.unshift(values.splice(index, 1)[0]);
                    } else {
                        lastError = texts.errors.outOfBounds;
                        return false;
                    }
                    break;
                case "<-":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (!intRegex.test(I[1])) {
                        lastError = texts.errors.parameterNotRational;
                        return false;
                    }
                    index = Number.parseInt(I[1]);
                    if (values[index]) {
                        values.splice(index, 0, values.shift());
                    } else {
                        lastError = texts.errors.outOfBounds;
                        return false;
                    }
                    break;
                case ">>":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let copiedVal = values[BigInt(I[1])];
                        if (copiedVal) {
                            values.unshift(copiedVal.clone());
                        } else {
                            lastError = texts.errors.outOfBounds;
                            return false;
                        }
                        break;
                    }
                case ">>>":
                    {
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let d = Number.parseInt(I[1]);
                        if (d < 0) {
                            lastError = texts.errors.negative;
                            return false;
                        }
                        if (d < repeats.length) {
                            values.unshift(new Rational(repeats[d][0]));
                        } else {
                            lastError = texts.errors.tooDeep;
                            return false;
                        }
                    }
                    break;
                case "chars":
                    {
                        if (!strRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotString;
                            return false;
                        }
                        let s = I[1].slice(1, -1);
                        if (s == null) s = "";
                        for (let i = s.length - 1; i >= 0; i--) {
                            values.unshift(new Rational(BigInt(s[i].charCodeAt(0))));
                        }
                        values.unshift(new Rational(BigInt(s.length)));
                        break;
                    }
                case "del":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (!intRegex.test(I[1])) {
                        lastError = texts.errors.parameterNotRational;
                        return false;
                    }
                    index = Number.parseInt(I[1]);
                    if (values[index]) {
                        values.splice(index, 1);
                    } else {
                        lastError = texts.errors.outOfBounds;
                        return false;
                    }
                    break;
                case "exists":
                    if (I[1].startsWith("\"")) {
                        lastError = texts.errors.variableName;
                        return false;
                    }
                    if (aux.has(I[1])) {
                        values.unshift(new Rational(1n));
                    } else {
                        values.unshift(new Rational(0n));
                    }
                    break;
                case "hold":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (I[1].startsWith("\"")) {
                        lastError = texts.errors.variableName;
                        return false;
                    }
                    if (values[0]) {
                        aux.set(I[1], values[0].clone());
                    } else {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    break;
                case "inputR":
                    if (!strRegex.test(I[1])) {
                        lastError = texts.errors.parameterNotString;
                        return false;
                    }
                    while (!interpretStringToRational(prompt(I[1].slice(1, -1), "0"), true));
                    break;
                case "inputS":
                    {
                        if (!strRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotString;
                            return false;
                        }
                        let s = prompt(I[1].slice(1, -1));
                        if (s == null) s = "";
                        for (let i = s.length - 1; i >= 0; i--) {
                            values.unshift(new Rational(BigInt(s[i].charCodeAt(0))));
                        }
                        values.unshift(new Rational(BigInt(s.length)));
                        break;
                    }
                case "jmp":
                    {
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let dist = Number.parseInt(I[1]);
                        if (dist != 0) {
                            current += dist - 1;
                        }
                        break;
                    }
                case "leap":
                    {
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        if (repeats.length == 0) {
                            lastError = texts.errors.notInLoop;
                            return false;
                        }
                        let r = repeats[0][2];
                        let n = repeats[0][3];
                        if (r < current && current < n) {
                            let dist = Number.parseInt(I[1]);
                            if (dist <= 0) {
                                dist = 1;
                            }
                            current = n + dist - 1;
                            repeats.shift();
                        } else {
                            lastError = texts.errors.jumpedOutOfLoop;
                            return false;
                        }
                        break;
                    }
                case "lose":
                    if (I[1].startsWith("\"")) {
                        lastError = texts.errors.variableName;
                        return false;
                    }
                    if (aux.has(I[1])) {
                        aux.delete(I[1]);
                    }
                    break;
                case "outputC":
                    if (!intRegex.test(I[1])) {
                        lastError = texts.errors.parameterNotRational;
                        return false;
                    }
                    appendToOutput(String.fromCharCode(Number.parseInt(I[1])));
                    break;
                case "outputS":
                    if (!strRegex.test(I[1])) {
                        lastError = texts.errors.parameterNotString;
                        return false;
                    }
                    appendToOutput(I[1].slice(1, -1));
                    break;
                case "place":
                    if (I[1].startsWith("\"")) {
                        lastError = texts.errors.variableName;
                        return false;
                    }
                    if (aux.has(I[1])) {
                        values.unshift(aux.get(I[1]).clone());
                    } else {
                        lastError = texts.errors.missingVariable.toSpliced(1, 0, I[1].substring(1).join(""));
                        return false;
                    }
                    break;
                case "repeat":
                    {
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
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
                    }
                case "scaleRow":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (!intRegex.test(I[1])) {
                        lastError = texts.errors.parameterNotRational;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                        values[1].scaleRow(Number.parseInt(I[1]), values[0]);
                        values.shift();
                    } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                        values[0].scaleRow(Number.parseInt(I[1]), values[1]);
                        values.splice(1, 1);
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                default:
                    lastError = texts.errors.command;
                    return false;
            }
            break;
        case 3:
            switch (I[0]) {
                case "addRow":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (!intRegex.test(I[1]) || !intRegex.test(I[2])) {
                        lastError = texts.errors.parameterNotRational;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                        values[1].addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[0].clone());
                        values.shift();
                    } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                        values[0].addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[1].clone());
                        values.splice(1, 1);
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "m":
                    {
                        let r = Number.parseInt(I[1]) * Number.parseInt(I[2]);
                        if (values.length < r) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!intRegex.test(I[1]) || !intRegex.test(I[2])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        if (!values.slice(0, r).map((e) => e instanceof Rational).includes(false)) {
                            let arg = values.splice(0, Number.parseInt(I[1]) * Number.parseInt(I[2]));
                            arg.reverse();
                            values.unshift(new Matrix(BigInt(I[1]), arg));
                        } else {
                            lastError = texts.errors.argument;
                            return false;
                        }
                        break;
                    }
                case "ind":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!intRegex.test(I[1]) || !intRegex.test(I[2])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        if (values[0] instanceof Matrix) {
                            let index = values[0].indices[Number.parseInt(I[2])]?.[Number.parseInt(I[1])];
                            if (!index) {
                                lastError = texts.errors.outOfBounds;
                                return false;
                            }
                            values.unshift(index.clone());
                        } else {
                            lastError = texts.errors.argument;
                            return false;
                        }
                        break;
                    }
                case "swapRows":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (!intRegex.test(I[1]) || !intRegex.test(I[2])) {
                        lastError = texts.errors.parameterNotRational;
                        return false;
                    }
                    if (values[0] instanceof Matrix) {
                        values[0].swapRows(Number.parseInt(I[1]), Number.parseInt(I[2]));
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                default:
                    lastError = texts.errors.command;
                    return false;
            }
            break;
    }
    current++;
    return true;
}