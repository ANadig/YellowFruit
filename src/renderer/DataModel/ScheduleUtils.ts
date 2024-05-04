import { Sched10Teams12Rounds433, Sched10Teams12Rounds442, Sched10TeamsSingleRR } from './Schedules/10-team';
import { Sched11Teams8Rounds, Sched11TeamsSingleRR } from './Schedules/11-team';
import {
  Sched12Teams10Rounds,
  Sched12Teams14Rounds,
  Sched12Teams8Rounds,
  Sched12Teams9Rounds,
  Sched12TeamsSingleRR,
} from './Schedules/12-team';
import { Sched13TeamsSingleRR } from './Schedules/13-team';
import {
  Sched14Teams10Rounds,
  Sched14Teams11Rounds,
  Sched14Teams12Rounds,
  Sched14TeamsSingleRR,
} from './Schedules/14-team';
import { Sched15Teams10Rounds, Sched15Teams11Rounds, Sched15Teams9Rounds } from './Schedules/15-team';
import { Sched16Teams9Rounds, Sched16Teams10Rounds, Sched16Teams11Rounds } from './Schedules/16-team';
import { Sched17Teams10Rounds, Sched17Teams12Rounds, Sched17Teams9Rounds } from './Schedules/17-team';
import {
  Sched18Teams10Rounds,
  Sched18Teams12Rounds6to9,
  Sched18Teams12Rounds9to6,
  Sched18Teams14Rounds,
  Sched18Teams9Rounds,
} from './Schedules/18-team';
import {
  Sched19Teams11Rounds,
  Sched19Teams12Rounds,
  Sched19Teams13Rounds,
  Sched19Teams14Rounds,
} from './Schedules/19-team';
import {
  Sched20Teams11Rounds2x10,
  Sched20Teams11Rounds4x5,
  Sched20Teams12Rounds,
  Sched20Teams13Rounds,
  Sched20Teams14Rounds,
  Sched20Teams9Rounds,
} from './Schedules/20-team';
import {
  Sched21Teams11Rounds,
  Sched21Teams12Rounds,
  Sched21Teams14Rounds,
  Sched21Teams14RoundsNoCO,
} from './Schedules/21-team';
import {
  Sched22Teams11Rounds5Prelim,
  Sched22Teams11Rounds7Prelim,
  Sched22Teams13Rounds,
  Sched22Teams14Rounds967Split,
  Sched22Teams14Rounds976Split,
} from './Schedules/22-team';
import {
  Sched23Teams10Rounds,
  Sched23Teams11Rounds2Phases5Prelim,
  Sched23Teams11Rounds2Phases7Prelim,
  Sched23Teams11Rounds3Phases,
  Sched23Teams13Rounds,
  Sched23Teams8Rounds,
  Sched23Teams9Rounds,
} from './Schedules/23-team';
import {
  Sched24Teams10Rounds,
  Sched24Teams11Rounds2Phases5Prelim,
  Sched24Teams11Rounds2Phases7Prelim,
  Sched24Teams11Rounds3Phases,
  Sched24Teams14Rounds,
  Sched24Teams8Rounds,
  Sched24Teams9Rounds,
} from './Schedules/24-team';
import { Sched30Teams11Rounds2PPlusF } from './Schedules/30-team';
import { Sched4TeamsTripleRR, Sched4TeamsQuadRR } from './Schedules/4-team';
import { Sched5Teams13Rounds, Sched5TeamsDoubleRR } from './Schedules/5-team';
import { Sched6Teams13RoundsSplit33, Sched6Teams13RoundsSplit42, Sched6TeamsDoubleRR } from './Schedules/6-team';
import Sched7Teams13Rounds, { Sched7Teams10Rounds, Sched7TeamsDoubleRR, Sched7TeamsSingleRR } from './Schedules/7-team';
import { Sched8Teams10Rounds, Sched8Teams13Rounds, Sched8TeamsDoubleRR, Sched8TeamsSingleRR } from './Schedules/8-team';
import {
  Sched9Teams12Rounds333,
  Sched9Teams12Rounds432,
  Sched9Teams14Rounds,
  Sched9TeamsSingleRR,
} from './Schedules/9-team';
import StandardSchedule from './StandardSchedule';

