/*global module */
  /*jshint devel : true*/

'use strict';

var styles = ['SHORT', 'MEDIUM', 'LONG', 'FULL'];
var geonamesAPI = 'http://api.geonames.org/';

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

    setBaseParameters : function(node, username, style) {
      if (username) node.username = username.trim();
      if (style)
         if (styles.indexOf(style.trim().toUpperCase()) != -1) node.style = style.trim().toUpperCase();
         else return false;
      return true;
    },

    setLocationParameters : function(node, latitude, longitude) {
      if (this.validLatitude(latitude)) node.latitude = latitude;
      else return false;
      if (this.validLongitude(longitude)) node.longitude = longitude;
      else return false;
      return true;
    },

    setQueryParameters : function(node, query, maxrows) {
      if (query) node.query = query.trim();
      if (maxrows)
         if (parseInt(maxrows.trim())) node.maxrows = parseInt(maxrows.trim());
         else return false;
      return true;
    },

    getGeonamesBaseURL : function(apifunc, username, style) {
      var geonamesurl = geonamesAPI + apifunc;

      if (username === undefined) username = 'demo';
      if (style === undefined) style = 'MEDIUM';

      geonamesurl += '?username=' + username;
      geonamesurl += '&style=' + style;
    
      return geonamesurl;
    }
  };
}());
