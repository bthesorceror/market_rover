var YahooRequest = require('./index');

var request = new YahooRequest();

request.addSymbol('GOOG');
request.addSymbol('AAPL');
request.addSymbol('MSFT');

request.addAttribute('volume');
request.addAttribute('average_daily_volume');
request.addAttribute('earnings_per_share');

var emitter = request.emitter();

emitter.on('update', function(symbol, update) {
  console.log("*****************************************************************");
  console.log("Symbol: " + update.symbol);
  console.log("Asking: " + update.ask);
  console.log("Bidding: " + update.bid);
  console.log("*****************************************************************");
  console.log("");
});

emitter.start();
