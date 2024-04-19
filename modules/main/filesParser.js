import fs from 'fs';
import path from 'path';

const envDirectory = path.resolve();
const fileLocation = path.join(path.resolve(), './modules/main/JSONLoader.js');
const collectionsDirectory = path.join(path.resolve(), './postmanCollections');
const configDirectory = path.join(path.resolve(), './modules');

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

const generateCollectionsNamesGetter = (selectedFiles) => {
  const trimmedFileNames = selectedFiles.map((fileName) => fileName.replace(/\.json$/, '')).map(a => `'${a}'`);
  return `\tstatic get collectionsNames() {\n\t\treturn [${trimmedFileNames.join(', ')}];\n\t}\n\n`;
};

const generateJSONLoader = (filePath, directory, extension) => {
  const files = getFiles(configDirectory, extension);
  const collectionsNamesGetterRequires = generateRequires(files, configDirectory);
  files.push(...getFiles(directory, extension));
  const collectionsNamesGetter = generateCollectionsNamesGetter(files);
  const requires = generateRequires(files, directory);
  const classInit = generateClassInit(files);
  const classExport = '}\n\nexport default JSONLoader;';
  fs.writeFileSync(filePath, collectionsNamesGetterRequires + requires + classInit + collectionsNamesGetter + classExport);
};

const checkEnvExists = (directory, extension) => {
  const files = getFiles(directory, extension);
  if (!files.length) throw new Error('[err]   .env.test file not exists in root directory!');
};

checkEnvExists(envDirectory, '.env');
generateJSONLoader(fileLocation, collectionsDirectory, '.json');