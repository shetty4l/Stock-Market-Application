(function(exports) {
  'use strict';
  //Load express module with `require` directive
  var express = require('express');
  var app = express();
  var router = express.Router();
  var path = require('path');
  var pathName = __dirname + '/views/';
  var config = require('../config');
  var request = require('request');
  var moment = require('moment');
  var momentTz = require('moment-timezone');

  router.use(function (req,res,next) {
    console.log("/" + req.method);
    next();
  });

  app.use("/",router);
  app.use(express.static(path.join(__dirname, '../')));
  app.use(express.static(__dirname));
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'html');

  router.get("/",function(req,res){
    res.sendFile(pathName + "index.html");
  });

  app.get('/stock/:stockSymbol', function(req, res){
    // res.send('Stock symbol received from user: ' + req.params.stockSymbol);
    var url = "https://www.alphavantage.co/query?";
    url += "function=TIME_SERIES_DAILY&outputsize=full&apikey="
    url += config.API_KEY + '&symbol=' + req.params.stockSymbol;
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var timestamp = moment.tz(json["Meta Data"]["3. Last Refreshed"], "America/New_York");
        if(timestamp.hour()==0&&timestamp.minute()==0&&timestamp.second()==0&&timestamp.millisecond()==0) {
          timestamp.hour(16);
          timestamp.minute(0);
          timestamp.second(0);
          timestamp.millisecond(0);
        }

        console.log(timestamp);

        var latestKey = Object.keys(json["Time Series (Daily)"])[0];
        var prevKey = Object.keys(json["Time Series (Daily)"])[1];

        var resObj = {
          "symbol": json["Meta Data"]["2. Symbol"],
          "timestamp": timestamp,
          "open": json["Time Series (Daily)"][latestKey]["1. open"],
          "high": json["Time Series (Daily)"][latestKey]["2. high"],
          "low": json["Time Series (Daily)"][latestKey]["3. low"],
          "close": json["Time Series (Daily)"][latestKey]["4. close"],
          "volume": json["Time Series (Daily)"][latestKey]["5. volume"],
          "prev_close": json["Time Series (Daily)"][prevKey]["4. close"]
        };
        res.send(resObj);
      } else {
        console.log("somethings wrong with alpha vantage again");
        res.statusMessage = "No response from Alpha Vantage";
        res.status(503).send(null);
      }
    });
  });

  var server = app.listen(3000,function(){
    console.log("Live at Port 3000");
  });
  // server.timeout = 5000;
})(this);
