/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var geoCommon = require('../geonames-common.js');

var DEBUG_PREFIX = '[geonames: lookup-place]';

module.exports = function(RED) {

  var http = require('http');

  function LookupPlace(config) {
    RED.nodes.createNode(this, config);

    this.username = config.username;
    this.style = config.style;
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.debug = config.debug;

    var node = this;

    this.on('input', function(msg) {
      var username = msg.username || msg.payload.username;
      var style = msg.style || msg.payload.style;
      var latitude = msg.latitude || msg.payload.latitude;
      var longitude = msg.longitude || msg.payload.longitude;

      if (geoCommon.setBaseParameters(node, username, style) && geoCommon.setLocationParameters(node, latitude, longitude)) {
         var geonamesURL = getGeonamesLookupPlaceURL(node.username, node.style, node.latitude, node.longitude);

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
           node.error(JSON.stringify(error));
         });
      } else {
        msg.payload = {'error' : 'Latitude must be between -90 - 90 and longitude between -180 - 180, style must be one of SHORT, MEDIUM, LONG or FULL.',
          'latitude' : latitude, 'longitude' : longitude, 'style' : style};
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

  RED.nodes.registerType('lookup place', LookupPlace);
};

function getGeonamesLookupPlaceURL(username, style, latitude, longitude) {
  var geonamesurl = geoCommon.getGeonamesBaseURL('findNearbyJSON', username, style);

  geonamesurl += '&lat=' + latitude;
  geonamesurl += '&lng=' + longitude;

  return geonamesurl;
}
