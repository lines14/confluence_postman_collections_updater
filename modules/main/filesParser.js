/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import fs from 'fs';
import path from 'path';

const fileExtension = '.json';
const inputDirectoryPath = './input';
const envDirectoryPath = path.resolve();
const fileLocation = path.join(path.resolve(), './modules/main/JSONLoader.js');

const absoleteInputDirectoryPath = path.relative(path.resolve(), inputDirectoryPath);
const absoleteOutputDirectoryPath = path.relative(path.resolve(), './output');
const absoleteResourcesDirectoryPath = path.relative(path.resolve(), './resources');

const relativeInputDirectoryPath = path.relative(
  path.dirname(new URL(import.meta.url).pathname),
  inputDirectoryPath,
);
const relativeOutputDirectoryPath = path.relative(
  path.dirname(new URL(import.meta.url).pathname),
  './output',
);
const relativeResourcesDirectoryPath = path.relative(
  path.dirname(new URL(import.meta.url).pathname),
  './resources',
);

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

const getFiles = (dirPath, fileExt) => {
  const allFiles = fs.readdirSync(dirPath);
  const files = allFiles.filter((file) => file.endsWith(fileExt));
  allFiles.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const nestedDirObject = getFiles(fullPath, fileExt);
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

const flattenJSON = (obj) => {
  const result = {};
  const recursive = (currentObj, prefix = '') => {
    for (const objKey in currentObj) {
      if (Object.hasOwn(currentObj, objKey)) {
        const fullKey = prefix ? `${prefix}.${objKey}` : objKey;
        if (typeof currentObj[objKey] === 'object') {
          recursive(currentObj[objKey], fullKey);
        } else {
          result[fullKey] = currentObj[objKey];
        }
      }
    }
  };

  recursive(obj);
  return result;
};

const trimDotsAndSpacesInFileNames = (filename) => {
  const regex = /[ .]/g;
  if (filename.endsWith(fileExtension)) {
    const lastDotIndex = filename.lastIndexOf('.');
    const name = filename.substring(0, lastDotIndex).replace(regex, '_');
    const extension = filename.substring(lastDotIndex);
    return `${name}${extension}`;
  }

  return filename.replace(regex, '_');
};

const processDirObjects = (dirObjects) => {
  const updatedDirObjects = dirObjects.map((dirObj) => ({
    ...dirObj,
    fileObjects: dirObj.fileObjects.map((fileObj) => ({
      ...fileObj,
      file: trimDotsAndSpacesInFileNames(fileObj.file),
      fileName: trimDotsAndSpacesInFileNames(fileObj.fileName),
    })),
  }));

  const flattenedDirObjects = flattenJSON(dirObjects);
  const flattenedUpdatedDirObjects = flattenJSON(updatedDirObjects);
  Object.keys(flattenedDirObjects).forEach((key) => {
    if (key.endsWith('.file')) {
      if (flattenedDirObjects[key] !== flattenedUpdatedDirObjects[key]) {
        fs.rename(
          `${inputDirectoryPath}/${flattenedDirObjects[key]}`,
          `${inputDirectoryPath}/${flattenedUpdatedDirObjects[key]}`,
          (err) => {
            if (err) {
              throw new Error(`[err]   couldn\`t rename file from ${flattenedDirObjects[key]} to ${flattenedUpdatedDirObjects[key]}!`);
            } else { // eslint-disable-next-line no-console
              console.log(`[inf]   file renamed from ${flattenedDirObjects[key]} to ${flattenedUpdatedDirObjects[key]}`);
            }
          },
        );
      }
    }
  });

  return updatedDirObjects;
};

const generateJSONLoader = (filePath, absoleteDirPathArr, relativeDirPathArr) => {
  let dirObjects = absoleteDirPathArr.reduce((filesArr, absoleteDirPath) => {
    const dirObj = getFiles(absoleteDirPath, fileExtension);
    dirObj.fileObjects = dirObj.fileObjects
      .map((fileObj) => ({ file: fileObj.file, fileName: fileObj.file.replace(fileExtension, '') }));
    return filesArr.concat(dirObj);
  }, []);
  dirObjects = processDirObjects(dirObjects);
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
