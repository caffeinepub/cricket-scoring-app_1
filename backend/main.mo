import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";



actor {
  type TeamId = Nat;
  type PlayerId = Nat;
  type MatchId = Nat;
  type InningsId = Nat;
  type OverNumber = Nat;
  type BallNumber = Nat;

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
    overNumber : OverNumber;
    ballNumber : BallNumber;
    batsmanId : PlayerId;
    bowlerId : PlayerId;
    runs : Nat;
    isWide : Bool;
    isNoBall : Bool;
    isFreeHit : Bool;
    wicket : ?WicketType;
  };

  type TossChoice = {
    #Bat;
    #Bowl;
  };

  type Toss = {
    winnerTeamId : TeamId;
    choice : TossChoice;
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
    toss : Toss;
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
  let deliveryStore = Map.empty<MatchId, Map.Map<InningsId, List.List<Delivery>>>();

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

  public shared ({ caller }) func createMatch(teamAId : TeamId, teamBId : TeamId, rules : MatchRules, toss : Toss) : async MatchId {
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

    let (firstInningsBattingTeamId, firstInningsBowlingTeamId) = switch (toss.choice) {
      case (#Bat) { (toss.winnerTeamId, if (toss.winnerTeamId == teamAId) { teamBId } else { teamAId }) };
      case (#Bowl) { (if (toss.winnerTeamId == teamAId) { teamBId } else { teamAId }, toss.winnerTeamId) };
    };

    let initialInnings : [Innings] = [
      {
        id = 1;
        battingTeamId = firstInningsBattingTeamId;
        bowlingTeamId = firstInningsBowlingTeamId;
        totalRuns = 0;
        wicketsLost = 0;
        deliveries = [];
        completed = false;
        overs = 0;
      },
      {
        id = 2;
        battingTeamId = firstInningsBowlingTeamId;
        bowlingTeamId = firstInningsBattingTeamId;
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
      toss;
    };

    matchStore.add(matchId, newMatch);

    let matchMap = Map.empty<InningsId, List.List<Delivery>>();
    matchMap.add(1, List.empty<Delivery>());
    matchMap.add(2, List.empty<Delivery>());
    deliveryStore.add(matchId, matchMap);

    nextMatchId += 1;
    matchId;
  };

  public shared ({ caller }) func recordDelivery(matchId : MatchId, inningsId : InningsId, delivery : Delivery) : async () {
    let matchMapOpt = deliveryStore.get(matchId);
    switch (matchMapOpt) {
      case (?matchMap) {
        switch (matchMap.get(inningsId)) {
          case (?deliveriesList) {
            deliveriesList.add(delivery);
          };
          case (null) {
            let newDeliveriesList = List.empty<Delivery>();
            newDeliveriesList.add(delivery);
            matchMap.add(inningsId, newDeliveriesList);
          };
        };
      };
      case (null) {
        let newMatchMap = Map.empty<InningsId, List.List<Delivery>>();
        let newDeliveriesList = List.empty<Delivery>();
        newDeliveriesList.add(delivery);
        newMatchMap.add(inningsId, newDeliveriesList);
        deliveryStore.add(matchId, newMatchMap);
      };
    };
  };

  public query ({ caller }) func getDeliveriesByInnings(matchId : MatchId, inningsId : InningsId) : async [Delivery] {
    switch (deliveryStore.get(matchId)) {
      case (?map) {
        switch (map.get(inningsId)) {
          case (?list) { list.toArray() };
          case (null) { [] };
        };
      };
      case (null) { [] };
    };
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

  public shared ({ caller }) func updateMatchRules(matchId : MatchId, newRules : MatchRules) : async () {
    let match = switch (matchStore.get(matchId)) {
      case (null) { Runtime.trap("Match does not exist") };
      case (?m) { m };
    };

    let updatedMatch = { match with rules = newRules };
    matchStore.add(matchId, updatedMatch);
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
    deliveryStore.clear();

    tournamentRules := defaultTournamentRules;
    nextTeamId := 0;
    nextPlayerId := 0;
    nextMatchId := 0;
  };
};
