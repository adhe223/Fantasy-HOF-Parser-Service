var $ = require('cheerio');
var Season = require('./Classes/Season');
var Owner = require('./Classes/Owner');

module.exports = {
    parseOwners: function($html) {
        var ownersArr = [];

        $html("#finalRankingsTable .sortableRow").each(function() {
            var ownerName = $html("td:nth-child(3)", this).text();
            ownersArr.push(new Owner(ownerName));
        });

        return ownersArr;
    },

    parseSeasonsFromYear: function($html) {
      var seasons = [];

      $html("#finalRankingsTable .sortableRow").each(function() {
          var teamName = $html("td:nth-child(2)", this).text();
          var ownerName = $html("td:nth-child(3)", this).text();
          var recordString = $html("td:nth-child(5)", this).text();
          var WLArr = recordString.split("-");
          var gamesWon = parseInt(WLArr[0]);
          var gamesLost = parseInt(WLArr[1]);
          var pointsFor = parseFloat($html("td:nth-child(6)", this).text());
          var pointsAgainst = parseFloat($html("td:nth-child(6)", this).text());

          seasons.push(new Season(ownerName, teamName, gamesWon, gamesLost, pointsFor, pointsAgainst));
      });

      return seasons;
    }
};