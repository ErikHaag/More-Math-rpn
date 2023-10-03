const input = document.getElementById("input");
const instrStack = document.getElementById("is");
const valueStack = document.getElementById("vs");
const startButton = document.getElementById("start");
let instructions = [];
let values = [];
let current = -1;
let timer;

startButton.addEventListener("click", () => {
    if (current >= 0) {
        clearTimeout(timer);
    }
    instructions = input.value.split("\n");
    values = [];
    current = 0;
    updateUI();
    timer = setTimeout(step, 500);
});

function updateUI() {
    let list = "";
    for (let i = 0; i < instructions.length; i++) {
        list += "<li " + (i == current ? "class=\"curr\" >" : ">") + instructions[i] + "</li>\n";
    }
    instrStack.innerHTML = list;
    list = ""
    for (let i = values.length - 1; i >= 0; i--) {
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
                    }
                    let B = values[0].cloneInverse();
                    A.mult(B);
                    values.splice(0, 2, A.clone());
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            } else if (/\d+/.test(I[0])) {
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
            } else {
                alert("invalid command");
                current = -2;
            }
            break;
        case 3:
            if (I[0] == "m") {
                if (!values.slice(0,Number.parseInt(I[1]) * Number.parseInt(I[2])).map((e) => e instanceof Rational).includes(false)) {
                let arg = values.splice(0, Number.parseInt(I[1]) * Number.parseInt(I[2]));
                arg.reverse();
                arg.unshift(Number.parseInt(I[1]));
                values.unshift(new Matrix(...arg));
                } else {
                    alert("invalid arguments");
                    current = -2;
                }
            }
    }
    current++;
    updateUI();
    timer = setTimeout(step, 500);
}

function strToBigInt(s) {
    let int = 0n;
    for (let i = 0; i < s.length; i++) {
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
                return int / 10n;
        }
    }
    return int;
}