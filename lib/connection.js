'use strict';

var _ = require('underscore');
var logger = require('./logger');

var Connection = module.exports = function (options) {
  this.options = options;

  this.onOpen = this.onOpen.bind(this);
  this.onMessage = this.onMessage.bind(this);
  this.onClose = this.onClose.bind(this);
  this.listeners = {};

  this._closed = false;

  this.connect();
};

Connection.prototype.connect = function () {
  var url = this.options.url;

  this.ws = new WebSocket(url);

  this.ws.onclose = this.onClose;
  this.ws.onmessage = this.onMessage;
  this.ws.onopen = this.onOpen;

  this._closed = false;

  logger.log('Connecting to ' + url);
};

Connection.prototype.connected = function() {
  return this.ws && this.ws.readyState === this.ws.OPEN;
};

Connection.prototype.disconnect = function () {
  this._closed = true;
  this.ws.close();
  this.listeners = [];
};

Connection.prototype.send = function (data) {
  this.ws.send(JSON.stringify(data));
};

Connection.prototype.on = function (type, callback) {
  this.listeners[type] = this.listeners[type] || [];
  this.listeners[type].push(callback);
};

Connection.prototype.off = function (type, callback) {
  this.listeners[type] = this.listeners[type] || [];
  this.listeners[type] = _.without(this.listeners[type], callback);
};

Connection.prototype.once = function (type, callback) {
  var self = this;
  function onceListener() {
    callback.apply(this, arguments);
    self.off(type, onceListener);
  }
  this.on(type, onceListener);
};

Connection.prototype.trigger = function () {
  var args = Array.prototype.slice.call(arguments);
  var type = args.shift();

  _.each(this.listeners[type] || [], function (listener) {
    listener.apply(null, args);
  });
};

Connection.prototype.onMessage = function (e) {
  try {
    this.trigger('message', JSON.parse(e.data));
  } catch (e) {
    logger.log(e.message);
  }
};

Connection.prototype.onOpen = function () {
  this.trigger('open');
  logger.log('Sear connection opened!');
};

Connection.prototype.onClose = function () {
  logger.log(JSON.stringify(arguments));

  this.trigger('close');

  if (this._closed) {
    return;
  }

  logger.log('Connection closed! Reconnecting in 3 seconds.');
  var self = this;
  setTimeout(function () {
    // Todo add some loggin about this
    self.trigger('reconnect');
    self.connect();
  }, 3000);
};
