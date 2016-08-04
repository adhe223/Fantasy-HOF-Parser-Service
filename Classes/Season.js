 function Season(ownerName, teamName, wins, losses, pointsFor, pointsAgainst) {
    this.ownerName = ownerName;
    this.teamName = teamName;
    this.wins = wins;
    this.losses = losses;
    this.pointsFor = pointsFor;
    this.pointsAgainst = pointsAgainst;
 }

module.exports = Season;