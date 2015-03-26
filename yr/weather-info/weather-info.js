/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var DEBUG_PREFIX = '[yr: weather-info]';
var unknownResult = { 'yr' : 'Unknown', 'meteogram' : 'Unknown', 'weather-data' : 'Unknown' , 'place' : 'No geoname for this location'};
var yrHost = 'www.yr.no';
var meteogram = 'meteogram.png';

module.exports = function(RED) {

  var http = require('http');

  function YrWeatherInfo(config) {
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
           path: yrURI + meteogram,
           method: 'HEAD'
         };

         var request = http.request(options, function(res) {
           res.setEncoding('utf8');
           debugLog('Got response: ' + res.statusCode);

          msg.statusCode = res.statusCode;
          if (res.statusCode === 200) {
              var yrInfo = getYrInfo(yrURI, geonames[0]);
              debugLog('HTTP 200 OK: yr info: ' + JSON.stringify(yrInfo));
              msg.payload = yrInfo;
              node.send(msg);
           }
           else {
              debugLog('HTTP status: ' + res.statusCode);
              debugLog('status != 200: yr URI: ' + yrURI);
              msg.payload = unknownResult;
              node.send(msg);
           }
         }).on('error', function(error) {
           debugLog('http request, on error: ' + error.message);
           msg.payload = JSON.stringify(error);
           node.send(msg);
         });
         request.end();
      } else {
         debugLog('Yr URI unknown');
         msg.payload = unknownResult;
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
  RED.nodes.registerType('weather info', YrWeatherInfo);
};

function getYrInfo(uri, geoinfo) {
  var baseURL = 'http://' + yrHost + uri;
  var place = '';
  place += geoinfo.toponymName ? geoinfo.toponymName : '';
  place += geoinfo.adminName1 ? ',' + geoinfo.adminName1 : '';
  place += geoinfo.countryName ? ',' + geoinfo.countryName : '';
  if (place === '') place = 'No geoname for this location';

  return { 'yr' : baseURL, 'meteogram' : baseURL + 'meteogram.png', 'weather-data' : baseURL + 'forecast.xml' , 'place' : place};
}

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