export const sizesWithTemplates = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30];

export enum ScheduleTemplates {
  $4teamsTripleRR,
  $4teamsQuadRR,
  $5teamsDoubleRR,
  $5teams13Rounds,
  $6teamsDoubleRR,
  $6teams13RoundsSplit33,
  $6teams13RoundsSplit42,
  $7teamsSingleRR,
  $7teams10rounds,
  $7teams13rounds,
  $7teamsDoubleRR,
  $8teamsSingleRR,
  $8teams10rounds,
  $8teams13rounds,
  $8teamsDoubleRR,
  $9teamsSingleRR,
  $9teams12roundsSplit333,
  $9teams12roundsSplit432,
  $9teams14rounds,
  $10teamsSingleRR,
  $10teams12rounds433,
  $10teams12rounds442,
  $11teamsSingleRR,
  $11teams8rounds,
  $12teams8rounds,
  $12teams9rounds,
  $12teams10rounds,
  $12teamsSingleRR,
  $12teams14rounds,
  $13teamsSingleRR,
  $14teams10rounds,
  $14teams11rounds,
  $14teams12rounds,
  $14teamsSingleRR,
  $15teams9rounds,
  $15teams10rounds,
  $15teams11rounds,
  $16teams9rounds,
  $16teams10rounds,
  $16teams11rounds,
  $17teams9rounds,
  $17teams10rounds,
  $17teams12rounds,
  $18teams9rounds,
  $18teams10rounds,
  $18teams12rounds6to9,
  $18teams12rounds9to6,
  $18teams14rounds,
  $19teams11rounds,
  $19teams12rounds,
  $19teams13rounds,
  $19teams14rounds,
  $20teams9rounds,
  $20teams11rounds10to4,
  $20teams11rounds5to884,
  $20teams12rounds,
  $20teams13rounds,
  $20teams14rounds,
  $21teams11rounds,
  $21teams12rounds,
  $21teams14roundsCO,
  $21teams14roundsNoCO,
  $22teams11rounds5prelim,
  $22teams11rounds7prelim,
  $22teams13rounds,
  $22teams14rounds967,
  $22teams14rounds976,
  $23teams8rounds,
  $23teams9rounds,
  $23teams10rounds,
  $23teams11rounds2phases5prelim,
  $23teams11rounds2phases7prelim,
  $23teams11rounds3phases,
  $23teams13rounds,
  $24teams8rounds,
  $24teams9rounds,
  $24teams10rounds,
  $24teams11rounds2phases5prelim,
  $24teams11rounds2phases7prelim,
  $24teams11rounds3phases,
  $24teams14rounds,
  $30teams11rounds2PPlusF,
}

