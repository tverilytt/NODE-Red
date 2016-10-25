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

/*global require, module,console, Buffer, process */
  /*jshint devel : true*/

'use strict';

var DEBUG_PREFIX = '[SLV: sok]';

module.exports = function(RED) {

  var http = require('http');
  var slv = require('../slv.js');

  function SLVSok(config) {
    RED.nodes.createNode(this, config);

    this.debug = config.debug;
    this.legemiddel = config.legemiddel;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    this.on('input', function(msg) {
      var legemiddel = msg.legemiddel || msg.payload.legemiddel || node.legemiddel || '';
      console.log(node, legemiddel, msg.legemiddel, msg.payload.legemiddel, node.legemiddel);
      var errorResponse;

      node .status({fill : 'green', shape : 'ring', text : 'Fetching ' + legemiddel + '...'});

      var httpOptions = {
        hostname : 'www.antidoping.no',
        path : '/regler/legemiddelsok/?q=' + encodeURIComponent(legemiddel),
        headers : {'Content-Type' : 'text/html; charset=UTF-8',
          'Accept' : 'application/json'}
      };

      http.get(httpOptions, function(res) {
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
            msg.payload = slv.legemiddelsok(payload);
            if (!msg.headers) msg.headers = [];
            msg.headers['Content-Length'] = Buffer.byteLength(msg.payload, ['utf8']);
            msg.headers['Content-Type'] = 'application/json; charset=UTF-8';
            node.status({fill : 'green', shape : 'dot', text : 'Success'});
            node.send(msg);
          } catch (error) {
            console.log('=====> Catch SLV sok  error:', error);
            console.log('=====> Catch SLV sok error stack:', error.stack);
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

  RED.nodes.registerType('sok', SLVSok);
};
