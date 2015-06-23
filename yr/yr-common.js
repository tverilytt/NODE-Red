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
