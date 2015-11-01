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

var parse5 = require('parse5');

var DEBUG_PREFIX = '[hrg: portschedule]';

module.exports = function(RED) {

  var https = require('https');

  function HRGPortSchedule(config) {
    RED.nodes.createNode(this, config);

    this.season = config.season;
    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;
    var seasons = ['Current', 'Spring', 'Summer', 'Autumn', 'Winter'];

    this.on('input', function(msg) {
      var season = msg.season || msg.payload.season || node.season || 'Current';
      var errorResponse;

      if (seasons.indexOf(season) == -1) {
         errorResponse = {error : true, errorMessage : 'Illegal season: ' + season + ' (legal: Current, Spring, Summer, Autumn, Winter)'};
         msg.payload = errorResponse;
         node.status({fill : 'red', shape : 'dot', text : 'Error' + errorResponse.errorMessage});
         node.error(JSON.stringify(errorResponse), msg);
         return;
      }
      node .status({fill : 'green', shape : 'ring', text : 'Fetching port '+ season + 'schedule...'});

      var url = 'https://www.hurtigruten.com/pages/practical-information/sailing-plan/';
      url += season != 'Current' ? '?season=' + season : '';

      debugLog('url', url);

      https.get(url, function(res) {
        var payload = '';
        res.setEncoding('utf8');
        debugLog('Got response: ' + res.statusCode);

        res.on('data', function(chunk) {
          payload += chunk;
          debugLog('BODY CHUNK: ' + chunk);
          debugLog('PAYLOAD: ' + payload);
        });
        res.on('end', function() {
          debugLog('END BODY: ' + payload);
          msg.statusCode = res.statusCode;
          try {
            var portSchedules = { season : season, schedules : getHRGPortSchedule(payload)};
            msg.payload = JSON.stringify(portSchedules);

            if (!msg.headers) msg.headers = [];
            msg.headers['Content-Length'] = Buffer.byteLength(msg.payload, ['utf8']);
            msg.headers['Content-Type'] = 'application/json; charset=UTF-8';
            node.status({fill : 'green', shape : 'dot', text : 'Success'});
            node.send(msg);
          } catch (error) {
            console.log('=====> Catch hrg port schedule error:', error);
            console.log('=====> Catch hrg port schedule error stack:', error.stack);
            node.status({fill : 'red', shape : 'dot', text : 'Error ' + error});
            portSchedules = [];
            msg.payload = JSON.stringify(portSchedules);
            if (!msg.headers) msg.headers = [];
            msg.headers['Content-Length'] = Buffer.byteLength(msg.payload, ['utf8']);
            msg.headers['Content-Type'] = 'application/json; charset=UTF-8';
            node.status({fill : 'red', shape : 'dot', text : 'Error' + error});
            errorResponse = JSON.stringify({error : true, errorMessage : error});
            node.error(errorResponse, msg);
          }
        });
      }).on('error', function(error) {
        debugLog('Got error: ' + error.message);
        node.status({fill : 'red', shape : 'dot', text : 'Error' + error});
        errorResponse = JSON.stringify({error : true, errorMessage : error});
        node.error(errorResponse, msg);
      });
    });

    function debugLog() {
      if (node.debug) {
         Array.prototype.unshift.call(arguments, DEBUG_PREFIX);
         console.log.apply(null, arguments);
      }
    }
  }

  RED.nodes.registerType('portschedule', HRGPortSchedule);
};

  function _trimWhitespace(str) {
    return str.trim().replace(/(\r\n|\n|\r)/gm, '');
  }

  function getHRGPortSchedule(html) {
    var debug = false;
    var matchColumn = -1;
    var portSchedules = {}, shipSchedule;
    var port, i;
    var direction = null, shipDirection;

    var htmlParser = new parse5.SimpleApiParser({
      startTag : function(tagName, attrs, selfClosing) {
        if (matchColumn == -1) {
           if (tagName == 'div') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'data-direction' && (attrs[i].value == 'NORTHBOUND' || attrs[i].value == 'SOUTHBOUND')) {
                     direction = attrs[i].value.toLowerCase();
                     portSchedules[direction] = [];
                     matchColumn++;
                     break;
                  }
           }
        } else if (matchColumn == 0) {
           if (tagName == 'div') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'data-port-code') matchColumn++;
           }
        } else if (matchColumn == 1) {
           if (tagName == 'span') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && attrs[i].value == 'schedule-list-port')
                     matchColumn++;
           }
        } else if (matchColumn == 3) {
           if (tagName == 'span') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && attrs[i].value == 'schedule-list-arrival')
                     matchColumn++;
           }
        } else if (matchColumn == 5) {
           if (tagName == 'span') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && attrs[i].value == 'schedule-list-departure')
                     matchColumn++;
           }
        } else if (matchColumn == 7) {
           if (tagName == 'span') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && _trimWhitespace(attrs[i].value) ==  'schedule-list-deviations')
                     matchColumn++;
           }
        } else if (matchColumn == 9) {
           if (tagName == 'div') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && attrs[i].value == 'schedule-inner-list')
                     matchColumn++;
           }
        } else if (matchColumn == 10) {
           if (tagName == 'th') matchColumn++;
        } else if (matchColumn == 12) {
           if (tagName == 'tbody') matchColumn++;
           else if (tagName == 'div')
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'data-port-code') matchColumn = 1;
        } else if (matchColumn == 13) {
           if (tagName == 'td') matchColumn++;
           else if (tagName == 'th') matchColumn = 11;
           else if (tagName == 'div') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'data-direction' && (attrs[i].value == 'NORTHBOUND' || attrs[i].value == 'SOUTHBOUND')) {
                     direction = attrs[i].value.toLowerCase();
                     portSchedules[direction] = [];
                     if (debug) console.log(JSON.stringify(port));
                     matchColumn = 0;
                     break;
                  }
           } else if (tagName == 'span') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && attrs[i].value == 'schedule-list-port')
                     matchColumn = 2;
           }
        } else if (matchColumn == 15) {
           if (tagName == 'td') matchColumn++;
        } else if (matchColumn == 17) {
           if (tagName == 'td') matchColumn++;
        }
      },
      text : function(text) {
        if (matchColumn == 2) {
           port = {};
           port.name = _trimWhitespace(text);
           matchColumn++;
           if (debug) console.log(text);
        } else if (matchColumn == 4) {
           port.arrival = _trimWhitespace(text);
           matchColumn++;
           if (debug) console.log(text);
        } else if (matchColumn == 6) {
           port.departure = _trimWhitespace(text);
           matchColumn++;
           if (debug) console.log(text);
        } else if (matchColumn == 8) {
           port.deviations = _trimWhitespace(text);
           portSchedules[direction].push(port);
           matchColumn++;
           if (debug) console.log(text);
        } else if (matchColumn == 11) {
           shipDirection = _trimWhitespace(text);
           if (!port.shipSchedules) port.shipSchedules = {};

           port.shipSchedules[shipDirection] = [];
           matchColumn++;
           if (debug) console.log(text);
        } else if (matchColumn == 14) {
           shipSchedule = {};
           shipSchedule.name = _trimWhitespace(text);
           matchColumn++;
           if (debug) console.log(text);
        } else if (matchColumn == 16) {
           shipSchedule.date = _trimWhitespace(text);
           matchColumn++;
           if (debug) console.log(text);
        } else if (matchColumn == 18) {
           shipSchedule.time = _trimWhitespace(text);
           port.shipSchedules[shipDirection].push(shipSchedule);
           matchColumn = 13;
           if (debug) console.log(text);
        }
      },
//      endTag : function(tagName) {
//      }
    });
    htmlParser.parse(html);

    return portSchedules;
  }
