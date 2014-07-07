'use strict';

module.exports.log = function (msg) {
  chrome.devtools.inspectedWindow.eval(
      'console.log(' + JSON.stringify(msg) + ')',
      function () {}
  );
};
