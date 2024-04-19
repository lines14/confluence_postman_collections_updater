import JSONLoader from './modules/main/JSONLoader.js';
import confluenceAPI from './modules/API/confluenceAPI.js';

const response = await confluenceAPI.getAttachments(JSONLoader.config.collectionsPageID);
const attachmentsIDs = JSONLoader.collectionsNames.map((collectionName) => response.data.results.filter((element) => element.title === collectionName).pop().id);
for (const attachmentID of attachmentsIDs) {
    await confluenceAPI.deleteAttachment(attachmentID);
    await confluenceAPI.deleteAttachment(attachmentID, { purge: true });
}

for (const collectionName of JSONLoader.collectionsNames) {
    await confluenceAPI.postAttachment(JSONLoader.config.collectionsPageID, collectionName);
}