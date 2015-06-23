/**
 * Jo Torsmyr
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/*global require, module,console, Buffer */
  /*jshint devel : true*/

'use strict';

module.exports = (function() {
  var debugPrefix;
  var debug = false;

  var MAX_DEPTH = 10;

  var https = require('https');
  var url = require('url');
  var zlib = require('zlib');
  var parse5 = require('parse5');

  function fullTelenorRequest(node, msg, firstURL, secondURL, getResponsePayloadCallback, requestPayload) {
      debug = node.debug;
      debugPrefix = node.debugPrefix;
      msg.payload = null;

      if (!msg.options) { // Check if Login node executed in same flow...
         msg.options = {}; msg.options.httpsOptions = initialHttpsOptions;
         debugLog('Request cookies:', msg.req.headers.cookie);
//         msg.options.telenorcookies = getRequestCookieJar(msg.req.headers.cookie);
         msg.options.telenorcookies = getTelenorLoggedInCookies(msg.req.headers.cookie);
      }

      msg.options.httpsOptions.headers['Cookie'] = formatCookieString(msg.options.telenorCookies);

      var urlObj = url.parse(firstURL);
      msg.options.httpsOptions.hostname = urlObj.hostname;
      msg.options.httpsOptions.path = urlObj.path;
      msg.options.httpsOptions.method = 'GET';

      msg.options.httpsOptions.headers['Host'] = msg.options.httpsOptions.hostname;

      telenorRequest(node, msg, function(node, responsemsg, payload, headers) {
        if (notLoggedIn(payload)) {
           prepareNotLoggedInResponse(responsemsg, headers);
           node.status({fill : 'yellow', shape : 'dot', text : 'Not logged in'});
           node.send(responsemsg);
           return;
        }
        var problemMessage = technicalProblem(payload);
        if (problemMessage) {
           prepareTechnicalProblemResponse(responsemsg, headers, problemMessage);
             node.status({fill : 'yellow', shape : 'dot', text : 'Technical problem'});
           node.send(responsemsg);
           return;          
        }

        if (requestPayload != undefined) {
           responsemsg.options.httpsOptions.method = 'POST';
           responsemsg.payload = requestPayload;
        }

        var urlObj = url.parse(secondURL);
        responsemsg.options.httpsOptions.hostname = urlObj.hostname;
        responsemsg.options.httpsOptions.path = urlObj.path;

        msg = responsemsg;

        telenorRequest(node, msg, function(node, responsemsg, payload, headers) {
          var responsePayload = getResponsePayloadCallback(payload);
          prepareResponse(responsemsg, headers, responsePayload);
          node.status({fill : 'green', shape : 'dot', text : 'Success'});
          node.send(responsemsg);
        });
      });
  }

  function telenorRequest(node, msg, telenorRequestCallback) {
    debug = node.debug;
    debugPrefix = node.debugPrefix;
    var requestpayload = null;
    msg.options.httpsOptions.headers['Cookie'] = formatCookieString(msg.options.telenorcookies);
    printCookies(msg.options.telenorcookies);

    if (msg.payload && msg.payload.length > 0) {
       requestpayload = msg.payload;
       msg.options.httpsOptions.headers['Content-Length'] = requestpayload.length;
       debugLog('payload byte length', requestpayload.length);
    }

    var redirecting = false;
    doHTTPSRequest(node, msg, redirecting, 0, requestpayload, function(responsemsg, payload, headers) {
      telenorRequestCallback(node, responsemsg, payload, headers);
    });
  }

  function doHTTPSRequest(node, msg, redirecting, callDepth, requestpayload, doHTTPSRequestcallback) {
    var chunks = [];
  
    debugLog('HTTPS request options', JSON.stringify(msg.options));
    var request = https.request(msg.options.httpsOptions, function(response) {
    try {
      if (callDepth++ > MAX_DEPTH) throw Error('Maximum #redirects reached:' + MAX_DEPTH);
      debugLog('=====>  Response statusCode: ', response.statusCode);
      debugLog('=====>  Request headers: ', msg.options.httpsOptions.headers);
      debugLog('=====>  Response headers: ', response.headers);

      if (response.statusCode > 300 && response.statusCode < 400) {
         redirecting = true;
         addCookies(msg.options.telenorcookies, response.headers['set-cookie']);
         msg.options.httpsOptions.headers['Cookie'] = formatCookieString(msg.options.telenorcookies);
         debugLog('302 = Cookie jar', msg.options.telenorcookies);

         var urlObj = url.parse(response.headers['location']);

         var currentHostname = msg.options.httpsOptions.hostname;
         msg.options.httpsOptions.hostname = urlObj.hostname || currentHostname;
         msg.options.httpsOptions.path = urlObj.path;
         debugLog('Redirect host = path', msg.options.httpsOptions.hostname,  msg.options.httpsOptions.path);

         msg.options.httpsOptions.method = 'GET';
         delete msg.options.httpsOptions.headers['Content-Length'];

         doHTTPSRequest(node, msg, redirecting, callDepth, null, doHTTPSRequestcallback);
      } else if (response.statusCode == 200) {
         redirecting = false;
         addCookies(msg.options.telenorcookies, response.headers['set-cookie']);
         debugLog('200 = Cookie jar', msg.options.telenorcookies);
      } else throw Error('Unexpected HTTP status code:' + response.statusCode);
      } catch (error) {
        debugLog('=====> Catch https.request error:', error.stack);
        node.status({fill : 'red', shape : 'dot', text : 'Error'});
        var errorResponse = JSON.stringify({error : true, errorMessage : error});
        node.error(errorResponse, msg);
      }

      response.on('data', function(chunk) {
        if (!redirecting) chunks.push(chunk);
      });

      response.on('error', function(error) {
        debugLog('=====> response on error:', error);
        node.status({fill : 'red', shape : 'dot', text : 'Error'});
        var errorResponse = JSON.stringify({error : true, errorMessage : error});
        node.error(errorResponse, msg);
      });

      response.on('end', function() {
        debugLog('=====> response on end: status', response.statusCode);
        if (!redirecting) {
           var buffer = Buffer.concat(chunks);

           msg.statusCode = response.statusCode;

           var encoding = response.headers['content-encoding'];
           debugLog('=====> response on end:', encoding);
           debugLog('Response on end - Cookie jar', msg.options.telenorcookies);
           if (encoding == 'gzip') {
              zlib.gunzip(buffer, function(error, decoded) {
                delete response.headers['content-encoding'];
                doHTTPSRequestcallback(msg, decoded.toString(), response.headers);
              });
           } else {
              doHTTPSRequestcallback(msg, buffer.toString(), response.headers);
           }
        }
      });
    });

    request.on('error', function(error) {
      debugLog('=====> request on error:', error);
      node.status({fill : 'red', shape : 'dot', text : 'Error'});
      var errorResponse = JSON.stringify({error : true, errorMessage : error});
      node.error(errorResponse, msg);
    });

    if (requestpayload) request.write(requestpayload);
    request.end();
  }

  function debugLog() {
    if (debug) {
       Array.prototype.unshift.call(arguments, debugPrefix);
       console.log.apply(null, arguments);
    }
  }

  function prepareResponse(responsemsg, headers, responsePayload) {
    debugLog('Response payload', responsePayload);
    responsemsg.payload = JSON.stringify(responsePayload);
    headers['Content-Length'] = Buffer.byteLength(responsemsg.payload, ['utf8']);;
    headers['Content-Type'] = 'application/json; charset=UTF-8';

    responsemsg.headers = headers;
    responsemsg.headers['set-cookie'] = formatCookieString(responsemsg.options.telenorcookies);
    debugLog('=====> response on end: node.send payload length', responsemsg.payload.length);
    debugLog('Cookie jar', responsemsg.options.telenorcookies);
    debugLog('==========> END Request - Success <==========');
  }
  function prepareNotLoggedInResponse(responsemsg, headers) {
    debugLog('Not logged in');
    responsemsg.payload = JSON.stringify({loggedIn : false});
    headers['Content-Length'] = Buffer.byteLength(responsemsg.payload, ['utf8']);
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    responsemsg.headers = headers;
    debugLog('==========> END Request - Not logged in <==========');
  }
  function prepareTechnicalProblemResponse(responsemsg, headers, problemMessage) {
    debugLog('Technical problem', problemMessage);
    responsemsg.payload = JSON.stringify({error : true, errorMessage : problemMessage});
    headers['Content-Length'] = Buffer.byteLength(responsemsg.payload, ['utf8']);
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    responsemsg.headers = headers;
    debugLog('==========> END Request - Technical problem <==========');
  }

  function getRequestCookieJar(requestCookiesString) {
    var cookieJar = {};
    if (!requestCookiesString) return cookieJar;

    requestCookiesString.split(';').forEach(function(requestCookieString) {
      addCookie(cookieJar, requestCookieString.trim());
    });

    return cookieJar;
  }  
  function getTelenorLoggedInCookies(requestCookiesString) {
    var cookieJar = {};
    if (!requestCookiesString) return cookieJar;

    requestCookiesString.split(';').forEach(function(requestCookieString) {
      addTelenorLoggedInCookie(cookieJar, requestCookieString.trim());
    });

    return cookieJar;
  }  
  function formatCookieString(cookieJar) {
    var cookieString = '';
    for (var key in cookieJar)
        cookieString += key + '=' + cookieJar[key] + '; ';
    cookieString = cookieString.substring(0, cookieString.length - 2);
    return cookieString;
  }
  function formatSetCookieString(cookieJar) {
    var jar = [];
    for (var key in cookieJar)
        jar.push(key + '=' + cookieJar[key]);
    return jar;
  }
  function printCookies(cookieJar) {
      debugLog('Cookie Jar: ' + formatCookieString(cookieJar));
  }
  function addCookies(cookieJar, cookies) {
    if (cookies == null) return;
    for (var i = 0; i < cookies.length; i++) {
        addCookie(cookieJar, cookies[i]);
    }
  }
  function addTelenorLoggedInCookie(cookieJar, cookieString) {
    var key = cookieString.substring(0, cookieString.indexOf('='));

    if (key == 'JSESSIONID' || key == 'dtCookie' || key == 'LB' || key == 'AUTH_SESSION_ID')
         addCookie(cookieJar, cookieString);
  }
  function addCookie(cookieJar, cookieString) {
    var key = cookieString.substring(0, cookieString.indexOf('='));

    if (key == 'TELENOR_MINESIDER_REMEMBERME_COOKIE' || key == 'TELENOR_MINESIDER_WIZARD_COOKIE') return;
    var value = cookieString.substring(cookieString.indexOf('=') + 1);
    var optionsIndex = value.indexOf(';');
    if (optionsIndex != -1) value = value.substring(0, optionsIndex);

    debugLog('addCookie', cookieString, key, value);

    cookieJar[key] = value;
  }

      function notLoggedIn(html) {
      var matchPhase = -1;
      var notLoggedInStatus = false;
      var htmlParser = new parse5.SimpleApiParser({
        startTag : function(tagName, attrs, selfClosing) {
          if (matchPhase == -1)
             if (tagName == 'title') matchPhase++;
        },
        text : function(text) {
          if (matchPhase == 0)
             if (text == 'Logg inn hos Telenor') {
                notLoggedInStatus = true;
                matchPhase++;
                return;
             }
        },
        endTag : function(tagName) {
        }
      });
      htmlParser.parse(html);

      return notLoggedInStatus;
    }

    function technicalProblem(html) {
      var matchPhase = -1;
      var problemMessage = null;
      var htmlParser = new parse5.SimpleApiParser({
        startTag : function(tagName, attrs, selfClosing) {
          if (matchPhase == -1)
          if (tagName == 'div') {
             for (var i = 0; i < attrs.length; i++)
                 if (attrs[i].name == 'class' && attrs[i].value == 'servererror')
                    matchPhase++;
          }
        },
        text : function(text) {
          if (matchPhase == 0) {
             problemMessage = text;
             matchPhase++;
          }
        }
      });
      htmlParser.parse(html);
      return problemMessage;
    }

  var initialHttpsOptions = {
      rejectUnauthorized : false,
      headers : {'Content-Type' : 'application/x-www-form-urlencoded',
        'Accept' : '*/*', 
        'Accept-Encoding' : 'gzip, deflate, sdch',
        'Accept-Language' : 'en-US,en;q=0.8,nb;q=0.6,sv;q=0.4,da;q=0.2',
         'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
      },
      keepAlive : true
    };

  return {
    fullTelenorRequest : fullTelenorRequest,
    telenorRequest : telenorRequest,
    notLoggedIn : notLoggedIn,
    technicalProblem : technicalProblem,
    prepareNotLoggedInResponse : prepareNotLoggedInResponse,    
    prepareTechnicalProblemResponse : prepareTechnicalProblemResponse,
    prepareResponse : prepareResponse,
    urlencode : function(obj) {
      var str = [];
      for (var p in obj)
          str.push(encodeURIComponent(p) + '='+ encodeURIComponent(obj[p]));
      return str.join('&').replace(/%20/g, '+');
    },
    formatCookieString : formatCookieString,
    formatSetCookieString : formatSetCookieString,
    debugLog : debugLog,
    httpsOptions :  initialHttpsOptions,
    setDebug : function(_debug, prefix) {debug = _debug; debugPrefix = prefix; },
    optionsOk : function(msg) {
      return (msg.options && msg.options.httpsOptions);
    }
  };
}());
