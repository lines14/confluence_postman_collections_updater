/* eslint-disable no-await-in-loop */
/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import dotenv from 'dotenv';
import gitlabAPI from './modules/API/gitlabAPI.js';
import confluenceAPI from './modules/API/confluenceAPI.js';
import JSONLoader from './modules/main/utils/data/JSONLoader.js';

dotenv.config({ override: true });

const publishCollections = async () => {
  await gitlabAPI.setToken();

  let fileObjects = JSONLoader.outputFileObjects
    .filter((fileObj) => JSONLoader.config.collectionNamesToPublish
      .includes(fileObj.fileName));

  for (const pageID of JSON.parse(process.env.CONFLUENCE_PAGES_IDS)) {
    const response = await confluenceAPI.getAttachments(pageID);
    const attachmentsIDs = fileObjects.map((fileObj) => response.data.results
      .filter((element) => element.title === fileObj.file).pop().id);

    for (const attachmentID of attachmentsIDs) {
      await confluenceAPI.deleteAttachment(attachmentID);
      await confluenceAPI.deleteAttachment(attachmentID, { purge: true });
    }

    for (const fileObj of fileObjects) {
      await confluenceAPI.postJSONAttachment(pageID, fileObj);
    }
  }

  fileObjects = fileObjects.map((fileObj) => ({
    file_path: `output_collections/${fileObj.file}`,
    content: JSON.stringify(JSONLoader[fileObj.fileName], null, 4),
  }));

  await gitlabAPI.updateFilesContent(fileObjects);
};

publishCollections();
