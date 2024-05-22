import fs from 'fs';
import path from 'path';

const envDirectoryPath = path.resolve();
const fileLocation = path.join(path.resolve(), './modules/main/JSONLoader.js');

const absoleteInputDirectoryPath = path.relative(path.resolve(), './input');
const absoleteOutputDirectoryPath = path.relative(path.resolve(), './output');
const absoleteConfigDirectoryPath = path.relative(path.resolve(), './modules');

const relativeInputDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './input');
const relativeOutputDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './output');
const relativeConfigDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './modules');

const absoleteDirectoryPathArr = [
  absoleteInputDirectoryPath,
  absoleteOutputDirectoryPath,
  absoleteConfigDirectoryPath,
];
const relativeDirectoryPathArr = [
  relativeInputDirectoryPath,
  relativeOutputDirectoryPath,
  relativeConfigDirectoryPath,
];

const getFiles = (dirPath, fileExtension) => {
  const allFiles = fs.readdirSync(dirPath);
  const files = allFiles.filter((file) => file.endsWith(fileExtension));
  allFiles.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const nestedDirObject = getFiles(fullPath, fileExtension);
      files.push(...nestedDirObject.files.map((nestedFile) => path.join(file, nestedFile)));
    }
  });

  return { files, dirPath };
};

const generateImports = (dirPathArr, dirObj) => dirObj.files.map((file) => {
  const variableName = path.parse(file).name;
  return `import ${variableName} from '${path.join(dirPathArr
    .filter((dirPath) => dirPath.includes(dirObj.dirPath)).pop() ?? '../', file)}' assert { type: 'json' };\n`;
}).join('');

const generateClassBody = (dirObjects) => dirObjects.map((dirObj) => `${dirObj.files.map((file) => {
  const variableName = path.parse(file).name;
  return `\tstatic get ${variableName}() {\n\t\treturn JSON.parse(JSON.stringify(${variableName}));\n\t}\n\n`;
})}`).join('');

const generateInputCollectionNamesGetter = (dirObjects) => `\tstatic get inputCollectionNames() {\n\t\treturn [${dirObjects
  .filter((dirObj) => dirObj.dirPath.includes('input'))
  .map((dirObj) => dirObj.files.map((file) => `'${file}'`).join(', '))}];\n\t}\n\n`;
const generateOutputCollectionNamesGetter = (dirObjects) => `\tstatic get outputCollectionNames() {\n\t\treturn [${dirObjects
  .filter((dirObj) => dirObj.dirPath.includes('output'))
  .map((dirObj) => dirObj.files.map((file) => `'${file}'`).join(', '))}];\n\t}\n\n`;

const generateJSONLoader = (filePath, absoleteDirPathArr, relativeDirPathArr, fileExtension) => {
  const dirObjects = absoleteDirPathArr.reduce((filesArr, absoleteDirPath) => filesArr
    .concat(getFiles(absoleteDirPath, fileExtension)), []);
  const imports = dirObjects.reduce((importsArr, dirObj) => importsArr
    .concat(generateImports(relativeDirPathArr, dirObj)), []).join('');
  const classInit = '\nclass JSONLoader {\n';
  const inputCollectionNamesGetter = generateInputCollectionNamesGetter(dirObjects);
  const outputCollectionNamesGetter = generateOutputCollectionNamesGetter(dirObjects);
  const classBody = generateClassBody(dirObjects);
  const classExport = '}\n\nexport default JSONLoader;';
  fs.writeFileSync(
    filePath,
    imports
    + classInit
    + inputCollectionNamesGetter
    + outputCollectionNamesGetter
    + classBody
    + classExport,
  );
};

const checkEnvExists = (dirPath, fileExtension) => {
  const dirObj = getFiles(dirPath, fileExtension);
  if (!dirObj.files.length) throw new Error('[err]   .env file not exists in root directory!');
};

checkEnvExists(envDirectoryPath, '.env');
generateJSONLoader(fileLocation, absoleteDirectoryPathArr, relativeDirectoryPathArr, '.json');
