var globals = require('../globals');

function PlayoffMatchup(firstTeamName, secondTeamName, firstTeamOwner, secondTeamOwner, firstPoints, secondPoints) {
    this.firstTeamName = firstTeamName;
    this.secondTeamName = secondTeamName
    this.firstTeamOwner = firstTeamOwner;
    this.secondTeamOwner = secondTeamOwner;
    this.firstPoints = firstPoints;
    this.secondPoints = secondPoints;
}

module.exports = PlayoffMatchup;