/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var DEBUG_PREFIX = '[geonames: search-place]';

module.exports = function(RED) {

  var http = require('http');

  function SearchPlace(config) {
    RED.nodes.createNode(this, config);

    this.query = config.query;
    this.maxrows = config.maxrows;
    this.username = config.username;
    this.debug = config.debug;

    var node = this;

    this.on('input', function(msg) {
      var query = msg.query || msg.payload.query;
      var maxrows = msg.maxrows || msg.payload.maxrows;
      var username = msg.username || msg.payload.username;

      if (setParameters(node, query, maxrows, username)) {
         var geonamesURL = getGeonamesURL(node.query, node.maxrows, node.username);

         debugLog('geonames URL:', geonamesURL);

         http.get(geonamesURL, function(res) {
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
             msg.payload = JSON.parse(payload);
             node.send(msg);
           });
         }).on('error', function(error) {
           debugLog('Got error: ' + error.message);
           msg.payload = JSON.stringify(error);
           node.send(msg);
         });
      } else {
        msg.payload = {'error' : 'Query cannot be empty and maxrows must be an integer.',
          'query' : query, 'maxrows' : maxrows};
        node.send(msg);
      }
    });

    function debugLog() {
      if (node.debug) {
         Array.prototype.unshift.call(arguments, DEBUG_PREFIX);
         console.log.apply(null, arguments);
      }
    }
  }

  RED.nodes.registerType('search place', SearchPlace);
};

function setParameters(node, query, maxrows, username) {
  if (query) node.query = query;
  if (maxrows) {
     if (parseInt(maxrows)) node.maxrows = parseInt(maxrows);
     else return false;
  }
  if (username) node.username = username;
  return true;
}

function getGeonamesURL(query, maxrows, username) {
  var geonamesurl = 'http://api.geonames.org/searchJSON';

  if (username === undefined) username = 'demo';
  if (maxrows === undefined) maxrows = 10;

  geonamesurl += '?username=' + username;
  geonamesurl += '&q=' + query;
  geonamesurl += '&maxRows=' + maxrows;
  geonamesurl += '&style=FULL';
    
  return geonamesurl;
}
