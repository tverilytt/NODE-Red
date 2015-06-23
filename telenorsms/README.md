<html><body>
<h1>node-red-contrib-telenorsms</h1>

A collection of <a target="_blank" href="http://nodered.org/">Node-RED</a> nodes for accessing
<a target="_blank" href="https://www.telenor.no/privat/minesider/logginnfelles.cms?skin=telenor">Telenor Mine Sider</a>
to send SMS text messages, view sent SMS text messages etc.

<h2>Installation</h2>

<p>
The latest release of these nodes can be installed by running:
</p>

<pre><code>
npm install node-red-contrib-telenorsms
</code></pre>

<h1>Telenor SMS nodes</h1>
<p>
These nodes provide functionality for sending SMS text messages from a Telenor account with a cell phone plan.
Please not that sending SMS might incur a cost. Some subscription types include a certain number of free SMS
each month (e.g. 30). You should check your subscription plan for details on this (the demo Web page mentioned below
tries to fetch remaining free SMS messages).
Also, note that recipients are restricted to norwegian cell phone numbers.
</p>

<p>
The nodes expects JSON input format and also returns data in JSON format.
</p>

There are currently 7 nodes.

<h4>login</h4>
Login to a Telenor account. This is required to use the other nodes.
After successfull login, these nodes can be used:

<ul>
<li><strong>sendsms</strong></li>
Send a SMS text messate to desired recipient(s). Your cell phone number will be the sender.

<li><strong>smscount</strong></li>
Return the number of free (if any) SMS left. The number varies with the cell phone plan.

<li><strong>smsarchive</strong></li>
Get the list of sent SMS messages.

<li><strong>contacts</strong></li>
Get the list of contacts.

<li><strong>logout</strong></li>
Log out of the Telenor account.
</ul>

<h4>simplesms</h4>
Send a SMS text messate to desired recipient(s). Your cell phone number will be the sender.
This node can be used standalone.

<h1>Dependencies</h1>
<a target="_blank" href="https://www.npmjs.com/package/parse5">parse5</a>

<h1>Sample</h1>
The sample directory contains a Web browser client using the Telenor SMS nodes.
The sample Web page can be found <a target="_blank" href="http://noderedjo2.mybluemix.net/telenorsms/">here</a>

<h1>Node-RED flows</h1>
<p>
This is a screen shot of some Node-RED flows using the nodes. These are also used by the
<a target="_blank" href="http://noderedjo2.mybluemix.net/telenorsms/">Telenor SMS sample</a>
and is available in the sample directory.
</p>

<img src="telenorsms-flows.jpg" align="left">

</body></html>
