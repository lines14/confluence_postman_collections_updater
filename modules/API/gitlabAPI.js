import dotenv from 'dotenv';
import BaseAPI from '../main/baseAPI.js';
import JSONLoader from '../main/JSONLoader.js';

dotenv.config({ override: true });

class GitlabAPI extends BaseAPI {
  #API;

  #token;

  #projectID;

  #options;

  constructor(options = {
    baseURL: process.env.GITLAB_URL,
  }) {
    super(options);
    this.#options = options;
    this.#token = process.env.GITLAB_TOKEN;
    this.#projectID = process.env.CI_PROJECT_ID;
  }

  async setToken() {
    this.#options.headers = {};
    this.#options.headers['PRIVATE-TOKEN'] = this.#token;
    this.#options.headers['Content-Type'] = 'application/json';
    this.#API = new GitlabAPI(this.#options);
  }

  async getFileContent(filePath, options = { branch: JSONLoader.config.branch }) {
    const params = {
      ref: options.branch,
    };

    return this.#API.get(`${JSONLoader.APIEndpoints.gitlab.projects}/${this.#projectID}/repository/files/${encodeURIComponent(filePath)}`, params);
  }

  /* eslint camelcase: ["error", {allow: ["file_path", "commit_message"]}] */
  async updateFilesContent(
    fileObjectsArr,
    options = {
      branch: JSONLoader.config.branch,
    },
  ) {
    const fileObjectsWithActionsArr = fileObjectsArr.map((fileObj) => ({ ...fileObj, action: 'update' }));
    const params = {
      branch: options.branch,
      commit_message: JSONLoader.config.commitMessage,
      actions: fileObjectsWithActionsArr,
    };

    return this.#API.post(`${JSONLoader.APIEndpoints.gitlab.projects}/${this.#projectID}/repository/commits`, params);
  }
}

export default new GitlabAPI();
