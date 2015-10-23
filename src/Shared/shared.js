var RQ = RQ || {};

RQ.VERSION = '3.4.1';

RQ.RULE_TYPES = {
  REDIRECT: 'Redirect',
  CANCEL: 'Cancel',
  REPLACE: 'Replace',
  HEADERS: 'Headers'
};

RQ.RULE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

RQ.RULE_KEYS = {
  URL: 'Url',
  HEADER: 'Header'
};

RQ.RULE_OPERATORS = {
  EQUALS: 'Equals',
  CONTAINS: 'Contains',
  MATCHES: 'Matches'
};

RQ.MODIFICATION_TYPES = {
  ADD: 'Add',
  REMOVE: 'Remove',
  MODIFY: 'Modify'
};

RQ.HEADERS_TARGET = {
  REQUEST: 'Request',
  RESPONSE: 'Response'
};

RQ.RESPONSE_CODES = {
  NOT_FOUND: 404
};

RQ.STORAGE_KEYS = {
  REQUESTLY_SETTINGS: 'rq_settings'
};

RQ.MESSAGES = {
  DELETE_RULE: 'Are you sure you want to delete the rule ?'
};

RQ.RESOURCES = {
  EXTENSION_ICON: '/resources/images/38x38.png',
  EXTENSION_ICON_GREYSCALE: '/resources/images/38x38_greyscale.png'
};

RQ.htmlEncode = function(value){
  return $('<div/>').text(value).html();
};
