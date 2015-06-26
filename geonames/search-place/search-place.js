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

var geoCommon = require('../geonames-common.js');

var DEBUG_PREFIX = '[geonames: search-place]';

module.exports = function(RED) {

  var http = require('http');

  function SearchPlace(config) {
    RED.nodes.createNode(this, config);

    this.query = config.query;
    this.maxrows = config.maxrows;
    this.style = config.style;
    this.username = config.username;
    this.debug = config.debug;

    var node = this;

    this.on('input', function(msg) {
      var query = msg.query || msg.payload.query || node.query;
      var maxrows = msg.maxrows || msg.payload.maxrows || node.maxrows;
      var username = msg.username || msg.payload.username || node.username;
      var style = msg.style || msg.payload.style || node.style;

      if (geoCommon.setBaseParameters(node, username, style) && geoCommon.setQueryParameters(node, query, maxrows)) {
         var geonamesURL = getGeonamesSearchPlaceURL(node.username, node.style, node.query, node.maxrows);

         debugLog('geonames URL:', geonamesURL);

         http.get(geonamesURL, function(res) {
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
             msg.payload = JSON.parse(payload);
             node.send(msg);
           });
         }).on('error', function(error) {
           debugLog('Got error: ' + error.message);
           node.error(JSON.stringify(error));
         });
      } else {
        msg.payload = {'error' : 'Query cannot be empty, maxrows must be an integer, style must be one of SHORT, MEDIUM, LONG or FULL.',
          'query' : query, 'maxrows' : maxrows, 'style' : style};
        node.send(msg);
      }
    });

    function debugLog() {
      if (node.debug) {
         Array.prototype.unshift.call(arguments, DEBUG_PREFIX);
         console.log.apply(null, arguments);
      }
    }
  }

  RED.nodes.registerType('search place', SearchPlace);
};

function getGeonamesSearchPlaceURL(username, style, query, maxrows) {
  var geonamesurl = geoCommon.getGeonamesBaseURL('searchJSON', username, style);

  if (maxrows === undefined) maxrows = 10;

  geonamesurl += '&maxRows=' + maxrows;
  geonamesurl += '&q=' + (isEncoded(query) ? query : encodeURIComponent(query));
    
  return geonamesurl;
}

// http://stackoverflow.com/questions/1275948/how-to-detect-if-a-string-is-encoded-with-escape-or-encodeuricomponent
function isEncoded(str) {
    return typeof str == 'string' && decodeURIComponent(str) !== str;
}
