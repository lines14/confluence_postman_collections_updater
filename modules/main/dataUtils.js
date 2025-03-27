/* eslint no-param-reassign: ["error", { "props": false }] */
import fs from 'fs';
import _ from 'lodash';
import postmanCollection from 'postman-collection';
import Logger from './logger.js';
import {
  HTTPMethods, Protocols, HostPlaceholders, Services,
} from './enums.js';
import JSONLoader from './JSONLoader.js';

const {
  ItemGroup, Item, PropertyList, QueryParam, FormParam, Response, Variable,
} = postmanCollection;

class DataUtils {
  static saveToJSON(collection) {
    const replacer = (key, value) => (typeof value === 'undefined' ? null : value);
    fs.writeFileSync(`./output_collections/${collection.name}.json`, JSON.stringify(collection, replacer, 4));
  }

  static hasUrlencodedPropertiesArr(item) {
    return item.request.body && item.request.body.urlencoded;
  }

  static hasFormdataPropertiesArr(item) {
    return item.request.body && item.request.body.formdata;
  }

  static hasExistingQueryProperties(item) {
    return item.request.method === HTTPMethods.GET
    && item.request.url.query
    && item.request.url.query.count();
  }

  static getOrCreateFolder(sortedCollection, name) {
    let folder = sortedCollection.items.members.find((f) => f.name === name);
    if (!folder) {
      folder = new ItemGroup({ name });
      sortedCollection.items.add(folder);
    }

    return folder;
  }

  static getListOfUniqueProperties(...propertyList) {
    const uniqueProperties = propertyList.filter((propertyPair, index, arr) => index === arr
      .findIndex((foundPropertyPair) => foundPropertyPair.key === propertyPair.key
      && foundPropertyPair.value === propertyPair.value));

    const itemType = uniqueProperties[0] instanceof QueryParam ? QueryParam : FormParam;
    return new PropertyList(itemType, null, uniqueProperties);
  }

  static getListOfUniqueResponseTemplates(...responseTemplateList) {
    responseTemplateList.forEach((responseTemplate) => { delete responseTemplate.id; });
    const uniqueResponses = _.uniqWith(responseTemplateList, _.isEqual);
    return new PropertyList(Response, null, uniqueResponses);
  }

