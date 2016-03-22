var payableURL;
var instrHeaders = {};

var authHeader, transferHeader; // off-chain transaction headers
var offChainHeaders = [];       // off-chain transaction headers array
// var tokenHeaders = [];          // micropayment channels headers

var PayableHeaderNames = [
  "Username",
  "Price",
  "Bitcoin-Payment-Channel-Server",
  "Bitcoin-Address"
];
var OptionalHeaderNames = [
  "Rate"
]

var enabled = true;
chrome.browserAction.onClicked.addListener(setEnabled);

function setEnabled() {
  enabled = !enabled;
  chrome.browserAction.setIcon({path: "resources/images/38x38" + (enabled ? ".png" : "_greyscale.png")});
  if (enabled) {
    chrome.webRequest.onHeadersReceived.addListener(
      BG.Methods.payableResponseHeadersListener, { urls: ['<all_urls>'] }, ['blocking', 'responseHeaders']
    );
  }
  else {
    chrome.webRequest.onHeadersReceived.removeListener(BG.Methods.payableResponseHeadersListener);
  }
}

function requestOffChainHeaders(payload) {
    $.ajax({
        type:"POST",
        url: "http://10.8.220.169:8080/headers", // "http://192.168.0.14:8080/headers",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(payload),
        success: function(resp) {
            console.log("Proxy response: ", resp);
            /* authHeader = resp["Authorization"];
            transferHeader = resp["Bitcoin-Transfer"]; */
            offChainHeaders.push({
              "Authorization": resp["Authorization"],
              "Bitcoin-Transfer": resp["Bitcoin-Transfer"]
            });
            console.log("Headers array: ", JSON.stringify(offChainHeaders));
        },
        failure: function(err) {
            alert(err)
        }
    });
};

function requestChannelsHeaders(payload) {
    $.ajax({
        type:"POST",
        url: "http://10.8.220.169:8080/headers-channels", // "http://192.168.0.14:8080/headers-channels",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(payload),
        success: function(resp) {
            console.log("Proxy response: ", resp);
            tokenHeaders.push(resp['bitcoin-payment-channel-token']);
        },
        failure: function(err) {
            alert(err)
        }
    });
};

var BG = {
  Methods: {},
  statusSettings: {
    id: RQ.STORAGE_KEYS.REQUESTLY_SETTINGS,
    avoidCache: true,
    isExtensionEnabled: true
  },
  extensionStatusContextMenuId: -1
};

BG.Methods.matchUrlWithReplaceRulePairs = function(rule, url) {
  var pairs = rule.pairs,
    pair = null,
    from = null,
    isFromPartRegex,
    resultingUrl = null;

  for (var i = 0; i < pairs.length; i++) {
    pair = pairs[i];
    pair.from = pair.from || '';

    // When string pair.from looks like a RegExp, create a RegExp object from it
    from = RQ.Utils.toRegex(pair.from);
    isFromPartRegex = (from !== null);

    from = from || pair.from;

    // Use String.match method when from is Regex otherwise use indexOf
    // Issue-86: String.match("?a=1") fails with an error
    if ((isFromPartRegex && url.match(from)) || (url.indexOf(from) !== -1)) {
      resultingUrl = url.replace(from, pair.to);
      break;
    }
  }

  return resultingUrl;
};

BG.Methods.removeHeader = function(headers, name) {
  for (var i = headers.length - 1; i >= 0; i--) {
    if (headers[i].name.toLowerCase() === name.toLowerCase()) {
      headers.splice(i, 1);
      break;
    }
  }
};

BG.Methods.modifyHeaderIfExists = function(headers, newHeader) {
  for (var i = headers.length - 1; i >= 0; i--) {
    if (headers[i].name.toLowerCase() === newHeader.name.toLowerCase()) {
      headers[i].value = newHeader.value;
      break;
    }
  }
};

