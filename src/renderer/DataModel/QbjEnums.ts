/** Values of the "type" field in qbj format */
export enum QbjTypeNames {
  Tournament = 'Tournament',
  ScoringRules = 'ScoringRules',
  AnswerType = 'AnswerType',
  TournamentSite = 'TournamentSite',
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
