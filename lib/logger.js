/* jshint evil: true */
/* global chrome:true */

'use strict';

module.exports.log = function (msg) {
  chrome.devtools.inspectedWindow.eval(
      'console.debug(' + JSON.stringify(msg) + ')',
      function () {}
  );
};