BG.Methods.getHeaderIfExists = function(headers, targetHeaderName) {
  for (var i = headers.length - 1; i >= 0; i--) {
    if (headers[i].name.toLowerCase() === targetHeaderName.toLowerCase()) {
      return headers[i];
    }
  }
  return null;
};

/**
 *
 * @param originalHeaders Original Headers present in the HTTP(s) request
 * @param headersTarget Request/Response (Where Modification is to be done)
 * @param details (Actual details object)
 * @returns originalHeaders with modifications if modified else returns {code}null{/code}
 */
BG.Methods.modifyHeaders = function(originalHeaders, headersTarget, details, isRequest) {
  var rule,
    headerPairs,
    isRuleApplied = false,
    modification,
    url = details.url;

  for (var i = 0; i < StorageService.records.length; i++) {
    rule = StorageService.records[i];

    if (rule.status !== RQ.RULE_STATUS.ACTIVE || rule.ruleType !== RQ.RULE_TYPES.HEADERS) {
      continue;
    }

    headerPairs = rule.pairs || [];

    for (var index = 0; index < headerPairs.length; index++) {
      modification = headerPairs[index];
      modification.source = modification.source || {};

      if (modification.target !== headersTarget || !modification.header) {
        continue;
      }

      // If Source Value exists and does not match, proceed with next pair
      if (modification.source.value && BG.Methods.matchUrlWithRuleSource(modification.source, null, url) === null) {
        continue;
      }

      isRuleApplied = true;

      switch (modification.type) {
        case RQ.MODIFICATION_TYPES.ADD:
          originalHeaders.push({ name: modification.header, value: modification.value });
          break;

        case RQ.MODIFICATION_TYPES.REMOVE:
          BG.Methods.removeHeader(originalHeaders, modification.header);
          break;

        case RQ.MODIFICATION_TYPES.MODIFY:
          BG.Methods.modifyHeaderIfExists(originalHeaders, {
            name: modification.header,
            value: modification.value
          });
          break;
      }
    }
  }

  // return if not on payable URL or if in response handler
  if (!payableURL || payableURL.indexOf(url) == -1
      || !isRequest) {
    return isRuleApplied ? originalHeaders : null;
  }

  // add payment headers to outgoing requests to payable URLs
  console.log("Headers: ", JSON.stringify(originalHeaders));

  if (authHeader && transferHeader) {
    console.log("Now pushing")
    isRuleApplied = true;
    originalHeaders.push({ name: 'Authorization', value: authHeader});
    originalHeaders.push({ name: 'Bitcoin-Transfer', value: transferHeader});

    authHeader = null;
    transferHeader = null;
  }
  if (offChainHeaders.length > 0) {
    // console.log("Now pushing")
    isRuleApplied = true;

    // console.log("Headers array: ", JSON.stringify(offChainHeaders));
    console.log("Now pushing...", "[" + url + "]");
    console.log("Authorization: " + offChainHeaders[0]['Authorization'],
      "Bitcoin-Transfer: " + offChainHeaders[0]['Bitcoin-Transfer']);
    originalHeaders.push({ name: 'Authorization', value: offChainHeaders[0]['Authorization']});
    originalHeaders.push({ name: 'Bitcoin-Transfer', value: offChainHeaders[0]['Bitcoin-Transfer']});

    offChainHeaders.splice(0, 1);
    requestOffChainHeaders({
        "headers": instrHeaders,
        "url": url
      });
  }
  else if (offChainHeaders.length == 0) {
    // console.log("Needed payment headers, but didn't have them...");
    console.log("Requesting headers...", "[" + url + "]");
    requestOffChainHeaders({
      "headers": instrHeaders,
      "url": url
    });
  }

  return isRuleApplied ? originalHeaders : null;
};

/**
 *
 * @param originalHeaders Original Headers present in the HTTP(s) request
 * @param headersTarget Request/Response (Where Modification is to be done)
 * @param details (Actual details object)
 * @returns originalHeaders with modifications if modified else returns {code}null{/code}
 */
