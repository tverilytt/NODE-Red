#### 0.0.5: Lookup node fixes

 - Lookup node - filter on station
 - Lookup node - filter fixes etc.

#### 0.0.4: Handle msg.payload null or undefined.

 - Check if msg.payload is null or undefined.

#### 0.0.3: Character handling

 - Fix error when using area / station name containing æ,ø,å etc.

 #### 0.0.2: New node names

 - New node names to prevent name clash with nodes from other packages. Name prefixed with "luftkvalitet-"
 - Note that you need to either modify 0.0.1 openaq nodes "type" property from e.g. "latest" to "luftkvalitet-latest",
 or delete the node and crate a new one from the palette after updating to 0.0.2.

#### 0.0.1: Initial version

 - First version
 - nodes: daily, historical, latest, lookup