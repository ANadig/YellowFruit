import Player from './Player';

/** A kind of ranking that teams might be ranked by, such as "JV" or "Small school" */
export interface IRanking {
  /** short name */
  name: string;
  /** A description of the ranking, such as information on eligibility */
  description: string;
}

/** A single placement in the tournament, such as "2nd place overall" or "3rd place JV" */
interface IRank {
  /** A Ranking for which the team is eligible */
  ranking: IRanking;
  /** The position/rank the team has achieved among all teams eligible for the given Ranking */
  position: number;
}

/** A single team */
class Team {
  /** name of the team */
  name: string;

  /** The players registered to play on this team */
  players: Player[];

  /** The ranks this team has achieved and/or is eligible for */
  ranks?: IRank[];

  constructor(name: string) {
    this.name = name;
    this.players = [];
  }
}

export default Team;