export function makeSchedule(template: ScheduleTemplates): StandardSchedule | null {
  switch (template) {
    // 4
    case ScheduleTemplates.$4teamsTripleRR:
      return new Sched4TeamsTripleRR();
    case ScheduleTemplates.$4teamsQuadRR:
      return new Sched4TeamsQuadRR();
    // 5
    case ScheduleTemplates.$5teamsDoubleRR:
      return new Sched5TeamsDoubleRR();
    case ScheduleTemplates.$5teams13Rounds:
      return new Sched5Teams13Rounds();
    // 6
    case ScheduleTemplates.$6teamsDoubleRR:
      return new Sched6TeamsDoubleRR();
    case ScheduleTemplates.$6teams13RoundsSplit33:
      return new Sched6Teams13RoundsSplit33();
    case ScheduleTemplates.$6teams13RoundsSplit42:
      return new Sched6Teams13RoundsSplit42();
    // 7
    case ScheduleTemplates.$7teamsSingleRR:
      return new Sched7TeamsSingleRR();
    case ScheduleTemplates.$7teams10rounds:
      return new Sched7Teams10Rounds();
    case ScheduleTemplates.$7teams13rounds:
      return new Sched7Teams13Rounds();
    case ScheduleTemplates.$7teamsDoubleRR:
      return new Sched7TeamsDoubleRR();
    // 8
    case ScheduleTemplates.$8teamsSingleRR:
      return new Sched8TeamsSingleRR();
    case ScheduleTemplates.$8teams10rounds:
      return new Sched8Teams10Rounds();
    case ScheduleTemplates.$8teams13rounds:
      return new Sched8Teams13Rounds();
    case ScheduleTemplates.$8teamsDoubleRR:
      return new Sched8TeamsDoubleRR();
    // 9
    case ScheduleTemplates.$9teamsSingleRR:
      return new Sched9TeamsSingleRR();
    case ScheduleTemplates.$9teams12roundsSplit333:
      return new Sched9Teams12Rounds333();
    case ScheduleTemplates.$9teams12roundsSplit432:
      return new Sched9Teams12Rounds432();
    case ScheduleTemplates.$9teams14rounds:
      return new Sched9Teams14Rounds();
    // 10
    case ScheduleTemplates.$10teamsSingleRR:
      return new Sched10TeamsSingleRR();
    case ScheduleTemplates.$10teams12rounds433:
      return new Sched10Teams12Rounds433();
    case ScheduleTemplates.$10teams12rounds442:
      return new Sched10Teams12Rounds442();
    // 11
    case ScheduleTemplates.$11teams8rounds:
      return new Sched11Teams8Rounds();
    case ScheduleTemplates.$11teamsSingleRR:
      return new Sched11TeamsSingleRR();
    // 12
    case ScheduleTemplates.$12teams8rounds:
      return new Sched12Teams8Rounds();
    case ScheduleTemplates.$12teams9rounds:
      return new Sched12Teams9Rounds();
    case ScheduleTemplates.$12teams10rounds:
      return new Sched12Teams10Rounds();
    case ScheduleTemplates.$12teamsSingleRR:
      return new Sched12TeamsSingleRR();
    case ScheduleTemplates.$12teams14rounds:
      return new Sched12Teams14Rounds();
    // 13
    case ScheduleTemplates.$13teamsSingleRR:
      return new Sched13TeamsSingleRR();
    // 14
    case ScheduleTemplates.$14teams10rounds:
      return new Sched14Teams10Rounds();
    case ScheduleTemplates.$14teams11rounds:
      return new Sched14Teams11Rounds();
    case ScheduleTemplates.$14teams12rounds:
      return new Sched14Teams12Rounds();
    case ScheduleTemplates.$14teamsSingleRR:
      return new Sched14TeamsSingleRR();
    // 15
    case ScheduleTemplates.$15teams9rounds:
      return new Sched15Teams9Rounds();
    case ScheduleTemplates.$15teams10rounds:
      return new Sched15Teams10Rounds();
    case ScheduleTemplates.$15teams11rounds:
      return new Sched15Teams11Rounds();
    // 16
    case ScheduleTemplates.$16teams9rounds:
      return new Sched16Teams9Rounds();
    case ScheduleTemplates.$16teams10rounds:
      return new Sched16Teams10Rounds();
    case ScheduleTemplates.$16teams11rounds:
      return new Sched16Teams11Rounds();
    // 17
    case ScheduleTemplates.$17teams9rounds:
      return new Sched17Teams9Rounds();
    case ScheduleTemplates.$17teams10rounds:
      return new Sched17Teams10Rounds();
    case ScheduleTemplates.$17teams12rounds:
      return new Sched17Teams12Rounds();
    // 18
    case ScheduleTemplates.$18teams9rounds:
      return new Sched18Teams9Rounds();
    case ScheduleTemplates.$18teams10rounds:
      return new Sched18Teams10Rounds();
    case ScheduleTemplates.$18teams12rounds6to9:
      return new Sched18Teams12Rounds6to9();
    case ScheduleTemplates.$18teams12rounds9to6:
      return new Sched18Teams12Rounds9to6();
    case ScheduleTemplates.$18teams14rounds:
      return new Sched18Teams14Rounds();
    // 19
    case ScheduleTemplates.$19teams11rounds:
      return new Sched19Teams11Rounds();
    case ScheduleTemplates.$19teams12rounds:
      return new Sched19Teams12Rounds();
    case ScheduleTemplates.$19teams13rounds:
      return new Sched19Teams13Rounds();
    case ScheduleTemplates.$19teams14rounds:
      return new Sched19Teams14Rounds();
    // 20
    case ScheduleTemplates.$20teams9rounds:
      return new Sched20Teams9Rounds();
    case ScheduleTemplates.$20teams11rounds10to4:
      return new Sched20Teams11Rounds2x10();
    case ScheduleTemplates.$20teams11rounds5to884:
      return new Sched20Teams11Rounds4x5();
    case ScheduleTemplates.$20teams12rounds:
      return new Sched20Teams12Rounds();
    case ScheduleTemplates.$20teams13rounds:
      return new Sched20Teams13Rounds();
    case ScheduleTemplates.$20teams14rounds:
      return new Sched20Teams14Rounds();
    // 21
    case ScheduleTemplates.$21teams11rounds:
      return new Sched21Teams11Rounds();
    case ScheduleTemplates.$21teams12rounds:
      return new Sched21Teams12Rounds();
    case ScheduleTemplates.$21teams14roundsCO:
      return new Sched21Teams14Rounds();
    case ScheduleTemplates.$21teams14roundsNoCO:
      return new Sched21Teams14RoundsNoCO();
    // 22
    case ScheduleTemplates.$22teams11rounds5prelim:
      return new Sched22Teams11Rounds5Prelim();
    case ScheduleTemplates.$22teams11rounds7prelim:
      return new Sched22Teams11Rounds7Prelim();
    case ScheduleTemplates.$22teams13rounds:
      return new Sched22Teams13Rounds();
    case ScheduleTemplates.$22teams14rounds967:
      return new Sched22Teams14Rounds967Split();
    case ScheduleTemplates.$22teams14rounds976:
      return new Sched22Teams14Rounds976Split();
    // 23
    case ScheduleTemplates.$23teams8rounds:
      return new Sched23Teams8Rounds();
    case ScheduleTemplates.$23teams9rounds:
      return new Sched23Teams9Rounds();
    case ScheduleTemplates.$23teams10rounds:
      return new Sched23Teams10Rounds();
    case ScheduleTemplates.$23teams11rounds2phases5prelim:
      return new Sched23Teams11Rounds2Phases5Prelim();
    case ScheduleTemplates.$23teams11rounds2phases7prelim:
      return new Sched23Teams11Rounds2Phases7Prelim();
    case ScheduleTemplates.$23teams11rounds3phases:
      return new Sched23Teams11Rounds3Phases();
    case ScheduleTemplates.$23teams13rounds:
      return new Sched23Teams13Rounds();
    // 24
    case ScheduleTemplates.$24teams8rounds:
      return new Sched24Teams8Rounds();
    case ScheduleTemplates.$24teams9rounds:
      return new Sched24Teams9Rounds();
    case ScheduleTemplates.$24teams10rounds:
      return new Sched24Teams10Rounds();
    case ScheduleTemplates.$24teams11rounds2phases5prelim:
      return new Sched24Teams11Rounds2Phases5Prelim();
    case ScheduleTemplates.$24teams11rounds2phases7prelim:
      return new Sched24Teams11Rounds2Phases7Prelim();
    case ScheduleTemplates.$24teams11rounds3phases:
      return new Sched24Teams11Rounds3Phases();
    case ScheduleTemplates.$24teams14rounds:
      return new Sched24Teams14Rounds();
    // 30
    case ScheduleTemplates.$30teams11rounds2PPlusF:
      return new Sched30Teams11Rounds2PPlusF();
    default:
      return null;
  }
}

