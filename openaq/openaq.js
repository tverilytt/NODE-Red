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

// https://stackoverflow.com/a/45291964/4878494
const fs = require('fs');
const { Console } = require('console');

const output = fs.createWriteStream('./openaq.log', {flags: 'a'});
//const errorOutput = fs.createWriteStream('./openaq.err', {flags: 'a'});
const fileLogger = new Console(output, output);

const fetch = require('node-fetch');

const haversine = require('haversine-distance')

//  const openaqAPI = 'https://api.openaq.org/v1/';
const openaqAPIURL = 'https://api.openaq.org/v2/';
const DEBUG_PREFIX = '[openaq: openaq]';

function checkFetchStatus(response, aqConfig) {
  aqConfig && aqConfig.debug && _debugLog('Headers', response.headers.raw());

  aqConfig && aqConfig.debug && _debugLog('checkFetchStatus', response.ok, response.status, response.statusText);
  if (response.ok) { // res.status >= 200 && res.status < 300
    return response;
  } else {
    throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText }));
  }
}

function debugLog(...args) {
  const timestamp = `[${new Date().toISOString()}]`;
  console.debug(timestamp, ...args);
  fileLogger.debug(timestamp, ...args);
}

function _debugLog(...args) {
  debugLog(DEBUG_PREFIX, ...args);
}

function logError(error, ...args) {
  const timestamp = `[${new Date().toISOString()}]`;
  console.error(timestamp, error, ...args);
  fileLogger.error(timestamp, error, ...args);
  return { error: error, trace: error.stack };
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
  var orders = orderbys.filter(field => field.orderby);

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
  queryURI += simpleParametersQuery;

  var orderbyQuery = parameters.orderby;
  if (typeof parameters.orderby === 'string')
    orderbyQuery = parameters.orderby;
  else
    orderbyQuery = getOrderByQueryString(parameters.orderby);
  if (queryURI.length === 0 && orderbyQuery.length > 0)
    orderbyQuery = '?' + orderbyQuery.substring(1);
  queryURI += orderbyQuery;

  return queryURI;
}

function sortByDistance(locations, origin, sort = 'asc') {
  const sortedLocations = locations
    .map(location => Object.assign(location, { distance: haversine(origin, location.coordinates) }))
    .sort((a, b) => a.distance - b.distance);
  return sort === 'desc' ? sortedLocations.reverse() : sortedLocations;
}

function sortByLocation(locations, sort = 'asc') {
  const sortedLocations = locations.sort((a, b) => a.location.localeCompare(b.location));
  return sort === 'desc' ? sortedLocations.reverse() : sortedLocations;
}

function getSortBy(queryParameters, sortby) {
  return queryParameters && queryParameters.orderby && queryParameters.orderby.find(order => order.orderby === sortby);
}

function getSortByDistance(queryParameters) {
  return getSortBy(queryParameters, 'distance');
}

function getSortByLocation(queryParameters) {
  return getSortBy(queryParameters, 'location');
}

function filterMeasurementParameters(measurements, measurementParamenters) {
  return measurements.filter(measurement => measurementParamenters.includes(measurement.parameter));
}

function filterLocationsMeasurementParameters(locations, measurementParamenters) {
  return locations.map(location => {
    return { ...location, ...{ measurements: filterMeasurementParameters(location.measurements, measurementParamenters) }}
  });
}

function openaqAPI(operation, queryParameters, aqConfig, options) {
  aqConfig = aqConfig || {};
  
  return new Promise(function (resolve, reject) {
    const measurementParamenters = (queryParameters.simpleParameters && queryParameters.simpleParameters.parameter) ? queryParameters.simpleParameters.parameter.split(',') : undefined;
    if (measurementParamenters) {
      queryParameters.simpleParameters.parameter = measurementParamenters.length === 1 ? measurementParamenters[0] : '';
    }

    var parameters = getQueryParameters(queryParameters);

    var url = (aqConfig.apiURL || openaqAPIURL) + operation + parameters;
    aqConfig.debug && _debugLog('URL', 'openaqAPI', url);

    fetch(url, options)
      .then((response) => checkFetchStatus(response, aqConfig))
      .then(responseBody => {
        responseBody.text()
          .then(text => {
            try {
              const response = JSON.parse(text);

              let orderByDistance = null;
              if (orderByDistance = getSortByDistance(queryParameters)) {
                response.results = sortByDistance(response.results, { latitude: queryParameters.latitude, longitude: queryParameters.longitude }, orderByDistance.sort)
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
              aqConfig.debug && _debugLog('openaqAPI', 'fetch responseBody', response);
            } catch (error) {
              aqConfig.debug && _debugLog('openaqAPI', 'json parse error', error);
              aqConfig.debug && _debugLog('openaqAPI', 'text body', text);
              reject({ error: error, body: text });
            }
          })
          .catch(error => {
            aqConfig.debug && _debugLog('openaqAPI', 'text body error', error);
            reject(error);
          });
      }, error => {
        logError('openaq.js', 'openaqAPI', 'Error in checkFetchStatus', error);
        reject(error);
      })
      .catch(error => {
        logError('openaq.js', 'openaqAPI', 'catch error', error);
        reject(error);
      });
  });
}

module.exports = {
  getOrderByConfigAsJSON,
  openaqAPI,
  logError,
  debugLog,
  getSortByLocation,
  sortByLocation
}

