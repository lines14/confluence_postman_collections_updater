/* eslint-disable no-await-in-loop */
/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import path from 'path';
import dotenv from 'dotenv';
import gitlabAPI from './modules/API/gitlabAPI.js';
import confluenceAPI from './modules/API/confluenceAPI.js';
import DataUtils from './modules/main/utils/data/dataUtils.js';
import JSONLoader from './modules/main/utils/data/JSONLoader.js';

dotenv.config({ override: true });
const file = 'updateDate.png';
const filePath = `artifacts/${file}`;
const fileBuffer = DataUtils.getFile(path.resolve(filePath));

const publishCollections = async () => {
  await gitlabAPI.setToken();

  let fileObjects = JSONLoader.outputFileObjects
    .filter((fileObj) => JSONLoader.config.collectionNamesToPublish
      .includes(fileObj.fileName));

  for (const pageID of JSON.parse(process.env.CONFLUENCE_PAGES_IDS)) {
    const response = await confluenceAPI.getAttachments(pageID);
    const attachmentsIDs = fileObjects.map((fileObj) => response.data.results
      .filter((element) => element.title === fileObj.file).pop().id);
    const fileAttachmentID = response.data.results
      .filter((result) => result.title === file).pop().id;
    attachmentsIDs.push(fileAttachmentID);

    for (const attachmentID of attachmentsIDs) {
      await confluenceAPI.deleteAttachment(attachmentID);
      await confluenceAPI.deleteAttachment(attachmentID, { purge: true });
    }

    for (const fileObj of fileObjects) {
      fileObj.fileBuffer = JSON.stringify(JSONLoader[fileObj.fileName], null, 4);
      await confluenceAPI.createAttachment(pageID, fileObj, 'application/json');
    }

    const fileObj = {};
    fileObj.file = file;
    fileObj.fileBuffer = fileBuffer;
    await confluenceAPI.createAttachment(pageID, fileObj, 'image/png');
  }

  fileObjects = fileObjects.map((fileObj) => ({
    file_path: `output_collections/${fileObj.file}`,
    content: JSON.stringify(JSONLoader[fileObj.fileName], null, 4),
  }));

  fileObjects.push({
    file_path: filePath,
    content: fileBuffer.toString('base64'),
    encoding: 'base64',
  });

  await gitlabAPI.updateFilesContent(fileObjects);
};

publishCollections();
