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

var yrCommon = require('../yr-common.js');

var DEBUG_PREFIX = '[yr: weather-data]';
var xmldata = 'forecast.xml';

module.exports = function(RED) {

  var http = require('http');

  function YrWeatherData(config) {
    RED.nodes.createNode(this, config);

    this.debug = config.debug;
    var node = this;

    this.on('input', function(msg) {
      var geonames = msg.geonames || msg.payload.geonames;

      debugLog(JSON.stringify(geonames));

      var yrURI = yrCommon.getYrURI(geonames);

      debugLog('yr URI: ', yrURI);

      if (yrURI) {
         var options = {
           hostname: yrCommon.yrHost,
           port: 80,
           path: yrURI + xmldata,
           method: 'GET'
         };

         var request = http.request(options, function(res) {
           var payload = '';
           res.setEncoding('utf8');
           debugLog('Got response status code: ' + res.statusCode);

           res.on('data', function(chunk) {
             payload += chunk;
             debugLog('BODY CHUNK: ' + chunk);
             debugLog('PAYLOAD: ' + payload);
           });
           res.on('end', function() {
             debugLog('END BODY: ' + payload);
             if (res.statusCode === 200)
                msg.headers = {'Content-Type' : 'text/xml; charset=utf-8'};
             else if (res.statusCode === 404) {
                msg.headers = {'Content-Type' : 'text/html; charset=utf-8'};
                msg.statusCode = 200;
             } else
                msg.headers = {'Content-Type' : 'text/html; charset=utf-8'};
             msg.statusCode = res.statusCode;
             msg.payload = payload;
             node.send(msg);
           });
         }).on('error', function(error) {
           debugLog('http request, on error: ' + error.message);
           node.error(JSON.stringify(error));
         });
         request.end();
      } else {
         debugLog('Yr URI unknown');
         msg.headers = {'Content-Type' : 'text/xml; charset=utf-8'};
         msg.payload = '<?xml version="1.0" encoding="UTF-8"?><unknownYr URI unknown</unknown>';
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
  RED.nodes.registerType('weather data', YrWeatherData);
};