BG.Methods.getPayableHeaders = function(originalHeaders, headersTarget, details) {

  var payableHeaders = {};

  for (var i = 0; i < PayableHeaderNames.length; i++) {
    var header = BG.Methods.getHeaderIfExists(originalHeaders, PayableHeaderNames[i]);
    if (header === null)
      return null;

    payableHeaders[PayableHeaderNames[i].toLowerCase()] = header.value;
  }
  for (var i = 0; i < OptionalHeaderNames.length; i++) {
    var header = BG.Methods.getHeaderIfExists(originalHeaders, OptionalHeaderNames[i]);
    if (header !== null) {
      payableHeaders[OptionalHeaderNames[i].toLowerCase()] = header.value;
    }
  }

  // console.log("Payable headers: ", payableHeaders);
  return payableHeaders;
};

/**
 * Checks if intercepted HTTP Request Url matches with any Rule
 *
 * @param sourceObject Object e.g. { key: 'Url', operator: 'Contains', value: 'google' }
 * @param destination String e.g. 'http://www.google.com'
 * @param url Url for which HTTP Request is intercepted.
 *
 * @returns String destinationUrl if Rule should be applied to intercepted Url else returns {code}null{/code}
 */
BG.Methods.matchUrlWithRuleSource = function(sourceObject, destination, url) {
  var operator = sourceObject.operator,
    destinationUrl = destination || '', // Destination Url is not present in all rule types (Cancel)
    value = sourceObject.value,
    blackListedDomains = RQ.BLACK_LIST_DOMAINS || [];

  for (var index = 0; index < blackListedDomains.length; index++) {
    if (url.indexOf(blackListedDomains[index]) !== -1) {
      return null;
    }
  }  
    
  switch (operator) {
    case RQ.RULE_OPERATORS.EQUALS: if (value === url) { return destinationUrl; }
      break;

    case RQ.RULE_OPERATORS.CONTAINS: if (url.indexOf(value) !== -1) { return destinationUrl; }
      break;

    case RQ.RULE_OPERATORS.MATCHES: {
      var regex = RQ.Utils.toRegex(value),
        matches;

      // Do not match when regex is invalid or regex does not match with Url
      if (!regex || url.search(regex) === -1) {
        return null;
      }

      matches = regex.exec(url) || [];

      matches.forEach(function (matchValue, index) {
        // First match is the full string followed by parentheses/group values
        if (index === 0) {
          return;
        }

        // Issue: 73 We should not leave $i in the Url otherwise browser will encode that. 
        // Even if match is not found, just replace that placeholder with empty string 
        matchValue = matchValue || '';

        // Replace all $index values in destinationUrl with the matched groups
        destinationUrl = destinationUrl.replace(new RegExp('[\$]' + index, 'g'), matchValue);
      });

      return destinationUrl;
    }
  }

  return null;
};

