import postmanCollection from 'postman-collection';
import Logger from './modules/main/utils/log/logger.js';
import DataUtils from './modules/main/utils/data/dataUtils.js';
import JSONLoader from './modules/main/utils/data/JSONLoader.js';
import ImageUtils from './modules/main/utils/image/imageUtils.js';

const updateCollections = () => {
  const { Collection } = postmanCollection;

  const originalTestCollections = JSONLoader.inputTestFileObjects
    .filter((fileObj) => (!JSONLoader.config.parseAllTestCollections
      ? JSONLoader.config.testCollectionNamesToParse.includes(fileObj.fileName)
      : fileObj))
    .map((fileObj) => new Collection(JSONLoader[fileObj.fileName]));

  const originalProdCollections = JSONLoader.inputProdFileObjects
    .filter((fileObj) => (!JSONLoader.config.parseAllProdCollections
      ? JSONLoader.config.prodCollectionNamesToParse.includes(fileObj.fileName)
      : fileObj))
    .map((fileObj) => new Collection(JSONLoader[fileObj.fileName]));

  const originalOnesCollections = JSONLoader.inputOnesFileObjects
    .filter((fileObj) => (!JSONLoader.config.parseAllOnesCollections
      ? JSONLoader.config.onesCollectionNamesToParse.includes(fileObj.fileName)
      : fileObj))
    .map((fileObj) => new Collection(JSONLoader[fileObj.fileName]));

  const testProductsAndServicesCollectionInfo = {
    name: 'NEW_TEST_PRODUCTS_AND_SERVICES',
    schema: JSONLoader.config.collectionSchema,
  };

  const prodProductsAndServicesCollectionInfo = {
    name: 'NEW_PRODUCTION_PRODUCTS_AND_SERVICES',
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

  const prodProductsCollectionInfo = {
    name: 'NEW_PRODUCTION_PRODUCTS',
    schema: JSONLoader.config.collectionSchema,
  };

  const prodServicesCollectionInfo = {
    name: 'NEW_PRODUCTION_SERVICES',
    schema: JSONLoader.config.collectionSchema,
  };

  const onesCollectionInfo = {
    name: 'NEW_1C_JSON_TEST_PROD',
    schema: JSONLoader.config.collectionSchema,
  };

  const sortedTestProductsAndServicesCollection = new Collection({
    info: testProductsAndServicesCollectionInfo,
  });

  const groupedTestProductsAndServicesCollection = new Collection({
    info: testProductsAndServicesCollectionInfo,
  });

  const sortedProdProductsAndServicesCollection = new Collection({
    info: prodProductsAndServicesCollectionInfo,
  });

  const groupedProdProductsAndServicesCollection = new Collection({
    info: prodProductsAndServicesCollectionInfo,
  });

  const sortedOnesCollection = new Collection({ info: onesCollectionInfo });

  const groupedOnesCollection = new Collection({ info: onesCollectionInfo });

  const testProductsCollection = new Collection({ info: testProductsCollectionInfo });
  const testServicesCollection = new Collection({ info: testServicesCollectionInfo });
  const prodProductsCollection = new Collection({ info: prodProductsCollectionInfo });
  const prodServicesCollection = new Collection({ info: prodServicesCollectionInfo });

  originalOnesCollections.forEach((originalCollection) => {
    if (originalCollection?.items.count() > 0) {
      DataUtils.processItems(
        sortedOnesCollection,
        originalCollection,
      );
    } else {
      Logger.log('[err]   no items found in the original ones collection!');
    }
  });

  originalTestCollections.forEach((originalCollection) => {
    if (originalCollection?.items.count() > 0) {
      DataUtils.processItems(
        sortedTestProductsAndServicesCollection,
        originalCollection,
      );
    } else {
      Logger.log('[err]   no items found in the original test collection!');
    }
  });

  originalProdCollections.forEach((originalCollection) => {
    if (originalCollection?.items.count() > 0) {
      DataUtils.processItems(
        sortedProdProductsAndServicesCollection,
        originalCollection,
      );
    } else {
      Logger.log('[err]   no items found in the original production collection!');
    }
  });

  DataUtils.removeRedundantRootFolders(sortedOnesCollection, { onesCollection: true });
  DataUtils.removeRedundantRootFolders(sortedTestProductsAndServicesCollection);
  DataUtils.removeRedundantRootFolders(sortedProdProductsAndServicesCollection);

  DataUtils.groupItems(
    groupedOnesCollection,
    sortedOnesCollection,
  );

  DataUtils.groupItems(
    groupedTestProductsAndServicesCollection,
    sortedTestProductsAndServicesCollection,
  );

  DataUtils.groupItems(
    groupedProdProductsAndServicesCollection,
    sortedProdProductsAndServicesCollection,
  );

  DataUtils.orderItemsAlphabetically(groupedOnesCollection);
  DataUtils.orderItemsAlphabetically(groupedTestProductsAndServicesCollection);
  DataUtils.orderItemsAlphabetically(groupedProdProductsAndServicesCollection);

  DataUtils.splitCollection(
    testProductsCollection,
    testServicesCollection,
    groupedTestProductsAndServicesCollection,
  );

  DataUtils.splitCollection(
    prodProductsCollection,
    prodServicesCollection,
    groupedProdProductsAndServicesCollection,
  );

  DataUtils.setUniqueEnvVariablesFromAllCollections(
    testProductsCollection,
    testServicesCollection,
    originalTestCollections,
    { isTestCollections: true },
  );

  DataUtils.setUniqueEnvVariablesFromAllCollections(
    prodProductsCollection,
    prodServicesCollection,
    originalProdCollections,
  );

  DataUtils.moveAuthMethodToRoot(testProductsCollection, testServicesCollection);
  DataUtils.moveAuthMethodToRoot(prodProductsCollection, prodServicesCollection);

  DataUtils.saveToJSON(groupedOnesCollection);
  DataUtils.saveToJSON(testProductsCollection);
  DataUtils.saveToJSON(testServicesCollection);
  DataUtils.saveToJSON(prodProductsCollection);
  DataUtils.saveToJSON(prodServicesCollection);
  ImageUtils.generateDateImage();
};

updateCollections();
