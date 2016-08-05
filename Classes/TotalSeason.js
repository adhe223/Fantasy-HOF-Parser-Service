function TotalSeason(year, totalPoints, champion, runnerUp, winningestTeam, losingestTeam, highScorer, lowScorer) {
    this.year = year;
    this.totalPoints = totalPoints;
    this.champion = champion;
    this.runnerUp = runnerUp;
    this.winningestTeam = winningestTeam;
    this.losingestTeam = losingestTeam;
    this.highScorer = highScorer;
    this.lowScorer = lowScorer;
}

module.exports = TotalSeason;