  static setUniquePropertiesFromSameItem(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (_.isEqual(existingItem.request.url.path, item.request.url.path)
      && existingItem.name.toUpperCase() === item.name.toUpperCase()
      && existingItem.request.method === item.request.method) {
        if (item.request.method === HTTPMethods.POST
        && this.hasUrlencodedPropertiesArr(item)
        && item.request.body.urlencoded.count()) {
          if (existingItem.request.method === HTTPMethods.POST) {
            if (this.hasUrlencodedPropertiesArr(existingItem)) {
              existingItem.request.body.urlencoded = this.getListOfUniqueProperties(
                ...existingItem.request.body.urlencoded.all(),
                ...item.request.body.urlencoded.all(),
              );
            } else if (this.hasFormdataPropertiesArr(existingItem)) {
              existingItem.request.body.formdata = this.getListOfUniqueProperties(
                ...existingItem.request.body.formdata.all(),
                ...item.request.body.urlencoded.all(),
              );
            }
          }
        } else if (item.request.method === HTTPMethods.POST
        && this.hasFormdataPropertiesArr(item)
        && item.request.body.formdata.count()) {
          if (existingItem.request.method === HTTPMethods.POST) {
            if (this.hasFormdataPropertiesArr(existingItem)) {
              existingItem.request.body.formdata = this.getListOfUniqueProperties(
                ...existingItem.request.body.formdata.all(),
                ...item.request.body.formdata.all(),
              );
            } else if (this.hasUrlencodedPropertiesArr(existingItem)) {
              existingItem.request.body.urlencoded = this.getListOfUniqueProperties(
                ...existingItem.request.body.urlencoded.all(),
                ...item.request.body.formdata.all(),
              );
            }
          }
        } else if (this.hasExistingQueryProperties(item)) {
          if (existingItem.request.method === HTTPMethods.GET) {
            existingItem.request.url.query = this.getListOfUniqueProperties(
              ...existingItem.request.url.query.all(),
              ...item.request.url.query.all(),
            );
          }
        }
      }
    });
  }

  static setUniqueResponseTemplatesFromSameItem(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (_.isEqual(existingItem.request.url.path, item.request.url.path)
      && existingItem.name.toUpperCase() === item.name.toUpperCase()
      && existingItem.request.method === item.request.method) {
        existingItem.responses = this.getListOfUniqueResponseTemplates(
          ...existingItem.responses.all(),
          ...item.responses.all(),
        );
      }
    });
  }

  static disableProperties(item) {
    if (item.request.method === HTTPMethods.POST
    && this.hasUrlencodedPropertiesArr(item)
    && item.request.body.urlencoded.count()) {
      item.request.body.urlencoded.all().forEach((property) => { property.disabled = true; });
    } else if (item.request.method === HTTPMethods.POST
    && this.hasFormdataPropertiesArr(item)
    && item.request.body.formdata.count()) {
      item.request.body.formdata.all().forEach((property) => { property.disabled = true; });
    } else if (this.hasExistingQueryProperties(item)) {
      item.request.url.query.all().forEach((property) => { property.disabled = true; });
    }
  }

  static startsWithNumberOrLocalhost(str) {
    return /^\d/.test(str) || str === 'localhost';
  }

  static notEmptyOrHasNumber(str) {
    return str.toLowerCase().startsWith('v') || (str !== '' && !/\d/.test(str));
  }

  static trimPlaceholder(str) {
    return str.replace(/{{|}}/g, '').trim().split('_', 1)[0].toLowerCase();
  }

  static hostAndPathModify(item, host, path, options = {}) {
    const trimmedHost = options.hostOverride ?? this.trimPlaceholder(host[0]);
    item.request.url.host = HostPlaceholders.GATEWAY;

    if (path[0] !== 'api' && path[0] !== trimmedHost) {
      path.unshift(trimmedHost);
      path.unshift('api');
    } else if (path[0] === trimmedHost) {
      if (path[1] === 'api') {
        path.splice(1, 1);
      }

      path.unshift('api');
    } else if (path[0] === 'api' && path[1] !== trimmedHost) {
      path.splice(1, 0, trimmedHost);
    }
  }

  static setPathBeginning(path) {
    if (path[0] !== 'api') {
      if (path[1] === 'api') {
        path.splice(1, 1);
      }

      path.unshift('api');
    }
  }

  static fixHostAndPath(item, host, port, path) {
    if (host[0].includes('SIGNER')
    || host[0].includes('NOTIFICATION')
    || host[0].includes('MEDPOOL')) {
      this.hostAndPathModify(item, host, path);
    } else if (host[0].includes('DICT')
    || path.some((substr) => substr.includes('factors'))) {
      this.hostAndPathModify(item, host, path, { hostOverride: Services.DICTIONARY });
    } else if (port === '8001') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.AUTH });
    } else if (port === '8013') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.AMANAT24 });
    } else if (port === '8021') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.SHORT_LINK });
    } else if (port === '8022') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.SIGNER });
    } else if (item.name.includes('create')
      && (port === '2023' || port === '2024' || port === '8034')) {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.EUROPROTOCOL });
    } else if (port === '8024') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.EDU });
    } else if (port === '8030') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.DOCS });
    } else if (port === '8035') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.CLAIM });
    } else if (port === '8036') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: Services.SIGNERSCRIPT });
    } else if (path[1] === 'acquiring') {
      path[1] = 'kaspi';
    } else if (host[0].includes('GOASYNC')) {
      this.hostAndPathModify(item, host, path, { hostOverride: Services.ASYNC });
    } else if (host[0] === '{{API_URL}}') {
      this.setPathBeginning(path);
      item.request.url.protocol = Protocols.HTTPS;
      item.request.url.host = HostPlaceholders.EDU;
    } else if (host[0].includes('FILEREPO')) {
      this.setPathBeginning(path);
      item.request.url.protocol = Protocols.HTTP;
      item.request.url.host = HostPlaceholders.FILEREPO;
    } else if (host.some((substr) => substr.toUpperCase().includes('GATEWAY'))
    || host[0] === '{{URL}}'
    || host[0] === '{{HOST}}'
    || host[0].includes('AUTH')
    || port === '8000') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.setPathBeginning(path);
      item.request.url.host = HostPlaceholders.GATEWAY;
    }

    return item.request.url.host;
  }

  static getFolderName(host, port, path) {
    let folderName;
    if (path.length > 2
    && (path[0] === 'api' || path[0] === 'clients')
    && path[1] !== 'user'
    && path[1] !== 'documents'
    && path[1] !== 'temp-users') {
      if (!host[0].toUpperCase().includes('GATEWAY')) {
        if (this.startsWithNumberOrLocalhost(host[0])) {
          folderName = `PORT_${port}`;
        } else if (host.length >= 3 && host[1] !== 'amanat' && host[2] !== 'a-i') {
          folderName = `${host[1].toUpperCase()}_${host[2].toUpperCase()}`;
        } else {
          folderName = host[0].toUpperCase();
        }
      } else {
        folderName = path[1].toUpperCase();
      }
    } else if (host.length > 1
      && (host[1] === 'amanat24-dev' || host[1] === 'medpul')) {
      folderName = host[1].replace('-', '_').toUpperCase();
    } else if (host.length > 1
      && host[1] === 'amanat') {
      folderName = host[0].toUpperCase();
    } else {
      folderName = 'AUTH';
    }

    return folderName;
  }

  static processItems(sortedCollection, originalCollection) {
    originalCollection.items.each((item) => {
      if (item instanceof Item) {
        const { host, path, port } = item.request.url;
        if (path && path.length > 1) {
          Logger.log(`[inf]   processing "${item.name}" request path: /${path.join('/')}`);
          this.disableProperties(item);
          const updatedHost = this.fixHostAndPath(item, host, port, path);
          const folderName = this.getFolderName(updatedHost, port, path);
          const folder = this.getOrCreateFolder(sortedCollection, folderName);

          if (folder.items.all()
            .some((existingItem) => _.isEqual(existingItem.request.url.path, item.request.url.path)
            && existingItem.name.toUpperCase() === item.name.toUpperCase()
            && existingItem.request.method === item.request.method)) {
            this.setUniqueResponseTemplatesFromSameItem(folder, item);
            this.setUniquePropertiesFromSameItem(folder, item);
          } else {
            folder.items.add(item);
          }
        }
      } else if (item.items) {
        Logger.log(`[inf]   processing folder: ${item.name}`);
        this.processItems(sortedCollection, item);
      }
    });
  }

  static groupItems(groupedCollection, sortedCollection) {
    sortedCollection.items.each((folder) => {
      if (folder instanceof ItemGroup) {
        Logger.log(`[inf]   processing folder: ${folder.name}`);
        const parentFolder = this.getOrCreateFolder(groupedCollection, folder.name);

        folder.items.each((item) => {
          if (item instanceof Item
          && item.request
          && item.request.url
          && item.request.url.path) {
            const { path } = item.request.url;
            if (path.length > 3
            && this.notEmptyOrHasNumber(path[3])
            && this.notEmptyOrHasNumber(path[2])) {
              const subFolderName = path[2].toUpperCase();
              const subFolder = this.getOrCreateFolder(parentFolder, subFolderName);
              const subSubFolderName = path[3].toUpperCase();
              const subSubFolder = this.getOrCreateFolder(subFolder, subSubFolderName);
              Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}/${subSubFolderName}`);
              subSubFolder.items.add(item);
            } else if (path.length > 2 && this.notEmptyOrHasNumber(path[2])) {
              const subFolderName = path[2].toUpperCase();
              const subFolder = this.getOrCreateFolder(parentFolder, subFolderName);
              Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}`);
              subFolder.items.add(item);
            } else {
              Logger.log(`[inf]   keeping "${item.name}" inside /${folder.name}`);
              parentFolder.items.add(item);
            }
          }
        });
      }
    });
  }

  static splitCollection(productsCollection, servicesCollection, groupedCollection) {
    groupedCollection.items.each((folder) => {
      if (folder instanceof ItemGroup) {
        if (JSONLoader.config.servicesFolders
          .map((el) => el.toUpperCase()).includes(folder.name)) {
          servicesCollection.items.add(folder);
        } else {
          productsCollection.items.add(folder);
        }
      }
    });
  }

  static setUniqueEnvVariablesFromAllCollections(
    productsCollection,
    servicesCollection,
    originalCollections,
  ) {
    const allVariables = originalCollections
      .filter((collection) => collection.variables.all().length > 0)
      .flatMap((collection) => collection.variables.all());

    let uniqueVariables = allVariables.filter((variable, index, arr) => index === arr
      .findIndex((foundVariable) => foundVariable.key === variable.key
      && foundVariable.value === variable.value));

    uniqueVariables.forEach((variable) => { variable.disabled = true; });
    uniqueVariables = new PropertyList(Variable, null, uniqueVariables);
    productsCollection.variables = uniqueVariables;
    servicesCollection.variables = uniqueVariables;
  }

  static moveAuthMethodToRoot(productsCollection, servicesCollection) {
    const itemName = 'Auth';
    const foundFolder = servicesCollection.items
      .find((folder) => folder.name === itemName.toUpperCase());
    if (foundFolder) {
      const foundItemIndex = foundFolder.items.members.findIndex((item) => item.name === itemName);
      if (foundItemIndex !== -1) {
        const [foundItem] = foundFolder.items.members.splice(foundItemIndex, 1);
        servicesCollection.items.members.unshift(foundItem);
        productsCollection.items.members.unshift(foundItem);
        Logger.log(`[inf]   moving item "${itemName}" from folder "${foundFolder.name}" to root`);
      }
    }
  }
}

export default DataUtils;
