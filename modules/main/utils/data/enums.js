export const HTTPMethods = Object.freeze({
  GET: 'GET',
});

export const Protocols = Object.freeze({
  HTTP: 'http',
  HTTPS: 'https',
});

export const HostPlaceholders = Object.freeze({
  GATEWAY: [
    '{{GATEWAY_URL}}',
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

export const Services = Object.freeze({
  CARGO: 'cargo',
  ELASTIC: 'elastic',
  GATEWAY: 'gateway',
  FILEREPO: 'filerepo',
  KASPI: 'kaspi',
  KASKO: 'kasko',
  MEDPOOL: 'medpool',
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
