function OwnerMatchupRecord(opponentOwner) {
    this.opponentOwner = opponentOwner;
    this.wins = 0;
    this.losses = 0;
    this.ties = 0;
    this.ownerPoints = 0;
    this.oppositionPoints = 0;
}

// ownerIndicator indicates whether the owner with this object is the home or away team. 1 if home team, 0 if away
// This method is necessary to take an object that has no ownership (Matchup), and make it reflect a specific owner.
OwnerMatchupRecord.prototype.addMatchup = function(oMatchup, ownerIndicator) {
    var myPoints, opponentPoints;

    if (ownerIndicator === 1) {
        // This owner is home team
        myPoints = oMatchup.homePoints;
        opponentPoints = oMatchup.awayPoints;
    } else {
        // This owner is away teams
        myPoints = oMatchup.awayPoints;
        opponentPoints = oMatchup.homePoints;
    }

    if (myPoints > opponentPoints) {
        this.wins++;
    } else if(myPoints === opponentPoints) {
        this.ties++;
    } else {
        this.losses++;
    }

    this.ownerPoints += myPoints;
    this.oppositionPoints += opponentPoints;
};

module.exports = OwnerMatchupRecord;
