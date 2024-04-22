import dotenv from 'dotenv';
import BaseAPI from '../main/baseAPI.js';
import JSONLoader from '../main/JSONLoader.js';

dotenv.config({ override: true });

class ConfluenceAPI extends BaseAPI {
  #API;

  constructor(options = {}) {
    super(
      options.baseURL || process.env.CONFLUENCE_URL,
      options.logString ?? '[inf] ▶ set base API URL:',
      options.timeout || process.env.TIMEOUT,
      options.headers || {
        Authorization: `Basic ${btoa(`${process.env.CONFLUENCE_LOGIN}:${process.env.CONFLUENCE_TOKEN}`)}`,
      },
    );
  }

  async getAttachments(pageID) {
    return this.get(`${JSONLoader.config.API.endpoints.confluence.pages}/${pageID}/attachments`);
  }

  async deleteAttachment(attachmentID, options = { purge: false }) {
    const params = {
      purge: options.purge,
    };

    return this.delete(`${JSONLoader.config.API.endpoints.confluence.attachments}/${attachmentID}`, params);
  }

  async postAttachment(pageID, attachmentName) {
    const file = new FormData();
    file.append('content_type', 'multipart/form-data');
    file.append(
      attachmentName, 
      new Blob([JSON.stringify(JSONLoader[attachmentName.replace('.json', '')], null, 4)], { type: 'application/json' }), 
      attachmentName
    );

    this.#API = new ConfluenceAPI({
      headers: {
        Authorization: `Basic ${btoa(`${process.env.CONFLUENCE_LOGIN}:${process.env.CONFLUENCE_TOKEN}`)}`,
        'X-Atlassian-Token': 'nocheck',
      },
    });

    return this.#API.post(`${JSONLoader.config.API.endpoints.confluence.content}/${pageID}/child/attachment`, file);
  }
}

export default new ConfluenceAPI();