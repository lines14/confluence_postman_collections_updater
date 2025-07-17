/* eslint no-param-reassign: ["off"] */
import fs from 'fs';
import _ from 'lodash';
import postmanCollection from 'postman-collection';
import Logger from '../log/logger.js';
import {
  HTTPMethods,
  protocols,
  placeholders,
  hostPlaceholders,
  services,
  servicesFolders,
  authIgnoredFolders,
  patterns,
} from './enums.js';

const {
  ItemGroup,
  Item,
  PropertyList,
  QueryParam,
  FormParam,
  Response,
  Variable,
  Event,
  RequestAuth,
  VariableList,
} = postmanCollection;

class DataUtils {
  static saveToJSON(collection) {
    const replacer = (key, value) => (typeof value === 'undefined' ? null : value);
    fs.writeFileSync(`./output_collections/${collection.name}.json`, JSON.stringify(collection, replacer, 4));
  }

  static getFile(filePath) {
    return fs.readFileSync(filePath);
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
    const uniqueProperties = propertyList.filter((propertyPair, index, arr) => {
      const foundIndex = arr
        .findIndex((foundPropertyPair) => foundPropertyPair.key === propertyPair.key
        && foundPropertyPair.value === propertyPair.value);
      if (index === foundIndex) return true;
      const firstMatch = arr[foundIndex];
      if (propertyPair.description) {
        firstMatch.description = firstMatch.description
          ? `${firstMatch.description};${propertyPair.description}`
          : propertyPair.description;
      }

      return false;
    });

    const itemType = uniqueProperties[0] instanceof QueryParam ? QueryParam : FormParam;
    return new PropertyList(itemType, null, uniqueProperties);
  }

  static getListOfUniqueTemplates(options, templateList) {
    const { namesCompare } = options;
    templateList.forEach((template) => { delete template.id; });
    if (!namesCompare) {
      templateList.forEach((template) => { delete template.name; });
    }

    const uniqueTemplates = _.uniqWith(templateList, _.isEqual);
    return new PropertyList(Response, null, uniqueTemplates);
  }

  static getNumberFromLastNumericCharacter(str) {
    const match = str.match(/(\d+)$/);
    if (match) {
      return parseInt(match[0], 10);
    }
    throw new Error(Logger.log('[err]   template\'s name not has numeric character at the end!'));
  }

  static sortStringsWithNumbersASC(stringsArr) {
    return stringsArr.sort((a, b) => {
      const numA = this.getNumberFromLastNumericCharacter(a);
      const numB = this.getNumberFromLastNumericCharacter(b);
      return numA - numB;
    });
  }

  static sortNamesAlphabetically(elementsArr) {
    elementsArr.members.sort((a, b) => a.name.localeCompare(b.name));
  }

  static sortStringsAlphabetically(stringsArr) {
    stringsArr.sort((a, b) => a.localeCompare(b));
  }

  static sortKeysAlphabetically(elementsArr) {
    elementsArr.sort((a, b) => {
      const keyA = a.key || '';
      const keyB = b.key || '';
      return keyA.localeCompare(keyB);
    });
  }

  static getNewTemplateName(itemName, templateNames) {
    const regex = new RegExp(`${itemName}${patterns.TEMPLATE_NAME}-\\d+$`);
    const filteredTemplateNames = templateNames.filter((name) => regex.test(name));
    if (filteredTemplateNames && filteredTemplateNames.length > 0) {
      const sortedTemplateNames = this.sortStringsWithNumbersASC(filteredTemplateNames);
      const lastNum = this.getNumberFromLastNumericCharacter(sortedTemplateNames.at(-1));
      return `${itemName}${patterns.TEMPLATE_NAME}-${lastNum + 1}`;
    }
    return `${itemName}${patterns.TEMPLATE_NAME}-1`;
  }

  static addUniqueBodyToTemplateList(existingItem, item) {
    Logger.log(`[inf]   adding new template for ${existingItem.name} request body`);
    const templateList = existingItem.responses.all();
    const templateNames = templateList.map((template) => template.name);
    const newTemplate = new Response();
    newTemplate.name = this.getNewTemplateName(existingItem.name, templateNames);
    newTemplate.originalRequest = item.request;
    templateList.push(newTemplate);
    return new PropertyList(Response, null, templateList);
  }

