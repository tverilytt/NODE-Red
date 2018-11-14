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
  appenders: { console: { type: 'file', filename: 'openaq.log' } },
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

  const openaqAPI = 'https://api.openaq.org/v1/';
  const DEBUG_PREFIX = '[openaq: openaq]';

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

    getOrderByQueryString : function(orderbys) {
      var orders = orderbys
        .filter(field => field.orderby);
      var multi = orders.length > 1 ? '[]' : '';
      return orders
        .map(field => {
          return '&order_by' + multi + '=' + field.orderby +
            (field.sort ? '&sort' + multi + '=' + field.sort : '');
        })
        .join('');
    },

    getOrderByConfigAsJSON : function(config) {
      var orderbys = Object.keys(config)
        .filter(key => key.startsWith('orderby'))
        .filter(key => config[key]);
      return orderbys.map(orderby => {
        var fieldName = orderby.split('_')[1];
        debugLog('--->', orderby, fieldName);
        return { 
          orderby : fieldName, sort : config['sort_' + fieldName]
        };
      });
    },

    getSimpleQueryParameters : function(simpleParameters) {
      if (!simpleParameters) return '';
      
      return Object.keys(simpleParameters)
      .filter(key => simpleParameters[key])
      .map(key =>
        '&' + key + '=' + encodeURIComponent(simpleParameters[key])
      )
      .join('');
    },

    getCoordinates : function(parameters) {
      if (parameters.latitude && parameters.longitude)
         return 'coordinates=' + parameters.latitude + ',' + parameters.longitude;
      else return '';
    },

    getQueryParameters : function(parameters) {
      var queryURI = '';

      var coordinatesQuery = this.getCoordinates(parameters);
      if (coordinatesQuery.length > 0)
         queryURI = '?' + coordinatesQuery;
      
      var simpleParametersQuery = this.getSimpleQueryParameters(parameters.simpleParameters);
      if (queryURI.length === 0 && simpleParametersQuery.length > 0)
         simpleParametersQuery = '?' + simpleParametersQuery.substring(1);
      debugLog('simple query parameters', simpleParametersQuery);
      queryURI += simpleParametersQuery;

      var orderbyQuery = parameters.orderby;
      if (typeof parameters.orderby === 'string')
         orderbyQuery = parameters.orderby;
      else
         orderbyQuery = this.getOrderByQueryString(parameters.orderby);
      if (queryURI.length === 0 && orderbyQuery.length > 0)
         orderbyQuery = '?' + orderbyQuery.substring(1);
      debugLog('orderby query', orderbyQuery);
      queryURI += orderbyQuery;

      return queryURI;
    },

    openaqAPI : function(operation, queryParameters, options) {
      return new Promise(function(resolve, reject) {
        var url = openaqAPI + operation + queryParameters;
//        url = 'http://127.0.0.1:1880/errortest/';
        debugLog('URL', 'openaqAPI', url);
        fetch(url, options)
        .then(checkFetchStatus)
        .then(responseBody => {
          debugLog('openaqAPI', 'fetch responseBody', responseBody);
          responseBody.text()
          .then(text => {
            try {
              resolve(JSON.parse(text));
            } catch(error) {
              debugLog('openaqAPI', 'json parse error', error);
              debugLog('openaqAPI', 'text body', text);
              reject({ error : error, body : text });
            }
          })
          .catch(error => { 
            debugLog('openaqAPI', 'text body error', error);
            reject(error);
          });
        }, error => {
          console.error('openaq.js', 'openaqAPI', 'Error in checkFetchStatus', error);
          reject(error);
        })
        .catch(error => {
          console.error('openaq.js', 'openaqAPI','catch error', error);
          reject(error);
        });
      });
    }

  };
}());
