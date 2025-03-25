/* eslint no-param-reassign: ["error", { "props": false }] */
import fs from 'fs';
import _ from 'lodash';
import postmanCollection from 'postman-collection';
import Logger from './logger.js';

const {
  ItemGroup, Item, PropertyList, QueryParam, FormParam,
} = postmanCollection;

const HTTPMethods = Object.freeze({
  GET: 'GET',
  POST: 'POST',
});

const Protocols = Object.freeze({
  HTTP: 'http',
  HTTPS: 'https',
});

const HostPlaceholders = Object.freeze({
  GATEWAY: ['{{GATEWAY_URL}}'],
  EDU: ['edu-dev', 'amanat', 'systems'],
  FILEREPO: ['filerepo', 'dev', 'a-i', 'kz'],
});

class DataUtils {
  static saveToJSON(collection) {
    const replacer = (key, value) => (typeof value === 'undefined' ? null : value);
    fs.writeFileSync(`./output/${collection.name}.json`, JSON.stringify(collection, replacer, 4));
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

  static getListOFUniqueProperties(...propertyList) {
    const uniqueProperties = [...propertyList].filter((item, index, arr) => index === arr
      .findIndex((foundItem) => foundItem.key === item.key && foundItem.value === item.value));

    const itemType = uniqueProperties[0] instanceof QueryParam ? QueryParam : FormParam;
    return new PropertyList(itemType, null, uniqueProperties);
  }

  static setUniquePropertiesFromSameItem(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (_.isEqual(existingItem.request.url.path, item.request.url.path)
      && existingItem.name.toUpperCase() === item.name.toUpperCase()) {
        if (item.request.method === HTTPMethods.POST
        && this.hasUrlencodedPropertiesArr(item)
        && item.request.body.urlencoded.count()) {
          if (existingItem.request.method === HTTPMethods.POST) {
            if (this.hasUrlencodedPropertiesArr(existingItem)) {
              existingItem.request.body.urlencoded = this.getListOFUniqueProperties(
                ...existingItem.request.body.urlencoded.all(),
                ...item.request.body.urlencoded.all(),
              );
            } else {
              existingItem.request.body.formdata = this.getListOFUniqueProperties(
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
              existingItem.request.body.formdata = this.getListOFUniqueProperties(
                ...existingItem.request.body.formdata.all(),
                ...item.request.body.formdata.all(),
              );
            } else {
              existingItem.request.body.urlencoded = this.getListOFUniqueProperties(
                ...existingItem.request.body.urlencoded.all(),
                ...item.request.body.formdata.all(),
              );
            }
          }
        } else if (this.hasExistingQueryProperties(item)) {
          if (existingItem.request.method === HTTPMethods.GET) {
            existingItem.request.url.query = this.getListOFUniqueProperties(
              ...existingItem.request.url.query.all(),
              ...item.request.url.query.all(),
            );
          }
        }
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
      this.hostAndPathModify(item, host, path, { hostOverride: 'dictionary' });
    } else if (port === '8001') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: 'auth' });
    } else if (port === '8013') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: 'amanat24' });
    } else if (port === '8022') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: 'signer' });
    } else if (item.name.includes('create')
      && (port === '2023' || port === '2024' || port === '8034')) {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: 'europrotocol' });
    } else if (port === '8024') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: 'edu' });
    } else if (port === '8030') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: 'docs' });
    } else if (port === '8035') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: 'claim' });
    } else if (path[1] === 'acquiring') {
      path[1] = 'kaspi';
    } else if (host[0].includes('GOASYNC')) {
      this.hostAndPathModify(item, host, path, { hostOverride: 'async' });
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
    } else if (host.length > 1 && host[1] === 'amanat24-dev') {
      folderName = host[1].replace('-', '_').toUpperCase();
    } else {
      folderName = 'AUTH';
    }

    return folderName;
  }

  static processItems(sortedCollection, originalCollection) {
    originalCollection.items.each((item) => {
      if (item instanceof Item) {
        const { host, path, port } = item.request.url;
        Logger.log(`[inf]   processing "${item.name}" request path: /${path.join('/')}`);
        this.disableProperties(item);

        if (path && path.length > 1) {
          const updatedHost = this.fixHostAndPath(item, host, port, path);
          const folderName = this.getFolderName(updatedHost, port, path);
          const folder = this.getOrCreateFolder(sortedCollection, folderName);

          if (folder.items.all()
            .some((existingItem) => _.isEqual(existingItem.request.url.path, item.request.url.path)
            && existingItem.name.toUpperCase() === item.name.toUpperCase())) {
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
}

export default DataUtils;