BG.Methods.modifyUrl = function(details) {
  var resultingUrl,
    pair,
    pairIndex;

  for (var i = 0; i < StorageService.records.length; i++) {
    var rule = StorageService.records[i];

    if (rule.status !== RQ.RULE_STATUS.ACTIVE) {
      continue;
    }

    switch(rule.ruleType) {
      case RQ.RULE_TYPES.REDIRECT:
        // Introduce Pairs: Transform the Redirect Rule Model to new Model to support multiple entries (pairs)
        if (typeof rule.source !== 'undefined' && typeof rule.destination !== 'undefined') {
          rule.pairs = [{
            source: { key: RQ.RULE_KEYS.URL, operator: rule.source.operator, value: rule.source.values[0] },
            destination: rule.destination
          }];

          delete rule.source;
          delete rule.destination;
        }

        for (pairIndex = 0; pairIndex < rule.pairs.length; pairIndex++) {
          pair = rule.pairs[pairIndex];
          resultingUrl = BG.Methods.matchUrlWithRuleSource(pair.source, pair.destination, details.url);
          if (resultingUrl !== null) {
            return { redirectUrl: resultingUrl };
          }
        }
        break;

      // In case of Cancel Request, destination url is 'javascript:'
      case RQ.RULE_TYPES.CANCEL:
        // Introduce Pairs: Transform the Cancel Rule Model to new Model to support multiple entries (pairs)
        if (typeof rule.source !== 'undefined') {
          rule.pairs = [{
            source: { key: RQ.RULE_KEYS.URL, operator: rule.source.operator, value: rule.source.values[0] }
          }];

          delete rule.source;
        }

        for (pairIndex = 0; pairIndex < rule.pairs.length; pairIndex++) {
          pair = rule.pairs[pairIndex];
          resultingUrl = BG.Methods.matchUrlWithRuleSource(pair.source, null, details.url);
          if (resultingUrl !== null) {
            return { redirectUrl: 'javascript:' };
          }
        }
        break;

      case RQ.RULE_TYPES.REPLACE:
        resultingUrl = BG.Methods.matchUrlWithReplaceRulePairs(rule, details.url);
        if (resultingUrl !== null) {
          return { redirectUrl: resultingUrl };
        }
        break;
    }
  }
};

BG.Methods.modifyRequestHeadersListener = function(details) {
  var isRequest = true;
  var modifiedHeaders = BG.Methods.modifyHeaders(details.requestHeaders, RQ.HEADERS_TARGET.REQUEST, details, isRequest);

  if (modifiedHeaders !== null) {
    return { requestHeaders: modifiedHeaders };
  }
};

BG.Methods.modifyResponseHeadersListener = function(details) {
  var isRequest = false;
  var modifiedHeaders = BG.Methods.modifyHeaders(details.responseHeaders, RQ.HEADERS_TARGET.RESPONSE, details, isRequest);

  if (modifiedHeaders !== null) {
    return { responseHeaders: modifiedHeaders };
  }
};

/* Callback invoked when any HTTP response is received */
BG.Methods.payableResponseHeadersListener = function(details) {
  var payableHeaders = BG.Methods.getPayableHeaders(details.responseHeaders, RQ.HEADERS_TARGET.RESPONSE, details);

  if (payableHeaders !== null) {
    console.log("402 response received...", "[" + details.url + "]");

    payableURL = details.url;

    /* If received (instr) headers contain time-rating scheme... */
    if ("rate" in payableHeaders) {

      /* Request proxy for payment headers, if none stored */
      if (offChainHeaders.length == 0) {
        requestOffChainHeaders({
          "headers": payableHeaders,
          "url": details.url
        });
      }

      /* Save instructional headers */
      instrHeaders = {
        "price": payableHeaders["rate"],
        "username": payableHeaders["username"],
        "bitcoin-address": payableHeaders["bitcoin-address"],
        "bitcoin-payment-channel-server": payableHeaders["bitcoin-payment-channel-server"]
      };
      console.log("Set time-rated headers: ", instrHeaders);
    }
  }
};

BG.Methods.registerListeners = function() {
  if (!chrome.webRequest.onBeforeRequest.hasListener(BG.Methods.modifyUrl)) {
    chrome.webRequest.onBeforeRequest.addListener(
      BG.Methods.modifyUrl, { urls: ['<all_urls>'] }, ['blocking']
    );
  }

  if (!chrome.webRequest.onBeforeSendHeaders.hasListener(BG.Methods.modifyRequestHeadersListener)) {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      BG.Methods.modifyRequestHeadersListener, { urls: ['<all_urls>'] }, ['blocking', 'requestHeaders']
    );
  }

  if (!chrome.webRequest.onHeadersReceived.hasListener(BG.Methods.modifyResponseHeadersListener)) {
    chrome.webRequest.onHeadersReceived.addListener(
      BG.Methods.modifyResponseHeadersListener, { urls: ['<all_urls>'] }, ['blocking', 'responseHeaders']
    );
  }

  if (enabled && !chrome.webRequest.onHeadersReceived.hasListener(BG.Methods.payableResponseHeadersListener)) {
    chrome.webRequest.onHeadersReceived.addListener(
      BG.Methods.payableResponseHeadersListener, { urls: ['<all_urls>'] }, ['blocking', 'responseHeaders']
    );
  }
};