  static getListOfUniqueEvents(...eventsList) {
    eventsList.forEach((event) => { delete event.script.id; event.script.packages = {}; });
    const uniqueEvents = _.uniqWith(eventsList, _.isEqual);
    return new PropertyList(Event, null, uniqueEvents);
  }

  static isExistingAndNewItemEqual(existingItem, newItem) {
    return _.isEqual(existingItem.request.url.path, newItem.request.url.path)
    && existingItem.request.method === newItem.request.method
    && (existingItem.name.toUpperCase() === newItem.name.toUpperCase()
    || ((existingItem.name.toLowerCase() === services.AUTH
    && newItem.name.toLowerCase() === placeholders.LOGIN)
    || (newItem.name.toLowerCase() === services.AUTH
    && existingItem.name.toLowerCase() === placeholders.LOGIN)));
  }

  static hasEmptyBody(item) {
    if (item.request.method !== HTTPMethods.GET) {
      return !item.request.body && !item.request.body?.raw;
    }
    return true;
  }

  static hasEqualBodies(existingItem, newItem) {
    if (newItem.request.method !== HTTPMethods.GET
    && newItem.request.body
    && !this.hasEmptyBody(newItem)) {
      return _.isEqual(existingItem.request.body, newItem.request.body);
    }
    return false;
  }

