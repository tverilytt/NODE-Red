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

  var DEBUG_PREFIX = '[openaq: parameters]';

  function Parameters(config) {
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
        orderby : msg.orderby || msg.payload.orderby || 
          openaq.getOrderByConfigAsJSON(config),
      };

      debugLog(queryParameters);

      node.status({fill : 'green', shape : 'ring', text : 'Requesting parameters...'});

      openaq.openaqAPI('parameters', queryParameters, node.aqconfig)
      .then(function(response) {
        node.status({fill : 'green', shape : 'dot', text : 'Success'});
        debugLog('parameters.js', 'openAPI response', response);
        msg.payload = response;
        node.send(msg);
      })
      .catch(function (error) {
        node.status({fill : 'red', shape : 'dot', text : 'Error ' + error});
        msg.payload = openaq.logError(error);
        node.send(msg);
//           node.error(JSON.stringify(error), msg);
      });

    });

  }

  RED.nodes.registerType('openaq-parameters', Parameters);
};
