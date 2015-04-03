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
   
         return uri;
      } else
         return null;
    }
  };
}());
