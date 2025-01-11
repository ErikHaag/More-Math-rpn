// when everything loaded properly use the URL parameters
document.addEventListener("DOMContentLoaded", () => {
    // hang on, where are we again?
    let url = new URL(document.location);
    let params = url.searchParams;
    if (params.has("instr")) {
        
        instructionInput.value = params.get("instr");
    }
    if (params.has("speed")) {
        speedSelect = BigInt(params.get("speed"));
        if (speedSelect < 0n) speedSelect = 0n;
        if (speedSelect > 4n) speedSelect = 4n;
        updateSpeed();
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

stateDisplayHideButton.addEventListener("click", () => {
    stateDisplay.hidden = !stateDisplay.hidden
    stateDisplayHideButton.innerText = "State " + (stateDisplay.hidden ? "hidden" : "shown");
    updateUI();
})

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

followInstructionButton.addEventListener("click", () => {
    followingCurrent = !followingCurrent;
    followInstructionButton.innerHTML = followingCurrent ? "&leftrightarrow;" : "&Cross;";
})

instructionInput.addEventListener("change", () => {
    updateLink();
});

function updateLink() {
    let formatted = encodeURIComponent(input.value);
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
    updateControls();
    if (allowRunning) {
        step();
    }
});

function updateControls() {
    resetButton.hidden = allowRunning;
    startButton.innerHTML = allowRunning ? "Start" : "Step";
    stopButton.innerHTML = allowRunning ? "Stop" : "Continue";
}

speedButton.addEventListener("click", () => {
    clearTimeout(timer);
    speedSelect = (speedSelect + 1n) % 5n
    updateSpeed();
    if (allowRunning && current != 0) {
        clearTimeout(timer);
        timer = setTimeout(step, speed);
    }
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
    //Elements that get disabled at high speed
    followInstructionButton.className = speedSelect >= 2n ? "grayed" : "";
}

linkOptionsToggle.addEventListener("click", () => {
    linkOptionsVisible = !linkOptionsVisible;
    linkOptionsToggle.innerHTML = linkOptionsVisible ? "&#x25BC;" : "&#x25B2;";
    linkOptions.hidden = !linkOptionsVisible;
});

useSpeedCheck.addEventListener("change", () => {
    updateLink();
});