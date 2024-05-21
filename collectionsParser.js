import postmanCollection from 'postman-collection';
import DataUtils from './modules/main/dataUtils.js';
import JSONLoader from './modules/main/JSONLoader.js';

const { Collection, ItemGroup, Item, Request, Url } = postmanCollection;

const parsedCollections = JSONLoader.collectionsNames
  .map((collectionName) => new Collection(JSONLoader[collectionName.replace('.json', '')]));
console.log(collections.pop().items.pop())

// const newCollection = new Collection();
// newCollection.name = 'TEST_PRODUCTS';

// const newFolder = {};
// newFolder.name = 'ESTATE_TEST';
// newFolder.item = [];

// const newRequest = {};
// newRequest.name = 'get-premium';
// newRequest.request

// newFolder.item.push(newRequest);
// newCollection.items.members.push(newFolder);
// DataUtils.saveToJSON(newCollection);

// const result = myCollection.toJSON().item.filter((item) => item.name === 'MST TEST').pop().item
//   .filter((item) => item.name === 'set-policy').pop().request.url;
// console.log(result);