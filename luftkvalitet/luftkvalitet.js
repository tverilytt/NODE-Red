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

/*global module */
  /*jshint devel : true*/

'use strict';

const log4js = require('log4js');
log4js.configure({
  appenders: { console: { type: 'file', filename: 'luftkvalitet.log' } },
  categories: { default: { appenders: ['console'], level: 'debug' } }
});
const logger = log4js.getLogger('console');
logger.level = 'debug';
console.trace = logger.debug.bind(logger);
console.debug = logger.debug.bind(logger);
console.info = logger.info.bind(logger);
console.log = logger.info.bind(logger);
console.warning= logger.info.bind(logger);
console.error = logger.info.bind(logger);
console.fatal = logger.info.bind(logger);

module.exports = (function() {

  const fetch = require('node-fetch');

  const luftkvalitetAPI = 'https://api.nilu.no/';
  const DEBUG_PREFIX = '[luftkvalitet: luftkvalitet]';

  function checkFetchStatus(response) {
    debugLog('Headers', response.headers.raw());

    debugLog('checkFetchStatus', response.ok, response.status, response.statusText);
    if (response.ok) { // res.status >= 200 && res.status < 300
        return response;
    } else {
        throw new Error(JSON.stringify({ status : response.status, statusText : response.statusText }));
    }
  }

  function debugLog(...args) {
    console.debug(DEBUG_PREFIX, ...args);
  }
  
  return {
    setDebugLogging : function(debug) {
      logger.level = debug ? 'debug' : 'error';
    },

    validLatitude : function(latitude) {
      var n = parseFloat(latitude);
      return n <= 90 && n >= -90;
    },
    validLongitude : function(longitude) {
      var n = parseFloat(longitude);
      return n <= 180 && n >= -180;
    },

    getCoordinates : function(parameters) {
      var coordinates = '';
      if (parameters.latitude && parameters.longitude) {
         coordinates +=  '/' + parameters.latitude + '/' + parameters.longitude;
         if (parameters.radius) {
            coordinates += '/' + parameters.radius;
            if (parameters.within)
               coordinates += '?method=within';
         }
      }
      return coordinates;
    },

    getStation : function(parameters) {
      if (parameters.station) return '/' + encodeURIComponent(parameters.station);
    },
    
    getTimePeriod : function(parameters) {
      var period = '';
      if (parameters.fromtime && parameters.totime) {
         period +=  '/' + parameters.fromtime + '/' + parameters.totime;
      }
      return period;
    },

    getLookupQueryParameters : function(parameters) {
      var queryURI = '/' + parameters.metadata;

      if (parameters.area) queryURI += '?area=' + encodeURIComponent(parameters.area);

      if (parameters.parameter) {
         var prefix = parameters.area ? '&' : '?';
         queryURI += prefix + 'components=' + parameters.parameter;
      }
      return queryURI;
    },

    getQueryParameters : function(parameters) {
      var prefix = '?';
      var queryURI = this.getTimePeriod(parameters);

      if (parameters.station)
         queryURI += this.getStation(parameters);
      else {
         if (parameters.latitude) {
            queryURI += this.getCoordinates(parameters);
            if (parameters.within) prefix = '&';
         } else {
            if (parameters.areas) {
               queryURI += prefix + 'areas=' + encodeURIComponent(parameters.areas);
               prefix = '&';
            }
            if (parameters.stations) {
               queryURI += prefix + 'stations=' + encodeURIComponent(parameters.stations);
               prefix = '&';
            }
         }
      }
      
      if (parameters.parameter) {
         queryURI += prefix + 'components=' + parameters.parameter;
      }
      return queryURI;
    },

    luftkvalitetAPI : function(operation, queryParameters, options) {
      return new Promise(function(resolve, reject) {
        var url = luftkvalitetAPI + operation +  queryParameters;
//        url = 'http://127.0.0.1:1880/errortest/';
        debugLog('URL', 'luftkvalitetAPI', url);
        fetch(url, options)
        .then(checkFetchStatus)
        .then(responseBody => {
          debugLog('luftkvalitetAPI', 'fetch responseBody', responseBody);
          responseBody.text()
          .then(text => {
            try {
              resolve(JSON.parse(text));
            } catch(error) {
              debugLog('luftkvalitetAPI', 'json parse error', error);
              debugLog('luftkvalitetAPI', 'text body', text);
              reject({ error : error, body : text });
            }
          })
          .catch(error => { 
            debugLog('luftkvalitetAPI', 'text body error', error);
            reject(error);
          });
        }, error => {
          console.error('luftkvalitet.js', 'luftkvalitetAPI', 'Error in checkFetchStatus', error);
          reject(error);
        })
        .catch(error => {
          console.error('luftkvalitet.js', 'luftkvalitetAPI','catch error', error);
          reject(error);
        });
      });
    }

  };
}());