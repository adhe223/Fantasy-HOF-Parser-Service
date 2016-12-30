module.exports = {
    ResponsePageTypesEnum : {
        "FINAL_STANDINGS" : 0,
        "SCHEDULE" : 1,
        "PLAYOFFS" : 2
    },
    CURRENT_FANTASY_YEAR : "2017",

    //TODO: This would fail if there were duplicate team names in the league's history
    getOwnerNameFromTeamName : function(ownersDict, teamName, year) {
        // Loop over the owners dictionary trying to find the team name
        for (var owner in ownersDict) {
            if (ownersDict.hasOwnProperty(owner)) {
                // Loop over the seasons in the owners seasonsDict to find the team name
                for (var season in ownersDict[owner].seasonsDict) {
                    if (ownersDict[owner].seasonsDict.hasOwnProperty(season)) {
                        if (ownersDict[owner].seasonsDict[season].teamName.indexOf(teamName) !== -1) {  // ESPN doesn't put the whole name on the playoff's bracket //TODO: In the future map each team per season to an owner and use that ID. This current solution is susceptible to teams that are substrings of other teams
                            return ownersDict[owner].ownerName;
                        }
                    }
                }
            }
        }

        // Not found?
        return null;
    }
};