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

const { long } = require('webidl-conversions');

module.exports = function(RED) {
  const yr = require('../yr.js');

  const yrWeatherURL = 'https://www.yr.no/nb/værvarsel';

  function YrWeatherInfo(config) {
    const node = this;

    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      msg.payload = msg.payload || {};

      const latitude = msg.latitude || msg.payload.latitude || config.latitude;
      const longitude = msg.longitude || msg.payload.longitude || config.longitude;
      const forecastView = msg.forecastView || msg.payload.forecastView || config.forecastView;

      const yrURL = `${yrWeatherURL}/${forecastView}/${latitude},${longitude}`;

        msg.payload = { forecast: yrURL };
        node.send(msg);
    });

  }
  RED.nodes.registerType('weather info', YrWeatherInfo);
};
