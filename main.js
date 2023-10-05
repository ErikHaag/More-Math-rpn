const input = document.getElementById("input");
const valueStack = document.getElementById("vs");
const repeatPile = document.getElementById("rp");
const instructionList = document.getElementById("is");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const speedButton = document.getElementById("speed");
let instructions = [];
let repeats = [];
let values = [];
let current = -1;
let allowRunning = true;
let timer;
let speedSelect = 0;
let speed = 500;

startButton.addEventListener("click", () => {
    if (current >= 0) {
        clearTimeout(timer);
    }
    instructions = input.value.split("\n");
    values = [];
    repeats = [];
    allowRunning = true;
    stopButton.innerHTML = "Stop";
    current = 0;
    updateUI();
    timer = setTimeout(step, speed);
});

stopButton.addEventListener("click", () => {
    allowRunning = !allowRunning;
    if (allowRunning) {
        stopButton.innerHTML = "Stop";
        step();
    } else {
        stopButton.innerHTML = "Continue";
    }
});

speedButton.addEventListener("click", () => {
    switch (speedSelect) {
        case 0:
            speed = 250;
            speedSelect = 1;
            speedButton.innerHTML = "Pacing";
            break;
        case 1:
            speed = 10;
            speedSelect = 2;
            speedButton.innerHTML = "*Engine noises*";
            break;
        case 2:
            speed = 500;
            speedSelect = 0;
            speedButton.innerHTML = "Slow"
    }
});

function updateUI() {
    let list = "";
    for (let i = 0; i < instructions.length; i++) {
        list += "<li " + (i == current ? "class=\"curr\" >" : ">") + instructions[i] + "</li>\n";
    }
    instructionList.innerHTML = list;
    list = "";
    for (let i = 0; i < repeats.length; i++) {
        list += "<li>" + repeats[i][0].toString() + ", " + repeats[i][1].toString() + ", " + repeats[i][2].toString() + "</li>\n";
    }
    repeatPile.innerHTML = list;
    list = ""
    for (let i = (values.length - 1); i >= 0; i--) {
        list += "<li><img src=\"https://latex.codecogs.com/svg.image?" + values[i].toLatex() + "\"alt=\"" + values[i].toLatex() + "\"></li>\n";
    }
    valueStack.innerHTML = list;
}

function step() {
    if (current == -1) {
        return;
    }
    if (current == instructions.length) {
        current = -1;
        return;
    }
    let I = instructions[current].split(" ");
    for (let i = 1; i < I.length; i++) {
        if (I[i].startsWith(">")) {
            let refer = Number.parseInt(I[i].substring(1));
            let parameter = values[refer];
            if (parameter instanceof Rational) {
                I.splice(i, 1, (parameter.numerator / parameter.denominator).toString());
            } else {
                alert("parameter can't be Matrix");
                current = -1;
                return;
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
                } else if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
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
            } else if (I[0] == "int") {
                if (values[0] instanceof Rational) {
                    let A = values[0].clone();
                    values.splice(0, 1, new Rational(A.numerator / A.denominator));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
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
                let n = instructions.indexOf("next", current)
                if (n > current) {
                    current = n;
                    repeats.shift();
                } else {
                    current = -2;
                    alert("not in a loop");
                }
            } else if (I[0] == "inverse") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    values.splice(0, 1, A.inverse());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "transpose") {
                if (values[0] instanceof Matrix) {
                    let A = values[0].clone();
                    values.splice(0, 1, A.transpose());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "augment") {
                if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    values.splice(0, 2, A.augment(values[0]));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "dot") {
                if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    values.splice(0, 2, A.dotProduct(values[0]));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (I[0] == "hadamard") {
                if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
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
                if (values[0] instanceof Matrix && values[1] instanceof Matrix) {
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
            } else if (I[0] == "repeat") {
                repeats.unshift([1n, BigInt(I[1]), current]);
            } else if (I[0] == ">>>") {
                if (repeats.length >= Number.parseInt(I[1])) {
                    values.unshift(new Rational(repeats[Number.parseInt(I[1])][0]));
                } else {
                    current = -2;
                    alert("not deep enough");
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
            } else if (I[0] = "addRow") {
                if (values[0] instanceof Rational && values[1] instanceof Matrix) {
                    let A = values[1].clone();
                    A.addRow(Number.parseInt(I[1]), Number.parseInt(I[2]), values[0].clone());
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
    updateUI();
    if (allowRunning) {
        timer = setTimeout(step, speed);
    }
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