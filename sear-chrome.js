/* jshint evil: true */
/* global chrome:true */

'use strict';

var Connection = require('./lib/connection');
var logger = require('./lib/logger');
var manifest = require('./manifest.json');
var _ = require('underscore');

var SearChrome = function () {
  var self = this;

  this.onMessage = this.onMessage.bind(this);
  this._resourceAdded = this._resourceAdded.bind(this);

  this.liveUpdatePath(function (data) {
    if (!data || !data.path) {
      return;
    }

    this.path = data.path;
    this.root = data.root;

    logger.log('Sear chrome plugin ' + manifest.version);
    this.init();
  });
};

SearChrome.prototype.init = function () {
  this.initChromeFlag();
  this.initResources();
  this.initPanel();
  this.initConnection({url: this.path});

  chrome.devtools.network.onNavigated.addListener(function () {
    this.resources = [];
    this.initChromeFlag();
    logger.log('Sear chrome plugin reinitialized');
  }.bind(this));
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
  chrome.devtools.panels.create(
    'Sear',
    '',
    'config.html',
    function (panel) {
      panel.onShown.addListener(function(panWin) {
        if (!panWin.visible) {
          self.panel = panWin;
          self.panel.visible = true;
        }
      });
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

    function cb() {
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
      res.setContent(command.source, true, callback);
      chrome.devtools.inspectedWindow.eval('window.dispatchEvent(' +
      'new CustomEvent("sear_update", {' +
        'detail: "' + module + '"' +
      '}));');
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
    this.connection.close();
  }

  try {
    this.connection = new Connection(options);
    this.connection.on('message', this.onMessage);
  } catch(e) {
    logger.log(e.message);
  }
};

try {
  var searChrome = new SearChrome();
} catch (e) {
  logger.log(e.stack);
}
