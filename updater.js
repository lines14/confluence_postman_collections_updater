import confluenceAPI from './modules/API/confluenceAPI.js';
import dataUtils from './modules/main/utils/data/dataUtils.js';

const pageID = '643170307';
const attachmentID = (await confluenceAPI.getAttachments(pageID));
const postmanCollection = (await confluenceAPI.getAttachmentFile(pageID, attachmentID)).data;
dataUtils.saveToJSON({ postmanCollection });
console.log(await confluenceAPI.deleteAttachment(attachmentID));
const attachmentVersion = await confluenceAPI.getLastAttachmentVersion(attachmentID);
console.log((await confluenceAPI.updateAttachment(attachmentID, attachmentVersion)));