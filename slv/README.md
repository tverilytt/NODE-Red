<html><body>
<h3>node-red-contrib-slv</h3>

Please note: This package has been deprecated.

A collection of <a target="_blank" href="http://nodered.org/">Node-RED</a> nodes for
<a target="_blank" href="https://legemiddelverket.no/">Statens Legemiddelverk (SLV)</a>

### Installation

The latest release of these nodes can be installed by running:

    $ npm install node-red-contrib-slv


### SLV nodes

<h4>legemiddelsok</h4>
A Node-RED node to search for drug and get information on status whether on WADA doping list or not.
Replaces initial node <strong>sok</strong>.

<h4>preparatogsubstanssok</h4>
A Node-RED node to search for drug or substance, and get information on status whether on WADA doping list or not.
Returns same result as node <strong>legemiddelsok</strong>, in addition also return match on substance search,
and also adds property <strong>type</strong> with value "legemiddel" or "substans" depending on match result.

</body></html>
