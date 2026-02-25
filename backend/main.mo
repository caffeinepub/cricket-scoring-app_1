import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";



actor {
  type TeamId = Nat;
  type PlayerId = Nat;
  type MatchId = Nat;

  type Team = {
    id : TeamId;
    name : Text;
    color : Text;
    logo : Text;
    players : [Player];
    squad : [PlayerId];
  };

  type Player = {
    id : PlayerId;
    name : Text;
    battingOrder : Nat;
    isBowler : Bool;
  };

  type MatchRules = {
    oversLimit : Nat;
    powerplayOvers : [Nat];
    duckworthLewisTarget : ?Nat;
    maxOversPerBowler : Nat;
    freeHitEnabled : Bool;
  };

  type Delivery = {
    batsmanId : PlayerId;
    bowlerId : PlayerId;
    runs : Nat;
    isWide : Bool;
    isNoBall : Bool;
    isBye : Bool;
    isLegBye : Bool;
    wicket : ?WicketType;
    isFreeHit : Bool;
  };

  type WicketType = {
    #Bowled;
    #Caught;
    #LBW;
    #RunOut;
    #Stumped;
    #HitWicket;
    #Other : Text;
  };

  type BallByBallRecord = {
    overNumber : Nat;
    ballNumber : Nat;
    batsmanId : PlayerId;
    bowlerId : PlayerId;
    runs : Nat;
    isWide : Bool;
    isNoBall : Bool;
    isFreeHit : Bool;
    wicket : ?WicketType;
  };

  type Innings = {
    id : Nat;
    battingTeamId : TeamId;
    bowlingTeamId : TeamId;
    totalRuns : Nat;
    wicketsLost : Nat;
    deliveries : [Delivery];
    completed : Bool;
    overs : Nat;
  };

  type Match = {
    id : MatchId;
    teamAId : TeamId;
    teamBId : TeamId;
    rules : MatchRules;
    innings : [Innings];
    deliveries : [BallByBallRecord];
    currentInnings : Nat;
    isFinished : Bool;
    winner : ?TeamId;
  };

  type TournamentRules = {
    totalMatches : Nat;
    numTeams : Nat;
    leagueMatches : Nat;
    knockoutMatches : Nat;
    semifinalMatches : Nat;
    finalMatches : Nat;
    leagueOvers : Nat;
    finalOvers : Nat;
    leaguePowerplayOvers : Nat;
    finalPowerplayOvers : Nat;
    maxFieldersOutside30Yards : Nat;
    timeoutDurationSeconds : Nat;
    teamReadinessPenaltyMinutes : Nat;
    teamReadinessPenaltyOvers : Nat;
    slowOverRatePenaltyRuns : Nat;
    inningsDurationMinutes : Nat;
    maxBallsPerBatsmanShortFormat : Nat;
    maxBallsPerBatsmanLongFormat : Nat;
    maxOversBowlerShortFormat : Nat;
    maxOversBowlerLongFormat : Nat;
    bouncerLimitPerOver : Nat;
    widesNoBallBowlerChangeThreshold : Nat;
    defaultPenaltyRuns : Nat;
    lbwApplicable : Bool;
    freeHitApplicable : Bool;
  };

  module Team {
    public func compare(a : Team, b : Team) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  let teamStore = Map.empty<TeamId, Team>();
  let matchStore = Map.empty<MatchId, Match>();

  var tournamentRules : TournamentRules = {
    totalMatches = 0;
    numTeams = 0;
    leagueMatches = 0;
    knockoutMatches = 0;
    semifinalMatches = 0;
    finalMatches = 0;
    leagueOvers = 50;
    finalOvers = 50;
    leaguePowerplayOvers = 10;
    finalPowerplayOvers = 10;
    maxFieldersOutside30Yards = 5;
    timeoutDurationSeconds = 120;
    teamReadinessPenaltyMinutes = 10;
    teamReadinessPenaltyOvers = 3;
    slowOverRatePenaltyRuns = 5;
    inningsDurationMinutes = 90;
    maxBallsPerBatsmanShortFormat = 50;
    maxBallsPerBatsmanLongFormat = 100;
    maxOversBowlerShortFormat = 10;
    maxOversBowlerLongFormat = 20;
    bouncerLimitPerOver = 2;
    widesNoBallBowlerChangeThreshold = 3;
    defaultPenaltyRuns = 5;
    lbwApplicable = true;
    freeHitApplicable = true;
  };

  var nextTeamId = 0;
  var nextPlayerId = 0;
  var nextMatchId = 0;

  func validateName(name : Text) {
    if (name.size() < 3) {
      Runtime.trap("Name must be at least 3 characters long");
    };
    if (name.size() > 50) {
      Runtime.trap("Name must not exceed 50 characters");
    };
    if (not name.contains(#char ' ')) {
      Runtime.trap("Name must contain at least one space");
    };
  };

  public shared ({ caller }) func addTeam(name : Text, color : Text, logo : Text) : async TeamId {
    validateName(name);
    if (teamStore.values().find(func(t) { t.name == name }) != null) {
      Runtime.trap("Team name already exists");
    };

    let teamId = nextTeamId;

    let newTeam : Team = {
      id = teamId;
      name;
      color;
      logo;
      players = [];
      squad = [];
    };

    teamStore.add(teamId, newTeam);
    nextTeamId += 1;
    teamId;
  };

  public shared ({ caller }) func addPlayer(teamId : TeamId, name : Text, battingOrder : Nat, isBowler : Bool) : async PlayerId {
    validateName(name);
    let team = switch (teamStore.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?t) { t };
    };

    if (team.players.find(func(p) { p.name == name }) != null) {
      Runtime.trap("Player name already exists in the team");
    };

    let playerId = nextPlayerId;

    let newPlayer : Player = {
      id = playerId;
      name;
      battingOrder;
      isBowler;
    };

    let updatedPlayers = team.players.concat([newPlayer]);
    let updatedTeam = { team with players = updatedPlayers };

    teamStore.add(teamId, updatedTeam);
    nextPlayerId += 1;
    playerId;
  };

  public shared ({ caller }) func selectSquad(teamId : TeamId, squad : [PlayerId]) : async () {
    if (squad.size() != 11) {
      Runtime.trap("Exactly 11 players must be selected for playing 11");
    };

    switch (teamStore.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?team) {
        let updatedTeam = { team with squad };
        teamStore.add(teamId, updatedTeam);
      };
    };
  };

  public shared ({ caller }) func createMatch(teamAId : TeamId, teamBId : TeamId, rules : MatchRules) : async MatchId {
    let teamA = switch (teamStore.get(teamAId)) {
      case (null) { Runtime.trap("Team A does not exist") };
      case (?t) { t };
    };
    let teamB = switch (teamStore.get(teamBId)) {
      case (null) { Runtime.trap("Team B does not exist") };
      case (?t) { t };
    };

    if (teamA.squad.size() != 11) {
      Runtime.trap("Team A does not have a playing 11 selected");
    };
    if (teamB.squad.size() != 11) {
      Runtime.trap("Team B does not have a playing 11 selected");
    };

    let matchId = nextMatchId;

    let initialInnings : [Innings] = [
      {
        id = 1;
        battingTeamId = teamAId;
        bowlingTeamId = teamBId;
        totalRuns = 0;
        wicketsLost = 0;
        deliveries = [];
        completed = false;
        overs = 0;
      },
      {
        id = 2;
        battingTeamId = teamBId;
        bowlingTeamId = teamAId;
        totalRuns = 0;
        wicketsLost = 0;
        deliveries = [];
        completed = false;
        overs = 0;
      },
    ];

    let newMatch : Match = {
      id = matchId;
      teamAId;
      teamBId;
      rules;
      innings = initialInnings;
      deliveries = [];
      currentInnings = 1;
      isFinished = false;
      winner = null;
    };

    matchStore.add(matchId, newMatch);
    nextMatchId += 1;
    matchId;
  };

  public shared ({ caller }) func recordDelivery(matchId : MatchId, delivery : Delivery) : async () {
    let match = switch (matchStore.get(matchId)) {
      case (null) { Runtime.trap("Match does not exist") };
      case (?m) { m };
    };

    if (match.currentInnings > match.innings.size()) {
      Runtime.trap("Invalid innings");
    };

    if (delivery.isNoBall) {
      if (not match.rules.freeHitEnabled) {
        Runtime.trap("Free hit is not enabled for this match");
      };
    };

    let currentInnings = match.innings[match.currentInnings - 1];
    let overNumber = currentInnings.overs + 1;
    let ballNumber = if (delivery.isNoBall or delivery.isWide) {
      Int.abs(currentInnings.deliveries.size() % 6) + 1;
    } else {
      Int.abs((currentInnings.deliveries.size() + 1) % 6) + 1;
    };

    let ballByBallRecord : BallByBallRecord = {
      overNumber;
      ballNumber;
      batsmanId = delivery.batsmanId;
      bowlerId = delivery.bowlerId;
      runs = delivery.runs;
      isWide = delivery.isWide;
      isNoBall = delivery.isNoBall;
      isFreeHit = delivery.isFreeHit;
      wicket = delivery.wicket;
    };

    let updatedDeliveries = match.deliveries.concat([ballByBallRecord]);
    let updatedMatch = { match with deliveries = updatedDeliveries };

    matchStore.add(matchId, updatedMatch);
  };

  public shared ({ caller }) func updateMatchRules(matchId : MatchId, newRules : MatchRules) : async () {
    let match = switch (matchStore.get(matchId)) {
      case (null) { Runtime.trap("Match does not exist") };
      case (?m) { m };
    };

    let updatedMatch = { match with rules = newRules };
    matchStore.add(matchId, updatedMatch);
  };

  public query ({ caller }) func getTeam(teamId : TeamId) : async ?Team {
    teamStore.get(teamId);
  };

  public query ({ caller }) func getMatch(matchId : MatchId) : async ?Match {
    matchStore.get(matchId);
  };

  public query ({ caller }) func getAllTeams() : async [Team] {
    let teamList = List.empty<Team>();
    for (team in teamStore.values()) { teamList.add(team) };
    teamList.toArray().sort();
  };

  public query ({ caller }) func getPlayerStats(teamId : TeamId, playerId : PlayerId) : async ?Player {
    if (teamId >= nextTeamId) { return null };
    switch (teamStore.get(teamId)) {
      case (null) { null };
      case (?team) {
        team.players.find(func(player) { player.id == playerId });
      };
    };
  };

  public query ({ caller }) func getTournamentRules() : async TournamentRules {
    tournamentRules;
  };

  public shared ({ caller }) func updateTournamentRules(rules : TournamentRules) : async () {
    tournamentRules := rules;
  };

  public shared ({ caller }) func resetAllData() : async () {
    let defaultTournamentRules : TournamentRules = {
      totalMatches = 0;
      numTeams = 0;
      leagueMatches = 0;
      knockoutMatches = 0;
      semifinalMatches = 0;
      finalMatches = 0;
      leagueOvers = 50;
      finalOvers = 50;
      leaguePowerplayOvers = 10;
      finalPowerplayOvers = 10;
      maxFieldersOutside30Yards = 5;
      timeoutDurationSeconds = 120;
      teamReadinessPenaltyMinutes = 10;
      teamReadinessPenaltyOvers = 3;
      slowOverRatePenaltyRuns = 5;
      inningsDurationMinutes = 90;
      maxBallsPerBatsmanShortFormat = 50;
      maxBallsPerBatsmanLongFormat = 100;
      maxOversBowlerShortFormat = 10;
      maxOversBowlerLongFormat = 20;
      bouncerLimitPerOver = 2;
      widesNoBallBowlerChangeThreshold = 3;
      defaultPenaltyRuns = 5;
      lbwApplicable = true;
      freeHitApplicable = true;
    };

    teamStore.clear();
    matchStore.clear();

    tournamentRules := defaultTournamentRules;
    nextTeamId := 0;
    nextPlayerId := 0;
    nextMatchId := 0;
  };
};
