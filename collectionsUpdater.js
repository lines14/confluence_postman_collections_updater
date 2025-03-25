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

const info = {
  name: 'TEMPLATE_postman_collection',
  schema: JSONLoader.config.collectionSchema,
};

const sortedCollectionBody = new Collection({ info });
const groupedCollectionBody = new Collection({ info });

originalCollectionBodies.forEach((originalCollectionBody) => {
  if (originalCollectionBody?.items.count() > 0) {
    DataUtils.processItems(sortedCollectionBody, originalCollectionBody);
  } else {
    Logger.log('[err]   no items found in the original collection!');
  }
});

DataUtils.groupItems(groupedCollectionBody, sortedCollectionBody);
DataUtils.saveToJSON(groupedCollectionBody);