// http://stackoverflow.com/questions/23001428/chrome-webrequest-onbeforerequest-removelistener-how-to-stop-a-chrome-web
// Documentation: https://developer.chrome.com/extensions/events
BG.Methods.unregisterListeners = function() {
  chrome.webRequest.onBeforeRequest.removeListener(BG.Methods.modifyUrl);
  chrome.webRequest.onBeforeSendHeaders.removeListener(BG.Methods.modifyRequestHeadersListener);
  chrome.webRequest.onHeadersReceived.removeListener(BG.Methods.modifyResponseHeadersListener);
  chrome.webRequest.onHeadersReceived.removeListener(BG.Methods.payableResponseHeadersListener);
};

BG.Methods.disableExtension = function() {
  BG.statusSettings['isExtensionEnabled'] = false;
  StorageService.saveRecord({ rq_settings: BG.statusSettings }, BG.Methods.handleExtensionDisabled);
};

BG.Methods.enableExtension = function() {
  BG.statusSettings['isExtensionEnabled'] = true;
  StorageService.saveRecord({ rq_settings: BG.statusSettings }, BG.Methods.handleExtensionEnabled);
};

BG.Methods.handleExtensionDisabled = function() {
  BG.Methods.unregisterListeners();
  chrome.contextMenus.update(BG.extensionStatusContextMenuId, {
    title: 'Activate Requestly',
    onclick: BG.Methods.enableExtension
  });
  chrome.browserAction.setIcon({ path: RQ.RESOURCES.EXTENSION_ICON_GREYSCALE });
  BG.Methods.sendMessage({ isExtensionEnabled: false });
  console.log('Requestly disabled');
};

BG.Methods.handleExtensionEnabled = function() {
  BG.Methods.registerListeners();
  chrome.contextMenus.update(BG.extensionStatusContextMenuId, {
    title: 'Deactivate Requestly',
    onclick: BG.Methods.disableExtension
  });
  chrome.browserAction.setIcon({ path: RQ.RESOURCES.EXTENSION_ICON });
  BG.Methods.sendMessage({ isExtensionEnabled: true });
  console.log('Requestly enabled');
};

BG.Methods.readExtensionStatus = function() {
  StorageService.getRecord(RQ.STORAGE_KEYS.REQUESTLY_SETTINGS, function(response) {
    response = response || {};
    var settings = response[RQ.STORAGE_KEYS.REQUESTLY_SETTINGS] || BG.statusSettings;

    settings['isExtensionEnabled'] ? BG.Methods.handleExtensionEnabled() : BG.Methods.handleExtensionDisabled();
  });
};

/* chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({'url': RQ.WEB_URL }, function(tab) {
    // Tab opened.
  });
}); */

// Create contextMenu Action to Enable/Disable Requestly (Default Options)
chrome.contextMenus.removeAll();
BG.extensionStatusContextMenuId = chrome.contextMenus.create({
  title: 'Deactivate Requestly',
  type: 'normal',
  contexts: ['browser_action'],
  onclick: function() { console.log('Requestly Default handler executed'); }
});

BG.Methods.sendMessage = function(messageObject, callback) {
  callback = callback || function() { console.log('DefaultHandler: Sending Message to Runtime: ', messageObject); };
  
  chrome.tabs.query({ url: RQ.WEB_URL_PATTERN }, function(tabs) {
    // Send message to each opened tab which matches the url
    for (var tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      chrome.tabs.sendMessage(tabs[tabIndex].id, messageObject, callback);
    }
  });
};

StorageService.getRecords({ callback: BG.Methods.readExtensionStatus });
