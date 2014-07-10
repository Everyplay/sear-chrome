/* jshint evil: true */
/* global chrome:true */

'use strict';

module.exports.log = function (msg) {
  chrome.devtools.inspectedWindow.eval(
      'console.log(' + JSON.stringify(msg) + ')',
      function () {}
  );
};
