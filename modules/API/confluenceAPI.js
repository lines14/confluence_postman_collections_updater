import dotenv from 'dotenv';
import BaseAPI from '../main/utils/API/baseAPI.js';
import JSONLoader from '../main/utils/data/JSONLoader.js';

dotenv.config({ override: true });

class ConfluenceAPI extends BaseAPI {
  #API;

  constructor(options = {}) {
    super(
      options.baseURL || process.env.CONFLUENCE_BASE_URL,
      options.logString ?? '[inf] ▶ set base API URL:',
      options.timeout || JSONLoader.APIConfigData.timeout,
      options.headers || {
        Authorization: `Basic ${btoa(`${process.env.CONFLUENCE_LOGIN}:${process.env.CONFLUENCE_TOKEN}`)}`
      },
    );
  }

  async getAttachments(pageID) {
    const response = await this.get(`${JSONLoader.APIEndpoints.Confluence.pages}/${pageID}/attachments`);
    return response.data.results;
    // const response = await this.get(`${JSONLoader.APIEndpoints.Confluence.pages}/${pageID}/attachments`);
    // return response.data.results.map((attachment) => attachment.id);
  }

  async getAttachmentFile(pageID, attachmentID) {
    const response = await this.get(`${JSONLoader.APIEndpoints.Confluence.pages}/${pageID}/attachments`);
    const link = response.data.results
      .filter((attachment) => attachment.id === attachmentID).pop().downloadLink;
    return this.get(link.slice(1));
  }

  async getLastAttachmentVersion(attachmentID) {
    const response = await this.get(`${JSONLoader.APIEndpoints.Confluence.attachments}/${attachmentID}/versions`);
    return response.data.results.pop().number;
  }

  async deleteAttachment(attachmentID) {
    const params = {
      purge: true
    }

    return this.delete(`${JSONLoader.APIEndpoints.Confluence.attachments}/${attachmentID}`, params);
  }

  // async updateAttachment(attachmentID, attachmentVersion) {
  //   // const file = new FormData();
  //   // file.append('postmanCollection', JSONLoader.postmanCollection);

  //   this.#API = new ConfluenceAPI({
  //     headers: {
  //       'X-Atlassian-Token': 'nocheck',
  //       // 'Accept': 'application/json',
  //       // 'Content-Type': 'multipart/form-data'
  //       'Content-Type': 'application/json'
  //     },
  //   });

  //   const params = {
  //     // file,
  //     file: JSONLoader.postmanCollection,
  //     version: {
  //       number: attachmentVersion += 1
  //     }
  //   }

  //   return this.#API.put(`${JSONLoader.APIEndpoints.Confluence.content}/${attachmentID}`, params);
  // }
}

export default new ConfluenceAPI();
