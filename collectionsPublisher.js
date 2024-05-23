/* eslint-disable no-await-in-loop */
/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import JSONLoader from './modules/main/JSONLoader.js';
import confluenceAPI from './modules/API/confluenceAPI.js';

const fileObjects = JSONLoader.outputFileObjects
  .filter((fileObj) => JSONLoader.config.collectionNamesToPublish
    .includes(fileObj.fileName));

const response = await confluenceAPI.getAttachments(JSONLoader.config.confluencePageID);
const attachmentsIDs = fileObjects.map((fileObj) => response.data.results
  .filter((element) => element.title === fileObj.file).pop().id);

for (const attachmentID of attachmentsIDs) {
  await confluenceAPI.deleteAttachment(attachmentID);
  await confluenceAPI.deleteAttachment(attachmentID, { purge: true });
}

for (const fileObj of fileObjects) {
  await confluenceAPI.postJSONAttachment(JSONLoader.config.confluencePageID, fileObj);
}
