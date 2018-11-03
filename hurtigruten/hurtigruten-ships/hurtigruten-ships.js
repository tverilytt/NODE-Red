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

var DEBUG_PREFIX = '[hurtigruten: ship]';

  var hrgFinnmarken = 'MS Finnmarken';
  var hrgFram = 'MS Fram';
  var hrgKongHarald = 'MS Kong Harald';
  var hrgLofoten = 'MS Lofoten';
  var hrgMidnatsol = 'MS Midnatsol';
  var hrgNordkapp = 'MS Nordkapp';
  var hrgNordlys = 'MS Nordlys';
  var hrgNordnorge = 'MS Nordnorge';
  var hrgNordstjernen = 'MS Nordstjernen';
  var hrgPolarlys = 'MS Polarlys';
  var hrgRichardWith = 'MS Richard With';
  var hrgSpitsbergen = 'MS Spitsbergen';
  var hrgTrollfjord = 'MS Trollfjord';
  var hrgVesteralen = 'MS Vesterålen';

  var hrgShipInfo = [];

  hrgShipInfo[hrgFinnmarken] = {
    facebook : 'https://www.facebook.com/pages/MS-Finnmarken/1474166032865915?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABFinnmarken%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_02_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_02_02.jpg'
  };
  hrgShipInfo[hrgFram] = {
    facebook : 'https://www.facebook.com/pages/MS-Fram/1508932116060479?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABFram%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_04_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_04_02.jpg'
  };
  hrgShipInfo[hrgKongHarald] = {
    facebook : 'https://www.facebook.com/pages/MS-Kong-Harald/839994066033603?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABKong_Harald%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_05_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_05_02.jpg'
  };
  hrgShipInfo[hrgLofoten] = {
    facebook : 'https://www.facebook.com/pages/MS-Lofoten/580065118765195?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABLofoten%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_07_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_07_01.jpg'
  };
  hrgShipInfo[hrgMidnatsol] = {
    facebook : 'https://www.facebook.com/MSMidnatsol?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABMidnatsol%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_11_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_11_02.jpg'
  };
  hrgShipInfo[hrgNordkapp] = {
    facebook : 'https://www.facebook.com/pages/MS-Nordkapp/724991130920652?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABNordkapp%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_10_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_10_02.jpg'
  };
  hrgShipInfo[hrgNordlys] = {
    facebook : 'https://www.facebook.com/pages/MS-Nordlys/344156699095701?fref=ts',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABNordlys%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/Hurtigruten_01_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/Hurtigruten_01_02.jpg'
  };
  hrgShipInfo[hrgNordnorge] = {
    facebook : 'https://www.facebook.com/pages/MS-Nordnorge/1481836345420962?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABNordnorge%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_03_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_03_02.jpg'
  };
  hrgShipInfo[hrgNordstjernen] = {
  };
  hrgShipInfo[hrgPolarlys] = {
    facebook : 'https://www.facebook.com/pages/MS-Polarlys/281204355413001?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABPolarlys%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_06_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_06_02.jpg'
  };
  hrgShipInfo[hrgRichardWith] = {
    facebook : 'https://www.facebook.com/pages/MS-Richard-With/366283933521360',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABRichard_With%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_08_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_08_02.jpg'
  };
  hrgShipInfo[hrgSpitsbergen] = {
  };
  hrgShipInfo[hrgTrollfjord] = {
    facebook : 'https://www.facebook.com/pages/MS-Trollfjord/457472707727555?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABTrollfjord%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_12_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_12_02.jpg'
  };
  hrgShipInfo[hrgVesteralen] = {
    facebook : 'https://www.facebook.com/pages/MS-Vester%C3%A5len/1525709867669053?ref=hl',
    wikipedia : 'https://no.wikipedia.org/wiki/MS_%C2%ABVester%C3%A5len%C2%BB',
    webcam1 : 'http://btweb.vosskom.no/hurtigruten_09_01.jpg',
    webcam2 : 'http://btweb.vosskom.no/hurtigruten_09_02.jpg'
  };

module.exports = function(RED) {

  var https = require('https');

  function HurtigrutenShips(config) {
    RED.nodes.createNode(this, config);

    this.ship = config.ship;
    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    this.on('input', function(msg) {
      var ship = msg.ship || msg.payload.ship || node.ship || 'All';
      var errorResponse;

      node .status({fill : 'green', shape : 'ring', text : 'Fetching ship ' + ship + '...'});

      var httpOptions = {
        hostname : 'www.hurtigruten.com',
//        path : '/api/ships/89410/en/',
        path : '/HRG/api/maps/ships?languageCode=en&marketCode=UK&countryCode=Global',
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
            var ships = JSON.parse(payload);
            var i;

            for (i = 0; i < ships.length; i++) {
                ships[i].info = hrgShipInfo[ships[i].title];
                ships[i].info.info = 'https://www.hurtigruten.com' + ships[i].pageUrl;
                if (ships[i].coordinates) {
                   ships[i].coordinates.latitude = ships[i].coordinates.latitude.toString();
                   ships[i].coordinates.longitude = ships[i].coordinates.longitude.toString();
                }
            }

            if (ship != 'All') {
               var oneship = {};
               for (i = 0; i < ships.length; i++)
                   if (ships[i].title == ship) oneship = ships[i];
//               var oneport = ports.find(element => element.title == port);
               ships = [oneship];
            }
            msg.payload = JSON.stringify(ships);
            if (!msg.headers) msg.headers = [];
            msg.headers['Content-Length'] = Buffer.byteLength(msg.payload, ['utf8']);
            msg.headers['Content-Type'] = 'application/json; charset=UTF-8';
            node.status({fill : 'green', shape : 'dot', text : 'Success'});
            node.send(msg);
          } catch (error) {
            console.log('=====> Catch hurtigruten ships  error:', error);
            console.log('=====> Catch hurtigruten ships error stack:', error.stack);
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

  RED.nodes.registerType('ships', HurtigrutenShips);
};