export function getTemplateShortName(template: ScheduleTemplates) {
  switch (template) {
    // 4
    case ScheduleTemplates.$4teamsTripleRR:
      return Sched4TeamsTripleRR.shortName;
    case ScheduleTemplates.$4teamsQuadRR:
      return Sched4TeamsQuadRR.shortName;
    // 5
    case ScheduleTemplates.$5teamsDoubleRR:
      return Sched5TeamsDoubleRR.shortName;
    case ScheduleTemplates.$5teams13Rounds:
      return Sched5Teams13Rounds.shortName;
    // 6
    case ScheduleTemplates.$6teamsDoubleRR:
      return Sched6TeamsDoubleRR.shortName;
    case ScheduleTemplates.$6teams13RoundsSplit33:
      return Sched6Teams13RoundsSplit33.shortName;
    case ScheduleTemplates.$6teams13RoundsSplit42:
      return Sched6Teams13RoundsSplit42.shortName;
    // 7
    case ScheduleTemplates.$7teamsSingleRR:
      return Sched7TeamsSingleRR.shortName;
    case ScheduleTemplates.$7teams10rounds:
      return Sched7Teams10Rounds.shortName;
    case ScheduleTemplates.$7teams13rounds:
      return Sched7Teams13Rounds.shortName;
    case ScheduleTemplates.$7teamsDoubleRR:
      return Sched7TeamsDoubleRR.shortName;
    // 8
    case ScheduleTemplates.$8teamsSingleRR:
      return Sched8TeamsSingleRR.shortName;
    case ScheduleTemplates.$8teams10rounds:
      return Sched8Teams10Rounds.shortName;
    case ScheduleTemplates.$8teams13rounds:
      return Sched8Teams13Rounds.shortName;
    case ScheduleTemplates.$8teamsDoubleRR:
      return Sched8TeamsDoubleRR.shortName;
    // 9
    case ScheduleTemplates.$9teamsSingleRR:
      return Sched9TeamsSingleRR.shortName;
    case ScheduleTemplates.$9teams12roundsSplit333:
      return Sched9Teams12Rounds333.shortName;
    case ScheduleTemplates.$9teams12roundsSplit432:
      return Sched9Teams12Rounds432.shortName;
    case ScheduleTemplates.$9teams14rounds:
      return Sched9Teams14Rounds.shortName;
    // 10
    case ScheduleTemplates.$10teamsSingleRR:
      return Sched10TeamsSingleRR.shortName;
    case ScheduleTemplates.$10teams12rounds433:
      return Sched10Teams12Rounds433.shortName;
    case ScheduleTemplates.$10teams12rounds442:
      return Sched10Teams12Rounds442.shortName;
    // 11
    case ScheduleTemplates.$11teams8rounds:
      return Sched11Teams8Rounds.shortName;
    case ScheduleTemplates.$11teamsSingleRR:
      return Sched11TeamsSingleRR.shortName;
    // 12
    case ScheduleTemplates.$12teams8rounds:
      return Sched12Teams8Rounds.shortName;
    case ScheduleTemplates.$12teams9rounds:
      return Sched12Teams9Rounds.shortName;
    case ScheduleTemplates.$12teams10rounds:
      return Sched12Teams10Rounds.shortName;
    case ScheduleTemplates.$12teamsSingleRR:
      return Sched12TeamsSingleRR.shortName;
    case ScheduleTemplates.$12teams14rounds:
      return Sched12Teams14Rounds.shortName;
    // 13
    case ScheduleTemplates.$13teamsSingleRR:
      return Sched13TeamsSingleRR.shortName;
    // 14
    case ScheduleTemplates.$14teams10rounds:
      return Sched14Teams10Rounds.shortName;
    case ScheduleTemplates.$14teams11rounds:
      return Sched14Teams11Rounds.shortName;
    case ScheduleTemplates.$14teams12rounds:
      return Sched14Teams12Rounds.shortName;
    case ScheduleTemplates.$14teamsSingleRR:
      return Sched14TeamsSingleRR.shortName;
    // 15
    case ScheduleTemplates.$15teams9rounds:
      return Sched15Teams9Rounds.shortName;
    case ScheduleTemplates.$15teams10rounds:
      return Sched15Teams10Rounds.shortName;
    case ScheduleTemplates.$15teams11rounds:
      return Sched15Teams11Rounds.shortName;
    // 16
    case ScheduleTemplates.$16teams9rounds:
      return Sched16Teams9Rounds.shortName;
    case ScheduleTemplates.$16teams10rounds:
      return Sched16Teams10Rounds.shortName;
    case ScheduleTemplates.$16teams11rounds:
      return Sched16Teams11Rounds.shortName;
    // 17
    case ScheduleTemplates.$17teams9rounds:
      return Sched17Teams9Rounds.shortName;
    case ScheduleTemplates.$17teams10rounds:
      return Sched17Teams10Rounds.shortName;
    case ScheduleTemplates.$17teams12rounds:
      return Sched17Teams12Rounds.shortName;
    // 18
    case ScheduleTemplates.$18teams9rounds:
      return Sched18Teams9Rounds.shortName;
    case ScheduleTemplates.$18teams10rounds:
      return Sched18Teams10Rounds.shortName;
    case ScheduleTemplates.$18teams12rounds6to9:
      return Sched18Teams12Rounds6to9.shortName;
    case ScheduleTemplates.$18teams12rounds9to6:
      return Sched18Teams12Rounds9to6.shortName;
    case ScheduleTemplates.$18teams14rounds:
      return Sched18Teams14Rounds.shortName;
    // 19
    case ScheduleTemplates.$19teams11rounds:
      return Sched19Teams11Rounds.shortName;
    case ScheduleTemplates.$19teams12rounds:
      return Sched19Teams12Rounds.shortName;
    case ScheduleTemplates.$19teams13rounds:
      return Sched19Teams13Rounds.shortName;
    case ScheduleTemplates.$19teams14rounds:
      return Sched19Teams14Rounds.shortName;
    // 20
    case ScheduleTemplates.$20teams9rounds:
      return Sched20Teams9Rounds.shortName;
    case ScheduleTemplates.$20teams11rounds10to4:
      return Sched20Teams11Rounds2x10.shortName;
    case ScheduleTemplates.$20teams11rounds5to884:
      return Sched20Teams11Rounds4x5.shortName;
    case ScheduleTemplates.$20teams12rounds:
      return Sched20Teams12Rounds.shortName;
    case ScheduleTemplates.$20teams13rounds:
      return Sched20Teams13Rounds.shortName;
    case ScheduleTemplates.$20teams14rounds:
      return Sched20Teams14Rounds.shortName;
    // 21
    case ScheduleTemplates.$21teams11rounds:
      return Sched21Teams11Rounds.shortName;
    case ScheduleTemplates.$21teams12rounds:
      return Sched21Teams12Rounds.shortName;
    case ScheduleTemplates.$21teams14roundsCO:
      return Sched21Teams14Rounds.shortName;
    case ScheduleTemplates.$21teams14roundsNoCO:
      return Sched21Teams14RoundsNoCO.shortName;
    // 22
    case ScheduleTemplates.$22teams11rounds5prelim:
      return Sched22Teams11Rounds5Prelim.shortName;
    case ScheduleTemplates.$22teams11rounds7prelim:
      return Sched22Teams11Rounds7Prelim.shortName;
    case ScheduleTemplates.$22teams13rounds:
      return Sched22Teams13Rounds.shortName;
    case ScheduleTemplates.$22teams14rounds967:
      return Sched22Teams14Rounds967Split.shortName;
    case ScheduleTemplates.$22teams14rounds976:
      return Sched22Teams14Rounds976Split.shortName;
    // 23
    case ScheduleTemplates.$23teams8rounds:
      return Sched23Teams8Rounds.shortName;
    case ScheduleTemplates.$23teams9rounds:
      return Sched23Teams9Rounds.shortName;
    case ScheduleTemplates.$23teams10rounds:
      return Sched23Teams10Rounds.shortName;
    case ScheduleTemplates.$23teams11rounds2phases5prelim:
      return Sched23Teams11Rounds2Phases5Prelim.shortName;
    case ScheduleTemplates.$23teams11rounds2phases7prelim:
      return Sched23Teams11Rounds2Phases7Prelim.shortName;
    case ScheduleTemplates.$23teams11rounds3phases:
      return Sched23Teams11Rounds3Phases.shortName;
    case ScheduleTemplates.$23teams13rounds:
      return Sched23Teams13Rounds.shortName;
    // 24
    case ScheduleTemplates.$24teams8rounds:
      return Sched24Teams8Rounds.shortName;
    case ScheduleTemplates.$24teams9rounds:
      return Sched24Teams9Rounds.shortName;
    case ScheduleTemplates.$24teams10rounds:
      return Sched24Teams10Rounds.shortName;
    case ScheduleTemplates.$24teams11rounds2phases5prelim:
      return Sched24Teams11Rounds2Phases5Prelim.shortName;
    case ScheduleTemplates.$24teams11rounds2phases7prelim:
      return Sched24Teams11Rounds2Phases7Prelim.shortName;
    case ScheduleTemplates.$24teams11rounds3phases:
      return Sched24Teams11Rounds3Phases.shortName;
    case ScheduleTemplates.$24teams14rounds:
      return Sched24Teams14Rounds.shortName;
    // 30
    case ScheduleTemplates.$30teams11rounds2PPlusF:
      return Sched30Teams11Rounds2PPlusF.shortName;
    default:
      return '';
  }
}

