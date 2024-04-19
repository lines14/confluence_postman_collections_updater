import dotenv from 'dotenv';
import BaseAPI from '../main/utils/API/baseAPI.js';
import JSONLoader from '../main/utils/data/JSONLoader.js';

dotenv.config({ override: true });

class ConfluenceAPI extends BaseAPI {
  #API;

  constructor(options = {}) {
    super(
      options.baseURL || process.env.CONFLUENCE_URL,
      options.logString ?? '[inf] ▶ set base API URL:',
      options.timeout || JSONLoader.APIConfigData.timeout,
      options.headers || {
        Authorization: `Basic ${btoa(`${process.env.CONFLUENCE_LOGIN}:${process.env.CONFLUENCE_TOKEN}`)}`
      },
    );
  }

  async getAttachments(pageID) {
    return this.get(`${JSONLoader.APIEndpoints.Confluence.pages}/${pageID}/attachments`);
  }

  async deleteAttachment(attachmentID, { purge = false }) {
    const params = {
      purge
    }

    return this.delete(`${JSONLoader.APIEndpoints.Confluence.attachments}/${attachmentID}`, params);
  }

  async postAttachment(pageID, dataObj) {
    this.#API = new ConfluenceAPI({
      headers: {
        'X-Atlassian-Token': 'nocheck'
      }
    });

    const [name] = Object.keys(dataObj);
    const attachment = dataObj[name];
    const file = new FormData();
    file.append(name, attachment);
    const params = {
      file
    }

    return this.#API.put(`${JSONLoader.APIEndpoints.Confluence.content}/${pageID}/child/attachment`, params);
  }
}

export default new ConfluenceAPI();