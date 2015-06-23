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

var DEBUG_PREFIX = '[telenorsms: sendsms]';

module.exports = function(RED) {

  function TelenorSMSSendSMS(config) {
    RED.nodes.createNode(this, config);

    this.recipients = config.recipients;
    this.message = config.message;
    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    var telenorSMSURL = 'https://www.telenor.no/privat/minesider/abonnement/mobil/umstjeneste/initUmsTjeneste.cms?setCurrentLocationToReturnOfFlow=true&umsUrl=SEND_SMS';
    var telenorSendSMSURL = 'https://telenormobil.no/norm/win/sms/send/process.do';

    this.on('input', function(msg) {
      node.status({fill : 'green', shape : 'ring', text : 'Sending SMS...'});

      telenorsms.setDebug(node.debug, node.debugPrefix);

      var recipients = msg.recipients || msg.payload.recipients || node.recipients;
      var message = msg.message || msg.payload.message || node.message;
      var sendSMSpayload = createSMSpayload(recipients, message);

      debugLog('Recipients', recipients, 'Message', message);

      if (!recipients) {
         msg.payload = {sent : false, messageStatus : 'No recipient(s), no SMS sent.'};
         node.status({fill : 'yellow', shape : 'dot', text : 'No recipient(s)'});
         node.send(msg);
         return;
      } else if (!message) {
         msg.payload = {sent : false, messageStatus : 'No message, no SMS sent.'};
         node.status({fill : 'yellow', shape : 'dot', text : 'No message'});
         node.send(msg);
         return;
      }

      telenorsms.fullTelenorRequest(node, msg, telenorSMSURL, telenorSendSMSURL, function(payload){
        var smsSentPayload = getSendSMSStatus(payload);
        smsSentPayload.recipients = recipients;
        smsSentPayload.message = message;
        return smsSentPayload;
      }, sendSMSpayload);

    });

  function createSMSpayload(recipients, message) {
    return telenorsms.urlencode({
      'toAddress' : recipients, 
      'message' : message, 
      'b_send' : 'Node-RED Send SMS'
    });
  }

    function debugLog() {
      var array = Array.prototype.slice.call(arguments);
      telenorsms.debugLog.apply(null, array);
    }
  }

  RED.nodes.registerType('sendsms', TelenorSMSSendSMS);
};

  function getSendSMSStatus(html) {
    var matchPhase = -1;
    var sendSMSstatus = null;
    var htmlParser = new parse5.SimpleApiParser({
      startTag : function(tagName, attrs, selfClosing) {
        if (matchPhase == -1) {
           if (tagName == 'tbody') matchPhase++;
        } else if (matchPhase == 0) {
           if (tagName == 'td') matchPhase++;
        } else if (matchPhase == 1) {
           if (tagName == 'td') matchPhase++;
        }
      },
      text : function(text) {
        if (matchPhase == 2) {
           var sendSMSstatusText = text.trim();
           if (sendSMSstatusText == 'Sendt')
              sendSMSstatus = {sent : true, messageStatus : sendSMSstatusText};
           else
              sendSMSstatus = {sent : false, messageStatus : sendSMSstatusText};
            matchPhase = -3;
        }
      },
      endTag : function(tagName) {
      }
    });
    htmlParser.parse(html);

    return sendSMSstatus;
  }

