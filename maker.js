// scaffold.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = process.cwd();

// Create folder if it doesn't exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created folder: ${dirPath}`);
  }
};

// Create file if it doesn't exist
const createFile = (filePath, content = '') => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created file: ${filePath}`);
  } else {
    console.log(`File already exists: ${filePath}`);
  }
};

// Create controller
const makeController = (name) => {
  const controllerDir = path.join(BASE_DIR, 'controllers');
  ensureDir(controllerDir);
  const controllerFile = path.join(controllerDir, `${name}Controller.js`);
  createFile(
    controllerFile,
    `// ${name} controller
export const ${name}Controller = {
  index: (req, res) => res.send('${name} index'),
};`
  );
};

// Create view (supports nested folders)
const makeView = (nestedPath) => {
  const parts = nestedPath.split('/'); // split folder(s) and file
  const fileName = parts.pop(); // last part is the file name
  const folderPath = path.join(BASE_DIR, 'views', ...parts); // remaining is folders
  ensureDir(folderPath);
  const viewFile = path.join(folderPath, `${fileName}.ejs`);
  createFile(viewFile, `<h1>${fileName} view</h1>\n<p>This is the ${fileName} page.</p>`);
};

// ===== CLI =====
const [,, command, type, arg] = process.argv;

if (command !== 'make' || !type || !arg) {
  console.error('Usage: node scaffold.mjs make <controllers|views> <nameOrPath>');
  console.error('Example for controller: node scaffold.mjs make controllers user');
  console.error('Example for view: node scaffold.mjs make views admin/home/index');
  process.exit(1);
}

if (type === 'controllers') {
  makeController(arg);
} else if (type === 'views') {
  makeView(arg);
} else {
  console.error('Type must be controllers or views');
}
