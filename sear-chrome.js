/* jshint evil: true */
/* global chrome:true */

'use strict';

var Connection = require('./lib/connection');
var logger = require('./lib/logger');
var manifest = require('./manifest.json');
var _ = require('underscore');

var SearChrome = function () {
  this._initialized = false;
  this.onMessage = this.onMessage.bind(this);
  this._resourceAdded = this._resourceAdded.bind(this);
  this._navigationListener = this._navigationListener.bind(this);
  chrome.devtools.network.onNavigated.addListener(this._navigationListener);
  this.init();
};

SearChrome.prototype._navigationListener = function () {
  this.init();
};

SearChrome.prototype.init = function () {
  var self = this;
  this.initChromeFlag();
  this.liveUpdatePath(function (data) {
    if (!data || !data.path) {
      setTimeout(function () {
        if (!self._initialized) {
          self.init();
        }
      }, 2000);
      return;
    }

    this.path = data.path;
    this.root = data.root;

    logger.log('Sear chrome plugin ' + manifest.version);
    this.start();
  });
};

SearChrome.prototype.clean = function () {
  if (this._initialized) {
    this.resources = [];
    chrome.devtools.inspectedWindow.onResourceAdded.removeListener(
      this._resourceAdded
    );
    this._initialized = false;
  }
};

SearChrome.prototype.start = function () {
  this.clean();
  this.initResources();
  this.initPanel();
  this.initConnection({url: this.path});
  this._initialized = true;
};

SearChrome.prototype.initChromeFlag = function () {
  chrome.devtools.inspectedWindow.eval('window.sear_chrome = true;');
};

SearChrome.prototype.liveUpdatePath = function (callback) {
  var self = this;
  chrome.devtools.inspectedWindow.eval(
    '(function () { return ' +
    'JSON.stringify({path: window.sear_live_update ? ("ws://" + ' +
    'location.host.toString() + ' +
    'window.sear_live_update + ' +
    '"/websocket")  : "", root: location.protocol + "//" + location.host});' +
    '})()',
    function (value, isEx) {
    callback.call(self, JSON.parse(value));
  });
};

SearChrome.prototype.initResources = function () {
  var self = this;
  chrome.devtools.inspectedWindow.getResources(function (resources) {
    self.resources = resources;
    chrome.devtools.inspectedWindow.onResourceAdded.addListener(
      self._resourceAdded
    );
  });
};

SearChrome.prototype._resourceAdded = function (res) {
  if (res.url) {
    this.resources.push(res);
  }
};

SearChrome.prototype.initPanel = function () {
  var self = this;
  if (self.panel) {
    return;
  }
  chrome.devtools.panels.create(
    'Sear',
    '',
    'config/index.html',
    function (panel) {
      self.panel = panel;
    }
  );
};

SearChrome.prototype.onUpdate = function (update, module) {
  var commands = update.devtool || update.other || [];
  var self = this;
  (function nextCommand(i) {
    var command = commands[i];
    if (!command) {
      return;
    }

    function cb(status) {
      if (status && status.code !== 'OK') {
        logger.log("Error: " + JSON.stringify(err));
      }
      nextCommand(++i);
    }

    if (command.type === 'swap') {
      self.onSwap(command, update, module, cb);
    } else if (command.type === 'eval') {
      self.onEval(command, update, module, cb);
    }
  })(0);
};

SearChrome.prototype.onEval = function (command, update, module, callback) {
  chrome.devtools.inspectedWindow.eval(command.eval, callback);
};

SearChrome.prototype.cleanUrl = function (url) {
  url = url.replace(this.root, '').split('?')[0];
  return url;
};

SearChrome.prototype.onSwap = function (command, update, module, callback) {
  _.find(this.resources, function (res) {
    var resUrl = this.cleanUrl(res.url);
    if (module.replace(/\.js$/, '') === resUrl.replace(/\.js$/, '')) {
      // Updating resource content
      logger.log("Setting new content for " + module);
      res.setContent(command.source, true, function (status) {
        chrome.devtools.inspectedWindow.eval('window.dispatchEvent(' +
        'new CustomEvent("sear_update", {' +
          'detail: "' + module + '"' +
        '}));', function() {
          callback(status);
        });
      });
      return true;
    } else {
      return false;
    }
  }, this);
};

SearChrome.prototype.onMessage = function (data) {
  if (data.type === 'update') {
    this.onUpdate(data.update, data.module);
  }
};

SearChrome.prototype.initConnection = function (options) {
  if (this.connection) {
    this.connection.disconnect();
  }

  try {
    this.connection = new Connection(options);
    this.connection.on('message', this.onMessage);
  } catch (e) {
    logger.log(e.message);
  }
};

try {
  var searChrome = new SearChrome();
} catch (e) {
  logger.log(e.stack);
}
