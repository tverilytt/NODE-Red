/*global module */
  /*jshint devel : true*/

'use strict';

module.exports = (function() {
  return {
    validLatitude : function(latitude) {
      var n = parseFloat(latitude);
      return n <= 90 && n >= -90;
    },
    validLongitude : function(longitude) {
      var n = parseFloat(longitude);
      return n <= 180 && n >= -180;
    },

    setParameters : function(node, latitude, longitude, username) {
      if (this.validLatitude(latitude)) node.latitude = latitude;
      else return false;
      if (this.validLongitude(longitude)) node.longitude = longitude;
      else return false;
      if (username) node.username = username;
      return true;
    },

    getGeonamesURL : function(latitude, longitude, username) {
      var geonamesurl = 'http://api.geonames.org/findNearbyJSON';

      if (username === undefined) username = 'demo';

      geonamesurl += '?username=' + username;
      geonamesurl += '&lat=' + latitude;
      geonamesurl += '&lng=' + longitude;
      geonamesurl += '&style=FULL';
    
      return geonamesurl;
    }
  };
}());
