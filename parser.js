var $ = require('cheerio');
var globals = require('./globals.js');
var Season = require('./Classes/Season');
var Owner = require('./Classes/Owner');
var Team = require('./Classes/Team');
var Matchup = require('./Classes/Matchup')
var OwnerMatchupRecord = require('./Classes/OwnerMatchupRecord');
var TotalSeason = require('./Classes/TotalSeason');

module.exports = {
    parseFinalStandings: function(dataObj, htmlResponses) {
        for (var i = 0; i < htmlResponses.length; i++) {
            if (htmlResponses[i].type !== globals.ResponsePageTypesEnum.FINAL_STANDINGS) { continue; }

            // Parse the final standings page
            var $finalStandingsHtml = $.load(htmlResponses[i].html);

            // Invoke the parser
            this.parseOwners($finalStandingsHtml, dataObj.ownerInfo);
            this.parseSeasonsFromYear($finalStandingsHtml, htmlResponses[i].year, dataObj.ownerInfo, dataObj.totalSeasonsInfo);
        }
    },

    parseSchedule: function(dataObj, htmlResponses) {
        for (var i = 0; i < htmlResponses.length; i++) {
            if (htmlResponses[i].type !== globals.ResponsePageTypesEnum.SCHEDULE) { continue; }

            // Parse the final standings page
            var $schedulePageHtml = $.load(htmlResponses[i].html);

            // Invoke the parser
            this.parseMatchupsForYear($schedulePageHtml, htmlResponses[i].year, dataObj.ownerInfo, dataObj.totalSeasonsInfo);
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

    parseMatchupsForYear: function($html, year, ownersDict, totalSeasonsDict) {
        var arrMatchupObjs = [];

        // Start parsing
        var scheduleTable = $html('table.tableBody').first(); // Sketchy parsing, the first table should be the one we want
        var nonHeadingRows = $html('tr:not(.tableHead):not(.tableSubHead)', scheduleTable); // Select all rows of the table that aren't headings
        $html('td:last-child:not(:first-child)', nonHeadingRows).parent().each(function(index) {  // If a td is the first and last child, it is the only td, get rid of them to not select the pesky nbsp lines
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

            // Figure out if this is a playoff or regular season matchup
            var isPlayoffs;
            var headerText = $html(this).prevAll(".tableHead:has(a[name*='matchup'])").first().text();

            if (headerText.indexOf('PLAYOFFS') > -1) {
                isPlayoffs = true
                return true;   // TODO: Count playoff matchups. This continue is temporary
            } else {
                isPlayoffs = false;
            }
            // TODO: Differentiate Playoffs vs Regular season. Maybe request the playoff bracket?

            var oMatchup = new Matchup(awayTeamName, awayTeamOwner, homeTeamName, homeTeamOwner, awayPoints, homePoints, isPlayoffs);
            arrMatchupObjs.push(oMatchup);
            _addOwnerMatchupRecordToOwners(oMatchup, ownersDict, totalSeasonsDict);
        });

        totalSeasonsDict[year].matchups = arrMatchupObjs;
    }
};

function _addOwnerMatchupRecordToOwners(oMatchup, ownersDict, totalSeasonsDict) {
    var homeOwnerMatchupRecord = ownersDict[oMatchup.homeTeamOwner].ownerMatchupRecordsDict[oMatchup.awayTeamOwner];
    var awayOwnerMatchupRecord = ownersDict[oMatchup.awayTeamOwner].ownerMatchupRecordsDict[oMatchup.homeTeamOwner];

    // Add the owner matchup record to the home owner
    if (!homeOwnerMatchupRecord) {
        // Need to create one because this is the first time we've seen this opponent
        homeOwnerMatchupRecord = new OwnerMatchupRecord(oMatchup.awayTeamOwner);
    }
    homeOwnerMatchupRecord.addMatchup(oMatchup, 1);

    // Add the owner matchup record to the away owner
    if (!awayOwnerMatchupRecord) {
        // Need to create one because this is the first time we've seen this opponent
        awayOwnerMatchupRecord = new OwnerMatchupRecord(oMatchup.homeTeamOwner);
    }
    awayOwnerMatchupRecord.addMatchup(oMatchup, 0);

    //Set back the owner matchup records
    ownersDict[oMatchup.homeTeamOwner].ownerMatchupRecordsDict[oMatchup.awayTeamOwner] = homeOwnerMatchupRecord;
    ownersDict[oMatchup.awayTeamOwner].ownerMatchupRecordsDict[oMatchup.homeTeamOwner] = awayOwnerMatchupRecord;
}