#### 0.0.4: orderby enhancements

 - More orderby options date (default), value and parameter for node measurements.
 
#### 0.0.3: Handle msg.payload

 - Handle msg.payload null or undefined.
 
#### 0.0.2: New node names

 - New node names to prevent name clash with nodes from other packages. Name prefixed with "openaq-"
 - Note that you need to either modify 0.0.1 openaq nodes "type" property from e.g. "latest" to "openaq-latest",
 or delete the node and crate a new one from the palette after updating to 0.0.2.

 ### 0.0.1: Initial version

 - First version
 - nodes: cities, country, fetches, latest, locations, measurements, parameters, sources
