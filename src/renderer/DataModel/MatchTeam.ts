import AnswerType from './AnswerType';
import { IQbjObject, IQbjRefPointer, IYftDataModelObject, IYftFileObject, ValidationStatuses } from './Interfaces';
import { MatchPlayer, IQbjMatchPlayer } from './MatchPlayer';
import MatchValidationMessage, {
  IYftFileMatchValidationMsg,
  MatchValidationCollection,
  MatchValidationType,
} from './MatchValidationMessage';
import { IQbjPlayerAnswerCount, PlayerAnswerCount, sortAnswerCounts } from './PlayerAnswerCount';
import { ScoringRules } from './ScoringRules';
import { IQbjTeam, Team } from './Team';

export interface IQbjMatchTeam extends IQbjObject {
  /** Which team this is */
  team?: IQbjTeam | IQbjRefPointer;
  /** Did this team forfeit the match? */
  forfeitLoss?: boolean;
  /** total number of points scored */
  points?: number;
  /** The number of points this team earned on bonuses */
  bonusPoints?: number;
  /** Number of tossups answered with no bonuses */
  correctTossupsWithoutBonuses?: number;
  /** The number of points this team earned on bonuses bounced back from the opponent */
  bonusBouncebackPoints?: number;
  /** The number of points this team earned on lightning questions */
  lightningPoints?: number;
  /** The performances of the players on this team */
  matchPlayers?: IQbjMatchPlayer[];
}

/** MatchTeam object as written to a .yft file */
export interface IYftFileMatchTeam extends IQbjMatchTeam, IYftFileObject {
  YfData: IMatchTeamExtraData;
}

/** Additional info not in qbj but needed for a .yft file */
interface IMatchTeamExtraData {
  overTimeBuzzes?: IQbjPlayerAnswerCount[];
  validation: IYftFileMatchValidationMsg[];
}

/** One team's performance in one game */
export class MatchTeam implements IQbjMatchTeam, IYftDataModelObject {
  team?: Team;

  forfeitLoss: boolean = false;

  points?: number;

  /** What the team scored in overtime. Note that we don't actually track which player made this buzzes */
  overTimeBuzzes: PlayerAnswerCount[] = [];

  bonusBouncebackPoints?: number;

  lightningPoints?: number;

  /** Performances of each player. A player being listed here doesn't necessarily mean they actually played in this game. */
  matchPlayers: MatchPlayer[] = [];

  totalScoreFieldValidation: MatchValidationMessage;

  bouncebackFieldValidation: MatchValidationMessage;

  /** Any other messages that should go at the bottom of the modal rather than a specific field */
  modalBottomValidation: MatchValidationCollection;

  /** All messages that might need to appear at the bottom of the modal, including those of nested objects */
  get allValidators(): MatchValidationMessage[] {
    let ary = this.modalBottomValidation.validators.slice();
    for (const mp of this.matchPlayers) {
      ary = ary.concat(mp.allValidators);
    }
    return ary;
  }

  static readonly minimumValidScore = -99999;

  static readonly maximumValidScore = 99999;

