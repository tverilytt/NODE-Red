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

/*global require, module,console, Buffer */
  /*jshint devel : true*/

'use strict';

var DEBUG_PREFIX = '[hrg: port]';

module.exports = function(RED) {

  var https = require('https');

  function HRGPorts(config) {
    RED.nodes.createNode(this, config);

    this.port = config.port;
    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    this.on('input', function(msg) {
      var port = msg.port || msg.payload.port || node.port || 'All';
      var errorResponse;

      node .status({fill : 'green', shape : 'ring', text : 'Fetching port ' + port + '...'});

      var httpOptions = {
        hostname : 'www.hurtigruten.com',
//        path : '/api/ports/88325/en/',
        path : '/HRG/api/maps/ports?languageCode=en&marketCode=UK&countryCode=Global',
        headers : {'Content-Type' : 'application/json; charset=UTF-8'}
      };

      https.get(httpOptions, function(res) {
        var payload = '';
        res.setEncoding('utf8');
        debugLog('Got response: ' + res.statusCode);

        res.on('data', function(chunk) {
          payload += chunk;
          debugLog('BODY CHUNK: ' + chunk);
          debugLog('PAYLOAD: ' + payload);
        });
        res.on('end', function() {
          debugLog('END BODY: ' + payload);
          msg.statusCode = res.statusCode;
          try {
            var ports = JSON.parse(payload);

            for (i = 0; i < ports.length; i++)
                if (ports[i].coordinates) {
                   ports[i].coordinates.latitude = ports[i].coordinates.latitude.toString();
                   ports[i].coordinates.longitude = ports[i].coordinates.longitude.toString();
                }

            if (port != 'All') {
               var oneport = {};
               for (var i = 0; i < ports.length; i++)
                   if (ports[i].title == port) oneport = ports[i];
//               var oneport = ports.find(element => element.title == port);
               ports = [oneport];
            }

            msg.payload = JSON.stringify(ports);
            if (!msg.headers) msg.headers = [];
            msg.headers['Content-Length'] = Buffer.byteLength(msg.payload, ['utf8']);
            msg.headers['Content-Type'] = 'application/json; charset=UTF-8';
            node.status({fill : 'green', shape : 'dot', text : 'Success'});
            node.send(msg);
          } catch (error) {
            console.log('=====> Catch hrg ports  error:', error);
            console.log('=====> Catch hrg ports error stack:', error.stack);
            node.status({fill : 'red', shape : 'dot', text : 'Error ' + error});
            msg.payload = JSON.stringify('[]');
            if (!msg.headers) msg.headers = [];
            msg.headers['Content-Length'] = Buffer.byteLength(msg.payload, ['utf8']);
            msg.headers['Content-Type'] = 'application/json; charset=UTF-8';
            node.status({fill : 'red', shape : 'dot', text : 'Error' + error});
            errorResponse = JSON.stringify({error : true, errorMessage : error});
            node.error(errorResponse, msg);
          }
        });
      }).on('error', function(error) {
        debugLog('Got error: ' + error.message);
        node.status({fill : 'red', shape : 'dot', text : 'Error' + error});
        errorResponse = JSON.stringify({error : true, errorMessage : error});
        node.error(errorResponse, msg);
      });
    });

    function debugLog() {
      if (node.debug) {
         Array.prototype.unshift.call(arguments, DEBUG_PREFIX);
         console.log.apply(null, arguments);
      }
    }
  }

  RED.nodes.registerType('ports', HRGPorts);
};
