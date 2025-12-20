import ejs from 'ejs';
import fs from 'fs';

const filePath = 'C:\\Users\\21269\\Desktop\\confonda\\views\\dashboard\\achats\\bc\\edit.ejs';
const originalContent = fs.readFileSync(filePath, 'utf8');

function tryCompile(content, description) {
    try {
        ejs.compile(content, { filename: filePath });
        console.log(`[PASS] ${description}`);
        return true;
    } catch (err) {
        console.log(`[FAIL] ${description}`);
        // console.log(err.message.split('\n')[0]);
        return false;
    }
}

// 1. Compile original
if (tryCompile(originalContent, "Original File")) {
    console.log("Original file compiled successfully? Then why the error?");
    process.exit(0);
}

// 2. Remove Block 1: Lines 520-522 (Chantier Loop)
// We will replace content from line 520 to 522 with empty lines
const lines = originalContent.split('\n');
const linesNoBlock1 = [...lines];
for (let i = 519; i <= 522; i++) linesNoBlock1[i] = ''; // 0-indexed, so 519 is line 520
const contentNoBlock1 = linesNoBlock1.join('\n');
tryCompile(contentNoBlock1, "Without Chantier Loop (Lines 520-523)");

// 3. Remove Block 2: Lines 550-557 (BC Rows Loop Start)
const linesNoBlock2 = [...lines];
for (let i = 549; i <= 557; i++) linesNoBlock2[i] = '';
const contentNoBlock2 = linesNoBlock2.join('\n');
tryCompile(contentNoBlock2, "Without BC Loop Logic (Lines 550-558)");

// 4. Remove Block 3: Line 809-816 (Fournisseurs Logic)
const linesNoBlock3 = [...lines];
for (let i = 808; i <= 816; i++) linesNoBlock3[i] = '';
const contentNoBlock3 = linesNoBlock3.join('\n');
tryCompile(contentNoBlock3, "Without Fournisseurs Logic (Lines 809-817)");
