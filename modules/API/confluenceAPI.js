import dotenv from 'dotenv';
import BaseAPI from '../main/baseAPI.js';
import JSONLoader from '../main/JSONLoader.js';

dotenv.config({ override: true });

class ConfluenceAPI extends BaseAPI {
  #API;

  #options;

  constructor(options = {
    baseURL: process.env.CONFLUENCE_URL,
    logString: '[inf] ▶ set base API URL:',
    timeout: process.env.TIMEOUT,
    headers: {
      Authorization: `Basic ${btoa(`${process.env.CONFLUENCE_LOGIN}:${process.env.CONFLUENCE_TOKEN}`)}`,
    },
  }) {
    super(options);
    this.#options = options;
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
    this.#options.headers['X-Atlassian-Token'] = 'nocheck';
    delete this.#options.logString;
    this.#API = new ConfluenceAPI(this.#options);
    const params = new FormData();
    params.append('content_type', 'multipart/form-data');
    params.append(
      'file',
      new Blob([JSON.stringify(JSONLoader[attachmentName.replace('.json', '')], null, 4)], { type: 'application/json' }),
      attachmentName,
    );

    return this.#API.post(`${JSONLoader.config.API.endpoints.confluence.content}/${pageID}/child/attachment`, params);
  }
}

export default new ConfluenceAPI();
