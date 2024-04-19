import config from '../config.json' assert { type: 'json' };
import TEST_PRODUCTS_postman_collection from '../../postmanCollections/TEST_PRODUCTS_postman_collection.json' assert { type: 'json' };
import postmanCollectionReserved from '../../postmanCollections/postmanCollectionReserved.json' assert { type: 'json' };

class JSONLoader {
	static get config() {
		return JSON.parse(JSON.stringify(config));
	}

	static get TEST_PRODUCTS_postman_collection() {
		return JSON.parse(JSON.stringify(TEST_PRODUCTS_postman_collection));
	}

	static get postmanCollectionReserved() {
		return JSON.parse(JSON.stringify(postmanCollectionReserved));
	}

	static get collectionsNames() {
		return ['config', 'TEST_PRODUCTS_postman_collection', 'postmanCollectionReserved'];
	}

}

export default JSONLoader;