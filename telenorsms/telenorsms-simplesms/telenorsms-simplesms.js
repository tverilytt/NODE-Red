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

var telenorsms = require('../telenorsms-common.js');

var DEBUG_PREFIX = '[telenorsms: simplesms]';

module.exports = function(RED) {

  var https = require('https');

  function TelenorSMSSimpleSMS(config) {
    RED.nodes.createNode(this, config);

    this.sender = config.sender;
    this.password = config.password;
    this.recipients = config.recipients;
    this.message = config.message;
    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    var telenorSimpleSMSURL = 'https://telenormobil.no/smapi/3/sms?sId=1000000000';

    this.on('input', function(msg) {
      node.status({fill : 'green', shape : 'ring', text : 'Sending SMS...'});

      telenorsms.setDebug(node.debug, node.debugPrefix);

      var sender = msg.sender || msg.payload.sender || node.sender;
      var password = msg.password || msg.payload.password || node.password;
      var recipients = msg.recipients || msg.payload.recipients || node.recipients;
      var message = msg.message || msg.payload.message || node.message;

      debugLog('Sender', sender, 'Recipients', recipients, 'Message', message);

      if (!sender) {
         msg.payload = JSON.stringify({sent : false, messageStatus : 'No sender, no SMS sent.'});
         node.status({fill : 'yellow', shape : 'dot', text : 'No sender'});
         node.send(msg);
         return;
      } else if (!password) {
         msg.payload = JSON.stringify({sent : false, messageStatus : 'No password, no SMS sent.'});
         node.status({fill : 'yellow', shape : 'dot', text : 'No password'});
         node.send(msg);
         return;
      } else if (!recipients) {
         msg.payload = JSON.stringify({sent : false, messageStatus : 'No recipient(s), no SMS sent.'});
         node.status({fill : 'yellow', shape : 'dot', text : 'No recipient(s)'});
         node.send(msg);
         return;
      } else if (!message) {
         msg.payload = JSON.stringify({sent : false, messageStatus : 'No message, no SMS sent.'});
         node.status({fill : 'yellow', shape : 'dot', text : 'No message'});
         node.send(msg);
         return;
      }

      var url = telenorSimpleSMSURL + '&sender=' + sender;
      url += '&password=' + password;
      url += '&recipients=' + recipients;
      url += '&content=' + message;

      debugLog('Request URL', url);

      try {
        var request = https.get(url, function(response) {
          var payload = '';
          debugLog('=====>  Response statusCode: ', response.statusCode);
          debugLog('=====>  Response headers: ', response.headers);

          response.setEncoding('utf8');

          response.on('data', function(chunk) {
            payload += chunk;
         });

          response.on('error', function(error) {
            debugLog('=====> response on error:', error);
            node.status({fill : 'red', shape : 'dot', text : 'Error'});
            node.error(error);
          });

          response.on('end', function() {
            debugLog('=====> response on end:');
            msg.statusCode = response.statusCode;
            msg.headers = response.headers;
            if (payload.indexOf('processed=\"FAILED\"') != -1) {
               payload = {sent : false, smapixml : payload};
            debugLog('red payload', payload);
               node.status({fill : 'red', shape : 'dot', text : 'Failed'});
            }
            else if (payload.indexOf('processed=\"OK\"') != -1) {
               payload = {sent : true, smapixml : payload};
            debugLog('green payload', payload);
               node.status({fill : 'green', shape : 'dot', text : 'Success'});
            }
            else {
               payload = {sent : false, smapixml : payload};
            debugLog('yellow payload', payload);
               node.status({fill : 'yellow', shape : 'dot', text : 'Unknown'});
            }
            msg.payload = JSON.stringify(payload);
            msg.headers['Content-Type'] = 'application/json; charset=UTF-8';
            msg.headers['Content-Length'] = Buffer.byteLength(msg.payload, ['utf8']);
            debugLog('Response payload', payload);
            node.send(msg);
          });
        });

        request.on('error', function(error) {
          debugLog('=====> request on error:', error);
          node.status({fill : 'red', shape : 'dot', text : 'Error'});
          node.error(error);
        });
      } catch(error) {
        debugLog('=====> Catch https.request error:', error);
        node.status({fill : 'red', shape : 'dot', text : 'Error'});
        node.error(error);
      }
    });

    function debugLog() {
      var array = Array.prototype.slice.call(arguments);
      telenorsms.debugLog.apply(null, array);
    }
  }

  RED.nodes.registerType('simplesms', TelenorSMSSimpleSMS);
};
