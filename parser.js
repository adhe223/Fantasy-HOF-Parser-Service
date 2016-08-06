var $ = require('cheerio');
var Season = require('./Classes/Season');
var Owner = require('./Classes/Owner');
var Team = require('./Classes/Team');
var TotalSeason = require('./Classes/TotalSeason');

module.exports = {
    parseFinalStandings: function(htmlResponses) {
        var ownersDict = {};
        var totalSeasonsDict = {};

        for (var i = 0; i < htmlResponses.length; i++) {
            // Parse the final standings page
            var $finalStandingsHtml = $.load(htmlResponses[i].html);

            // Invoke the parser
            this.parseOwners($finalStandingsHtml, ownersDict);
            this.parseSeasonsFromYear($finalStandingsHtml, htmlResponses[i].year, ownersDict, totalSeasonsDict);
        }
        return {ownerInfo: ownersDict, totalSeasonsInfo: totalSeasonsDict};
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
    }
};