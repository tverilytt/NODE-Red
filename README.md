<html><body>
<h3>Node-RED nodes</h3>

This repository contains <a target="_blank" href="http://nodered.org/">Node-RED</a> nodes.

<h3>Geonames</h3>
These nodes use the <a target="_blank" href="http://geonames.org/">geonames.org</a> API.

<h4>lookup-place</h4>
A Node-RED node to perform reverse geolocation place lookup using Geonames.org.

<h4>lookup-timezone</h4>
A Node-RED node to perform timezone lookup using Geonames.org.

<h4>search-place</h4>
A Node-RED node to perform search for geographical places using Geonames.org.

<h3>Yr</h3>
These nodes use the <a target="_blank" href="http://yr.no/">yr.no</a> weather data and links.

<h4>weather-data</h4>
A Node-RED node to lookup Yr.no weather data (in XML format).

<h4>weather-info</h4>
A Node-RED node to lookup Yr.no weather info links.

<h3>Samples</h3>

<h4>Yr SMS</h4>
The Telenor SMS sample directory contains a Web browser client using the Geonames, Yr and Telenor SMS nodes.
The sample Web page can be found <a target="_blank" href="http://noderedjo2.mybluemix.net/yrsms">here</a>
or by clicking on the image.

<br>
<div>
<a target="_blank" href="http://noderedjo2.mybluemix.net/yrsms">
<img src="https://raw.githubusercontent.com/tverilytt/NODE-Red/master/telenorsms/sample/yrsms.jpg">
</a>
</div>
<br>

<h4>Yr Google Maps</h4>
This sample adds Yr weather information lookup for a given geolocation. Move the "blue ball" marker by dragging it to a desired
location and release it. Click on the marker to view place name (if available) for the geolocation. If Yr weather information
is available, click the "Meteogram" link to view the Yr weather meteogram. You can click on the meteogram to jump to the Web page
at Yr.no for the place.
<br>
<div>
<a target="_blank" href="http://noderedjo2.mybluemix.net/yrmaps">http://noderedjo2.mybluemix.net/yrmaps</a>
</div>
<br>

The yrmaps sample html is located in the samples directory:
<a href="https://github.com/tverilytt/NODE-Red/tree/master/samples">https://github.com/tverilytt/NODE-Red/tree/master/samples</a>
<br>


<h3>Node-RED sample flows</h3>
The sample flows are examples of using the Geonames and / or Yr nodes in Node-RED.

Sample test URL's:

<p> Geonames reverse geolocation lookup:
<a target="_blank" href="http://noderedjo2.mybluemix.net/geonamesplace?latitude=59.93797728565216&longitude=10.720676915344256&username=demo">http://noderedjo2.mybluemix.net/geonamesplace?latitude=59.93797728565216&longitude=10.720676915344256&username=demo</a>
</p>

<div><strong>Node-RED Geonames sample flow</strong></div>
<img src="./samples/Node-RED-Geonames.jpg" alt="Node-RED Geonames sample flow">

<p>Yr weather links:
<a target="_blank" href="http://noderedjo2.mybluemix.net/yrinfo?latitude=59.93797728565216&longitude=10.720676915344256&username=demo">http://noderedjo2.mybluemix.net/yrinfo?latitude=59.93797728565216&longitude=10.720676915344256&username=demo</a>
</p>

<div><strong>Node-RED Yr sample flow</strong></div>
<img src="./samples/Node-RED-Yr.jpg" alt="Node-RED Yr sample flow">

<div><strong>Node-RED Geonames-Yr sample flow</strong></div>
<img src="./samples/Node-RED-Geonames-Yr.jpg" alt="Node-RED Yr sample flow">

</body></html>
