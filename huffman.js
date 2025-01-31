function huffmanEncoding() {
    let inputSymbols = instructionInput.value;
    if (inputSymbols.length < 2) {
        //insufficient types
        return [false, null];
    }
    let symbols = []
    let tree = [];
    //create leaves
    for (const s of inputSymbols) {
        let index = symbols.indexOf(s);
        if (index == -1) {
            tree.push({ children: symbols.push(s) - 1, occurrences: 1 });
        } else {
            tree[index].occurrences++;
        }
    }
    if (tree.length < 2) {
        // insufficient types
        return [false, null];
    }
    //collect leaves
    while (tree.length > 1) {
        tree.sort((a, b) => a.occurrences - b.occurrences);
        if (/opn/.exec([tree[0].children].concat([tree[1].children]).flat(Infinity).map((e)=>symbols[e]).join("")) == null) {
            tree.splice(0, 2, { children: [tree[0].children, tree[1].children], occurrences: tree[0].occurrences + tree[1].occurrences });
        } else {
            tree.splice(0, 2, { children: [tree[1].children, tree[0].children], occurrences: tree[0].occurrences + tree[1].occurrences });
        }
    }
    tree = tree[0].children;
    let charToBits = [];
    function createLookUpTable(t, path = "") {
        if (typeof t == "number") {
            charToBits[t] = path;
            return;
        }
        createLookUpTable(t[0], path + "0");
        createLookUpTable(t[1], path + "1");
    }
    createLookUpTable(tree);
    //flatten tree
    for (let i = 0; i < tree.length; i++) {
        if (tree[i] instanceof Array) {
            tree.splice(i, 1, "opn", tree[i][0], tree[i][1]);
        } else if (typeof tree[i] == "number") {
            tree[i] = symbols[tree[i]];
        }
    }
    tree = tree.join("")
    //translate symbols using LUT
    let encoded = 1n;
    for (const s of inputSymbols) {
        let e = charToBits[symbols.indexOf(s)];
        encoded <<= BigInt(e.length);
        encoded |= BigInt("0b" + e);
    }
    const encodingString = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#";
    let encodedString = ""
    for (; encoded > 0n; encoded >>= 6n) {
        encodedString = encodingString[encoded & 63n] + encodedString;
    }
    return [encodeURIComponent(tree), encodeURIComponent(encodedString)];
}

function huffmanDecoding(treeString, encodedString) {
    //tokenize
    let tree = [];
    for (let i = 0; i < treeString.length; i++) {
        if (treeString[i] == "o" && treeString[i + 1] == "p" && treeString[i + 2] == "n") {
            tree.push("opn");
            i += 2;
            continue;
        }
        tree.push(treeString[i]);
    }
    {
        let i = tree.lastIndexOf("opn");
        while (i != -1) {
            tree.splice(i, 3, [tree[i + 1], tree[i + 2]]);
            i = tree.lastIndexOf("opn");
        }
    }
    let decodedString = "";
    {
        let subTree = structuredClone(tree);
        let first = true;
        {
            const encodingString = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#";
            for (const c of encodedString) {
                let encodedInt = BigInt(encodingString.indexOf(c));
                let mask = 32n;
                if (first) {
                    mask = 1n;
                    for (;mask < encodedInt; mask <<= 1n) {}
                    mask >>= 2n;
                    first = false;
                }
                for (;mask > 0n; mask >>= 1n) {
                    subTree = subTree[(encodedInt & mask) > 0n ? 1 : 0];
                    if (typeof subTree == "string") {
                        decodedString += subTree;
                        subTree = structuredClone(tree);
                    }
                }
            }
        }
    }
    instructionInput.value = decodedString;
}