  static setUniquePropertiesFromSameItem(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (this.isExistingAndNewItemEqual(existingItem, item)) {
        if (item.request.method !== HTTPMethods.GET
        && this.hasUrlencodedPropertiesArr(item)
        && item.request.body.urlencoded.count()) {
          if (existingItem.request.method !== HTTPMethods.GET) {
            if (this.hasUrlencodedPropertiesArr(existingItem)) {
              existingItem.request.body.urlencoded = this.getListOfUniqueProperties(
                ...existingItem.request.body.urlencoded.all(),
                ...item.request.body.urlencoded.all(),
              );
              this.sortKeysAlphabetically(existingItem.request.body.urlencoded.members);
            } else if (this.hasFormdataPropertiesArr(existingItem)) {
              existingItem.request.body.formdata = this.getListOfUniqueProperties(
                ...existingItem.request.body.formdata.all(),
                ...item.request.body.urlencoded.all(),
              );
              this.sortKeysAlphabetically(existingItem.request.body.formdata.members);
            }
          }
        } else if (item.request.method !== HTTPMethods.GET
        && this.hasFormdataPropertiesArr(item)
        && item.request.body.formdata.count()) {
          if (existingItem.request.method !== HTTPMethods.GET) {
            if (this.hasFormdataPropertiesArr(existingItem)) {
              existingItem.request.body.formdata = this.getListOfUniqueProperties(
                ...existingItem.request.body.formdata.all(),
                ...item.request.body.formdata.all(),
              );
              this.sortKeysAlphabetically(existingItem.request.body.formdata.members);
            } else if (this.hasUrlencodedPropertiesArr(existingItem)) {
              existingItem.request.body.urlencoded = this.getListOfUniqueProperties(
                ...existingItem.request.body.urlencoded.all(),
                ...item.request.body.formdata.all(),
              );
              this.sortKeysAlphabetically(existingItem.request.body.urlencoded.members);
            }
          }
        } else if (this.hasExistingQueryProperties(item)) {
          if (existingItem.request.method === HTTPMethods.GET) {
            existingItem.request.url.query = this.getListOfUniqueProperties(
              ...existingItem.request.url.query.all(),
              ...item.request.url.query.all(),
            );
            this.sortKeysAlphabetically(existingItem.request.url.query.members);
          }
        }
      }
    });
  }

  static setUniqueEventsFromSameItem(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (this.isExistingAndNewItemEqual(existingItem, item)) {
        existingItem.events = this.getListOfUniqueEvents(
          ...existingItem.events.all(),
          ...item.events.all(),
        );
      }
    });
  }

  static setUniqueTemplatesFromSameItem(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (this.isExistingAndNewItemEqual(existingItem, item)) {
        existingItem.responses = this.getListOfUniqueTemplates(
          { namesCompare: true },
          [...existingItem.responses.all(), ...item.responses.all()],
        );
        this.sortNamesAlphabetically(existingItem.responses);
      }
    });
  }

  static setUniqueRequestBodiesFromSameItemAsTemplates(folder, item) {
    folder.items.all().forEach((existingItem) => {
      if (this.isExistingAndNewItemEqual(existingItem, item)
      && existingItem.request.body?.mode === 'raw'
      && !this.hasEmptyBody(existingItem)
      && !this.hasEqualBodies(existingItem, item)) {
        existingItem.responses = this.addUniqueBodyToTemplateList(
          existingItem,
          item,
        );
      }
    });
  }

  static disableProperties(item) {
    if (item.request.method !== HTTPMethods.GET
    && this.hasUrlencodedPropertiesArr(item)
    && item.request.body.urlencoded.count()) {
      item.request.body.urlencoded.all().forEach((property) => { property.disabled = true; });
    } else if (item.request.method !== HTTPMethods.GET
    && this.hasFormdataPropertiesArr(item)
    && item.request.body.formdata.count()) {
      item.request.body.formdata.all().forEach((property) => { property.disabled = true; });
    } else if (this.hasExistingQueryProperties(item)) {
      item.request.url.query.all().forEach((property) => { property.disabled = true; });
    }
  }

  static setFolderNamesToAuthPropertyDescriptions(item, folderName) {
    if (item.request.url.path[1] === placeholders.LOGIN
      || (item.request.url.path[1] === services.AUTH
        && item.request.url.path[2] === placeholders.LOGIN)) {
      if (item.request.method !== HTTPMethods.GET
      && this.hasUrlencodedPropertiesArr(item)
      && item.request.body.urlencoded.count()) {
        item.request.body.urlencoded.all().forEach((property) => {
          property.description = property.description
            ? `(${property.description});${folderName}`
            : folderName;
        });
      } else if (item.request.method !== HTTPMethods.GET
      && this.hasFormdataPropertiesArr(item)
      && item.request.body.formdata.count()) {
        item.request.body.formdata.all().forEach((property) => {
          property.description = property.description
            ? `(${property.description});${folderName}`
            : folderName;
        });
      } else if (this.hasExistingQueryProperties(item)) {
        item.request.url.query.all().forEach((property) => {
          property.description = property.description
            ? `(${property.description});${folderName}`
            : folderName;
        });
      }
    }
  }

  static addBearerTokenAuthIfEmpty(item) {
    if (!item.request.auth
      && item.request.url.path
      && item.request.url.path.every((substr) => !substr
        .includes(placeholders.LOGIN))) {
      Logger.log(`[inf]   adding bearer token placeholder for ${item.name}`);
      const authPlaceholderObj = new Variable({
        key: placeholders.TOKEN.toLowerCase(),
        value: `{{${placeholders.TOKEN}}}`,
      });
      const bearerAuthList = new VariableList(null, [authPlaceholderObj]);
      const auth = new RequestAuth({
        type: 'bearer',
        bearer: bearerAuthList,
      });
      item.request.auth = auth;
    }
  }

  static startsWithNumberOrLocalhost(str) {
    return /^\d/.test(str) || str === hostPlaceholders.LOCALHOST[0];
  }

  static notEmptyOrNotHasNumber(str) {
    return str.toLowerCase().startsWith('v')
    || (str !== '' && !/\d/.test(str) && !str.toLowerCase().startsWith('med'));
  }

  static trimPlaceholder(str) {
    const match = str.match(/{{(.*?)}}/);
    if (match) {
      return match[1].trim().split('_', 1)[0].toLowerCase();
    }

    return '';
  }

  static hostAndPathModify(item, host, path, options = {}) {
    const trimmedHost = options.hostOverride ?? this.trimPlaceholder(host[0]);
    if (trimmedHost === services.AMANAT24) {
      item.request.url.host = hostPlaceholders.AMANAT24;
    } else {
      item.request.url.host = hostPlaceholders.GATEWAY;
    }

    if (path[0] !== 'api' && path[0] !== trimmedHost) {
      path.unshift(trimmedHost);
      path.unshift('api');
    } else if (path[0] === trimmedHost) {
      if (path[1] === 'api') {
        path.splice(1, 1);
      }

      path.unshift('api');
    } else if (path[0] === 'api' && path[1] !== trimmedHost) {
      if (trimmedHost !== services.AMANAT24) path.splice(1, 0, trimmedHost);
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
    if (host[0].includes(services.SIGNER.toUpperCase())
    || host[0].includes(services.NOTIFICATION.toUpperCase())
    || host[0].includes(services.MEDPOOL.toUpperCase())
    || host[0].includes(services.CLAIM.toUpperCase())
    || host[0].includes(services.AMANAT24.toUpperCase())
    || host[0].includes(services.AMANAT24)
    || host[0].includes(services.EDU.toUpperCase())
    || host[0].includes(services.KASKO.toUpperCase())) {
      this.hostAndPathModify(item, host, path);
    } else if (host[0].includes('DICT')
    || path.some((substr) => substr.includes('factors'))
    || (path.some((substr) => substr === 'products')
    && path.every((substr) => !substr.includes(services.KASKO)))) {
      this.hostAndPathModify(item, host, path, { hostOverride: services.DICTIONARY });
    } else if (port === '8001') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.AUTH });
    } else if (port === '8003') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.NOTIFICATION });
    } else if (port === '8004') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.DICTIONARY });
    } else if (path[1] === 'acquiring') {
      path[1] = services.KASPI;
    } else if (path[1] === 'quotes') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.KASKO });
    } else if (port === '8013') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.AMANAT24 });
    } else if (port === '8021') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.SHORT_LINK });
    } else if (port === '8022') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.SIGNER });
    } else if (item.name.includes('create')
      && (port === '2023' || port === '2024' || port === '8034')) {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.EUROPROTOCOL });
    } else if (port === '8024') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.EDU });
    } else if (port === '8026') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.DWH });
    } else if (port === '8030') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.DOCS });
    } else if (port === '8035') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.CLAIM });
    } else if (port === '8036') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.SIGNERSCRIPT });
    } else if (host[0] === hostPlaceholders.WEB_ENV[0]) {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.hostAndPathModify(item, host, path, { hostOverride: services.MEDPOOL });
    } else if (host[0].includes(`GO${services.ASYNC.toUpperCase()}`)) {
      this.hostAndPathModify(item, host, path, { hostOverride: services.ASYNC });
    } else if (host[0] === hostPlaceholders.API_URL[0]) {
      this.setPathBeginning(path);
      item.request.url.protocol = protocols.HTTPS;
      item.request.url.host = hostPlaceholders.EDU;
    } else if (host[0].includes(services.FILEREPO.toUpperCase())) {
      this.setPathBeginning(path);
      item.request.url.protocol = protocols.HTTP;
      item.request.url.host = hostPlaceholders.FILEREPO;
    } else if (host.some((substr) => substr.toUpperCase().includes(services.GATEWAY.toUpperCase()))
    || host[0] === hostPlaceholders.URL[0]
    || host[0] === hostPlaceholders.HOST[0]
    || host[0].includes(services.AUTH.toUpperCase())
    || port === '8000') {
      delete item.request.url.port;
      delete item.request.url.protocol;
      this.setPathBeginning(path);
      item.request.url.host = hostPlaceholders.GATEWAY;
    }

    while (path.includes('')) {
      path.splice(path.indexOf(''), 1);
    }

    return item.request.url.host;
  }

  static getFolderName(item, host, port, path) {
    let folderName;
    if (path.length > 2
    && (path[0] === 'api' || path[0] === 'clients')
    && path[1] !== 'user'
    && path[1] !== 'documents'
    && path[1] !== 'temp-users') {
      if (!host[0].toUpperCase().includes(services.GATEWAY.toUpperCase())) {
        if (this.startsWithNumberOrLocalhost(host[0])) {
          folderName = `PORT_${port}`;
        } else if (host.length >= 3
        && host[1] !== 'amanat'
        && host[1] !== 'a-i'
        && host[2] !== 'a-i') {
          folderName = `${host[1].toUpperCase()}_${host[2].toUpperCase()}`;
        } else if (host[0].toUpperCase().includes(services.AMANAT24.toUpperCase())) {
          folderName = this.trimPlaceholder(host[0]).toUpperCase();
        } else {
          folderName = host[0].toUpperCase();
        }
      } else {
        folderName = path[1].toUpperCase();
      }
    } else if (host.length > 1
      && (host[1] === services.AMANAT24
      || host[1] === `${services.AMANAT24}-dev`
      || host[1] === services.MEDPUL)) {
      folderName = host[1].replace('-', '_').toUpperCase();
    } else if (host.length > 1
      && host[1] === 'amanat') {
      folderName = host[0].toUpperCase();
    } else if (host[0].toUpperCase().includes(services.ELASTIC.toUpperCase())) {
      folderName = this.trimPlaceholder(host[0]).toUpperCase();
    } else if (host[0].toUpperCase().includes(services.AMANAT24.toUpperCase())) {
      folderName = this.trimPlaceholder(host[0]).toUpperCase();
    } else if (host[2] === 'mockbin') {
      if (item.name.includes('refund')) {
        folderName = services.KASPI.toUpperCase();
      } else {
        folderName = services.CARGO.toUpperCase();
      }
    } else if (host[0] === 'fcm') {
      folderName = services.NOTIFICATION.toUpperCase();
    } else if (host[1] === 'mkb') {
      folderName = services.ESBD.toUpperCase();
    } else {
      folderName = services.AUTH.toUpperCase();
    }

    return folderName;
  }

  static processItems(sortedCollection, originalCollection, oldFolderName) {
    originalCollection.items.each((item) => {
      if (item instanceof Item) {
        const { host, path, port } = item.request.url;
        if (path) {
          Logger.log(`[inf]   processing "${item.name}" request path: /${path.join('/')}`);
          this.disableProperties(item);
          if (path.some((substr) => substr.includes('hs'))
          || (host[0] === hostPlaceholders.URL[0] && path.length === 1)) {
            const folderName = '1C';

            const folder = this.getOrCreateFolder(sortedCollection, folderName);
            if (folder.items.all()
              .some((existingItem) => this.isExistingAndNewItemEqual(existingItem, item))) {
              this.setUniquePropertiesFromSameItem(folder, item);
              this.setUniqueEventsFromSameItem(folder, item);
              this.setUniqueRequestBodiesFromSameItemAsTemplates(folder, item);
              this.setUniqueTemplatesFromSameItem(folder, item);
            } else {
              folder.items.add(item);
            }
          } else {
            this.setFolderNamesToAuthPropertyDescriptions(item, oldFolderName);
            this.addBearerTokenAuthIfEmpty(item);
            const updatedHost = this.fixHostAndPath(item, host, port, path);
            const folderName = this.getFolderName(item, updatedHost, port, path);

            const folder = this.getOrCreateFolder(sortedCollection, folderName);
            if (folder.items.all()
              .some((existingItem) => this.isExistingAndNewItemEqual(existingItem, item))) {
              this.setUniquePropertiesFromSameItem(folder, item);
              this.setUniqueEventsFromSameItem(folder, item);
              this.setUniqueRequestBodiesFromSameItemAsTemplates(folder, item);
              this.setUniqueTemplatesFromSameItem(folder, item);
            } else {
              folder.items.add(item);
            }
          }
        }
      } else if (item.items) {
        Logger.log(`[inf]   processing folder: ${item.name}`);
        oldFolderName = item.name;
        this.processItems(sortedCollection, item, oldFolderName);
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
            const { host, path } = item.request.url;
            if (path.length > 3) {
              if (host.some((substr) => substr.toUpperCase()
                .includes(services.AMANAT24.toUpperCase()))
              && this.notEmptyOrNotHasNumber(path[1])) {
                const subFolderName = path[1].toUpperCase();
                const subFolder = this.getOrCreateFolder(parentFolder, subFolderName);
                if (this.notEmptyOrNotHasNumber(path[3])
                && this.notEmptyOrNotHasNumber(path[2])) {
                  const subSubFolderName = path[2].toUpperCase();
                  const subSubFolder = this.getOrCreateFolder(subFolder, subSubFolderName);
                  const subSubSubFolderName = path[3].toUpperCase();
                  const subSubSubFolder = this.getOrCreateFolder(subSubFolder, subSubSubFolderName);
                  Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}/${subSubFolderName}/${subSubSubFolderName}`);
                  subSubSubFolder.items.add(item);
                } else {
                  Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}`);
                  subFolder.items.add(item);
                }
              } else if (this.notEmptyOrNotHasNumber(path[3])
                && this.notEmptyOrNotHasNumber(path[2])) {
                const subFolderName = path[2].toUpperCase();
                const subFolder = this.getOrCreateFolder(parentFolder, subFolderName);
                const subSubFolderName = path[3].toUpperCase();
                const subSubFolder = this.getOrCreateFolder(subFolder, subSubFolderName);
                Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}/${subSubFolderName}`);
                subSubFolder.items.add(item);
              } else if (this.notEmptyOrNotHasNumber(path[2])) {
                const subFolderName = path[2].toUpperCase();
                const subFolder = this.getOrCreateFolder(parentFolder, subFolderName);
                Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}`);
                subFolder.items.add(item);
              } else {
                Logger.log(`[inf]   keeping "${item.name}" inside /${folder.name}`);
                parentFolder.items.add(item);
              }
            } else if (path.length > 2) {
              if (host.some((substr) => substr.toUpperCase()
                .includes(services.AMANAT24.toUpperCase()))
              && this.notEmptyOrNotHasNumber(path[1])) {
                const subFolderName = path[1].toUpperCase();
                const subFolder = this.getOrCreateFolder(parentFolder, subFolderName);
                if (this.notEmptyOrNotHasNumber(path[2])) {
                  const subSubFolderName = path[2].toUpperCase();
                  const subSubFolder = this.getOrCreateFolder(subFolder, subSubFolderName);
                  Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}/${subSubFolderName}`);
                  subSubFolder.items.add(item);
                } else {
                  Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}`);
                  subFolder.items.add(item);
                }
              } else if (this.notEmptyOrNotHasNumber(path[2])) {
                const subFolderName = path[2].toUpperCase();
                const subFolder = this.getOrCreateFolder(parentFolder, subFolderName);
                Logger.log(`[inf]   moving "${item.name}" into /${folder.name}/${subFolderName}`);
                subFolder.items.add(item);
              } else {
                Logger.log(`[inf]   keeping "${item.name}" inside /${folder.name}`);
                parentFolder.items.add(item);
              }
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
        if (servicesFolders
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
    options = { isTestCollections: false },
  ) {
    const allVariables = originalCollections
      .filter((collection) => collection.variables.all().length > 0)
      .flatMap((collection) => collection.variables.all());

    let uniqueVariables = allVariables.filter((variable, index, arr) => index === arr
      .findIndex((foundVariable) => foundVariable.key === variable.key
      && foundVariable.value === variable.value));

    const count = {};
    const keys = uniqueVariables.map((variable) => variable.key);
    keys.forEach((variable) => { count[variable] = (count[variable] || 0) + 1; });
    uniqueVariables.forEach((variable) => {
      if (count[variable.key] > 1) variable.disabled = true;
    });

    uniqueVariables = uniqueVariables.filter((variable) => variable.key !== placeholders.TOKEN);
    uniqueVariables = options.isTestCollections
      ? uniqueVariables.filter((variable) => variable.key !== hostPlaceholders.GATEWAY[0].match(/{{(.*?)}}/)[1].trim())
      : uniqueVariables;
    uniqueVariables = new PropertyList(Variable, null, uniqueVariables);
    this.sortKeysAlphabetically(uniqueVariables.members);
    productsCollection.variables = uniqueVariables;
    servicesCollection.variables = uniqueVariables;
  }

  static moveAuthMethodsToRoot(productsCollection, servicesCollection) {
    const itemNames = [_.capitalize(services.AUTH), placeholders.LOGIN];
    itemNames.forEach((itemName) => {
      const foundFolder = servicesCollection.items
        .find((folder) => folder.name === services.AUTH.toUpperCase());
      if (foundFolder) {
        const foundItemIndex = foundFolder.items.members
          .findIndex((item) => item.name === itemName);
        if (foundItemIndex !== -1) {
          Logger.log(`[inf]   moving item "${itemName}" from folder "${foundFolder.name}" to root`);
          const [foundItem] = foundFolder.items.members.splice(foundItemIndex, 1);
          this.groupPropertiesByDescription(foundItem);
          servicesCollection.items.members.unshift(foundItem);
          productsCollection.items.members.unshift(foundItem);
        }
      }
    });
  }

  static orderItemsAlphabetically(groupedCollection) {
    const { items } = groupedCollection;
    this.sortNamesAlphabetically(items);
    items.members.forEach((item) => {
      if (item.items && item.items.count()) {
        this.orderItemsAlphabetically(item);
      }
    });
  }

  static groupPropertiesByDescription(item) {
    if (item.request.method !== HTTPMethods.GET
    && this.hasUrlencodedPropertiesArr(item)
    && item.request.body.urlencoded.count()) {
      item.request.body.urlencoded = this
        .getListOfGroupedProperties(item.request.body.urlencoded.all());
    } else if (item.request.method !== HTTPMethods.GET
    && this.hasFormdataPropertiesArr(item)
    && item.request.body.formdata.count()) {
      item.request.body.formdata = this
        .getListOfGroupedProperties(item.request.body.formdata.all());
    }
  }

  static getListOfGroupedProperties(propertyList) {
    const processedProperties = [];
    const allAutogenPropertyGroups = [];
    propertyList.forEach((property) => {
      const splittedPropertyDescription = property.description.split(';');
      const uniquePropertyGroups = [...new Set(splittedPropertyDescription)];
      const uniqueAutogenPropertyGroups = uniquePropertyGroups
        .filter((propertyGroup) => !propertyGroup.startsWith('('));
      allAutogenPropertyGroups.push(...uniqueAutogenPropertyGroups);
      property.description = uniquePropertyGroups;
    });

    const allUniqueAutogenPropertyGroups = [...new Set(allAutogenPropertyGroups)];
    this.sortStringsAlphabetically(allUniqueAutogenPropertyGroups);

    const allFilteredUniqueAutogenPropertyGroups = allUniqueAutogenPropertyGroups
      .filter((uniqueAutogenPropertyGroup) => servicesFolders
        .filter((serviceFolder) => serviceFolder !== services.AUTH)
        .every((serviceFolder) => !uniqueAutogenPropertyGroup.toUpperCase()
          .includes(serviceFolder.toUpperCase()))
    && !authIgnoredFolders.includes(uniqueAutogenPropertyGroup));

    allFilteredUniqueAutogenPropertyGroups.forEach((filteredUniqueAutogenPropertyGroup) => {
      const uniqueProperties = [];
      propertyList.forEach((property) => {
        const uniqueNonAutogenPropertyGroups = property.description
          .filter((propertyGroup) => propertyGroup.startsWith('('));
        const resultProperty = structuredClone(property);
        if (property.description.includes(filteredUniqueAutogenPropertyGroup)
          && property.value !== '') {
          resultProperty.description = uniqueNonAutogenPropertyGroups.length
            ? `${filteredUniqueAutogenPropertyGroup}, ${uniqueNonAutogenPropertyGroups.join(';')}`
            : `${filteredUniqueAutogenPropertyGroup}`;
          uniqueProperties.push(resultProperty);
        }
      });

      this.sortKeysAlphabetically(uniqueProperties);
      processedProperties.push(...uniqueProperties);
    });

    const itemType = processedProperties[0] instanceof QueryParam ? QueryParam : FormParam;
    return new PropertyList(itemType, null, processedProperties);
  }

  static removeRedundantRootFolders(collection, options = { onesCollection: false }) {
    const foldersToRemove = ['1C'];
    collection.items.members = collection.items.members.filter((item) => {
      const isFolder = item.items !== undefined;
      const shouldRemove = options.onesCollection
        ? !foldersToRemove.includes(item.name)
        : foldersToRemove.includes(item.name);
      return !(isFolder && shouldRemove);
    });
  }
}

export default DataUtils;
