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

module.exports = function(RED) {
  const yr = require('../yr.js');

  const DEBUG_PREFIX = '[yr: weather-data]';

  function YrWeatherData(config) {
    const node = this;

    function debugLog(...args) {
      node.yrconfig && node.yrconfig.debug && yr.debugLog(DEBUG_PREFIX, ...args);
    }

    RED.nodes.createNode(this, config);

    this.yrconfig = (config.yrconfig && RED.nodes.getNode(config.yrconfig)) ||
      { api: yr.yrAPIURL, debug: false };
    debugLog('Config',  this.yrconfig);

    this.on('input', async function(msg) {
      debugLog('node',  node);
      debugLog('config', node.yrconfig);

      msg.payload = msg.payload || {};

      const latitude = msg.latitude || msg.payload.latitude || config.latitude;
      const longitude = msg.longitude || msg.payload.longitude || config.longitude;
      const forecastType = msg.forecastType || msg.payload.forecastType || config.forecastType;

      debugLog('Forecast', latitude, longitude, forecastType);

      node.status({fill : 'green', shape : 'ring', text : `Requesting ${forecastType} weather forecase...`});

      try {
        const forecastUrl = `${node.yrconfig.api}/${forecastType}?lat=${latitude}&lon=${longitude}`;
        debugLog('Forecast URL', forecastUrl);
        const response = await yr.callYrAPI(forecastUrl);
        msg.payload = response;
        debugLog('Response', response);
        node.status({fill : 'green', shape : 'dot', text : 'Success'});
        node.send(msg);
      } catch(error) {
        yr.logError(error);
        node.status({fill : 'red', shape : 'dot', text : 'Error ' + error});
        node.error(JSON.stringify(error));
      }

    });

  }
  RED.nodes.registerType('weather data', YrWeatherData);
};
