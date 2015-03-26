/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var DEBUG_PREFIX = '[yr: weather-data]';
var yrHost = 'www.yr.no';
var xmldata = 'forecast.xml';

module.exports = function(RED) {

  var http = require('http');

  function YrWeatherData(config) {
    RED.nodes.createNode(this, config);

    this.debug = config.debug;
    var node = this;

    this.on('input', function(msg) {
      var geonames = msg.geonames || msg.payload.geonames;

      debugLog(JSON.stringify(geonames));

      var yrURI = getYrURI(geonames);

      debugLog('yr URI: ', yrURI);

      if (yrURI) {
         var options = {
           hostname: yrHost,
           port: 80,
           path: yrURI + xmldata,
           method: 'GET'
         };

         var request = http.request(options, function(res) {
           var payload = '';
           res.setEncoding('utf8');
           debugLog('Got response status code: ' + res.statusCode);

           res.on('data', function(chunk) {
             payload += chunk;
             debugLog('BODY CHUNK: ' + chunk);
             debugLog('PAYLOAD: ' + payload);
           });
           res.on('end', function() {
             debugLog('END BODY: ' + payload);
             if (res.statusCode === 200)
                msg.headers = {'Content-Type' : 'text/xml; charset=utf-8'};
              else
                msg.headers = {'Content-Type' : 'text/html; charset=utf-8'};
             msg.statusCode = res.statusCode;
             msg.payload = payload;
             node.send(msg);
           });
         }).on('error', function(error) {
           debugLog('http request, on error: ' + error.message);
           msg.headers = {'Content-Type' : 'application/json'};
           msg.payload = JSON.stringify(error);
           node.send(msg);
         });
         request.end();
      } else {
         debugLog('Yr URI unknown');
         msg.headers = {'Content-Type' : 'text/xml; charset=utf-8'};
         msg.payload = '<?xml version="1.0" encoding="UTF-8"?><unknownYr URI unknown</unknown>';
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
  RED.nodes.registerType('weather data', YrWeatherData);
};

function getYrURI(geonames) {
  var uri = '';

  if (geonames && geonames[0]) {
     var geoname = geonames[0];
     var svalbard = false;

    // Map Svalbard and Jan Mayen to Norway
     if (geoname.countryName == 'Svalbard and Jan Mayen') {
        geoname.countryName = 'Norway';
        svalbard = true;
     }
   
     uri += '/place/';
     uri += geoname.countryName + '/';
   
     if (geoname.adminName1 === '') uri += 'Other' + '/';
     else uri += geoname.adminName1 + '/';

     if (geoname.countryName == 'Norway' && !svalbard)
        if (geoname.adminName2)
           uri += geoname.adminName2 + '/';
        else
           uri += geoname.adminName1 + '/';      
     uri += geoname.toponymName + '/';

     uri = uri.replace(/\s+/g, '_');
   
     return uri;
  } else
     return null;
}