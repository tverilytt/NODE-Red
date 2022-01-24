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

const haversine = require('haversine-distance')

const logger = log4js.getLogger('console');
logger.level = 'debug';
console.trace = logger.debug.bind(logger);
console.debug = logger.debug.bind(logger);
console.info = logger.info.bind(logger);
console.log = logger.info.bind(logger);
console.warning = logger.info.bind(logger);
console.error = logger.info.bind(logger);
console.fatal = logger.info.bind(logger);

const fetch = require('node-fetch');

//  const openaqAPI = 'https://api.openaq.org/v1/';
const openaqAPIURL = 'https://api.openaq.org/v2/';
const DEBUG_PREFIX = '[openaq: openaq]';

function checkFetchStatus(response) {
  debugLog('Headers', response.headers.raw());

  debugLog('checkFetchStatus', response.ok, response.status, response.statusText);
  if (response.ok) { // res.status >= 200 && res.status < 300
    return response;
  } else {
    throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText }));
  }
}

function debugLog(...args) {
  console.debug(DEBUG_PREFIX, ...args);
}

function setDebugLogging(debug) {
  logger.level = debug ? 'debug' : 'error';
}

function validLatitude(latitude) {
  var n = parseFloat(latitude);
  return n <= 90 && n >= -90;
}

function validLongitude(longitude) {
  var n = parseFloat(longitude);
  return n <= 180 && n >= -180;
}

function getOrderByQueryString(orderbys) {
  var orders = orderbys
    .filter(field => field.orderby);
  return orders
    .filter(field => field.orderby !== 'distance') // Open AQ API no longer supports order_by "distance"...
    .map(field => {
      return '&order_by' + '=' + field.orderby +
        (field.sort ? '&sort' + '=' + field.sort : '');
    })
    .join('');
}

function getOrderByConfigAsJSON(config) {
  var orderbys = Object.keys(config)
    .filter(key => key.startsWith('orderby'))
    .filter(key => config[key]);
  return orderbys.map(orderby => {
    var fieldName = orderby.split('_')[1];
    debugLog('--->', orderby, fieldName);
    return {
      orderby: fieldName, sort: config['sort_' + fieldName]
    };
  });
}

function getSimpleQueryParameters(simpleParameters) {
  if (!simpleParameters) return '';

  return Object.keys(simpleParameters)
    .filter(key => simpleParameters[key])
    .map(key =>
      '&' + key + '=' + encodeURIComponent(simpleParameters[key])
    )
    .join('');
}

function getCoordinates(parameters) {
  if (parameters.latitude && parameters.longitude)
    return 'coordinates=' + parameters.latitude + ',' + parameters.longitude;
  else return '';
}

function getQueryParameters(parameters) {
  var queryURI = '';

  var coordinatesQuery = getCoordinates(parameters);
  if (coordinatesQuery.length > 0)
    queryURI = '?' + coordinatesQuery;

  var simpleParametersQuery = getSimpleQueryParameters(parameters.simpleParameters);
  if (queryURI.length === 0 && simpleParametersQuery.length > 0)
    simpleParametersQuery = '?' + simpleParametersQuery.substring(1);
  debugLog('simple query parameters', simpleParametersQuery);
  queryURI += simpleParametersQuery;

  var orderbyQuery = parameters.orderby;
  if (typeof parameters.orderby === 'string')
    orderbyQuery = parameters.orderby;
  else
    orderbyQuery = getOrderByQueryString(parameters.orderby);
  if (queryURI.length === 0 && orderbyQuery.length > 0)
    orderbyQuery = '?' + orderbyQuery.substring(1);
  debugLog('orderby query', orderbyQuery);
  queryURI += orderbyQuery;

  return queryURI;
}

function sortByDistance(locations, origin, sort = 'asc') {
  debugLog('sortByDistance', locations, origin);
  const sortedLocations = locations
    .map(location => Object.assign(location, { distance: haversine(origin, location.coordinates) }))
    .sort((a, b) => a.distance - b.distance);
  return sort === 'desc' ? sortedLocations.reverse() : sortedLocations;
}

function getSortByDistance(queryParameters) {
  return queryParameters && queryParameters.orderby && queryParameters.orderby.find(order => order.orderby === 'distance');
}

function filterMeasurementParameters(measurements, measurementParamenters) {
  return measurements.filter(measurement => measurementParamenters.includes(measurement.parameter));
}

function filterLocationsMeasurementParameters(locations, measurementParamenters) {
  return locations.map(location => {
    return { ...location, ...{ measurements: filterMeasurementParameters(location.measurements, measurementParamenters) }}
  });
}

function openaqAPI(operation, queryParameters, apiURL, options) {
  return new Promise(function (resolve, reject) {
    const measurementParamenters = queryParameters.simpleParameters.parameter ? queryParameters.simpleParameters.parameter.split(',') : undefined;
    if (measurementParamenters) {
      queryParameters.simpleParameters.parameter = measurementParamenters.length === 1 ? measurementParamenters[0] : '';
    }

    var parameters = getQueryParameters(queryParameters);

    debugLog('latest.js', 'openAPI query parameters', queryParameters, 'Config node API URL:', apiURL);

    var url = (apiURL || openaqAPIURL) + operation + parameters;
    debugLog('URL', 'openaqAPI', url);

    fetch(url, options)
      .then(checkFetchStatus)
      .then(responseBody => {
        responseBody.text()
          .then(text => {
            try {
              const response = JSON.parse(text);

              let orderByDistance = null;
              if (orderByDistance = getSortByDistance(queryParameters)) {
                response.results = sortByDistance(response.results, { latitude: queryParameters.latitude, longitude: queryParameters.longitude }, orderByDistance.sort)
                debugLog('latest.js', 'openAPI response', response);
              }

              if (measurementParamenters && measurementParamenters.length > 0) {
                if (operation === 'latest') {
                  response.results = filterLocationsMeasurementParameters(response.results, measurementParamenters);
                }
                if (operation === 'measurements') {
                  response.results = filterMeasurementParameters(response.results, measurementParamenters);
                }
              }

              resolve(response);
              debugLog('openaqAPI', 'fetch responseBody', data);
            } catch (error) {
              debugLog('openaqAPI', 'json parse error', error);
              debugLog('openaqAPI', 'text body', text);
              reject({ error: error, body: text });
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
        console.error('openaq.js', 'openaqAPI', 'catch error', error);
        reject(error);
      });
  });
}

module.exports = {
  setDebugLogging,
  getOrderByConfigAsJSON,
  openaqAPI
}

