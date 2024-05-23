import fs from 'fs';
import postmanCollection from 'postman-collection';
import Logger from './logger.js';

const { ItemGroup, Item } = postmanCollection;

class DataUtils {
  static saveToJSON(collection) {
    const replacer = (key, value) => (typeof value === 'undefined' ? null : value);
    fs.writeFileSync(`./output/${collection.name}.json`, JSON.stringify(collection, replacer, 4));
  }

  static getOrCreateFolder(sortedCollection, folders, name) {
    let folder = folders.find((f) => f.name === name);
    if (!folder) {
      folder = new ItemGroup({ name });
      sortedCollection.items.add(folder);
    }

    return folder;
  }

  static processItems(sortedCollection, items) {
    items.each((item) => {
      if (item instanceof Item) {
        const { path } = item.request.url;
        Logger.log(`Processing "${item.name}" request path: /${path.join('/')}`);
        if (path && path.length > 1) {
          const folderName = path[1].toUpperCase();
          const folder = this.getOrCreateFolder(sortedCollection, sortedCollection.items.members, folderName);
          folder.items.add(item);
        }
      } else if (item.items) {
        Logger.log(`Processing folder: ${item.name}`);
        this.processItems(sortedCollection, item.items);
      }
    });
  }
}

export default DataUtils;
