export const HTTPMethods = Object.freeze({
  GET: 'GET',
  POST: 'POST',
});

export const Protocols = Object.freeze({
  HTTP: 'http',
  HTTPS: 'https',
});

export const HostPlaceholders = Object.freeze({
  GATEWAY: ['{{GATEWAY_URL}}'],
  EDU: ['edu-dev', 'amanat', 'systems'],
  FILEREPO: ['filerepo', 'dev', 'a-i', 'kz'],
});

export const Services = Object.freeze({
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
