import JSONLoader from './modules/main/JSONLoader.js';
import confluenceAPI from './modules/API/confluenceAPI.js';

const response = await confluenceAPI.getAttachments(JSONLoader.config.collectionsPageID);
const { collectionsNames } = JSONLoader;
console.log({ collectionsNames });
response.data.results;
const postmanCollection = (await confluenceAPI.getAttachmentFile(pageID, attachmentID)).data;
dataUtils.saveToJSON({ postmanCollection });
await confluenceAPI.deleteAttachment(1, { purge: true });
const attachmentVersion = await confluenceAPI.getLastAttachmentVersion(attachmentID);
console.log((await confluenceAPI.updateAttachment(attachmentID, attachmentVersion)));
