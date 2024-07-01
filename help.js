const helpButton = document.getElementById("help");
const helpBox = document.getElementById("helpBox");
const [helpText, closeHelp, nextHelp] = helpBox.children;


const helpList = [
    {
        id: "input",
        side: "adjacent",
        text: "The list of commands the calculator will run throught.\nCheck out the links below for programming assistance"
    },
    {
        id: "start",
        side: "adjacent",
        text: "When you want to run your program, hit \"Start\""
    },
    {
        id: "stop",
        side: "adjacent",
        text: "If you want to pause or debug your program, hit \"Stop\" to assist in error finding"
    },
    {
        id: "speed",
        side: "adjacent",
        text: "Click this multiple times to speed up execution"
    },
    {
        id: "stateDisplay",
        side: "under",
        text: "This is the machine's display, you can see what the machine is doing step by step"
    },
    {
        id: "vs",
        side: "under",
        text: "All the computation occurs here, \"The Stack\" is what you'll mostly focus on"
    },
    {
        id: "visual",
        side: "under",
        text: "You can change the appearence of the stack here, Fractions, Decimals, and such"
    },
    {
        id: "darkModeButton",
        side: "under",
        text: "Dark Mode is availible to those who can't contract their pupils fully"
    },
    {
        id: "link",
        side: "under",
        text: "If you like your program, copy the link that appears here and share it around!"
    },
    {
        id: "help",
        side: "under",
        text: "Goodbye!"
    }
];

let helpListIndex = -1n;
let helpElement;

helpButton.addEventListener("click", () => {
    if (helpListIndex == -1n) {
        helpListIndex = 0n;
    } else {
        helpListIndex = -1n;
    }
    updateHelpBox();
});

closeHelp.addEventListener("click", () => {
    helpListIndex = -1n;
    updateHelpBox();
});

nextHelp.addEventListener("click", () => {
    resetHelpElement();
    helpListIndex++;
    updateHelpBox();
})

document.addEventListener("scroll", updateHelpBox);

function resetHelpElement() {
    if (helpElement) {
        helpElement.style.border = "";
        helpElement = undefined;
    }
}

function updateHelpBox() {
    if (helpListIndex == -1n) {
        helpBox.hidden = true;
        resetHelpElement();
        return;
    }
    let info = helpList[helpListIndex];
    if (info == undefined) {
        helpListIndex = -1n;
        helpBox.hidden = true;
        resetHelpElement();
        return;
    }
    helpElement = document.getElementById(info.id);
    helpElement.style.border = "5px red solid";
    let helpElementBounds = helpElement.getBoundingClientRect();
    let x = 0;
    let y = 0;
    switch (info.side) {
        case "under":
            x = helpElementBounds.left;
            y = helpElementBounds.bottom;
            break;
        case "adjacent":
            x = helpElementBounds.right;
            y = helpElementBounds.top;
            break;
        default:
            break;
    }

    helpBox.style.left = window.scrollX + x + "px";
    helpBox.style.top = window.scrollY + y + "px";
    helpText.innerText = info.text;
    helpBox.hidden = false;
}