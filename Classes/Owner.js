var OWNER_ID = 0;

function Owner(ownerName) {
    this.ownerName = ownerName;
    this.seasonsDict = {};
    this.ownerMatchupRecordsDict = {};
    this._id = OWNER_ID;

    OWNER_ID++;
}

module.exports = Owner;