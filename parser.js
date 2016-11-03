var $ = require('cheerio');
var Season = require('./Classes/Season');
var Owner = require('./Classes/Owner');
var Team = require('./Classes/Team');
var Matchup = require('./Classes/Matchup')
var PlayoffMatchup = require('./Classes/PlayoffMatchup')
var OwnerMatchupRecord = require('./Classes/OwnerMatchupRecord');
var TotalSeason = require('./Classes/TotalSeason');
var globals = require('./globals');

module.exports = {
    parseFinalStandings: function(dataObj, htmlResponses) {
        for (var i = 0; i < htmlResponses.length; i++) {
            if (htmlResponses[i].type !== globals.ResponsePageTypesEnum.FINAL_STANDINGS) { continue; }

            // Load the page into cheerio
            var $finalStandingsHtml = $.load(htmlResponses[i].html);

            // Invoke the parser
            this.parseOwners($finalStandingsHtml, dataObj.ownerInfo);
            this.parseSeasonsFromYear($finalStandingsHtml, htmlResponses[i].year, dataObj.ownerInfo, dataObj.totalSeasonsInfo);
        }
    },

    parseSchedule: function(dataObj, htmlResponses) {
        for (var i = 0; i < htmlResponses.length; i++) {
            if (htmlResponses[i].type !== globals.ResponsePageTypesEnum.SCHEDULE) { continue; }

            // Load the page into cheerio
            var $schedulePageHtml = $.load(htmlResponses[i].html);

            // Invoke the parser
            this.parseMatchupsForYear($schedulePageHtml, htmlResponses[i].year, dataObj.totalSeasonsInfo);
        }
    },

    parsePlayoffs: function(dataObj, htmlResponses) {
        for (var i = 0; i < htmlResponses.length; i++) {
            if (htmlResponses[i].type !== globals.ResponsePageTypesEnum.PLAYOFFS) { continue; }

            // Load the page into cheerio
            var $playoffPageHtml = $.load(htmlResponses[i].html);

            // Invoke the parser
            this.parsePlayoffsFromYear($playoffPageHtml, htmlResponses[i].year, dataObj.ownerInfo, dataObj.totalSeasonsInfo);
        }
    },

    parseOwners: function($html, ownersDict) {
        $html("#finalRankingsTable .sortableRow").each(function() {
            var ownerName = $html("td:nth-child(3)", this).text();
            if (!ownersDict[ownerName]) {
                ownersDict[ownerName] = new Owner(ownerName);
            }
        });
    },

    parseSeasonsFromYear: function($html, year, ownersDict, totalSeasonsDict) {
        var teamSeasons = [];
        var totalPoints = 0;
        var champion = null;
        var runnerUp = null;
        var mostWins = Number.MIN_VALUE;
        var mostLosses = Number.MIN_VALUE;
        var winningestTeams = [];
        var losingestTeams = [];
        var highestScore = Number.MIN_VALUE;
        var lowestScore = Number.MAX_VALUE;
        var highScorer = null;
        var lowScorer = null;

        $html("#finalRankingsTable .sortableRow").each(function(index) {
            // One time data
            var teamName = $html("td:nth-child(2)", this).text();
            var ownerName = $html("td:nth-child(3)", this).text();
            var recordString = $html("td:nth-child(5)", this).text();
            var WLArr = recordString.split("-");
            var gamesWon = parseInt(WLArr[0]);
            var gamesLost = parseInt(WLArr[1]);
            var pointsFor = parseFloat($html("td:nth-child(6)", this).text());
            var pointsAgainst = parseFloat($html("td:nth-child(7)", this).text());

            // The first result is the champion, the second is the runner up
            if (index === 0) {champion = new Team(ownerName, teamName, year);}
            else if (index === 1) {runnerUp = new Team(ownerName, teamName, year, pointsFor);}

            // Aggregates
            totalPoints += pointsFor;
            if (gamesWon > mostWins) {mostWins = gamesWon;}
            if (gamesLost > mostLosses) {mostLosses = gamesLost;}
            if (pointsFor > highestScore) {highestScore = pointsFor; highScorer = new Team(ownerName, teamName, year)}
            if (pointsFor < lowestScore) {lowestScore = pointsFor; lowScorer = new Team(ownerName, teamName, year)}

            var teamSeason = new Season(ownerName, teamName, gamesWon, gamesLost, pointsFor, pointsAgainst);

            // Add to the owners existing season array
            if (ownersDict[ownerName]) {
              ownersDict[ownerName].seasonsDict[year] = teamSeason;
            }
            teamSeasons.push(teamSeason);
        });

        // Fill winningest/losingest team arrays
        for (var i = 0; i < teamSeasons.length; i++) {
            var teamSeason = teamSeasons[i];
            if (teamSeason.wins === mostWins) {
                winningestTeams.push(new Team(teamSeason.ownerName, teamSeason.teamName, year));
            }
            if (teamSeason.losses === mostLosses) {
                losingestTeams.push(new Team(teamSeason.ownerName, teamSeason.teamName, year));
            }
        }

        // Add the total season values
        totalSeasonsDict[year] = new TotalSeason(year, totalPoints, champion, runnerUp, winningestTeams, losingestTeams, highScorer, lowScorer);
    },

    parseMatchupsForYear: function($html, year, totalSeasonsDict) {
        var oMatchups = [];

        // Start parsing
        var scheduleTable = $html('table.tableBody').first(); // Sketchy parsing, the first table should be the one we want
        var nonHeadingRows = $html('tr:not(.tableHead):not(.tableSubHead)', scheduleTable); // Select all rows of the table that aren't headings
        $html('td:last-child:not(:first-child)', nonHeadingRows).parent().each(function(index) {  // If a td is the first and last child, it is the only td, get rid of them to not select the pesky nbsp lines
            // Figure out if this is a playoff or regular season matchup
            var headerText = $html(this).prevAll(".tableHead:has(a[name*='matchup'])").first().text();
            if (headerText.indexOf('PLAYOFFS') > -1) {
                return true;   // We'll handle this elsewhere because we need to load the playoff bracket page
            }

            // 'this' is the tr element that has the data in it
            var awayTeamName = $html('td:nth-child(1) a', this).text();
            var awayTeamOwner = $html('td:nth-child(2)', this).text();
            var homeTeamName = $html('td:nth-child(4) a', this).text();
            var homeTeamOwner = $html('td:nth-child(5)', this).text();
            var strPoints = $html('td:nth-child(6) a', this).text();

            if (strPoints.indexOf('Preview') > -1 || strPoints.indexOf('Box') > -1) {     //Sketchy parsing, I hate it but it might be the best way
                // This matchup row is a preview or box score and hasn't completed yet, get out of here.
                return true;    // In a query loop returning non false is the same as continue
            }

            var pointsArr = strPoints.split("-");
            var awayPoints = parseFloat(pointsArr[0]);
            var homePoints = parseFloat(pointsArr[1]);

            // Store the data
            var oMatchup = new Matchup(awayTeamName, awayTeamOwner, homeTeamName, homeTeamOwner, awayPoints, homePoints);
            oMatchups.push(oMatchup);
        });

        totalSeasonsDict[year].matchups = oMatchups;
    },

    parsePlayoffsFromYear: function($html, year, ownersDict, totalSeasonsDict) {
        var oPlayoffMatchups = [];

        // TODO: This parsing is so sketchy
        // The tds with a rowspan attribute that are not under a tr with class tableHead happen to be the ones we care about
        $html("table.tableBody > tr:not(.tableHead) > td[rowspan]").each(function(index) {      // tbody is not recognized in cheerio because of a bizarre bug, that's why it's absent here
            var dataRows = $html('table.tableBody > tr[align="right"]', this);
            var firstTeamName = $html('td[align="left"] > a', dataRows).eq(0).text();    // Team name
            var secondTeamName = $html('td[align="left"] > a', dataRows).eq(1).text();   // Team name. Will be blank if it's a bye week
            if (firstTeamName.length === 0 || secondTeamName.length === 0) { return true; }  // Same as continue

            var firstTeamPoints = parseFloat($html('td[align="right"]', dataRows).eq(0).text());
            var secondTeamPoints = parseFloat($html('td[align="right"]', dataRows).eq(1).text());
            var firstTeamOwner = globals.getOwnerNameFromTeamName(ownersDict, firstTeamName, year);
            var secondTeamOwner = globals.getOwnerNameFromTeamName(ownersDict, secondTeamName, year);

            // Store the data
            var oPlayoffMatchup = new PlayoffMatchup(firstTeamName, secondTeamName, firstTeamOwner, secondTeamOwner, firstTeamPoints, secondTeamPoints);
            oPlayoffMatchups.push(oPlayoffMatchup);
        });

        totalSeasonsDict[year].playoffMatchups = oPlayoffMatchups;
    }
};