export function getTemplateList(size: number | string) {
  if (typeof size === 'string') return [];

  switch (size) {
    case 4:
      return [ScheduleTemplates.$4teamsTripleRR, ScheduleTemplates.$4teamsQuadRR];
    case 5:
      return [ScheduleTemplates.$5teamsDoubleRR, ScheduleTemplates.$5teams13Rounds];
    case 6:
      return [
        ScheduleTemplates.$6teamsDoubleRR,
        ScheduleTemplates.$6teams13RoundsSplit33,
        ScheduleTemplates.$6teams13RoundsSplit42,
      ];
    case 7:
      return [
        ScheduleTemplates.$7teamsSingleRR,
        ScheduleTemplates.$7teams10rounds,
        ScheduleTemplates.$7teams13rounds,
        ScheduleTemplates.$7teamsDoubleRR,
      ];
    case 8:
      return [
        ScheduleTemplates.$8teamsSingleRR,
        ScheduleTemplates.$8teams10rounds,
        ScheduleTemplates.$8teams13rounds,
        ScheduleTemplates.$8teamsDoubleRR,
      ];
    case 9:
      return [
        ScheduleTemplates.$9teamsSingleRR,
        ScheduleTemplates.$9teams12roundsSplit333,
        ScheduleTemplates.$9teams12roundsSplit432,
        ScheduleTemplates.$9teams14rounds,
      ];
    case 10:
      return [
        ScheduleTemplates.$10teamsSingleRR,
        ScheduleTemplates.$10teams12rounds433,
        ScheduleTemplates.$10teams12rounds442,
      ];
    case 11:
      return [ScheduleTemplates.$11teams8rounds, ScheduleTemplates.$11teamsSingleRR];
    case 12:
      return [
        ScheduleTemplates.$12teams8rounds,
        ScheduleTemplates.$12teams9rounds,
        ScheduleTemplates.$12teams10rounds,
        ScheduleTemplates.$12teamsSingleRR,
        ScheduleTemplates.$12teams14rounds,
      ];
    case 13:
      return [ScheduleTemplates.$13teamsSingleRR];
    case 14:
      return [
        ScheduleTemplates.$14teams10rounds,
        ScheduleTemplates.$14teams11rounds,
        ScheduleTemplates.$14teams12rounds,
        ScheduleTemplates.$14teamsSingleRR,
      ];
    case 15:
      return [
        ScheduleTemplates.$15teams9rounds,
        ScheduleTemplates.$15teams10rounds,
        ScheduleTemplates.$15teams11rounds,
      ];
    case 16:
      return [
        ScheduleTemplates.$16teams9rounds,
        ScheduleTemplates.$16teams10rounds,
        ScheduleTemplates.$16teams11rounds,
      ];
    case 17:
      return [
        ScheduleTemplates.$17teams9rounds,
        ScheduleTemplates.$17teams10rounds,
        ScheduleTemplates.$17teams12rounds,
      ];
    case 18:
      return [
        ScheduleTemplates.$18teams9rounds,
        ScheduleTemplates.$18teams10rounds,
        ScheduleTemplates.$18teams12rounds6to9,
        ScheduleTemplates.$18teams12rounds9to6,
        ScheduleTemplates.$18teams14rounds,
      ];
    case 19:
      return [
        ScheduleTemplates.$19teams11rounds,
        ScheduleTemplates.$19teams12rounds,
        ScheduleTemplates.$19teams13rounds,
        ScheduleTemplates.$19teams14rounds,
      ];
    case 20:
      return [
        ScheduleTemplates.$20teams9rounds,
        ScheduleTemplates.$20teams11rounds10to4,
        ScheduleTemplates.$20teams11rounds5to884,
        ScheduleTemplates.$20teams12rounds,
        ScheduleTemplates.$20teams13rounds,
        ScheduleTemplates.$20teams14rounds,
      ];
    case 21:
      return [
        ScheduleTemplates.$21teams11rounds,
        ScheduleTemplates.$21teams12rounds,
        ScheduleTemplates.$21teams14roundsCO,
        ScheduleTemplates.$21teams14roundsNoCO,
      ];
    case 22:
      return [
        ScheduleTemplates.$22teams11rounds5prelim,
        ScheduleTemplates.$22teams11rounds7prelim,
        ScheduleTemplates.$22teams13rounds,
        ScheduleTemplates.$22teams14rounds967,
        ScheduleTemplates.$22teams14rounds976,
      ];
    case 23:
      return [
        ScheduleTemplates.$23teams8rounds,
        ScheduleTemplates.$23teams9rounds,
        ScheduleTemplates.$23teams10rounds,
        ScheduleTemplates.$23teams11rounds2phases5prelim,
        ScheduleTemplates.$23teams11rounds2phases7prelim,
        ScheduleTemplates.$23teams11rounds3phases,
        ScheduleTemplates.$23teams13rounds,
      ];
    case 24:
      return [
        ScheduleTemplates.$24teams8rounds,
        ScheduleTemplates.$24teams9rounds,
        ScheduleTemplates.$24teams10rounds,
        ScheduleTemplates.$24teams11rounds2phases5prelim,
        ScheduleTemplates.$24teams11rounds2phases7prelim,
        ScheduleTemplates.$24teams11rounds3phases,
        ScheduleTemplates.$24teams14rounds,
      ];
    case 30:
      return [ScheduleTemplates.$30teams11rounds2PPlusF];
    default:
      return [];
  }
}
