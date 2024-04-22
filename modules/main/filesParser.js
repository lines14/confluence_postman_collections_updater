import fs from 'fs';
import path from 'path';

const envDirectory = path.resolve();
const fileLocation = path.join(path.resolve(), './modules/main/JSONLoader.js');
const absoleteCollectionsDirectory = path.relative(path.resolve(), './postmanCollections');
const relativeCollectionsDirectory = path.relative(path.dirname(new URL(import.meta.url).pathname), './postmanCollections');
const absoleteConfigDirectory = path.relative(path.resolve(), './modules');
const relativeConfigDirectory = path.relative(path.dirname(new URL(import.meta.url).pathname), './modules');

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

const generateImports = (selectedFiles, directory) => selectedFiles.map((file) => {
  const variableName = path.parse(file).name;
  return `import ${variableName} from '${path.join(directory, file)}' assert { type: 'json' };\n`;
}).join('');

const generateClassInit = (selectedFiles) => `\nclass JSONLoader {\n${selectedFiles.map((file) => {
  const variableName = path.parse(file).name;
  return `\tstatic get ${variableName}() {\n\t\treturn JSON.parse(JSON.stringify(${variableName}));\n\t}\n\n`;
}).join('')}`;

const generateCollectionsNamesGetter = (selectedFiles) => `\tstatic get collectionsNames() {\n\t\treturn [${selectedFiles.map((file) => `'${file}'`).join(', ')}];\n\t}\n\n`;

const generateJSONLoader = (filePath, absoleteDirectory, relativeDirectory, extension) => {
  const files = getFiles(absoleteDirectory, extension);
  const imports = generateImports(files, relativeDirectory);
  const collectionsNamesGetter = generateCollectionsNamesGetter(files);
  const configFile = getFiles(absoleteConfigDirectory, extension);
  const configFileImport = generateImports(configFile, relativeConfigDirectory);
  files.push(...configFile);
  const classInit = generateClassInit(files);
  const classExport = '}\n\nexport default JSONLoader;';
  fs.writeFileSync(
    filePath,
    configFileImport + imports + classInit + collectionsNamesGetter + classExport,
  );
};

const checkEnvExists = (directory, extension) => {
  const files = getFiles(directory, extension);
  if (!files.length) throw new Error('[err]   .env.test file not exists in root directory!');
};

checkEnvExists(envDirectory, '.env');
generateJSONLoader(fileLocation, absoleteCollectionsDirectory, relativeCollectionsDirectory, '.json');
