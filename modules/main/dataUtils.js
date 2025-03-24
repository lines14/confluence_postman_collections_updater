import fs from 'fs';
import _ from 'lodash';
import postmanCollection from 'postman-collection';
import Logger from './logger.js';

const { ItemGroup, Item } = postmanCollection;

class DataUtils {
  static saveToJSON(collection) {
    const replacer = (key, value) => (typeof value === 'undefined' ? null : value);
    fs.writeFileSync(`./output/${collection.name}.json`, JSON.stringify(collection, replacer, 4));
  }

  static getOrCreateFolder(sortedCollection, name) {
    let folder = sortedCollection.items.members.find((f) => f.name === name);
    if (!folder) {
      folder = new ItemGroup({ name });
      sortedCollection.items.add(folder);
    }

    return folder;
  }

  static getPropertiesFromSameItem(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (_.isEqual(existingItem.request.url.path, item.request.url.path)) {
        if (item.request.method === 'POST' && item.request.body && item.request.body.urlencoded) {
          if (existingItem.request.method === 'POST') {
            if (existingItem.request.body && existingItem.request.body.urlencoded) {
              existingItem.request.body.urlencoded.add(...item.request.body.urlencoded.all());
            } else {
              existingItem.request.body.formdata.add(...item.request.body.urlencoded.all());
            }
          }
        } else if (item.request.method === 'POST' && item.request.body && item.request.body.formdata) {
          if (existingItem.request.method === 'POST') {
            if (existingItem.request.body && existingItem.request.body.formdata) {
              existingItem.request.body.formdata.add(...item.request.body.formdata.all());
            } else {
              existingItem.request.body.urlencoded.add(...item.request.body.formdata.all());
            }
          }
        } else if (item.request.method === 'GET' && item.request.url.query) {
          if (existingItem.request.method === 'GET') {
            existingItem.request.url.query.add(...item.request.url.query.all());
          }
        }
      }
    });
  }

  static processItems(sortedCollection, originalCollection) {
    originalCollection.items.each((item) => {
      if (item instanceof Item) {
        const { host, path } = item.request.url;
        Logger.log(`[inf]   processing "${item.name}" request path: /${path.join('/')}`);
        if (path && path.length > 1) {
          if (host.some((substr) => substr.toUpperCase().includes('GATEWAY'))
            && path[0] !== 'api') {
            path.unshift('api');
          }

          let folderName;
          if (path.length > 2) {
            folderName = path[0] === 'api' ? path[1].toUpperCase() : host[0].toUpperCase();
          } else {
            folderName = 'AUTH';
          }

          const folder = this.getOrCreateFolder(sortedCollection, folderName);

          if (folder.items.all().some((existingItem) => _.isEqual(existingItem.request.url.path, item.request.url.path) 
            && existingItem.name.toUpperCase() === item.name.toUpperCase())) {
            this.getPropertiesFromSameItem(folder, item);
          } else {
            folder.items.add(item);
          }
        }
      } else if (item.items) {
        Logger.log(`[inf]   processing folder: ${item.name}`);
        this.processItems(sortedCollection, item);
      }
    });
  }
}

export default DataUtils;
