<html><body>

<h1>Sample</h1>
The sample directory contains a Web browser client using the Telenor SMS nodes.
The sample Web page can be found <a target="_blank" href="http://noderedjo2.mybluemix.net/telenorsms/">here</a>
or by clicking on the image.

<br>
<div>
<a target="_blank" href="http://noderedjo2.mybluemix.net/telenorsms">
<img src="https://raw.githubusercontent.com/tverilytt/NODE-Red/master/telenorsms/sample/telenorsms.jpg">
</a>
</div>
<br>
<p>
<strong>settings.js</strong> contains Node-RED settings, also also settings for 
<a target="_blank" href="https://www.npmjs.com/package/cryptico">Cryptico</a>
private and public key, which is used by Node-RED flows to decrypt user input from the client (which encrypts the data with the public key).
</p>

<p>
<strong>generatekeys.js</strong> is an example of using the Cryptico library to generate public and private keys.
</p>

<h1>Node-RED flows</h1>
<p>
This is a screen shot of some Node-RED flows using the nodes. These are also used by the
<a target="_blank" href="http://noderedjo2.mybluemix.net/telenorsms">Telenor SMS sample</a>
and is available in the sample directory.
</p>

<img src="https://raw.githubusercontent.com/tverilytt/NODE-Red/master/telenorsms/sample/telenorsms-flows.jpg" align="left">

</body></html>
