function Matchup(awayTeamName, awayTeamOwner, homeTeamName, homeTeamOwner, awayPoints, homePoints) {
    this.awayTeamName = awayTeamName;
    this.awayTeamOwner = awayTeamOwner;
    this.homeTeamName = homeTeamName;
    this.homeTeamOwner = homeTeamOwner;
    this.awayPoints = awayPoints;
    this.homePoints = homePoints;
}

module.exports = Matchup;