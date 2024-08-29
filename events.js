// when everything loaded properly use the URL parameters
document.addEventListener("DOMContentLoaded", () => {
    // hang on, where are we again?
    let url = new URL(document.location);
    let params = url.search;
    params = params.substring(1).split("&");
    for (let parameter of params) {
        let p = parameter.split("=");
        switch (p[0]) {
            case "instr":
                // translate the ASCII encoding into characters
                let instr = p[1];
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
                input.value = instr;
                break;
            // TODO: add more parameters like setting the speed
            default:
                break;
        }
    }
});

input.addEventListener("change", () => {
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
    link.textContent = "https://erikhaag.github.io/More-Math-rpn/?instr=" + formatted;
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
    britishModeDiv.hidden = !(appearence == "commas" || appearence == "decimal" || appearence == "decimalcommas");
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