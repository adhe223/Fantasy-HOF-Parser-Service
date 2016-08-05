var parser = require('./parser');
var express = require('express');
var request = require('request-promise');
var $ = require('cheerio');
var app = express();

const CURRENT_FANTASY_YEAR = "2016";
var leagueId = "44169";

app.get('/getLeagueData', function (req, res) {
    var year = "2015";

    // Get the number of years the league has been active
    request("http://games.espn.com/ffl/history?leagueId=" + leagueId)
        .then(function(html) {
            // Parse the number of active years
            var $historyHtml = $.load(html);
            var yearCount = $historyHtml("span.tableHead",".games-fullcol").length;     //Yuck this is nasty scraping. Getting the year header
            return yearCount;
        })
        .then(function(yearCount) {
            // Parse the final standings page
            request("http://games.espn.com/ffl/tools/finalstandings?leagueId=" + leagueId + "&seasonId=" + year)
                .then(function (html) {
                    var $finalStandingsHtml = $.load(html);

                    // Init Data storage objects;
                    var ownersDict = {};
                    var totalSeasonsDict = {};

                    // Invoke the parser
                    parser.parseOwners($finalStandingsHtml, ownersDict);
                    parser.parseSeasonsFromYear($finalStandingsHtml, year, ownersDict, totalSeasonsDict);

                    var dataObj = {owners: ownersDict, totalSeasons: totalSeasonsDict};
                    return dataObj;
                }).then(displayResults(dataObj));
    });

    res.end();
});

var server = app.listen(8081, function () {
    console.log('Example app listening on port 8081!');
});

function parseFinalStandings(year) {
    request("http://games.espn.com/ffl/tools/finalstandings?leagueId=" + leagueId + "&seasonId=" + year)
        .then(function (html) {
            var $finalStandingsHtml = $.load(html);

            // Init Data storage objects;
            var ownersDict = {};
            var totalSeasonsDict = {};

            // Invoke the parser
            parser.parseOwners($finalStandingsHtml, ownersDict);
            parser.parseSeasonsFromYear($finalStandingsHtml, year, ownersDict, totalSeasonsDict);

            var dataObj = {owners: ownersDict, totalSeasons: totalSeasonsDict};
            return dataObj;
        });
}

function displayResults(dataObj) {
    console.log(dataObj);
}