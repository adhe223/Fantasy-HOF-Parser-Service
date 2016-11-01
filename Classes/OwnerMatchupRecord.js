function OwnerMatchupRecord(opponentOwner) {
    this.opponentOwner = opponentOwner;
    this.wins = 0;
    this.losses = 0;
    this.ties = 0;
    this.ownerPoints = 0;
    this.oppositionPoints = 0;
}

// ownerIndicator indicates whether the owner with this object is the home or away team
OwnerMatchupRecord.prototype.addMatchup = function(oMatchup, ownerIndicator) {
    // TODO: Flesh this out
};

module.exports = OwnerMatchupRecord;
