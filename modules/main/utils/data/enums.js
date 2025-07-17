export const HTTPMethods = Object.freeze({
  GET: 'GET',
});

export const patterns = Object.freeze({
  TEMPLATE_NAME: '-template-from-body',
});

export const protocols = Object.freeze({
  HTTP: 'http',
  HTTPS: 'https',
});

export const placeholders = Object.freeze({
  TOKEN: 'TOKEN',
  LOGIN: 'login',
});

export const hostPlaceholders = Object.freeze({
  LOCALHOST: [
    'localhost',
  ],
  URL: [
    '{{URL}}',
  ],
  GATEWAY: [
    '{{GATEWAY_URL}}',
  ],
  WEB_ENV: [
    '{{WEB_ENV}}',
  ],
  API_URL: [
    '{{API_URL}}',
  ],
  HOST: [
    '{{HOST}}',
  ],
  AMANAT24: [
    '{{amanat24_url}}',
  ],
  EDU: [
    'edu-dev',
    'amanat',
    'systems',
  ],
  FILEREPO: [
    'filerepo',
    'dev',
    'a-i',
    'kz',
  ],
});

export const services = Object.freeze({
  DWH: 'dwh',
  ESBD: 'esbd',
  CARGO: 'cargo',
  ELASTIC: 'elastic',
  GATEWAY: 'gateway',
  FILEREPO: 'filerepo',
  KASPI: 'kaspi',
  KASKO: 'kasko',
  MEDPOOL: 'medpool',
  MEDPUL: 'medpul',
  NOTIFICATION: 'notification',
  DICTIONARY: 'dictionary',
  AUTH: 'auth',
  AMANAT24: 'amanat24',
  SHORT_LINK: 'short_link',
  SIGNER: 'signer',
  EUROPROTOCOL: 'europrotocol',
  EDU: 'edu',
  DOCS: 'docs',
  CLAIM: 'claim',
  SIGNERSCRIPT: 'signerscript',
  ASYNC: 'async',
});

export const servicesFolders = Object.freeze([
  'elastic',
  'archive',
  'auth',
  'docs',
  'notification',
  'client',
  'async',
  'dictionary',
  'policy',
  'ocr',
  'generative_ai',
  'esbd',
  'ones',
  'pay',
  'kaspi',
  'nurkassa_kz',
  'filerepo',
  'short_link',
  'signer',
  'dwh',
  'crawler',
  'signerscript',
  'numerator',
]);

export const authIgnoredFolders = Object.freeze([
  'cr-lr-value',
  'CRUD categories',
  'HALYK HOMEBANK TEST',
  'm-adp 1C setagent',
  'TEST',
  'USERS',
  'v1',
  'WEBBOX',
]);