  constructor(t?: Team, answerTypes?: AnswerType[]) {
    if (t) {
      this.team = t;
      this.matchPlayers = t.players.map((pl) => new MatchPlayer(pl, answerTypes));
    }
    for (const aType of answerTypes || []) {
      this.overTimeBuzzes.push(new PlayerAnswerCount(aType));
    }
    this.totalScoreFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidTeamScore);
    this.bouncebackFieldValidation = new MatchValidationMessage(MatchValidationType.InvalidBouncebackPoints);
    this.modalBottomValidation = new MatchValidationCollection();
  }

  makeCopy(): MatchTeam {
    const copy = new MatchTeam();
    copy.copyFromOther(this);
    return copy;
  }

  copyFromOther(source: MatchTeam) {
    this.team = source.team;
    this.matchPlayers = source.matchPlayers.map((mp) => mp.makeCopy());
    this.forfeitLoss = source.forfeitLoss;
    this.points = source.points;
    this.bonusBouncebackPoints = source.bonusBouncebackPoints;
    this.lightningPoints = source.lightningPoints;
    this.overTimeBuzzes = source.overTimeBuzzes.map((ac) => ac.makeCopy());
    this.totalScoreFieldValidation = source.totalScoreFieldValidation.makeCopy();
    this.bouncebackFieldValidation = source.bouncebackFieldValidation.makeCopy();
    this.modalBottomValidation = source.modalBottomValidation.makeCopy();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjMatchTeam {
    const qbjObject: IQbjMatchTeam = {
      team: this.team?.toRefPointer(),
      forfeitLoss: this.forfeitLoss,
      points: this.points,
      bonusPoints: this.getBonusPoints(),
      correctTossupsWithoutBonuses: this.getCorrectTossupsWithoutBonuses(),
      bonusBouncebackPoints: this.bonusBouncebackPoints,
      lightningPoints: this.lightningPoints,
      matchPlayers: this.matchPlayers.map((mp) => mp.toFileObject(qbjOnly)),
    };

    // this should not be a top-level or referenced object
    if (qbjOnly) return qbjObject;

    const yfData: IMatchTeamExtraData = {
      overTimeBuzzes: this.overTimeBuzzes?.map((ac) => ac.toFileObject()),
      validation: this.modalBottomValidation.toFileObject(),
    };
    const yftFileObj: IYftFileMatchTeam = { YfData: yfData, ...qbjObject };
    return yftFileObj;
  }

  /** For each players on the roster that don't have a MatchPlayer object, make one */
  addNewPlayers(answerTypes: AnswerType[]) {
    if (!this.team) return;
    const newMatchPlayers: MatchPlayer[] = [];
    for (const player of this.team.players) {
      if (!this.matchPlayers.find((mp) => mp.player === player)) {
        newMatchPlayers.push(new MatchPlayer(player, answerTypes));
      }
    }
    this.matchPlayers = this.matchPlayers.concat(newMatchPlayers);
  }

  /** The list of Player objects who played in this match */
  getActivePlayerList() {
    return this.getActiveMatchPlayers().map((mp) => mp.player);
  }

  /** The list of MatchPlayer objects who played in this match */
  getActiveMatchPlayers() {
    const mps: MatchPlayer[] = [];
    this.matchPlayers.forEach((mp) => {
      if (mp.wasActive()) mps.push(mp);
    });
    return mps;
  }

  /** Remove MatchPlayers with no tossups heard */
  clearInactivePlayers() {
    for (let i = this.matchPlayers.length - 1; i >= 0; i--) {
      const mp = this.matchPlayers[i];
      if (!mp.wasActive() && mp.points === 0) {
        this.matchPlayers.splice(i, 1);
      }
    }
  }

  /** The sum of all player tossups heard values */
  getTotalTossupsHeard() {
    let sum = 0;
    this.matchPlayers.forEach((mp) => {
      sum += mp.tossupsHeard || 0;
    });
    return sum;
  }

  getTotalBuzzes(positiveOnly: boolean = false) {
    let totalBuzzes = 0;
    this.matchPlayers.forEach((mp) => {
      totalBuzzes += mp.getTotalBuzzes(positiveOnly);
    });
    return totalBuzzes;
  }

  /** Get the total numbers of 15s, 10s, etc. for the team  */
  getAnswerCounts() {
    const teamAnswerCounts: PlayerAnswerCount[] = [];
    for (const mp of this.matchPlayers) {
      for (const playerAC of mp.answerCounts) {
        let teamCount = teamAnswerCounts.find((ac) => ac.answerType === playerAC.answerType);
        if (!teamCount) {
          teamCount = new PlayerAnswerCount(playerAC.answerType);
          teamAnswerCounts.push(teamCount);
        }
        teamCount.addToCount(playerAC.number);
      }
    }
    return teamAnswerCounts;
  }

  /** Set the points attribute based on a known number of bonus points */
  calculateTotalPoints(bonusPoints: number) {
    this.points =
      this.getTossupPoints() + bonusPoints + (this.bonusBouncebackPoints || 0) + (this.lightningPoints || 0);
  }

  /** Number of points scored on tossups */
  getTossupPoints(): number {
    let total = 0;
    for (const p of this.matchPlayers) {
      total += p.points;
    }
    return total;
  }

  getBonusesHeard(scoringRules: ScoringRules): number {
    let tot = 0;
    this.matchPlayers.forEach((mp) => {
      tot += mp.getTotalBuzzes(true);
    });
    if (scoringRules.overtimeIncludesBonuses) return tot;
    return tot - this.getNumOvertimeBuzzes(true);
  }

  getBonusPoints(): number {
    return (
      (this.points || 0) - this.getTossupPoints() - (this.bonusBouncebackPoints || 0) - (this.lightningPoints || 0)
    );
  }

  getPointsPerBonus(scoringRules: ScoringRules): number | undefined {
    const bHeard = this.getBonusesHeard(scoringRules);
    if (bHeard === 0) return undefined;
    return this.getBonusPoints() / bHeard;
  }

  /** [bonus points, bonuses heard, ppb] */
  getBonusStats(scoringRules: ScoringRules): [string, string, string] {
    const bonusPoints = this.getBonusPoints();
    const bonusesHeard = this.getBonusesHeard(scoringRules);
    const ppb = bonusPoints / bonusesHeard;
    const ppbStr = !Number.isFinite(ppb) ? '--' : ppb.toFixed(2).toString();
    return [bonusPoints.toString(), bonusesHeard.toString(), ppbStr];
  }

  /** Total points minus points scored in overtime without bonuses */
  getPointsForPPG(scoringRules: ScoringRules): number {
    if (scoringRules.useOvertimeInPPTUH()) {
      return this.points || 0;
    }
    return (this.points || 0) - this.getOvertimePoints();
  }

  /** Number of tossups answered with no bonuses. In YF, this means overtime */
  getCorrectTossupsWithoutBonuses(): number {
    let total = 0;
    for (const ac of this.overTimeBuzzes) {
      if (ac.points > 0) {
        total += ac.number || 0;
      }
    }
    return total;
  }

  /** Number of tossups answered with no bonuses. In YF, this means overtime */
  getOvertimePoints(): number {
    let total = 0;
    for (const ac of this.overTimeBuzzes) {
      total += ac.points;
    }
    return total;
  }

  /** The number of buzzes recorded for this team in overtime */
  getNumOvertimeBuzzes(positiveOnly: boolean = false): number {
    let total = 0;
    for (const ac of this.overTimeBuzzes) {
      if (!positiveOnly || ac.answerType.value > 0) total += ac.number || 0;
    }
    return total;
  }

  setOvertimeAnswerCount(answerType: AnswerType, count: number | undefined) {
    const answerCount = this.overTimeBuzzes.find((ac) => ac.answerType === answerType);
    if (!answerCount) return;
    answerCount.number = count;
  }

  clearOvertimeBuzzes() {
    for (const ac of this.overTimeBuzzes) {
      delete ac.number;
    }
  }

  sortOvertimeBuzzes() {
    sortAnswerCounts(this.overTimeBuzzes);
  }

  getErrorMessages(ignoreHidden: boolean = false): string[] {
    let errs: string[] = [];
    if (this.totalScoreFieldValidation.status === ValidationStatuses.Error) {
      errs.push(`${this.team?.name || 'Total'} score: ${this.totalScoreFieldValidation.message}`);
    }
    if (this.bouncebackFieldValidation.status === ValidationStatuses.Error) {
      errs.push(`${this.team?.name || ''} Bounceback points: ${this.bouncebackFieldValidation.message}`);
    }
    errs = errs.concat(this.modalBottomValidation.getErrorMessages(ignoreHidden));
    this.matchPlayers.forEach((mp) => {
      errs = errs.concat(mp.getErrorMessages());
    });
    this.overTimeBuzzes.forEach((ac) => {
      errs = errs.concat(ac.getErrorMessages());
    });
    return errs;
  }

  getWarningMessages(): string[] {
    let warnings: string[] = [];
    if (this.totalScoreFieldValidation.status === ValidationStatuses.Warning) {
      warnings.push(`${this.team?.name || 'Total'} score: ${this.totalScoreFieldValidation.message}`);
    }
    if (this.bouncebackFieldValidation.status === ValidationStatuses.Warning) {
      warnings.push(`${this.team?.name || ''} Bounceback points: ${this.bouncebackFieldValidation.message}`);
    }
    warnings = warnings.concat(this.modalBottomValidation.getWarningMessages());
    this.matchPlayers.forEach((mp) => {
      warnings = warnings.concat(mp.getWarningMessages());
    });
    this.overTimeBuzzes.forEach((ac) => {
      warnings = warnings.concat(ac.getWarningMessages());
    });
    return warnings;
  }

  validateAll(scoringRules: ScoringRules) {
    this.validateTotalPoints();
    this.validateTotalAndTuPtsEqual(scoringRules);
    this.validateBouncebackPoints(scoringRules);
    this.validateAnswerCounts();
    this.validateBonusPoints(scoringRules);
    this.validateOvertimeBuzzes();
    this.validateTotalAndLightningPoints(scoringRules);
    this.validateLightningPoints(scoringRules);
  }

  clearValidation() {
    this.modalBottomValidation = new MatchValidationCollection();
  }

  validateTotalPoints() {
    if (this.points === undefined) {
      this.addValidationMessage(
        MatchValidationType.MissingTotalPoints,
        ValidationStatuses.HiddenError,
        'Total score is required',
      );
      this.totalScoreFieldValidation.setOk();
      return;
    }
    this.modalBottomValidation.clearMsgType(MatchValidationType.MissingTotalPoints);

    if (this.points < MatchTeam.minimumValidScore || this.points > MatchTeam.maximumValidScore) {
      this.totalScoreFieldValidation.setError('Invalid number');
      return;
    }
    this.totalScoreFieldValidation.setOk();
  }

  /** If not using bonuses or lightning rounds, player TU points must add up to the final score */
  validateTotalAndTuPtsEqual(scoringRules: ScoringRules) {
    if (scoringRules.useBonuses || scoringRules.useLightningRounds()) return;
    if (this.points === undefined) return;

    if (this.getTossupPoints() !== this.points) {
      this.addValidationMessage(
        MatchValidationType.TotalScoreAndTuPtsMismatch,
        ValidationStatuses.Error,
        "Players' points don't add up to total score",
      );
    } else {
      this.clearValidationMessage(MatchValidationType.TotalScoreAndTuPtsMismatch);
    }
  }

  /** If useing lightning rounds but NOT bonuses, adding lightning points to player TU points must equal the final score  */
  validateTotalAndLightningPoints(scoringRules: ScoringRules) {
    if (scoringRules.useBonuses) return;
    if (!scoringRules.useLightningRounds()) return;
    if (this.points === undefined) return;

    if (this.getTossupPoints() + (this.lightningPoints ?? 0) !== this.points) {
      this.addValidationMessage(
        MatchValidationType.TuPlusLtngNotEqualTotal,
        ValidationStatuses.Error,
        'Player tossup points plus lightning points should equal total score',
      );
    } else {
      this.clearValidationMessage(MatchValidationType.TuPlusLtngNotEqualTotal);
    }
  }

  validateLightningPoints(scoringRules: ScoringRules) {
    if (!scoringRules.useLightningRounds()) return;
    if ((this.lightningPoints ?? 0) % scoringRules.lightningDivisor > 0) {
      this.addValidationMessage(
        MatchValidationType.LightningDivisorMismatch,
        ValidationStatuses.Warning,
        `Lightning round points aren't divisble by ${scoringRules.lightningDivisor}`,
      );
    } else {
      this.clearValidationMessage(MatchValidationType.LightningDivisorMismatch);
    }
  }

  validateBouncebackPoints(scoringRules: ScoringRules) {
    if (this.bonusBouncebackPoints === undefined) {
      this.bouncebackFieldValidation.setOk();
      this.clearValidationMessage(MatchValidationType.BouncebackDivisorMismatch);
      return;
    }
    if (this.bonusBouncebackPoints < 0 || this.bonusBouncebackPoints > 9999) {
      this.bouncebackFieldValidation.setError('Invalid number');
      this.clearValidationMessage(MatchValidationType.BouncebackDivisorMismatch);
      return;
    }
    this.bouncebackFieldValidation.setOk();

    if (this.bonusBouncebackPoints % scoringRules.bonusDivisor !== 0) {
      this.addValidationMessage(
        MatchValidationType.BouncebackDivisorMismatch,
        ValidationStatuses.Warning,
        `Bonus bounceback points aren't divisible by ${scoringRules.bonusDivisor}`,
      );
    } else {
      this.clearValidationMessage(MatchValidationType.BouncebackDivisorMismatch);
    }
  }

  validateAnswerCounts() {
    this.matchPlayers.forEach((mp) => mp.validateAnswerCounts());
  }

  validateBonusPoints(scoringRules: ScoringRules) {
    if (!scoringRules.useBonuses) return;

    const bonusPoints = this.getBonusPoints();
    const bonusesHeard = this.getBonusesHeard(scoringRules);
    const ppb = bonusPoints / bonusesHeard;
    const maxPpb = scoringRules.maximumBonusScore;
    if (bonusPoints < 0) {
      this.addValidationMessage(
        MatchValidationType.NegativeBonusPoints,
        ValidationStatuses.Error,
        'Bonus points cannot be negative',
      );
    } else {
      this.clearValidationMessage(MatchValidationType.NegativeBonusPoints);
    }

    if ((bonusPoints > 0 && bonusesHeard === 0) || ppb > maxPpb) {
      this.addValidationMessage(
        MatchValidationType.BonusPointsTooHigh,
        bonusesHeard > 0 ? ValidationStatuses.Error : ValidationStatuses.HiddenError,
        `Points per bonus exceeds the maximum of ${maxPpb}`,
      );
    } else {
      this.clearValidationMessage(MatchValidationType.BonusPointsTooHigh);
    }

    if (bonusPoints % scoringRules.bonusDivisor !== 0 && bonusesHeard > 0 && ppb <= maxPpb) {
      this.addValidationMessage(
        MatchValidationType.BonusDivisorMismatch,
        ValidationStatuses.Warning,
        `Bonus points are not divisible by ${scoringRules.bonusDivisor}`,
      );
    } else {
      this.clearValidationMessage(MatchValidationType.BonusDivisorMismatch);
    }
  }

  validateOvertimeBuzzes() {
    for (const ac of this.overTimeBuzzes) {
      ac.validateAll(`${this.team?.name || ''} Overtime tossups`);
    }
  }

  addValidationMessage(type: MatchValidationType, status: ValidationStatuses, message: string, suppressable?: boolean) {
    const fullMessage = `${this.team ? `${this.team.getTruncatedName()}: ` : ''}${message}`;
    this.modalBottomValidation.addValidationMsg(type, status, fullMessage, suppressable);
  }

  clearValidationMessage(type: MatchValidationType) {
    this.modalBottomValidation.clearMsgType(type);
  }

  suppressMessageType(type: MatchValidationType) {
    this.modalBottomValidation.suppressMessageType(type);
  }
}
