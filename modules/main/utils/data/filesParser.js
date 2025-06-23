/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import fs from 'fs';
import path from 'path';

const fileExtension = '.json';
const resourcesDirectoryPath = './resources';
const outputDirectoryPath = './output_collections';
const inputTestDirectoryPath = './input_test_collections';
const inputProdDirectoryPath = './input_prod_collections';
const envDirectoryPath = path.resolve();
const fileLocation = path.join(path.resolve(), './modules/main/utils/data/JSONLoader.js');

const absoleteInputTestDirectoryPath = path.relative(path.resolve(), inputTestDirectoryPath);
const absoleteInputProdDirectoryPath = path.relative(path.resolve(), inputProdDirectoryPath);
const absoleteOutputDirectoryPath = path.relative(path.resolve(), outputDirectoryPath);
const absoleteResourcesDirectoryPath = path.relative(path.resolve(), resourcesDirectoryPath);

const relativeInputTestDirectoryPath = path.relative(
  path.dirname(new URL(import.meta.url).pathname),
  inputTestDirectoryPath,
);
const relativeInputProdDirectoryPath = path.relative(
  path.dirname(new URL(import.meta.url).pathname),
  inputProdDirectoryPath,
);
const relativeOutputDirectoryPath = path.relative(
  path.dirname(new URL(import.meta.url).pathname),
  outputDirectoryPath,
);
const relativeResourcesDirectoryPath = path.relative(
  path.dirname(new URL(import.meta.url).pathname),
  resourcesDirectoryPath,
);

const absoleteDirectoryPathArr = [
  absoleteInputTestDirectoryPath,
  absoleteInputProdDirectoryPath,
  absoleteOutputDirectoryPath,
  absoleteResourcesDirectoryPath,
];
const relativeDirectoryPathArr = [
  relativeInputTestDirectoryPath,
  relativeInputProdDirectoryPath,
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

const generateInputTestFileObjectsGetter = (dirObjects) => `\tstatic get inputTestFileObjects() {\n\t\treturn [${dirObjects
  .filter((dirObj) => dirObj.dirPath.includes('input_test'))
  .flatMap((dirObj) => dirObj.fileObjects
    .map((fileObj) => `{file: '${fileObj.file}', fileName: '${fileObj.fileName}'}`)
    .join(', '))}];\n\t}\n\n`;

const generateInputProdFileObjectsGetter = (dirObjects) => `\tstatic get inputProdFileObjects() {\n\t\treturn [${dirObjects
  .filter((dirObj) => dirObj.dirPath.includes('input_prod'))
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
  const regex = /[ .\-+]/g;
  if (filename.endsWith(fileExtension)) {
    const lastDotIndex = filename.lastIndexOf('.');
    const name = filename.substring(0, lastDotIndex).replace(regex, '_');
    const extension = filename.substring(lastDotIndex);
    return `${name}${extension}`;
  }

  return filename.replace(regex, '_');
};

const getDirPath = (dirObjects, file) => dirObjects
  .find((dirObj) => dirObj.fileObjects
    .some((fileObj) => fileObj.file === file)).dirPath;

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
          `./${getDirPath(dirObjects, flattenedDirObjects[key])}/${flattenedDirObjects[key]}`,
          `./${getDirPath(dirObjects, flattenedDirObjects[key])}/${flattenedUpdatedDirObjects[key]}`,
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

const checkTestAndProdFilesInTargetFolders = (dirObjects) => {
  dirObjects.forEach((dirObj) => {
    dirObj.fileObjects.forEach((fileObj) => {
      if (dirObj.dirPath.includes('test')
        && fileObj.fileName.split('_').map((subStr) => subStr.toLowerCase()).includes('production')) {
        throw new Error(`[err]   file "${fileObj.fileName}" not in "input_prod_collections" folder`);
      } else if (dirObj.dirPath.includes('prod')
        && fileObj.fileName.split('_').map((subStr) => subStr.toLowerCase()).includes('test')) {
        throw new Error(`[err]   file "${fileObj.fileName}" not in "input_test_collections" folder`);
      }
    });
  });
};

const generateJSONLoader = (filePath, absoleteDirPathArr, relativeDirPathArr) => {
  let dirObjects = absoleteDirPathArr.reduce((filesArr, absoleteDirPath) => {
    const dirObj = getFiles(absoleteDirPath, fileExtension);
    dirObj.fileObjects = dirObj.fileObjects
      .map((fileObj) => ({ file: fileObj.file, fileName: fileObj.file.replace(fileExtension, '') }));
    return filesArr.concat(dirObj);
  }, []);
  dirObjects = processDirObjects(dirObjects);
  checkTestAndProdFilesInTargetFolders(dirObjects);
  const imports = dirObjects.reduce((importsArr, dirObj) => importsArr
    .concat(generateImports(relativeDirPathArr, dirObj)), []).join('');
  const classInit = '\nclass JSONLoader {\n';
  const inputTestFileObjectsGetter = generateInputTestFileObjectsGetter(dirObjects);
  const inputProdFileObjectsGetter = generateInputProdFileObjectsGetter(dirObjects);
  const outputFileObjectsGetter = generateOutputFileObjectsGetter(dirObjects);
  const classBody = generateClassBody(dirObjects);
  const classExport = '}\n\nexport default JSONLoader;';
  fs.writeFileSync(
    filePath,
    imports
    + classInit
    + inputTestFileObjectsGetter
    + inputProdFileObjectsGetter
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
