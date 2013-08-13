var http         = require('http'),
    Runner5      = require('runner5'),
    qs           = require('querystring'),
    Columnist    = require('columnist'),
    EventEmitter = require('events').EventEmitter,
    util         = require('util');

function createDataObjByKey(key, array) {
  var result = {};
  array.forEach(function(el) { result[el[key]] = el; });
  return result;
}

var translation = {
  ask: 'a',
  bid: 'b',
  average_daily_volume: 'a2',
  book_value: 'b4',
  volume: 'v',
  commission: 'c3',
  change: 'c1',
  earnings_per_share: 'e',
  dividend_per_share: 'd',
  symbol: 's'
};

function YahooFinanceRequest() {
  ['symbol', 'ask', 'bid'].forEach(this.addAttribute.bind(this));
}

YahooFinanceRequest.prototype.columnist = function() {
  return new Columnist(this.columns());
}

YahooFinanceRequest.prototype.columns = function() {
  this._columns = this._columns || [];
  return this._columns;
}

YahooFinanceRequest.prototype.attributes = function() {
  this._attrs = this._attrs || [];
  return this._attrs;
}

YahooFinanceRequest.prototype.addAttribute = function(common_name) {
  this.attributes().push(translation[common_name]);
  this.columns().push(common_name);
}

YahooFinanceRequest.prototype.symbols = function() {
  this._symbols = this._symbols || [];
  return this._symbols
}

YahooFinanceRequest.prototype.port = function() {
  return 80;
}

YahooFinanceRequest.prototype.host = function() {
  return "download.finance.yahoo.com";
}

YahooFinanceRequest.prototype.path = function() {
  return "/d/quotes.csv"
}

YahooFinanceRequest.prototype.method = function() {
  return 'GET';
}

YahooFinanceRequest.prototype.addSymbol = function(symbol) {
  this.symbols().push(symbol);
}

YahooFinanceRequest.prototype.queryString = function() {
  return qs.stringify({s: this.symbols(), f: this.attributes().join('')});
}

YahooFinanceRequest.prototype.fullPath = function() {
  return this.path() + '?' + this.queryString();
}

YahooFinanceRequest.prototype.requestOptions = function() {
  return { host:   this.host(),
           path:   this.fullPath(),
           method: this.method(),
           port:   this.port() }
}

YahooFinanceRequest.prototype.emitter = function(time) {
  return new YahooFinanceEmitter(this, time);
}

YahooFinanceRequest.prototype.getData = function() {
  return new Runner5(this, this._getData);
}

YahooFinanceRequest.prototype._getData = function(cb) {
  var handler = function(res) {
    this._handleResponse(res, cb);
  }.bind(this);

  var request = this._request(handler);
  request.on('error', function(err) { cb(err, null); });
  request.end();
}

YahooFinanceRequest.prototype._request = function(cb) {
  var func = function(res) { cb(res); }
  return http.request(this.requestOptions(), func);
}

YahooFinanceRequest.prototype._handleResponse = function(res, cb) {
  var response = "";
  res.setEncoding('utf8');
  res.on('data', function(data) { response += data; });
  res.on('end', function() { cb(null, this.parse(response)); }.bind(this));
}

YahooFinanceRequest.prototype.parse = function(response) {
  return createDataObjByKey('symbol', this.columnist().parse(response));
}

function YahooFinanceEmitter(request, time) {
  this.time = time || 10000;
  this.request = request;
}

util.inherits(YahooFinanceEmitter, EventEmitter);

YahooFinanceEmitter.prototype.start = function() {
  var runner = this.request.getData();
  runner.on('success', this.emitUpdates.bind(this));
  this._interval = setInterval(runner.run, this.time);
}

YahooFinanceEmitter.prototype.emitUpdates = function(updates) {
  Object.keys(updates).forEach(function(key) {
    this.emit('update', key, updates[key]);
  }.bind(this));
}

YahooFinanceEmitter.prototype.stop = function() {
  if (this._interval) {
    stopInterval(this._interval);
  }
}

module.exports = YahooFinanceRequest;
