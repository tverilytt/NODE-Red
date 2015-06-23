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

/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var parse5 = require('parse5');

var telenorsms = require('../telenorsms-common.js');

var DEBUG_PREFIX = '[telenorsms: logout]';

module.exports = function(RED) {

  var url = require('url');

  function TelenorSMSLogout(config) {
    RED.nodes.createNode(this, config);

    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    var telenorLogoutURL = 'https://www.telenor.no/privat/minesider/logout';

    this.on('input', function(msg) {
      node .status({fill : 'green', shape : 'ring', text : 'Logging out...'});

      telenorsms.setDebug(node.debug, node.debugPrefix);

      var httpsOptions = telenorsms.httpsOptions;
      var urlObj = url.parse(telenorLogoutURL);

      debugLog('==========> START LOGOUT <==========');

      httpsOptions.hostname = urlObj.hostname;
      httpsOptions.path = urlObj.path;
      httpsOptions.method = 'GET';

      httpsOptions.headers['Host'] = httpsOptions.hostname;

      msg.options = {}; msg.options.httpsOptions = httpsOptions;
      msg.options.telenorcookies = [];

      telenorsms.telenorRequest(node, msg, function(node, responsemsg, payload, headers) {
          responsemsg.payload = payload;

          var logoutStatus = getLogoutStatus(payload);
          debugLog('Logout status:', logoutStatus);

          responsemsg.payload = JSON.stringify({loggedIn : false, logoutStatus : logoutStatus});
          headers['Content-Length'] = Buffer.byteLength(responsemsg.payload, ['utf8']);
          headers['Content-Type'] = 'application/json; charset=UTF-8';
          responsemsg.headers = headers;
          responsemsg.headers['set-cookie'] = telenorsms.formatCookieString(responsemsg.options.telenorcookies);
          debugLog('=====> response on end: node.send payload length', responsemsg.payload.length, responsemsg.payload);
          debugLog('Cookie jar', responsemsg.options.telenorcookies);
          debugLog('==========> END LOGOUT - Success <==========');
          node .status({fill : 'green', shape : 'dot', text : 'Logged out'});
          node.send(responsemsg);
        });
    });

    function debugLog() {
      var array = Array.prototype.slice.call(arguments);
      telenorsms.debugLog.apply(null, array);
    }
  }

  RED.nodes.registerType('logout', TelenorSMSLogout);
};

  function getLogoutStatus(html) {
    var matchPhase = -1;
    var logoutMessage = null;
    var htmlParser = new parse5.SimpleApiParser({
      startTag : function(tagName, attrs, selfClosing) {
        if (matchPhase == -1)
           if (tagName == 'div') {
              for (var i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'id' && attrs[i].value == 'notificationLogout')
                     matchPhase++;
           }
      },
      text : function(text) {
        if (matchPhase == 0) {
           logoutMessage = text;
           matchPhase++;
        }
      },
      endTag : function(tagName) {
      }
    });
    htmlParser.parse(html);

    return logoutMessage;
  }
