var parser = require('./parser');
var express = require('express');
var request = require('request');
var $ = require('cheerio');
var app = express();

app.get('/numPlayers', function (req, res) {
    request("http://games.espn.com/ffl/tools/finalstandings?leagueId=44169&seasonId=2015", function(err, message, html) {
        var $fullHtml = $.load(html);

        //Invoke the parser
        var ownersArr = parser.parseOwners($fullHtml);
        var seasonsArr = parser.parseSeasonsFromYear($fullHtml);
        console.log(ownersArr);

        res.end();
    });
});

var server = app.listen(8081, function () {
    console.log('Example app listening on port 8081!');
});