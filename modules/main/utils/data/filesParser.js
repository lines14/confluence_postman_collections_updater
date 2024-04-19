import fs from 'fs';
import path from 'path';

const envDirectory = path.resolve();
const fileLocation = path.join(path.resolve(), './modules/main/utils/data/JSONLoader.js');
const JSONDirectory = path.join(path.resolve(), './modules/resources');

const getFiles = (directory, extension) => {
  const allFiles = fs.readdirSync(directory);
  const selectedFiles = allFiles.filter((file) => file.endsWith(extension));
  allFiles.forEach((file) => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const nestedFiles = getFiles(fullPath, extension);
      selectedFiles.push(...nestedFiles.map((nestedFile) => path.join(file, nestedFile)));
    }
  });

  return selectedFiles;
};

const generateRequires = (selectedFiles, directory) => selectedFiles.map((file) => {
  const variableName = path.parse(file).name;
  return `import ${variableName} from '${path.join(directory, file)}' assert { type: 'json' };\n`;
}).join('');

const generateClassInit = (selectedFiles) => `\nclass JSONLoader {\n${selectedFiles.map((file) => {
  const variableName = path.parse(file).name;
  return `\tstatic get ${variableName}() {\n\t\treturn JSON.parse(JSON.stringify(${variableName}));\n\t}\n\n`;
}).join('')}`;

const generateJSONLoader = (filePath, directory, extension) => {
  const files = getFiles(directory, extension);
  const requires = generateRequires(files, directory);
  const classInit = generateClassInit(files);
  const classExport = '}\n\nexport default JSONLoader;';
  fs.writeFileSync(filePath, requires + classInit + classExport);
};

const checkEnvExists = (directory, extension) => {
  const files = getFiles(directory, extension);
  if (!files.length) throw new Error('[err]   .env.test file not exists in root directory!');
};

checkEnvExists(envDirectory, '.env');
generateJSONLoader(fileLocation, JSONDirectory, '.json');
