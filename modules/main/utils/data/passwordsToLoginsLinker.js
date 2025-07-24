/* eslint no-param-reassign: ["off"] */
/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import fs from 'fs';
import path from 'path';
import Logger from '../log/logger.js';

const dirPaths = [
  path.relative(path.resolve(), './input_test_collections'),
  path.relative(path.resolve(), './input_prod_collections'),
];

const args = process.argv.slice(2);
const login = args.shift();
const password = args.shift();
const description = args.length ? `${login} ${args.shift()}` : login;

const processNestedObj = (obj) => {
  if (obj && typeof obj === 'object') {
    if (obj.value === password) {
      if (obj.description) {
        if (!obj.description.includes(description)) {
          obj.description = `${description} ; ${obj.description}`;
        }
      } else {
        obj.description = description;
      }
    }

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        processNestedObj(obj[key]);
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(processNestedObj);
  }
};

const processFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath);
    const obj = JSON.parse(content);

    processNestedObj(obj);

    fs.writeFileSync(filePath, JSON.stringify(obj, null, 4));
    Logger.log(`[inf]   linked passwords to logins in: ${filePath}`);
  } catch (error) {
    Logger.error(`[err]   failed to link passwords to logins in: ${filePath}\n${error.message}`);
  }
};

const linkPasswordsToLogins = (dirPath) => {
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      linkPasswordsToLogins(fullPath);
    } else if (entry.endsWith('.json')) {
      processFile(fullPath);
    }
  }
};

if (process.argv.slice(2).length > 1) {
  for (const dirPath of dirPaths) {
    linkPasswordsToLogins(dirPath);
  }
} else {
  throw new Error('[err]   login and password pair not provided to console command!');
}
