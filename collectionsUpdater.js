import postmanCollection from 'postman-collection';
import Logger from './modules/main/logger.js';
import DataUtils from './modules/main/dataUtils.js';
import JSONLoader from './modules/main/JSONLoader.js';

const { Collection } = postmanCollection;

const originalCollectionBodies = JSONLoader.inputFileObjects
  .filter((fileObj) => (!JSONLoader.config.parseAll
    ? JSONLoader.config.collectionNamesToParse.includes(fileObj.fileName)
    : fileObj))
  .map((fileObj) => new Collection(JSONLoader[fileObj.fileName]));

const sortedCollectionBody = new Collection({
  info: {
    name: 'TEMPLATE_postman_collection',
    schema: JSONLoader.config.collectionSchema,
  },
});

originalCollectionBodies.forEach((originalCollectionBody) => {
  if (originalCollectionBody?.items.count() > 0) {
    DataUtils.processItems(sortedCollectionBody, originalCollectionBody);
  } else {
    Logger.log('[err]   no items found in the original collection!');
  }
});

DataUtils.saveToJSON(sortedCollectionBody);
