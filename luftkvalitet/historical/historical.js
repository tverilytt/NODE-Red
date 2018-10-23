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
  var luftkvalitet = require('../luftkvalitet.js');

  var DEBUG_PREFIX = '[luftkvalitet: historical]';

  function Historical(config) {
    RED.nodes.createNode(this, config);

    luftkvalitet.setDebugLogging(config.debug);

    var node = this;

    this.on('input', function(msg) {
      debugLog('node',  node);
      debugLog('config', config);

      var queryParameters = {
        fromtime : msg.fromtime || msg.payload.fromtime || config.fromtime,
        totime : msg.totime || msg.payload.totime || config.totime,
        station : msg.station || msg.payload.station || config.station,
        latitude : msg.latitude || msg.payload.latitude || config.latitude,
        longitude : msg.longitude || msg.payload.longitude || config.longitude,
        radius : msg.radius || msg.payload.radius || config.radius,
        parameter : msg.parameter || msg.payload.parameter || config.parameter,
        within : msg.within || msg.payload.within || config.within,
      };

      debugLog(queryParameters);

      var parameters = luftkvalitet.getQueryParameters(queryParameters);

       node.status({fill : 'green', shape : 'ring', text : 'Requesting historical...'});
       luftkvalitet.luftkvalitetAPI('aq/historical', parameters)
       .then(function(response) {
         node.status({fill : 'green', shape : 'dot', text : 'Success'});
         console.info('historical.js', 'luftkvalitetAPI response', response);
         msg.payload = response;
         node.send(msg);
       })
       .catch(function (error) {
         node.status({fill : 'red', shape : 'dot', text : 'Error ' + 
           (error.error ? error.error : error) });
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

  RED.nodes.registerType('historical', Historical);
};
