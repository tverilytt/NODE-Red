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

var DEBUG_PREFIX = '[yr: weather-info]';
var unknownResult = { 'yr' : 'Unknown', 'meteogram' : 'Unknown', 'weather-data' : 'Unknown' , 'place' : 'No geoname for this location'};
var meteogram = 'meteogram.png';

module.exports = function(RED) {

  var http = require('http');

  function YrWeatherInfo(config) {
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
           path: yrURI + meteogram,
           method: 'HEAD'
         };

         var request = http.request(options, function(res) {
           res.setEncoding('utf8');
           debugLog('Got response: ' + res.statusCode);

           msg.statusCode = res.statusCode;

           if (res.statusCode === 200) {
              var yrInfo = getYrInfo(yrURI, geonames[0]);
              debugLog('HTTP 200 OK: yr info: ' + JSON.stringify(yrInfo));
              msg.payload = yrInfo;
              node.send(msg);
           }
           else if (res.statusCode === 404) {
              debugLog('HTTP status: ' + res.statusCode);
              debugLog('status == 404: yr URI: ' + yrURI);
              msg.payload = unknownResult;
              msg.statusCode = 200;
              node.send(msg);
           }
           else {
              debugLog('HTTP status: ' + res.statusCode);
              debugLog('status != 200: yr URI: ' + yrURI);
              msg.payload = unknownResult;
              node.send(msg);
           }

           res.on('data', function() {
             debugLog('DATA HEAD');
           });
           res.on('end', function() {
             debugLog('END HEAD');
           });
         });

         request.end();

         request.on('error', function(error) {
           debugLog('http request, on error: ' + error.message);
           node.error(JSON.stringify(error));
         });
      } else {
         debugLog('Yr URI unknown');
         msg.payload = unknownResult;
         node.send(msg);
      }
    });

    function debugLog() {
      if (node.debug) {
         Array.prototype.unshift.call(arguments, DEBUG_PREFIX);
         console.log.apply(null, arguments);
      }
    }

    function getYrInfo(uri, geoinfo) {
      var baseURL = 'http://' + yrCommon.yrHost + uri;
      var place = '';
      place += geoinfo.toponymName ? geoinfo.toponymName : '';
      place += geoinfo.adminName1 ? ',' + geoinfo.adminName1 : '';
      place += geoinfo.countryName ? ',' + geoinfo.countryName : '';
      if (place === '') place = 'No geoname for this location';

      return { 'yr' : baseURL, 'meteogram' : baseURL + 'meteogram.png', 'weather-data' : baseURL + 'forecast.xml' , 'place' : place,
        'latitude' : geoinfo.lat, 'longitude' : geoinfo.lng };
    }
  }
  RED.nodes.registerType('weather info', YrWeatherInfo);
};
