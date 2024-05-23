import postmanCollection from 'postman-collection';
import Logger from './modules/main/logger.js';
import DataUtils from './modules/main/dataUtils.js';
import JSONLoader from './modules/main/JSONLoader.js';

const { Collection } = postmanCollection;

const parsedCollections = JSONLoader.inputCollectionNames
  .map((collectionName) => new Collection(JSONLoader[collectionName.replace('.json', '')]));
const originalCollection = parsedCollections.pop();
const sortedCollection = new Collection({
  info: {
    name: 'TEMPLATE_postman_collection',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
});

if (originalCollection.items && originalCollection.items.count() > 0) {
  DataUtils.processItems(sortedCollection, originalCollection.items);
} else {
  Logger.log('No items found in the original collection!');
}

DataUtils.saveToJSON(sortedCollection);
