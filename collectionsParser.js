import postmanCollection from 'postman-collection';
import DataUtils from './modules/main/dataUtils.js';
import JSONLoader from './modules/main/JSONLoader.js';

const { Collection, ItemGroup, Item, Request, Url } = postmanCollection;

const parsedCollections = JSONLoader.collectionsNames
.map((collectionName) => new Collection(JSONLoader[collectionName.replace('.json', '')]));
const originalCollection = parsedCollections.pop();
const sortedCollection = new Collection({
  info: {
    name: "TEST_AHAHA",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  }
});

const getOrCreateFolder = (folders, name) => {
  let folder = folders.find(f => f.name === name);
  if (!folder) {
      folder = new ItemGroup({ name });
      sortedCollection.items.add(folder);
  }
  return folder;
};

const processItems = (items) => {
  items.each(item => {
      if (item instanceof Item) {
          const path = item.request.url.path;
          console.log('Processing item:', item.name, 'Path:', path);
          if (path && path.length > 1) {
              const folderName = path[1].toUpperCase();
              const folder = getOrCreateFolder(sortedCollection.items.members, folderName);
              folder.items.add(item);
          }
      } else if (item.items) {
          // Handle folders within the original collection
          console.log('Processing folder:', item.name);
          processItems(item.items);
      }
  });
};

if (originalCollection.items && originalCollection.items.count() > 0) {
  processItems(originalCollection.items);
} else {
  console.error('No items found in the original collection');
}

DataUtils.saveToJSON(sortedCollection);

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
// const result = myCollection.toJSON().item.filter((item) => item.name === 'MST TEST').pop().item
//   .filter((item) => item.name === 'set-policy').pop().request.url;
// console.log(result);