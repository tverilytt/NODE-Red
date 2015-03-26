/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var DEBUG_PREFIX = '[geonames: lookup-place]';

module.exports = function(RED) {

  var http = require('http');

  function LookupPlace(config) {
    RED.nodes.createNode(this, config);

    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.username = config.username;
    this.debug = config.debug;

    var node = this;

    this.on('input', function(msg) {
      var latitude = msg.latitude || msg.payload.latitude;
      var longitude = msg.longitude || msg.payload.longitude;
      var username = msg.username || msg.payload.username;

      if (setParameters(node, latitude, longitude, username)) {
         var geonamesURL = getGeonamesURL(node.latitude, node.longitude, node.username);

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
        msg.payload = {'error' : 'Latitude / Longitude validation error. Latitude must be between -90 - 90 and longitude between -180 - 180',
          'latitude' : latitude, 'longitude' : longitude};
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

function validLatitude(latitude) {
  var n = parseFloat(latitude);
  return n <= 90 && n >= -90;
}
function validLongitude(longitude) {
  var n = parseFloat(longitude);
  return n <= 180 && n >= -180;
}

function setParameters(node, latitude, longitude, username) {
  if (validLatitude(latitude)) node.latitude = latitude;
  else return false;
  if (validLongitude(longitude)) node.longitude = longitude;
  else return false;
  if (username) node.username = username;
  return true;
}

function getGeonamesURL(latitude, longitude, username) {
  var geonamesurl = 'http://api.geonames.org/findNearbyJSON';

  if (username === undefined) username = 'demo';

  geonamesurl += '?username=' + username;
  geonamesurl += '&lat=' + latitude;
  geonamesurl += '&lng=' + longitude;
  geonamesurl += '&style=FULL';
    
  return geonamesurl;
}
