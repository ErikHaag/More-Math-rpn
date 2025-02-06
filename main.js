//whether it's black on white or white on black
let dark = false;
// whether the instruction list auto-scrolls
let followingCurrent = false;
let followingOffset = 0;
//whether the link options tray is hidden or shown
let linkOptionsVisible = false;
//the amount of precision after the decimal point in associated display modes
let decimals = 3n;
//the list of instructions in a JS friendly format
let instructions = [];
//the comments and locations
let comments = [];
//the breakpoints in the code
let breakpoints = [];
//any repeats currently being dealt with
let repeats = [];
//the values shuffled on a stack
let values = [];
//the named variables
let aux = new Map();
//where we are in the instructions
let current = [];
let executingCurrent = 0;
//whether the program is stepping manually or automatically
let autoStepping = true;
//whether the program is running
let running = false;
//the beating heart of this magnum opus
let clock;
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
//whether these lists had any elementss
let openAA = false;
let openRP = false;

const texts = {
    errors: {
        argument: "Invalid argument(s).",
        argumentNotVector: "An argument wasn't a vector.",
        beforeCode: "Jumped beyond start of instructions.",
        command: "Invalid command.",
        det0: "Matrix has determinate of zero.",
        invalidEscapeCharacter: "Invalid escape character.",
        indeterminateForm: "Rational of indeterminate form!",
        jumpedOutOfLoop: "Outside of current loop.",
        matrixDim: "Matrices have incompatible sizes.",
        missingVariable: ["Variable \"", "\" doesn't exist."],
        negative: "Non-negative number expected.",
        notInLoop: "Not in a loop.",
        notPositive: "Positive number expected.",
        outOfBounds: "Out of bounds.",
        parameterInfinity: "A parameter isn't finite.",
        parameterNotRational: "A parameter wasn't a rational or integer.",
        parameterNotString: "A parameter wasn't a string.",
        parameterMatrix: "Parameters are rationals or strings.",
        shortStack: "The stack doesn't have enough items.",
        tooDeep: "Too deep.",
        unclosedString: "Unclosed string.",
        unknown: "An unknow error occurred, please create an issue so I can debug.",
        variableName: "Variable names can't start with quotes.",
        variableParameterMatrix: "Parameters are rationals or strings, try using place."
    },
    input: {
        rational: "Input an integer, rational, decimal, or recurring decimal:",
        text: "Input some text:",
        textEscaping: "Input some text, use \\n for newlines and \\\\ for \\"
    }
};

function reset() {
    clearInterval(clock);
    instructions = [];
    comments = [];
    breakpoints = [];
    repeats = [];
    values = [];
    current = [];
    rnList = [];
    outputList = [];
    aux = new Map();
    openAA = false;
    openRP = false;
    auxillaryArray.parentElement.hidden = true;
    repeatPile.parentElement.hidden = true;
    parse(instructionInput.value);
}

function parse(instr) {
    let parsedInstructions = instr.split("\n").map((s) => s.trim());
    {
        //comments
        let parsedComments = [];
        let bpPos = [];
        let instructionCount = 0;
        for (let i = 0; i < parsedInstructions.length; i++) {
            if (parsedInstructions[i].startsWith("\"")) {
                let c = parsedInstructions.splice(i, 1)[0].substring(1);
                if (i >= 1 && parsedComments.at(-1)?.[0] == instructionCount) {
                    parsedComments.at(-1).push(c);
                } else {
                    parsedComments.push([instructionCount, c]);
                }
                i--;
            } else if (parsedInstructions[i] == "!!!") {
                if (bpPos.at(-1) != instructionCount) {
                    bpPos.push(instructionCount);
                }
                parsedInstructions.splice(i, 1);
                i--;
            } else {
                instructionCount++;
            }
        }
        comments.push(parsedComments);    
        breakpoints.push(bpPos);
    }
    instructions.push(parsedInstructions);
    repeats.push([]);
    rnList.push(parsedInstructions.map((s) => {
        if (s.startsWith("repeat")) {
            return 1;
        } else if (s == "next") {
            return 2;
        }
        return 0;
    }));
    current.push(0);
    executingCurrent = 0;
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
            h += "\n<td class=\"bracket D L U\"></td>";
        } else if (i == 0n) {
            h += "\n<td class=\"bracket L U\"></td>";
        } else if (i == M.rows - 1n) {
            h += "\n<td class=\"bracket D L\"></td>";
        } else {
            h += "\n<td class=\"bracket L\"> </td>";
        }
        for (let j = 0n; j < M.columns; j++) {
            h += "\n<td class=\"matrixIndex\">" + rationalAppearence(M.indices[i][j]) + "</td>";
        }
        if (M.rows == 1n) {
            h += "\n<td class=\"bracket D R U\"></td>";
        } else if (i == 0n) {
            h += "\n<td class=\"bracket R U\"></td>";
        } else if (i == M.rows - 1n) {
            h += "\n<td class=\"bracket D R\"></td>";
        } else {
            h += "\n<td class=\"bracket R\"></td>";
        }
        h += "\n</tr>";
    }
    return h + "\n</table>";
}

