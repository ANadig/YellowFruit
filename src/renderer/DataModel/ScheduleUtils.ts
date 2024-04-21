import { Sched10Teams12Rounds433, Sched10Teams12Rounds442, Sched10TeamsSingleRR } from './Schedules/10-team';
import { Sched11Teams8Rounds, Sched11TeamsSingleRR } from './Schedules/11-team';
import {
  Sched12Teams10Rounds,
  Sched12Teams14Rounds,
  Sched12Teams8Rounds,
  Sched12Teams9Rounds,
  Sched12TeamsSingleRR,
} from './Schedules/12-team';
import {
  Sched14Teams10Rounds,
  Sched14Teams11Rounds,
  Sched14Teams12Rounds,
  Sched14TeamsSingleRR,
} from './Schedules/14-team';
import { Sched24Teams11Rounds2Phases, Sched24Teams11Rounds3Phases } from './Schedules/24-team';
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

export const sizesWithTemplates = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 24, 30];

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
  $9Teams12RoundsSplit333,
  $9Teams12RoundsSplit432,
  $9Teams14Rounds,
  $10TeamsSingleRR,
  $10teams12rounds433,
  $10teams12rounds442,
  $11teamsSingleRR,
  $11teams8rounds,
  $12teams8rounds,
  $12teams9rounds,
  $12teams10rounds,
  $12teamsSingleRR,
  $12teams14rounds,
  $14teams10rounds,
  $14teams11rounds,
  $14teams12rounds,
  $14teamsSingleRR,
  $24teams11rounds2phases,
  $24teams11rounds3phases,
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
    case ScheduleTemplates.$9Teams12RoundsSplit333:
      return new Sched9Teams12Rounds333();
    case ScheduleTemplates.$9Teams12RoundsSplit432:
      return new Sched9Teams12Rounds432();
    case ScheduleTemplates.$9Teams14Rounds:
      return new Sched9Teams14Rounds();
    // 10
    case ScheduleTemplates.$10TeamsSingleRR:
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
    // 14
    case ScheduleTemplates.$14teams10rounds:
      return new Sched14Teams10Rounds();
    case ScheduleTemplates.$14teams11rounds:
      return new Sched14Teams11Rounds();
    case ScheduleTemplates.$14teams12rounds:
      return new Sched14Teams12Rounds();
    case ScheduleTemplates.$14teamsSingleRR:
      return new Sched14TeamsSingleRR();
    // 24
    case ScheduleTemplates.$24teams11rounds2phases:
      return new Sched24Teams11Rounds2Phases();
    case ScheduleTemplates.$24teams11rounds3phases:
      return new Sched24Teams11Rounds3Phases();
    // 30
    case ScheduleTemplates.$30teams11rounds2PPlusF:
      return new Sched30Teams11Rounds2PPlusF();
    default:
      return null;
  }
}

export function getTemplateName(template: ScheduleTemplates, size: number) {
  return `${size} Teams: ${getTemplateShortName(template)}`;
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
    case ScheduleTemplates.$9Teams12RoundsSplit333:
      return Sched9Teams12Rounds333.shortName;
    case ScheduleTemplates.$9Teams12RoundsSplit432:
      return Sched9Teams12Rounds432.shortName;
    case ScheduleTemplates.$9Teams14Rounds:
      return Sched9Teams14Rounds.shortName;
    // 10
    case ScheduleTemplates.$10TeamsSingleRR:
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
    // 14
    case ScheduleTemplates.$14teams10rounds:
      return Sched14Teams10Rounds.shortName;
    case ScheduleTemplates.$14teams11rounds:
      return Sched14Teams11Rounds.shortName;
    case ScheduleTemplates.$14teams12rounds:
      return Sched14Teams12Rounds.shortName;
    case ScheduleTemplates.$14teamsSingleRR:
      return Sched14TeamsSingleRR.shortName;
    // 24
    case ScheduleTemplates.$24teams11rounds2phases:
      return Sched24Teams11Rounds2Phases.shortName;
    case ScheduleTemplates.$24teams11rounds3phases:
      return Sched24Teams11Rounds3Phases.shortName;
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
        ScheduleTemplates.$9Teams12RoundsSplit333,
        ScheduleTemplates.$9Teams12RoundsSplit432,
        ScheduleTemplates.$9Teams14Rounds,
      ];
    case 10:
      return [
        ScheduleTemplates.$10TeamsSingleRR,
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
    case 14:
      return [
        ScheduleTemplates.$14teams10rounds,
        ScheduleTemplates.$14teams11rounds,
        ScheduleTemplates.$14teams12rounds,
        ScheduleTemplates.$14teamsSingleRR,
      ];
    case 24:
      return [ScheduleTemplates.$24teams11rounds2phases, ScheduleTemplates.$24teams11rounds3phases];
    case 30:
      return [ScheduleTemplates.$30teams11rounds2PPlusF];
    default:
      return [];
  }
}
