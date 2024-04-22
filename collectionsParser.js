const fs = require('fs');
const path = require('path');
const Collection = require('postman-collection').Collection;

const myCollection = new Collection(JSON.parse(fs.readFileSync('TEST PRODUCTS.postman_collection.json').toString()));
const result = myCollection.toJSON()
.item.filter((item) => item.name === 'MST TEST').pop()
.item.filter((item) => item.name === 'set-policy').pop()
.request.url

console.log(path.join(...[...result.host, ...result.path]));