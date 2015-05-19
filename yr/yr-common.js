/*global module */
  /*jshint devel : true*/

'use strict';

module.exports = (function() {
  return {
    yrHost : 'www.yr.no',
    getYrURI : function(geonames) {
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

         uri = encodeURI(uri);
         uri = utf8quote(uri);
   
         return uri;
      } else
         return null;
    },
  };
}());

// http://www.real-world-systems.com/docs/Characters.html
// E2 80 9C = UTF-8 &apos ('')
function utf8quote(s) { return ('' + s).replace(/'/g, '%E2%80%99'); }