function rationalAppearence(R) {
    if (R instanceof Error) {
        switch (appearenceSelect.value) {
            case "fraction":
            case "fractioncommas":
                return "<table>\n<tr>\n<td class=\"numerator\">0</td>\n</tr>\n<tr>\n<td class=\"denominator\">0</td></tr></tabl/e>";
            case "decimal":
            case "decimalcommas":
                return "<p>Indeterminate form</p>";
            default:
                return "<p>Huh?</p>";
        }
    }
    if (R.denominator == 0n) {
        return "<p>" + (R.numerator < 0n ? "-" : "") + "&infin;</p>";
    }
    switch (appearenceSelect.value) {
        case "fraction":
            return rationalToTable(R, false);
        case "fractioncommas":
            return rationalToTable(R, true);
        case "decimal":
            return "<p>" + rationalToDecimal(R, decimals, false) + "</p>";
        case "decimalcommas":
            return "<p>" + rationalToDecimal(R, decimals, true) + "</p>";
        default:
            return "<p>Huh?</p>";
    }
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
        let bracketIndex = s.indexOf("[");
        [int, decimal] = s.split(":");
        for (let i = int.length - 3; i > 0; i -= 3) {
            int = int.substring(0, i) + ";" + int.substring(i);
        }
        for (let i = 3; i < decimal.length - 2 * (bracketIndex != -1); i += 4) {
            let j = i;
            if (bracketIndex != -1 && i + 1 >= bracketIndex) {
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
    if (/^-?\d+[\.,]\d*\[\d+\]$/.test(str)) {
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
        return true;
    } else if (/^-?\d+[\.,]\d+$/.test(str)) {
        let numComponents = str.split(/[,\.]/);
        let int = new Rational(BigInt(numComponents[0]));
        let frac = new Rational(BigInt(numComponents[1]), 10n ** BigInt(numComponents[1].length));
        if (int.numerator >= 0n) {
            int.add(frac);
        } else {
            int.sub(frac);
        }
        values.unshift(int);
        return true;
    } else if (/^-?\d+\/\d+$/.test(str)) {
        let numComponents = str.split("/");
        let v = new Rational(BigInt(numComponents[0]), BigInt(numComponents[1]));
        if (v instanceof Error) {
            if (!isInput) {
                lastError = texts.errors.indeterminateForm;
            }
            return false;
        }
        values.unshift(v);
        return true;
    } else if (/^-?\d+$/.test(str)) {
        values.unshift(new Rational(BigInt(str)));
        return true;
    }
    if (!isInput) {
        lastError = texts.errors.command;
    }
    return false;
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
    let list = [];
    function appendList() {
        if (list.length == 0) {
            output.appendChild(document.createElement("br"));
        } else {
            let listEl = document.createElement("ol");
            for (const i of list) {
                listEl.appendChild(i);
            }
            output.appendChild(listEl);
            list = [];
        }
    }
    for (const o of outputList) {
        let item = document.createElement("li");
        if (typeof o == "string") {
            if (o.startsWith("\n")) {
                appendList();
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
        list.push(item);
    }
    appendList();
    if (stateDisplay.hidden) return;
    list = "";
    let indexRow = "";
    for (let i = (values.length - 1); i >= 0; i--) {
        if (!autoStepping) {
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
        if (autoStepping) {
            list += "<li>" + valElem + "</li>\n"
        } else {
            list += "<td>" + valElem + "</td>"
        }
    }
    if (autoStepping) {
        valueStack.innerHTML = list;
    } else {
        valueStack.innerHTML = "<li><table><tr class=\"index\">" + indexRow + "</tr><tr class=\"valRow\">" + list + "</tr></table></li>"
    }
    if (openAA) {
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
    if (openRP) {
        let rep = repeats.at(-1);
        list = "";
        for (let i = 0; i < rep.length; i++) {
            list += "<li>current: " + rep[i][0].toString() + "<br>max: " + rep[i][1].toString() + "<br>start: " + rep[i][2].toString() + "<br>end: " + rep[i][3].toString() + "</li>\n";
        }   
        repeatPile.innerHTML = list;
        repeatPile.parentElement.hidden = false;
    }
    list = "";
    let com = comments.at(-1);
    if (com?.[0]?.[0] == 0) {
        for (let j = 1; j < com[0].length; j++) {
            list += "<li><p class=\"comment\">\"" + com[0][j] + "\"</p></li>\n";
        }
    }
    let bp = breakpoints.at(-1);
    if (bp?.[0] == 0) {
        list += "<li><p class=\"breakpoint\">!!!</p></li>";
    }
    let instr = instructions.at(-1);
    for (let i = 0; i < instr?.length; i++) {
        list += "<li " + (running && i == executingCurrent ? "class=\"curr\" >" : ">") + (autoStepping || current.length == 0 ? "" : "<p class=\"index\">" + BigInt(i - executingCurrent) + "</p><br>") + instr[i] + "</li>\n";
        let cI = com.findIndex((e) => { return e[0] == i + 1; });
        if (cI >= 0) {
            for (let j = 1; j < com[cI].length; j++) {
                list += "<li><p class=\"comment\">\"" + com[cI][j] + "\"</p></li>\n";
            }
        }
        let bpI = bp.indexOf(i + 1);
        if (bpI >= 0) {
            list += "<li><p class=\"breakpoint\">!!!</p></li>";
        }
    }
    instructionList.innerHTML = list;
}

function scrollInstructions(ending = false) {
    if (speedSelect >= 2n) {
        return;
    }
    // this is going to look weird
    let c = instructionList.getElementsByClassName("curr")[0];
    if (!c) {
        if (!ending) {
            return;
        }
        //scroll to end
        c = instructionList.children[instructionList.children.length - 1];
    }
    let iLBR = instructionList.getBoundingClientRect();
    let xOff = c.offsetLeft - followingOffset;
    if (Math.abs(xOff / iLBR.width - 0.5) < 0.3) {
        return;
    }
    followingOffset += xOff - iLBR.width / 4;
    instructionList.scrollLeft = followingOffset;
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
    if (autoStepping) {
        // a burst of instructions
        for (let i = 0; i < steps; i++) {
            e = doInstruction();
            if (e !== true) break;
        }
    } else {
        e = doInstruction();
    }
    executingCurrent = current.at(-1);
    // e = undefined, "bp", "halt!", true or false
    // undefined -> stop, no error
    // "bp" -> hit breakpoint, basically hit stop button
    // "halt!" -> stop completely
    // true -> ok
    // false -> stop, yes error
    let end = false;
    let halt = true;
    if (e == "halt!") {
        running = false;
        executingCurrent = instructions.at(-1).length;
    } else if (e == "bp") {
        autoStepping = false;
        updateControls();
    } else if (executingCurrent >= instructions.at(-1).length) {
        // end of program reached
        if (instructions.length >= 2) {
            instructions.pop();
            comments.pop();
            breakpoints.pop();
            repeats.pop()
            current.pop();
            rnList.pop();
            executingCurrent = current.at(-1);
            halt = false;
        } else {
            running = false;
        }
        end = true;
    } else if (e === true && autoStepping) {
        //continue to next iteration
        halt = false;
    }
    updateUI();
    if (e === false) {
        // an error occurred :(
        autoStepping = false;
        running = false;
        updateControls();
        output.innerHTML += (output.innerHTML.length == 0 ? "" : "<br>") + "<span class=error>Error: " + lastError + "</span";
    }
    if (followingCurrent) {
        scrollInstructions(end);
    }
    if (halt) {
        // if there's a problem, stop execution
        clearInterval(clock);
    }
}

function handleEscapeCharacters(str) {
    for (let i = 0; i < str.length; i++) {
        if (str[i] == "\\") {
            let replaced = "";
            switch (str[i + 1]) {
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
                    return false;
            }
            str = str.substring(0, i) + replaced + str.substring(i + 2);
        }
    }
    return str;
}

function doInstruction() {
    let top = instructions.length - 1;
    if (current[top] < 0 || current[top] >= instructions[top].length) {
        return;
    }
    let I = instructions[top][current[top]].split(" ");
    for (let i = 1; i < I.length; i++) {
        if (I[i].startsWith("]")) {
            let refer = Number.parseInt(I[i].substring(1));
            let parameter = values[refer];
            if (!parameter) {
                lastError = texts.errors.outOfBounds;
                return false;
            }
            if (parameter instanceof Rational) {
                if (parameter.denominator == 0n) {
                    lastError = texts.errors.parameterInfinity;
                    return false;
                }
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
                if (parameter.denominator == 0n) {
                    lastError = texts.errors.parameterInfinity;
                    return false;
                }
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
                    if (parameter.denominator == 0n) {
                        texts.errors.parameterInfinity;
                        return false;
                    }
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
                let s = handleEscapeCharacters(I[i])
                if (s === false) {
                    lastError = texts.errors.invalidEscapeCharacter;
                    return false;
                }
                I[i] = s;
            }
        }
    }
    const intRegex = /^-?\d+$/;
    const strRegex = /^"[\s\S]*"$/;
    let errorHolder;
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
                            let C = values[1].clone();
                            if (C.denominator == 0n) {
                                lastError = texts.errors.argument;
                                return false;
                            }
                            if (values[0].numerator == 0n) {
                                lastError = texts.errors.div0;
                                return false;
                            }
                            if (values[0].denominator == 0n) {
                                if (values[0].numerator == -1n) {
                                    values[1].mult(-1n);
                                }
                                values.shift();
                                break;
                            }
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
                    }
                    break;
                case "*":
                    if (values.length < 2) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational && values[1] instanceof Rational) {
                        errorHolder = values[1].mult(values[0]);
                        values.shift();
                    } else if (values[0] instanceof Matrix && values[1] instanceof Rational) {
                        errorHolder = values[0].scale(values[1]);
                        values.splice(1, 1);
                    } else if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                        errorHolder = values[1].scale(values[0]);
                        values.shift();
                    } else if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                        if (values[1].columns != values[0].rows) {
                            lastError = texts.errors.matrixDim;
                            return false;
                        }
                        errorHolder = values[1].product(values[0]);
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
                        errorHolder = values[1].add(values[0]);
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
                        errorHolder = values[1].sub(values[0]);
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
                        errorHolder = values[1].div(values[0]);
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
                        if (repeats[top].length == 0) {
                            lastError = texts.errors.notInLoop;
                            return false;
                        }
                        let r = repeats[top][0][2];
                        let n = repeats[top][0][3];
                        if (r < current[top] && current[top] < n) {
                            current[top] = n;
                            repeats[top].shift();
                        } else {
                            lastError = texts.errors.jumpedOutOfLoop;
                            return false;
                        }
                    }
                    break;
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
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (values[0] instanceof Matrix) {
                            let d = values[0].determinate();
                            if (d instanceof Error) {
                                errorHolder = d;
                                break;
                            }
                            values.splice(0, 1, d);
                        } else {
                            lastError = texts.errors.argument;
                            return false;
                        }
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
                            errorHolder = values[1].dotProduct(values[0]);
                            values.shift();
                        } else {
                            lastError = texts.errors.argument;
                            return false;
                        }
                    }
                    break;
                case "end":
                    current[top] = instructions[top].length;
                    return; //stops without errors
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
                    }
                    break;
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
                        errorHolder = values[1].hadamardProduct(values[0]);
                        values.shift();
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "halt":
                    return "halt!";
                case "hyperStep":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational) {
                        if (values[0].denominator >= 1n) {
                            values.splice(0, 1, new Rational(0n));
                        } else {
                            values.splice(0, 1, new Rational(values[0].numerator < 0n ? -1n : 1n));
                        }
                    } else {
                        lastError = texts.errors.argument;
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
                    }
                    break;
                case "inputSE":
                    {
                        let input = "";
                        let escaped;
                        do {
                            input = prompt(texts.input.textEscaping, input);
                            escaped = input == null ? "" : handleEscapeCharacters(input);
                        } while (escaped === false)
                        if (escaped == null) escaped = "";
                        for (let i = escaped.length - 1; i >= 0; i--) {
                            values.unshift(new Rational(BigInt(escaped.charCodeAt(i))));
                        }
                        values.unshift(new Rational(BigInt(escaped.length)));
                    }
                    break;
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
                    if (repeats[top].length >= 1) {
                        if (repeats[top][0][0] < repeats[top][0][1]) {
                            repeats[top][0][0]++;
                            current[top] = repeats[top][0][2];
                        } else {
                            repeats[top].shift();
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
                            lastError = texts.errors.argumentNotVector;
                            return false;
                        }
                        errorHolder = values[1].outerProduct(values[0]);
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
                        errorHolder = values[0].gaussianElimination();
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
                    }
                    break;
                case "run":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Matrix) {
                        if (values[0].rows >= 2n) {
                            lastError = texts.errors.multirowMatrix;
                            return false;
                        }
                        let d = values.shift().indices[0]
                        if (d.map((e) => e.denominator).includes(0n)) {
                            lastError = texts.errors.indeterminateForm;
                            return false;
                        }
                        parse(String.fromCharCode(...d.map((e) => Number(e.numerator / e.denominator))));
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "step":
                    if (values.length < 1) {
                        lastError = texts.errors.shortStack;
                        return false;
                    }
                    if (values[0] instanceof Rational) {
                        values.splice(0, 1, new Rational(values[0].numerator >= 1n ? 1n : 0n));
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
                case "unzip":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (values[0] instanceof Matrix) {
                            let m = values.shift().indices.flat();
                            for (let i = 0; i < m.length; i++) {
                                values.unshift(m[i]);
                            }
                        }
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
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let index = Number.parseInt(I[1]);
                        if (values[index]) {
                            values.unshift(values.splice(index, 1)[0]);
                        } else {
                            lastError = texts.errors.outOfBounds;
                            return false;
                        }
                    }
                    break;
                case "<-":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let index = Number.parseInt(I[1]);
                        if (values[index]) {
                            values.splice(index, 0, values.shift());
                        } else {
                            lastError = texts.errors.outOfBounds;
                            return false;
                        }
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
                    }
                    break;
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
                        if (d < repeats[top].length) {
                            values.unshift(new Rational(repeats[top][d][0]));
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
                    }
                    break;
                case "del":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let index = Number.parseInt(I[1]);
                        if (values[index]) {
                            values.splice(index, 1);
                        } else {
                            lastError = texts.errors.outOfBounds;
                            return false;
                        }
                    }
                    break;
                case "error":
                    {
                        if (!strRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotString;
                            return false;
                        }
                        lastError = I[1].slice(1, -1);
                    }
                    return false;
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
                        openAA = true;
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
                    }
                    break;
                case "inputSE":
                    {
                        if (!strRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotString;
                            return false;
                        }
                        let input = "";
                        let escaped;
                        do {
                            input = prompt(I[1].slice(1, -1), input);
                            escaped = input == null ? "" : handleEscapeCharacters(input);
                        } while (escaped === false)
                        if (escaped == null) escaped = "";
                        for (let i = escaped.length - 1; i >= 0; i--) {
                            values.unshift(new Rational(BigInt(escaped.charCodeAt(i))));
                        }
                        values.unshift(new Rational(BigInt(escaped.length)));
                    }
                    break;
                case "jmp":
                    {
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let dist = Number.parseInt(I[1]);
                        if (current[top] + dist < 0) {
                            lastError = texts.errors.beforeCode;
                            return false;
                        }
                        if (dist != 0) {
                            current[top] += dist - 1;
                        }
                    }
                    break;
                case "leap":
                    {
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        if (repeats[top].length == 0) {
                            lastError = texts.errors.notInLoop;
                            return false;
                        }
                        let r = repeats[top][0][2];
                        let n = repeats[top][0][3];
                        if (r < current[top] && current[top] < n) {
                            let dist = Number.parseInt(I[1]);
                            if (dist <= 0) {
                                dist = 1;
                            }
                            current[top] = n + dist - 1;
                            repeats[top].shift();
                        } else {
                            lastError = texts.errors.jumpedOutOfLoop;
                            return false;
                        }
                    }
                    break;
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
                        lastError = texts.errors.missingVariable.toSpliced(1, 0, I[1]).join("");
                        return false;
                    }
                    break;
                case "query":
                    {
                        if (values.length < 1) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let index = BigInt(I[1]);
                        if (values[index]) {
                            if (values[index] instanceof Rational) {
                                //Rational
                                values.unshift(new Rational(0n));
                            } else {
                                //Matrix
                                values.unshift(new Rational(1n))
                            }
                        } else {
                            lastError = texts.errors.outOfBounds;
                            return false;
                        }
                    }
                    break;
                case "repeat":
                    {
                        if (!intRegex.test(I[1])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let depth = 1;
                        let scan = current[top];
                        while (depth >= 1 && scan + 1 < instructions[top].length) {
                            let nextNext = rnList[top].indexOf(2, scan + 1);
                            if (nextNext == -1) {
                                // if no next statement...
                                scan = instructions[top].length;
                                break;
                            }
                            let nextRepeat = rnList[top].indexOf(1, scan + 1);
                            if (nextRepeat != -1 && nextRepeat < nextNext) {
                                scan = nextRepeat;
                                depth++;
                            } else {
                                scan = nextNext;
                                depth--;
                            }
                        }
                        if (BigInt(I[1]) <= 0n) {
                            current[top] = scan;
                        } else {
                            openRP = true;
                            repeats[top].unshift([1n, BigInt(I[1]), current[top], scan]);
                        }
                    }
                    break;
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
                        errorHolder = values[1].scaleRow(Number.parseInt(I[1]), values[0]);
                        values.shift();
                    } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                        errorHolder = values[0].scaleRow(Number.parseInt(I[1]), values[1]);
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
                        errorHolder = values[1].addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[0].clone());
                        values.shift();
                    } else if (values[1] instanceof Rational && values[0] instanceof Matrix) {
                        errorHolder = values[0].addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[1].clone());
                        values.splice(1, 1);
                    } else {
                        lastError = texts.errors.argument;
                        return false;
                    }
                    break;
                case "m":
                    {
                        if (!intRegex.test(I[1]) || !intRegex.test(I[2])) {
                            lastError = texts.errors.parameterNotRational;
                            return false;
                        }
                        let c = Number.parseInt(I[1]);
                        let r = Number.parseInt(I[2]);
                        if (c <= 0 || r <= 0) {
                            lastError = texts.errors.notPositive;
                            return false;
                        }
                        let indices = c * r;
                        if (values.length < indices) {
                            lastError = texts.errors.shortStack;
                            return false;
                        }
                        if (!values.slice(0, indices).map((e) => e instanceof Rational).includes(false)) {
                            let arg = values.splice(0, indices);
                            arg.reverse();
                            values.unshift(new Matrix(BigInt(I[1]), arg));
                        } else {
                            lastError = texts.errors.argument;
                            return false;
                        }
                    }
                    break;
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
                    }
                    break;
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
    if (errorHolder instanceof Error) {
        switch (errorHolder.message) {
            case "Determinate indeterminate!":
            case "Indeterminate form":
            case "Row reduction failed!":
                lastError = texts.errors.indeterminateForm;
                break;
            default:
                lastError = texts.errors.unknown;
                break;
        }
        return false;
    }
    if (breakpoints[top]?.includes(++current[top])) return "bp";
    return true;
}
