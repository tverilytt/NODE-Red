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

/*global  module,console */
  /*jshint devel : true*/

'use strict';

module.exports = function(RED) {
  var openaq = require('../openaq.js');

  var DEBUG_PREFIX = '[openaq: measurements]';

  function Measurements(config) {
    var node = this;

    function debugLog(...args) {
      node.aqconfig && node.aqconfig.debug && openaq.debugLog(DEBUG_PREFIX, ...args);
    }

    RED.nodes.createNode(this, config);

    this.aqconfig = config.aqconfig && RED.nodes.getNode(config.aqconfig);
    debugLog('Config',  this.aqconfig);

    this.on('input', function(msg) {
      debugLog('node',  node);
      debugLog('config', node.aqconfig);

      msg.payload = msg.payload || {};

      var queryParameters = {
        latitude : msg.latitude || msg.payload.latitude || config.latitude,
        longitude : msg.longitude || msg.payload.longitude || config.longitude,
        orderby : msg.orderby || msg.payload.orderby || 
          openaq.getOrderByConfigAsJSON(config),
        simpleParameters : {
          location : msg.location || msg.payload.location || config.location,
          city : msg.city || msg.payload.city || config.city,
          country : msg.country || msg.payload.country || config.country,
          radius : msg.radius || msg.payload.radius || config.radius,
          value_from : msg.value_from || msg.payload.value_from || config.value_from,
          value_to : msg.value_to || msg.payload.value_to || config.value_to,
          date_from : msg.date_from || msg.payload.date_from || config.date_from,
          date_to : msg.date_to || msg.payload.date_to || config.date_to,
          parameter : msg.parameter || msg.payload.parameter || config.parameter,
          has_geo : msg.hasGeo || msg.payload.hasGeo || config.hasGeo,
          limit : msg.limit || msg.payload.limit || config.limit,
          page : msg.page || msg.payload.page || config.page
        }
      };

      debugLog(queryParameters);

       node.status({fill : 'green', shape : 'ring', text : 'Requesting measurements...'});

       openaq.openaqAPI('measurements', queryParameters, node.aqconfig)
       .then(function(response) {
         node.status({fill : 'green', shape : 'dot', text : 'Success'});
         debugLog('measurements.js', 'openAPI response', response);
         msg.payload = response;
         node.send(msg);
       })
       .catch(function (error) {
         node.status({fill : 'red', shape : 'dot', text : 'Error ' + 
           (error.error ? error.error : error) });
           msg.payload = openaq.logError(error);
           node.send(msg);
//           node.error(JSON.stringify(error), msg);
       });
    });

  }

  RED.nodes.registerType('openaq-measurements', Measurements);
};
