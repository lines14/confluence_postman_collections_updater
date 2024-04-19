import APIConfigData from '/home/lines14/projects/confluence_postman_collections_updater/modules/resources/data/APIConfigData.json' assert { type: 'json' };
import APIEndpoints from '/home/lines14/projects/confluence_postman_collections_updater/modules/resources/data/APIEndpoints.json' assert { type: 'json' };
import configData from '/home/lines14/projects/confluence_postman_collections_updater/modules/resources/data/configData.json' assert { type: 'json' };
import postmanCollection from '/home/lines14/projects/confluence_postman_collections_updater/modules/resources/downloads/postmanCollection.json' assert { type: 'json' };
import postmanCollectionReserved from '/home/lines14/projects/confluence_postman_collections_updater/modules/resources/downloads/postmanCollectionReserved.json' assert { type: 'json' };

class JSONLoader {
	static get APIConfigData() {
		return JSON.parse(JSON.stringify(APIConfigData));
	}

	static get APIEndpoints() {
		return JSON.parse(JSON.stringify(APIEndpoints));
	}

	static get configData() {
		return JSON.parse(JSON.stringify(configData));
	}

	static get postmanCollection() {
		return JSON.parse(JSON.stringify(postmanCollection));
	}

	static get postmanCollectionReserved() {
		return JSON.parse(JSON.stringify(postmanCollectionReserved));
	}

}

export default JSONLoader;