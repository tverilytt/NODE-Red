<html><body>
<h3>node-red-contrib-luftkvalitet</h3>

A collection of <a target="_blank" href="http://nodered.org/">Node-RED</a> nodes for
<a target="_blank" href="https://luftkvalitet.info">luftkvalitet.info</a> (Norway).

The nodes use the <a target="_blank" href="https://api.nilu.no/docs/">luftkvalitet.info API</a>
(in norwegian) to access the data.

### Installation

The latest release of these nodes can be installed by running:

    $ npm install node-red-contrib-luftkvalitet


### Luftkvalitet nodes

These nodes use the <a target="_blank" href="https://api.nilu.no/docs/">luftkvalitet.info API</a>.

The samples directory contains example payloads and Node-RED flow using the nodes.

<h4>Daily</h4>
Provides daily (24 hour) mean value for a given period (e.g. a month).

<h4>Historical</h4>
Provides measurement values within a given time period.

<h4>Latest</h4>
Providing latest (newest) measurement values.

<h4>Lookup</h4>
Provides metadata lookup for areas, stations, components and aqis.

</body></html>
