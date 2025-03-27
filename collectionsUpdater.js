import postmanCollection from 'postman-collection';
import Logger from './modules/main/logger.js';
import DataUtils from './modules/main/dataUtils.js';
import JSONLoader from './modules/main/JSONLoader.js';

const { Collection } = postmanCollection;

const originalTestCollections = JSONLoader.inputTestFileObjects
  .filter((fileObj) => (!JSONLoader.config.parseAll
    ? JSONLoader.config.testCollectionNamesToParse.includes(fileObj.fileName)
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

const sortedCollection = new Collection({ info: templateCollectionInfo });
const groupedCollection = new Collection({ info: templateCollectionInfo });
const testProductsCollection = new Collection({ info: testProductsCollectionInfo });
const testServicesCollection = new Collection({ info: testServicesCollectionInfo });

originalTestCollections.forEach((originalCollection) => {
  if (originalCollection?.items.count() > 0) {
    DataUtils.processItems(sortedCollection, originalCollection);
  } else {
    Logger.log('[err]   no items found in the original collection!');
  }
});

DataUtils.groupItems(groupedCollection, sortedCollection);
DataUtils.splitCollection(
  testProductsCollection,
  testServicesCollection,
  groupedCollection,
);

DataUtils.setUniqueEnvVariablesFromAllCollections(
  testProductsCollection,
  testServicesCollection,
  originalTestCollections,
);

DataUtils.moveAuthMethodToRoot(testProductsCollection, testServicesCollection);
DataUtils.saveToJSON(testProductsCollection);
DataUtils.saveToJSON(testServicesCollection);
