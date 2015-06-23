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

var DEBUG_PREFIX = '[telenorsms: smscount]';

module.exports = function(RED) {

  function TelenorSMSCount(config) {
    RED.nodes.createNode(this, config);

    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    var telenorSMSURL = 'https://www.telenor.no/privat/minesider/abonnement/mobil/umstjeneste/initUmsTjeneste.cms?setCurrentLocationToReturnOfFlow=true&umsUrl=SEND_SMS';
    var telenorSMSCountURL = 'https://telenormobil.no/norm/win/sms/send/popup/counter.do';

    this.on('input', function(msg) {
      node .status({fill : 'green', shape : 'ring', text : 'Fetching free SMSs left...'});
      telenorsms.fullTelenorRequest(node, msg, telenorSMSURL, telenorSMSCountURL, function(payload){
        return {freesms : getFreeSMSleft(payload)};
      });
    });

    function debugLog() {
      var array = Array.prototype.slice.call(arguments);
      telenorsms.debugLog.apply(null, array);
    }
  }

  RED.nodes.registerType('smscount', TelenorSMSCount);
};

  function getFreeSMSleft(html) {
    var matchPhase = -1;
    var freeSMS = null;
    var htmlParser = new parse5.SimpleApiParser({
      startTag : function(tagName, attrs, selfClosing) {
        if (matchPhase == -1)
           if (tagName == 'div') {
              for (var i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'id' && attrs[i].value == 'normContent')
                     matchPhase++;
        }
      },
      text : function(text) {
        if (matchPhase == 0) {
           freeSMS = text.substring(text.lastIndexOf(':') + 1).trim();
           matchPhase++;
        }
      },
      endTag : function(tagName) {
      }
    });
    htmlParser.parse(html);

    return freeSMS;
  }

