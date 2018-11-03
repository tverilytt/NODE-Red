/**
 * Jo Torsmyr
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var parse5 = require('parse5');

var telenorsms = require('../telenorsms-common.js');

var DEBUG_PREFIX = '[telenorsms: login]';

module.exports = function(RED) {

  var url = require('url');

  function TelenorSMSLogin(config) {
    RED.nodes.createNode(this, config);

    this.username = config.username;
    this.password = config.password;
    this.debug = config.debug;
    this.debugPrefix = DEBUG_PREFIX;
    var node = this;

    var telenorLoginURL = 'https://www.telenor.no/privat/minesider/logginnfelles.cms';

    this.on('input', function(msg) {
      node.status({fill : 'green', shape : 'ring', text : 'Logging in...'});

      telenorsms.setDebug(node.debug, node.debugPrefix);

      var username = msg.username || msg.payload.username || node.username;
      var password = msg.password || msg.payload.password || node.password;

      debugLog('==========> START LOGIN <==========');

      msg.options = {}; msg.options.httpsOptions = telenorsms.httpsOptions;
      msg.options.telenorcookies = [];

      msg.payload = null;
      delete msg.options.httpsOptions.headers['Content-Length'];

      var urlObj = url.parse(telenorLoginURL);
      msg.options.httpsOptions.hostname = urlObj.hostname;
      msg.options.httpsOptions.path = urlObj.path;
      msg.options.httpsOptions.method = 'GET';

      msg.options.httpsOptions.headers['Host'] = msg.options.httpsOptions.hostname;

      telenorsms.telenorRequest(node, msg, function(node, responsemsg, payload, headers) {
        responsemsg.options.httpsOptions.headers['Cookie'] = telenorsms.formatCookieString(responsemsg.options.telenorcookies);
        responsemsg.options.httpsOptions.method = 'POST';
        responsemsg.payload = createLoginPayload(username, password);

        msg = responsemsg;

        telenorsms.telenorRequest(node, msg, function(node, responsemsg, payload, headers) {
          if (telenorsms.notLoggedIn(payload)) {
             debugLog('Not logged in');
             responsemsg.payload = JSON.stringify({loggedIn : false});
             headers['Content-Length'] = Buffer.byteLength(responsemsg.payload, ['utf8']);
             headers['Content-Type'] = 'application/json; charset=UTF-8';
             responsemsg.headers = headers;
             node.status({fill : 'yellow', shape : 'dot', text : 'Not logged in'});
             node.send(responsemsg);
             debugLog('==========> END LOGIN - notLoggedIn <==========');
             return;
          }
          var problemMessage = telenorsms.technicalProblem(payload);
          if (problemMessage) {
             debugLog('Technical problem', problemMessage);
             responsemsg.payload = JSON.stringify({loggedIn : false, error : true, errorMessage : problemMessage});
             headers['Content-Length'] = Buffer.byteLength(responsemsg.payload, ['utf8']);
             headers['Content-Type'] = 'application/json; charset=UTF-8';
             responsemsg.headers = headers;
             debugLog('==========> END LOGIN - Technical problem <==========');
             node.status({fill : 'yellow', shape : 'dot', text : 'Technical problem'});
             node.send(responsemsg);
            return;          
          }

          responsemsg.payload = payload;

          var telenoruser = getTelenorUsername(payload);
          debugLog('Telenor profile name', telenoruser);
          var cellphone = getTelenorCellPhone(payload);
          debugLog('Telenor cell phone no', cellphone);
          responsemsg.payload = JSON.stringify({loggedIn : telenoruser != null, name : telenoruser, 'cell' : cellphone});
          debugLog('Response payload', responsemsg.payload);

          headers['Content-Length'] = Buffer.byteLength(responsemsg.payload, ['utf8']);
          headers['Content-Type'] = 'application/json; charset=UTF-8';
          responsemsg.headers = headers;
          responsemsg.headers['set-cookie'] = telenorsms.formatSetCookieString(responsemsg.options.telenorcookies);
          debugLog('=====> response on end: node.send payload length', responsemsg.payload.length);
          debugLog('=====>  Login response headers: ', responsemsg.headers);
          debugLog('Cookie jar', responsemsg.options.telenorcookies);
          debugLog('==========> END LOGIN <==========');
          node.status({fill : 'green', shape : 'dot', text : 'Logged in'});
          node.send(responsemsg);
        });
      });
    });

    function debugLog() {
      var array = Array.prototype.slice.call(arguments);
      telenorsms.debugLog.apply(null, array);
    }
  }

  RED.nodes.registerType('login', TelenorSMSLogin);
};

  function getTelenorUsername(html) {
    var matchPhase = -1;
    var htmlText;
    var telenorUsername = null;
//    var htmlParser = new parse5.SimpleApiParser({
    var htmlParser = new parse5.SAXParser();

    htmlParser.on('startTag', function(tagName, attrs) {
//      startTag : function(tagName, attrs, selfClosing) {
        if (matchPhase == -1)
           if (tagName == 'h3') {
              for (var i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'title' && attrs[i].value == 'Til Mine sider')
                     matchPhase++;
        }
      });
    htmlParser.on('text', function(text) {
//      text : function(text) {
        if (matchPhase == 0) {
           htmlText = text;
           matchPhase++;
        }
      });
    htmlParser.on('endTag', function(tagName, attrs) {
//      endTag : function(tagName) {
        if (matchPhase == 1)
           if (tagName == 'h3') {
              telenorUsername = htmlText;
              matchPhase++;
           }
      });

//    htmlParser.parse(html);
    htmlParser.write(html);

    return telenorUsername;
  }
  function getTelenorCellPhone(html) {
    var matchPhase = -1;
    var htmlText;
    var cellphone = null;
//    var htmlParser = new parse5.SimpleApiParser({
//      startTag : function(tagName, attrs, selfClosing) {
    var htmlParser = new parse5.SAXParser();

    htmlParser.on('startTag', function(tagName, attrs) {
        if (matchPhase == -1)
           if (tagName == 'span') {
              for (var i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && attrs[i].value == 'bkg mobile')
                     matchPhase++;
        }
      });
    htmlParser.on('text', function(text) {
        if (matchPhase == 0) {
           cellphone = text;
           matchPhase++;
        }
      });
//    htmlParser.parse(html);
    htmlParser.write(html);

    return cellphone ? cellphone.substring(cellphone.indexOf('(') + 1, cellphone.indexOf(')')) : null;
  }

  function createLoginPayload(username, password) {
    return telenorsms.urlencode({
//'controller': 'com.telenor.consumer.web.action.login.LogginnfellesAction',
      'lbAction': 'Logg inn',
      'usr_name' : username, 
      'usr_password' : password
//'__checkbox_loginForm.rememberUsername': 'true',
//'useAjax': false,
// 'loginForm.screenSize' : '1366x768',
//'loginForm.windowSize' :' 1302x682',
//'nyBrukerPersonaliaNameForm.firstName':'',
//'nyBrukerPersonaliaNameForm.lastName':''
    });
  }
