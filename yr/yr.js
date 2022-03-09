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

const output = fs.createWriteStream('./yr.log', { flags: 'a' });
//const errorOutput = fs.createWriteStream('./yr.err', {flags: 'a'});
const fileLogger = new Console(output, output);

const fetch = require('node-fetch');

const haversine = require('haversine-distance')

const yrAPIURL = 'https://api.met.no/weatherapi/locationforecast/2.0';
const DEBUG_PREFIX = '[yr: yr]';

const defaultFetchOptions = {
  headers: {
    'User-Agent': 'node-red-y-contrib https://www.npmjs.com/package/node-red-contrib-yr'
  }

};

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

async function getJSON(result) {
  try {
    const responseText = await result.text();
    return JSON.parse(responseText);
  } catch (error) {
    logError('getJSON error', error, responseText);
    Promise.reject(new Error(error))
  }
}

async function callYrAPI(url, options) {
  try {
    options = { ...defaultFetchOptions, ...options };
    const result = await fetch(url, options);
    debugLog('callYrAPI result', result);
    if (result.ok) {
      const response = await getJSON(result);
      return response;
    } else {
      throw new Error(`callYrAPI error: ${result.status} - ${result.statusText}}`);
    }
  } catch (error) {
    const errorResult = logError(error);
    return errorResult;
  }
}

module.exports = {
  yrAPIURL,
  logError,
  debugLog,
  callYrAPI
}
