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

/*global require,console */
  /*jshint devel : true*/

'use strict';

module.exports = (function() {

  var parse5 = require('parse5');

  function getKlasse(klasse) {
    if (klasse.indexOf('yellow') !== -1) return 'yellow';
    else if (klasse.indexOf('red') !== -1) return 'red';
    else return 'green';
  }

  function trimText(text) {
    return text.trim().replace(/(\r\n|\n|\r)/gm, '');
  }

  return {
  legemiddelsok : function(html) {
    var matchColumn = -10;
    var legemiddelData = [];
    var legemiddelItem;
    var i, colno, label, labels = [];

    var htmlParser = new parse5.SAXParser();

    htmlParser.on('startTag', function(tagName, attrs) {
//      if (matchColumn > -10) console.log('startTag', matchColumn, tagName);
        if (matchColumn == -10) {
           if (tagName == 'table')
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name == 'class' && (attrs[i].value == 'table-info')) matchColumn++;
        } else if (matchColumn == -9) {
           if (tagName == 'thead') matchColumn++;
        } else if (matchColumn == -9) {
           if (tagName == 'tr') matchColumn++;
        } else if (matchColumn == -8) {
           if (tagName == 'th')
              matchColumn++;
        } else if (matchColumn == -6) {
           if (tagName == 'tbody') matchColumn++;
        } else if (matchColumn == -5) {
           if (tagName == 'tr') {
              colno = -1;
              legemiddelItem = {};
              matchColumn++;
           }
        } else if (matchColumn == -4) {
           if (tagName == 'td') {
              matchColumn++;
              colno++;
           }
        } else if (matchColumn == -3) {
           if (colno === 0 && tagName === 'i') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name === 'class') {
                     legemiddelItem[labels[colno]] = getKlasse(attrs[i].value);
                     matchColumn++;
                  }
           } else if (colno === 1 && tagName === 'a') {
              for (i = 0; i < attrs.length; i++)
                  if (attrs[i].name === 'href') {
                     legemiddelItem[labels[colno]] = {};
                     legemiddelItem[labels[colno]].url = attrs[i].value;
                  }
           }
        }
      });

    htmlParser.on('text', function(text) {
//      if (matchColumn > -10) console.log('text', matchColumn, text);
        if (matchColumn === -7) {
           label = trimText(text);
//           console.log(label);
           labels.push(label);
           matchColumn++;
        } else if (matchColumn === -3) {
           label = trimText(text);
//           console.log(label);
           if (colno === 1)
              legemiddelItem[labels[colno]].name = label;
           else
              legemiddelItem[labels[colno]] = label;
           matchColumn++;
        }
    });

    htmlParser.on('endTag', function(tagName, attrs) {
//      if (matchColumn > -10) console.log('endTag', matchColumn, tagName);
        if (matchColumn === -8) {
           if (tagName === 'tr') matchColumn = -6;
        } else if (matchColumn === -6) {
           if (tagName === 'th') matchColumn = -8;
        } else if (matchColumn === -2 || matchColumn === -3) {
           if (tagName === 'td') matchColumn = -4;
        } else if (matchColumn === -4) {
           if (tagName === 'tr') {
              legemiddelData.push(legemiddelItem);
              matchColumn = -5;
           } else if (tagName === 'tbody') matchColumn = 0;
        }
    });

    htmlParser.write(html);

    return legemiddelData;
  }
  };

}());

var inputData = [];
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
     inputData.push(chunk);
  }
});

process.stdin.on('end', function() {
  var inputBuffer = Buffer.concat(inputData);

  var luftkvalitetData = module.exports.legemiddelsok(inputBuffer.toString());

  console.log('Legemiddel', JSON.stringify(luftkvalitetData));
});
