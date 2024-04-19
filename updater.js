import confluenceAPI from './modules/API/confluenceAPI.js';
import dataUtils from './modules/main/utils/data/dataUtils.js';

// const response = await this.get(`${JSONLoader.APIEndpoints.Confluence.pages}/${pageID}/attachments`);
// return response.data.results.map((attachment) => attachment.id);
// const pageID = '643170307';
// const attachmentID = (await confluenceAPI.getAttachments(pageID));
// const postmanCollection = (await confluenceAPI.getAttachmentFile(pageID, attachmentID)).data;
// dataUtils.saveToJSON({ postmanCollection });
await confluenceAPI.deleteAttachment(1, { purge: true });
// const attachmentVersion = await confluenceAPI.getLastAttachmentVersion(attachmentID);
// console.log((await confluenceAPI.updateAttachment(attachmentID, attachmentVersion)));