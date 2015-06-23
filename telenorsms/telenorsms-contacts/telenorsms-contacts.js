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

var DEBUG_PREFIX = '[telenorsms: contacts]';

module.exports = function(RED) {

  var url = require('url');

  function TelenorContacts(config) {
    RED.nodes.createNode(this, config);

    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    var telenorSMSURL = 'https://www.telenor.no/privat/minesider/abonnement/mobil/umstjeneste/initUmsTjeneste.cms?setCurrentLocationToReturnOfFlow=true&umsUrl=SEND_SMS';
    var telenorContactsURL = 'https://telenormobil.no/norm/win/sms/async/addresslist.do';

    this.on('input', function(msg) {
      node .status({fill : 'green', shape : 'ring', text : 'Fetching contacts...'});
      telenorsms.fullTelenorRequest(node, msg, telenorSMSURL, telenorContactsURL, function(payload){
        return {contacts : getContacts(payload)};
      });
    });

    function debugLog() {
      var array = Array.prototype.slice.call(arguments);
      telenorsms.debugLog.apply(null, array);
    }
  }

  RED.nodes.registerType('contacts', TelenorContacts);
};

  function getContacts(html) {
    var matchColumn = -1;
    var contacts = [];
    var contact, i;
    var htmlParser = new parse5.SimpleApiParser({
      startTag : function(tagName, attrs, selfClosing) {
        if (matchColumn == -1) {
           if (tagName == 'select') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'id' && attrs[i].value == 'addressList')
                     matchColumn = 0;
           }
        } else if (tagName == 'option') {
           if (matchColumn == 0) {
              contact = {};
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'value')
                     contact.number = attrs[i].value;
              matchColumn++;
           }
        }
      },
      text : function(text) {
        if (matchColumn == 1) {
           if (!contact.name) contact.name = text;
           contacts.push(contact);
           matchColumn = 0;
        }
      },
      endTag : function(tagName) {
      }
    });
    htmlParser.parse(html);

    return contacts;
  }
