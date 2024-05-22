import fs from 'fs';
import path from 'path';

const envDirectoryPath = path.resolve();
const filePath = path.join(path.resolve(), './modules/main/JSONLoader.js');
const absoleteInputDirectoryPath = path.relative(path.resolve(), './input');
const absoleteOutputDirectoryPath = path.relative(path.resolve(), './output');
const absoleteConfigDirectoryPath = path.relative(path.resolve(), './modules');
const relativeInputDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './input');
const relativeOutputDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './output');
const relativeConfigDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './modules');
const absoleteDirectoryPathArr = [absoleteInputDirectoryPath, absoleteOutputDirectoryPath, absoleteConfigDirectoryPath];
const relativeDirectoryPathArr = [relativeInputDirectoryPath, relativeOutputDirectoryPath, relativeConfigDirectoryPath];

const getFiles = (dirPath, extension) => {
  const allFiles = fs.readdirSync(dirPath);
  const files = allFiles.filter((file) => file.endsWith(extension));
  allFiles.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const nestedDirObject = getFiles(fullPath, extension);
      files.push(...nestedDirObject.files.map((nestedFile) => path.join(file, nestedFile)));
    }
  });

  return { files, dirPath };
};

const generateImports = (dirPathArr, dirObj) => dirObj.files.map((file) => {
  const variableName = path.parse(file).name;
  return `import ${variableName} from '${path.join(dirPathArr.filter((dirPath) => dirPath.includes(dirObj.dirPath)).pop() ?? '../', file)}' assert { type: 'json' };\n`;
}).join(',');

// const generateImports = (dirPathArr, dirObj) => selectedFiles.map((file) => {
//   const variableName = path.parse(file).name;
//   return `import ${variableName} from '${path.join(dirPathArr.filter((dirPath) => dirPath.includes(dirObj.dirPath)).pop() ?? '../', file)}' assert { type: 'json' };\n`;
// }).join('');

const generateClassInit = () => '\nclass JSONLoader {';

const generateClassBody = (dirObjects) => {
  let classBody = '';
  dirObjects.forEach((dirObj) => {
    classBody += `${dirObj.files.map((file) => {
      const variableName = path.parse(file).name;
      return `\tstatic get ${variableName}() {\n\t\treturn JSON.parse(JSON.stringify(${variableName}));\n\t}\n`;
    }).join('')}\n`;
  });

  return classBody;
}

const generateInputCollectionsNamesGetter = (dirObjects) => `\tstatic get inputCollectionsNames() {\n\t\treturn [${dirObjects.filter((dirObj) => dirObj.dirPath.includes('input')).map((dirObj) => dirObj.files.map((file) => `'${file}'`).join(', '))}];\n\t}\n\n`;
const generateOutputCollectionsNamesGetter = (dirObjects) => `\tstatic get outputCollectionsNames() {\n\t\treturn [${dirObjects.filter((dirObj) => dirObj.dirPath.includes('output')).map((dirObj) => dirObj.files.map((file) => `'${file}'`).join(', '))}];\n\t}\n\n`;

const generateJSONLoader = (filePath, absoleteDirPathArr, relativeDirPathArr, extension) => {
  const dirObjects = absoleteDirPathArr.reduce((filesArr, absoleteDirPath) => filesArr.concat(getFiles(absoleteDirPath, extension)), []);
  const imports = dirObjects.reduce((importsArr, dirObj) => importsArr.concat(generateImports(relativeDirPathArr, dirObj)), []);
  const inputCollectionsNamesGetter = generateInputCollectionsNamesGetter(dirObjects);
  const outputCollectionsNamesGetter = generateOutputCollectionsNamesGetter(dirObjects);
  const classInit = generateClassInit();
  const classBody = generateClassBody(dirObjects);
  const classExport = '}\n\nexport default JSONLoader;';
  fs.writeFileSync(
    filePath,
    imports + classInit + inputCollectionsNamesGetter + outputCollectionsNamesGetter + classBody + classExport,
  );
};

const checkEnvExists = (dirPath, extension) => {
  const dirObj = getFiles(dirPath, extension);
  if (!dirObj.files.length) throw new Error('[err]   .env file not exists in root directory!');
};

checkEnvExists(envDirectoryPath, '.env');
generateJSONLoader(filePath, absoleteDirectoryPathArr, relativeDirectoryPathArr, '.json');