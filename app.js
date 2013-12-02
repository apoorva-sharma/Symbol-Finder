/**************************************************
 * Symbols, written by Apoorva Sharma, 11/25/2013 *
 **************************************************/

var app = require('http').createServer(handler).listen(8000)
  , fs = require('fs')
  , url = require('url');

// basic Symbol class
function Symbol(str, lower, upper) {
    this.str = str;
    this.lower = lower;
    this.upper = upper || lower;
  }

// search Result class
function Result(str, lower, upper, score) {
  this.str = str;
  this.lower = lower;
  this.upper = upper || lower;
  this.score = score;
}

//sorted array of symbol objects, each with a name, lowercase, and uppercase versions
var symbols_;

// load them in from a file;
loadDatabase('/symbols.syms');

// handles requests sent to the server
function handler (req, res) {
  var path =  url.parse(req.url).pathname;
  // ajax request
  if (path == '/sym') {
  	var query = url.parse(req.url).query;
  	var output = lookup(query);
  	res.writeHead(200);
    res.end(output);
  } else if (path == '/') { // mainpage
  	fs.readFile(__dirname + '/index.html',
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading');
        }
        res.writeHead(200);
        res.end(data);
      });
  } else { // wrong
  	fs.readFile(__dirname + path,
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading');
        }
        res.writeHead(200);
        res.end(data);
      });
  }
}

// returns matching symbol info for the given query
function lookup(query) {
  if (symbols_) {
    var output = {}
    var results = searchAndScore(query);
    for (var i = 0; i < results.length; i++) {
      output[i] = results[i];
    };
    return JSON.stringify(results);
  }
  return "Error, symbols array not ready.";
}

// searches and scores the results
function searchAndScore(query) {
  return symbols_.map(function (x) {
    return new Result(x.str, x.lower, x.upper, score(x.str,query));
  }).filter(function (x) {
    return x.score > 0.05; // filter really poor guesses
  }).sort(function (x,y) {
    return y.score - x.score;
  });
} 

// scores a symbol against a query
function score(sym, query) {
  // high matches with exact num of letters is best
  var slen = sym.length;
  var qlen = query.length;
  return matches(sym, query)/qlen - Math.abs(qlen - slen)/slen;
}

// number of sequential letter matches
function matches(sym, query) {
  if (sym.length == 0 || query.length == 0) {
    return 0;
  } else if (sym.charAt(0) == query.charAt(0)) {
    return 1 + matches(sym.substr(1), query.substr(1));
  } else {
    return Math.max(matches(sym.substr(1), query),
                    matches(sym, query.substr(1)));
  }
}

// loads symbols from given file into the array
function loadDatabase(filename) {
  fs.readFile(__dirname + filename,
      function (err, data) {
        if (err) {
          return -1;
        }
        loadSymbolsFromString(data);
      });
}

// loads symbols from the given string into an array
function loadSymbolsFromString(data) {
  data = String(data)
  var symbolStrings = data.split('\n');
  var numSymbols = symbolStrings.length;
  symbols_ = new Array(numSymbols);
  for (i = 0; i < numSymbols; i++) {
    var symbolProps = symbolStrings[i].split(' ');
    symbols_[i] = new Symbol(symbolProps[0], 
                            symbolProps[1], 
                            (symbolProps[2] ? symbolProps[2] : symbolProps[1]));
  }
}

