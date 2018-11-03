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

  var DEBUG_PREFIX = '[openaq: fetches]';

  function Fetches(config) {
    RED.nodes.createNode(this, config);

    openaq.setDebugLogging(config.debug);

    var node = this;

    this.on('input', function(msg) {
      debugLog('node',  node);
      debugLog('config', config);

      msg.payload = msg.payload || {};

      var queryParameters = {
        orderby : msg.orderby || msg.payload.orderby || 
          openaq.getOrderByQueryString(openaq.getOrderByConfigAsJSON(config)),
        simpleParameters : {
          limit : msg.limit || msg.payload.limit || config.limit,
          page : msg.page || msg.payload.page || config.page
        }
      };

      debugLog(queryParameters);

      var parameters = openaq.getQueryParameters(queryParameters);

      node.status({fill : 'green', shape : 'ring', text : 'Requesting fetches...'});
      openaq.openaqAPI('fetches', parameters)
      .then(function(response) {
        node.status({fill : 'green', shape : 'dot', text : 'Success'});
        console.info('fetches.js', 'openAPI response', response);
        msg.payload = response;
        node.send(msg);
      })
      .catch(function (error) {
        node.status({fill : 'red', shape : 'dot', text : 'Error ' + error});
        debugLog('Got error: ' + error);
        msg.payload = error;
        node.send(msg);
//           node.error(JSON.stringify(error), msg);
      });

    });

    function debugLog(...args) {
      console.debug(DEBUG_PREFIX, ...args);
    }

  }

  RED.nodes.registerType('openaq-fetches', Fetches);
};
