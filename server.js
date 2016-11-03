//example url: http://localhost:8081/getLeagueDataJSON?leagueId=44169
var parser = require('./parser');
var globals = require('./globals.js');
var express = require('express');
var Promise = require('promise');
var url = require('url');
var request = require('request-promise');
const each = require('promise-each');
var $ = require('cheerio');
var app = express();


//Web Server
var server = app.listen(process.env.PORT || 8081, function () {
    console.log('Example app listening on port ' + (process.env.PORT || "8081") + "!");
});

//Routes
app.get('/getLeagueDataJSON', function (req, res) {
    var httpRequests = [];
    var htmlResponses = [];
    var leagueId = req.query.leagueId;

    // Get the number of years the league has been active
    request("http://games.espn.com/ffl/history?leagueId=" + leagueId)
        .then(function(html) {
            // Parse the number of active years
            var $historyHtml = $.load(html);
            return $historyHtml("span.tableHead",".games-fullcol").length;     //Yuck this is nasty scraping. Getting the year header
        })
        .then(function(yearCount) {
            for (var i = 1; i <= yearCount; i++) {
                var currentYear = globals.CURRENT_FANTASY_YEAR - i;

                // IIFC so that currentYear is captured instead of relying on closure in for loop
                (function (year) {
                    // Grab the final standings page
                    httpRequests.push(request("http://games.espn.com/ffl/tools/finalstandings?leagueId=" + leagueId + "&seasonId=" + currentYear)
                        .then(function(html) { storeHTMLResponse(htmlResponses, html, year, globals.ResponsePageTypesEnum.FINAL_STANDINGS); })
                    );

                    // Grab the schedule page
                    httpRequests.push(request("http://games.espn.com/ffl/schedule?leagueId=" + leagueId + "&seasonId=" + currentYear)
                                          .then(function(html) { storeHTMLResponse(htmlResponses, html, year, globals.ResponsePageTypesEnum.SCHEDULE); })
                    );

                    // Grab the playoff bracket page
                    httpRequests.push(request("http://games.espn.com/ffl/h2hplayoffs?leagueId=" + leagueId + "&seasonId=" + currentYear)
                        .then(function(html) { storeHTMLResponse(htmlResponses, html, year, globals.ResponsePageTypesEnum.PLAYOFFS); })
                    );
                })(currentYear);
            }

            // Return Promise.all so taht the next .then block won't be hit until all have resolved
            return Promise.all(httpRequests);
        })
        .then(function() {
            var dataObj = {
                ownerInfo : {},
                totalSeasonsInfo : {}
            };

            parser.parseFinalStandings(dataObj, htmlResponses);
            parser.parseSchedule(dataObj, htmlResponses);
            parser.parsePlayoffs(dataObj, htmlResponses);

            writeResponse(res, dataObj);
        })
        .catch(function(err) { console.log(err); res.end(); });
});

//Helpers
function storeHTMLResponse(htmlResponses, html, year, pageTypeEnum) {
    htmlResponses.push({ html: html, year: year, type: pageTypeEnum })
}

function writeResponse(response, dataObj) {
    response.writeHead(200, {"Content-Type": "application/json"});
    response.end(JSON.stringify(dataObj));
}