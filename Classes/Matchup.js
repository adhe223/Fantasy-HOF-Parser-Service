function Matchup(awayTeamName, awayTeamOwner, homeTeamName, homeTeamOwner, awayPoints, homePoints, isPlayoffs) {
    this.awayTeamName = awayTeamName;
    this.awayTeamOwner = awayTeamOwner;
    this.homeTeamName = homeTeamName;
    this.homeTeamOwner = homeTeamOwner;
    this.awayPoints = awayPoints;
    this.homePoints = homePoints;
    this.isPlayoffs = isPlayoffs;
}

module.exports = Matchup;