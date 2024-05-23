import fs from 'fs';
import path from 'path';

const envDirectoryPath = path.resolve();
const fileLocation = path.join(path.resolve(), './modules/main/JSONLoader.js');

const absoleteInputDirectoryPath = path.relative(path.resolve(), './input');
const absoleteOutputDirectoryPath = path.relative(path.resolve(), './output');
const absoleteResourcesDirectoryPath = path.relative(path.resolve(), './resources');

const relativeInputDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './input');
const relativeOutputDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './output');
const relativeResourcesDirectoryPath = path.relative(path.dirname(new URL(import.meta.url).pathname), './resources');

const absoleteDirectoryPathArr = [
  absoleteInputDirectoryPath,
  absoleteOutputDirectoryPath,
  absoleteResourcesDirectoryPath,
];
const relativeDirectoryPathArr = [
  relativeInputDirectoryPath,
  relativeOutputDirectoryPath,
  relativeResourcesDirectoryPath,
];

const getFiles = (dirPath, fileExtension) => {
  const allFiles = fs.readdirSync(dirPath);
  const files = allFiles.filter((file) => file.endsWith(fileExtension));
  allFiles.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const nestedDirObject = getFiles(fullPath, fileExtension);
      files.push(...nestedDirObject.fileObjects.map((nestedFile) => path.join(file, nestedFile)));
    }
  });

  return { fileObjects: files.map((file) => ({ file })), dirPath };
};

const generateImports = (dirPathArr, dirObj) => dirObj.fileObjects
  .map((fileObj) => `import ${fileObj.fileName} from '${path.join(dirPathArr
    .filter((dirPath) => dirPath.includes(dirObj.dirPath)).pop() ?? '../', fileObj.file)}' assert { type: 'json' };\n`)
  .join('');

const generateClassBody = (dirObjects) => dirObjects.map((dirObj) => `${dirObj.fileObjects
  .map((fileObj) => `\tstatic get ${fileObj.fileName}() {\n\t\treturn JSON.parse(JSON.stringify(${fileObj.fileName}));\n\t}\n\n`)
  .join('')}`)
  .join('');

const generateInputFileObjectsGetter = (dirObjects) => `\tstatic get inputFileObjects() {\n\t\treturn [${dirObjects
  .filter((dirObj) => dirObj.dirPath.includes('input'))
  .flatMap((dirObj) => dirObj.fileObjects
    .map((fileObj) => `{file: '${fileObj.file}', fileName: '${fileObj.fileName}'}`)
    .join(', '))}];\n\t}\n\n`;

const generateOutputFileObjectsGetter = (dirObjects) => `\tstatic get outputFileObjects() {\n\t\treturn [${dirObjects
  .filter((dirObj) => dirObj.dirPath.includes('output'))
  .flatMap((dirObj) => dirObj.fileObjects
    .map((fileObj) => `{file: '${fileObj.file}', fileName: '${fileObj.fileName}'}`)
    .join(', '))}];\n\t}\n\n`;

const generateJSONLoader = (filePath, absoleteDirPathArr, relativeDirPathArr) => {
  const fileExtension = '.json';
  const dirObjects = absoleteDirPathArr.reduce((filesArr, absoleteDirPath) => {
    const dirObj = getFiles(absoleteDirPath, fileExtension);
    dirObj.fileObjects = dirObj.fileObjects
      .map((fileObj) => ({ file: fileObj.file, fileName: fileObj.file.replace(fileExtension, '') }));
    return filesArr.concat(dirObj);
  }, []);
  const imports = dirObjects.reduce((importsArr, dirObj) => importsArr
    .concat(generateImports(relativeDirPathArr, dirObj)), []).join('');
  const classInit = '\nclass JSONLoader {\n';
  const inputFileObjectsGetter = generateInputFileObjectsGetter(dirObjects);
  const outputFileObjectsGetter = generateOutputFileObjectsGetter(dirObjects);
  const classBody = generateClassBody(dirObjects);
  const classExport = '}\n\nexport default JSONLoader;';
  fs.writeFileSync(
    filePath,
    imports
    + classInit
    + inputFileObjectsGetter
    + outputFileObjectsGetter
    + classBody
    + classExport,
  );
};

const checkEnvExists = (dirPath) => {
  const dirObj = getFiles(dirPath, '.env');
  if (!dirObj.fileObjects.length) throw new Error('[err]   .env file not exists in root directory!');
};

checkEnvExists(envDirectoryPath);
generateJSONLoader(fileLocation, absoleteDirectoryPathArr, relativeDirectoryPathArr);
