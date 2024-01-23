/** Values of the "type" field in qbj format */
export enum QbjTypeNames {
  Tournament = 'Tournament',
  ScoringRules = 'ScoringRules',
  AnswerType = 'AnswerType',
  TournamentSite = 'TournamentSite',
  Phase = 'Phase',
  Pool = 'Pool',
  PoolTeam = 'PoolTeam',
  Round = 'Round',
  Packet = 'Packet',
  Registration = 'Registration',
  Team = 'Team',
  Player = 'Player',
  Rank = 'Rank',
  Ranking = 'Ranking',
}

/** Audience / level of the tournament */
export enum QbjAudience {
  ElementarySchool,
  MiddleSchool,
  HighSchool,
  CommunityCollege,
  College,
  Open,
  Other,
}

/** Level of the tournament, within a given Audience */
export enum QbjLevel {
  Novice,
  Regular,
  Nationals,
  Other,
}

/** Kinds of question sets */
export enum QbjContent {
  GeneralAcademic,
  SpecializedAcademic,
  Trash,
  Other,
}
