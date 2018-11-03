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

var DEBUG_PREFIX = '[telenorsms: smsarchive]';

module.exports = function(RED) {

  var url = require('url');

  function TelenorSMSArchive(config) {
    RED.nodes.createNode(this, config);

    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    var telenorSMSURL = 'https://www.telenor.no/privat/minesider/abonnement/mobil/umstjeneste/initUmsTjeneste.cms?setCurrentLocationToReturnOfFlow=true&umsUrl=SEND_SMS';
    var telenorSMSArchiveURL = 'https://telenormobil.no/norm/win/sms/store/outbox/view.do';

    this.on('input', function(msg) {
      node.status({fill : 'green', shape : 'ring', text : 'Fetching SMS archive...'});
      telenorsms.fullTelenorRequest(node, msg, telenorSMSURL, telenorSMSArchiveURL, function(payload){
        return {smsarchive : getSMSArchive(payload)};
      });
    });

    function debugLog() {
      var array = Array.prototype.slice.call(arguments);
      telenorsms.debugLog.apply(null, array);
    }
  }

  RED.nodes.registerType('smsarchive', TelenorSMSArchive);
};

  function getSMSArchive(html) {
    var matchColumn = -1;
    var smss = [];
    var sms;
//    var htmlParser = new parse5.SimpleApiParser({
//      startTag : function(tagName, attrs, selfClosing) {
    var htmlParser = new parse5.SAXParser();

    htmlParser.on('startTag', function(tagName, attrs) {
        if (matchColumn == -1) {
           if (tagName == 'input') {
              for (var i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'name' && attrs[i].value == 'smslist')
                     matchColumn = 0;
           }
        } else if (tagName == 'td') {
           if (matchColumn == 0) sms = {};
           matchColumn++;
        }
      });
//      text : function(text) {
    htmlParser.on('text', function(text) {
        if (matchColumn > -1)        
           if (matchColumn == 1) {
              if (!sms.to) sms.to = text;
           } else if (matchColumn == 2) {
              if (!sms.message) sms.message = text;
              else sms.message += text;
           } else if (matchColumn == 3) {
              if (!sms.date) {
                 sms.date = text;
                 sms.message = sms.message.trim().replace(/(\r\n|\n|\r)/gm, '');
                 smss.push(sms);
                 matchColumn = -1;
              }
           }
      });

//    htmlParser.parse(html);
    htmlParser.write(html);

    return smss;
  }
