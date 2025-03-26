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

const templateCollectionInfo = {
  name: 'TEMPLATE',
  schema: JSONLoader.config.collectionSchema,
};

const testProductsCollectionInfo = {
  name: 'NEW_TEST_PRODUCTS',
  schema: JSONLoader.config.collectionSchema,
};

const testServicesCollectionInfo = {
  name: 'NEW_TEST_SERVICES',
  schema: JSONLoader.config.collectionSchema,
};

const sortedCollectionBody = new Collection({ info: templateCollectionInfo });
const groupedCollectionBody = new Collection({ info: templateCollectionInfo });
const testProductsCollectionBody = new Collection({ info: testProductsCollectionInfo });
const testServicesCollectionBody = new Collection({ info: testServicesCollectionInfo });

originalCollectionBodies.forEach((originalCollectionBody) => {
  if (originalCollectionBody?.items.count() > 0) {
    DataUtils.processItems(sortedCollectionBody, originalCollectionBody);
  } else {
    Logger.log('[err]   no items found in the original collection!');
  }
});

DataUtils.groupItems(groupedCollectionBody, sortedCollectionBody);
DataUtils.splitCollection(
  testProductsCollectionBody,
  testServicesCollectionBody,
  groupedCollectionBody,
);
DataUtils.saveToJSON(testProductsCollectionBody);
DataUtils.saveToJSON(testServicesCollectionBody);
