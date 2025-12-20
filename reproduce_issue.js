import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

const filePath = 'C:\\Users\\21269\\Desktop\\confonda\\views\\dashboard\\achats\\bc\\edit.ejs';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('Compiling...');
    const fn = ejs.compile(content, { filename: filePath });
    console.log('Compilation successful!');
} catch (err) {
    console.error('Compilation failed:');
    console.error(err);
    // If it is a syntax error in the generated function, EJS might verify it.
}
