<html><body>
<h3>node-red-contrib-yr</h3>

A collection of <a target="_blank" href="http://nodered.org/">Node-RED</a> nodes for
<a target="_blank" href="http://yr.no/">yr.no</a>

### Installation

The latest release of these nodes can be installed by running:

    $ npm install node-red-contrib-yr


### Yr nodes

These nodes use the <a target="_blank" href="http://yr.no/">yr.no</a> weather data and links.

The nodes expects JSON input (either as msg.geonames (URI parameter) or msg.payload.geonames)
as returned by the node <strong>lookup-place</strong> in
<a target="_blank" href="https://github.com/tverilytt/NODE-Red/tree/master/geonames">node-red-contrib-geonames</a>.

<h4>weather-data</h4>
A Node-RED node to lookup Yr.no weather data (in XML format).

<h4>weather-info</h4>
A Node-RED node to lookup Yr.no weather info links.

</body></html>
