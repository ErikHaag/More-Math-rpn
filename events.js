// when everything loaded properly use the URL parameters
document.addEventListener("DOMContentLoaded", () => {
    // hang on, where are we again?
    let url = new URL(document.location);
    let params = url.search;
    params = params.substring(1).split("&");
    let instr = "";
    for (let parameter of params) {
        let p = parameter.split("=");
        switch (p[0]) {
            case "instr":
                instr = p[1];
                break;
            case "speed":
                speedSelect = BigInt(p[1]);
                if (speedSelect < 0n) speedSelect = 0n;
                if (speedSelect > 4n) speedSelect = 4n;
                updateSpeed();
                break;
            default:
                break;
        }
    }
    if (instr != "") {
        // translate the ASCII encoding into characters
        instr = instr.replaceAll(" ", "");
        instr = instr.replaceAll("_", " ");
        instr = instr.replaceAll("%0A", "\n");
        instr = instr.replaceAll("%22", "\"");
        instr = instr.replaceAll("%23", "#");
        instr = instr.replaceAll("%24", "$");
        instr = instr.replaceAll("%26", "&");
        instr = instr.replaceAll("%27", "\'");
        instr = instr.replaceAll("%3C", "<");
        instr = instr.replaceAll("%3D", "=");
        instr = instr.replaceAll("%3E", ">");
        instr = instr.replaceAll("%5B", "[");
        instr = instr.replaceAll("%5D", "]");
        //decode percentaged last
        instr = instr.replaceAll("%25", "%");
        instructionInput.value = instr;
    }
});


darkButton.addEventListener("click", () => {
    // flip that boolean
    dark = !dark;
    // change the darkMode button to a sun or moon
    darkButton.innerHTML = dark ? "&#x263D" : "&#x2609";
    // change the body's class (CSS changes all the colors based on this)
    document.getElementsByTagName("body")[0].className = dark ? "dark" : "light";
    // update the UI (really only matters if appearence is LaTeX, but it doesn't hurt)
    updateUI()
});

appearenceSelect.addEventListener("change", () => {
    // modify appearence based on dropdown
    let appearence = appearenceSelect.value;
    // show the appropriate extra options
    decimalDiv.hidden = !(appearence == "decimal" || appearence == "decimalcommas");
    britishModeDiv.hidden = !(appearence == "fractioncommas" || appearence == "decimal" || appearence == "decimalcommas");
    updateUI();
});

britishCheck.addEventListener("change", () => {
    // ensure that the . and , get swapped
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

valueStackShrinkButton.addEventListener("click", () => {
    let shrunk = valueStack.className == "shrink";
    valueStack.className = shrunk ? "" : "shrink";
    valueStackShrinkButton.innerHTML = shrunk ? "&blacktriangledown;" : "&blacktriangle;";
});

auxillaryArrayShrinkButton.addEventListener("click", () => {
    let shrunk = auxillaryArray.className == "shrink";
    auxillaryArray.className = shrunk ? "" : "shrink";
    auxillaryArrayShrinkButton.innerHTML = shrunk ? "&blacktriangledown;" : "&blacktriangle;";
})

instructionInput.addEventListener("change", () => {
    updateLink();
});

function updateLink() {
    let formatted = input.value;
    //encode percentage first
    formatted = formatted.replaceAll("%", "%25");
    formatted = formatted.replaceAll("\n", "%0A");
    formatted = formatted.replaceAll(" ", "_");
    formatted = formatted.replaceAll("\"", "%22");
    formatted = formatted.replaceAll("#", "%23");
    formatted = formatted.replaceAll("$", "%24");
    formatted = formatted.replaceAll("&", "%26");
    formatted = formatted.replaceAll("\'", "%27");
    formatted = formatted.replaceAll("<", "%3C")
    formatted = formatted.replaceAll("=", "%3D");
    formatted = formatted.replaceAll(">", "%3E")
    formatted = formatted.replaceAll("[", "%5B");
    formatted = formatted.replaceAll("]", "%5D");
    let linkStr = "https://erikhaag.github.io/More-Math-rpn/?instr=" + formatted;
    if (useSpeedCheck.checked) {
        linkStr += "&speed=" + speedSelect;
    }
    link.textContent = linkStr;
}

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
        // sit back and watch the magic happen
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
    speedSelect = (speedSelect + 1n) % 5n
    updateSpeed();
    if (useSpeedCheck.checked) {
        updateLink();
    }
});

function updateSpeed() {
    switch (speedSelect) {
        case 0n:
            speed = 500;
            steps = 1;
            speedButton.innerHTML = "&gt;"
            break;
        case 1n:
            speed = 250;
            steps = 1;
            speedButton.innerHTML = "&gt;&gt;";
            break;
        case 2n:
            speed = 10;
            steps = 1;
            speedButton.innerHTML = "&gt;&gt;&gt;";
            break;
        case 3n:
            speed = 10;
            steps = 5;
            speedButton.innerHTML = "&gt;&gt;&gt;&gt;";
            break;
        case 4n:
            speed = 10;
            steps = 10;
            speedButton.innerHTML = "&gt;&gt;&gt;&gt;&gt;";
            break;
    }
    if (allowRunning) {
        clearTimeout(timer);
        timer = setTimeout(step, speed);
    }
}

linkOptionsToggle.addEventListener("click", () => {
    linkOptionsVisible = !linkOptionsVisible;
    linkOptionsToggle.innerHTML = linkOptionsVisible ? "&#x25BC;" : "&#x25B2;";
    linkOptions.hidden = !linkOptionsVisible;
});

useSpeedCheck.addEventListener("change", () => {
    updateLink();
});