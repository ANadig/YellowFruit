import { Sched24Teams11Rounds2Phases, Sched24Teams11Rounds3Phases } from './Schedules/24-team';
import { Sched4TeamsTripleRR, Sched4TeamsQuadRR } from './Schedules/4-team';
import { Sched5Teams13Rounds, Sched5TeamsDoubleRR } from './Schedules/5-team';
import { Sched6Teams13RoundsSplit33, Sched6Teams13RoundsSplit42, Sched6TeamsDoubleRR } from './Schedules/6-team';
import Sched7Teams13Rounds, { Sched7Teams10Rounds, Sched7TeamsDoubleRR } from './Schedules/7-team';
import StandardSchedule from './StandardSchedule';

export const sizesWithTemplates = [4, 5, 6, 7, 24];

export enum ScheduleTemplates {
  $4teamsTripleRR,
  $4teamsQuadRR,
  $5teamsDoubleRR,
  $5teams13Rounds,
  $6teamsDoubleRR,
  $6teams13RoundsSplit33,
  $6teams13RoundsSplit42,
  $7Teams10Rounds,
  $7Teams13Rounds,
  $7TeamsDoubleRR,
  $24teams11rounds2phases,
  $24teams11rounds3phases,
}

export function makeSchedule(template: ScheduleTemplates): StandardSchedule | null {
  switch (template) {
    case ScheduleTemplates.$4teamsTripleRR:
      return new Sched4TeamsTripleRR();
    case ScheduleTemplates.$4teamsQuadRR:
      return new Sched4TeamsQuadRR();
    case ScheduleTemplates.$5teamsDoubleRR:
      return new Sched5TeamsDoubleRR();
    case ScheduleTemplates.$5teams13Rounds:
      return new Sched5Teams13Rounds();
    case ScheduleTemplates.$6teamsDoubleRR:
      return new Sched6TeamsDoubleRR();
    case ScheduleTemplates.$6teams13RoundsSplit33:
      return new Sched6Teams13RoundsSplit33();
    case ScheduleTemplates.$6teams13RoundsSplit42:
      return new Sched6Teams13RoundsSplit42();
    case ScheduleTemplates.$7Teams10Rounds:
      return new Sched7Teams10Rounds();
    case ScheduleTemplates.$7Teams13Rounds:
      return new Sched7Teams13Rounds();
    case ScheduleTemplates.$7TeamsDoubleRR:
      return new Sched7TeamsDoubleRR();
    case ScheduleTemplates.$24teams11rounds2phases:
      return new Sched24Teams11Rounds2Phases();
    case ScheduleTemplates.$24teams11rounds3phases:
      return new Sched24Teams11Rounds3Phases();
    default:
      return null;
  }
}

export function getTemplateName(template: ScheduleTemplates, size: number) {
  return `${size} Teams: ${getTemplateShortName(template)}`;
}

export function getTemplateShortName(template: ScheduleTemplates) {
  switch (template) {
    case ScheduleTemplates.$4teamsTripleRR:
      return Sched4TeamsTripleRR.shortName;
    case ScheduleTemplates.$4teamsQuadRR:
      return Sched4TeamsQuadRR.shortName;
    case ScheduleTemplates.$5teamsDoubleRR:
      return Sched5TeamsDoubleRR.shortName;
    case ScheduleTemplates.$5teams13Rounds:
      return Sched5Teams13Rounds.shortName;
    case ScheduleTemplates.$6teamsDoubleRR:
      return Sched6TeamsDoubleRR.shortName;
    case ScheduleTemplates.$6teams13RoundsSplit33:
      return Sched6Teams13RoundsSplit33.shortName;
    case ScheduleTemplates.$6teams13RoundsSplit42:
      return Sched6Teams13RoundsSplit42.shortName;
    case ScheduleTemplates.$7Teams10Rounds:
      return Sched7Teams10Rounds.shortName;
    case ScheduleTemplates.$7Teams13Rounds:
      return Sched7Teams13Rounds.shortName;
    case ScheduleTemplates.$7TeamsDoubleRR:
      return Sched7TeamsDoubleRR.shortName;
    case ScheduleTemplates.$24teams11rounds2phases:
      return Sched24Teams11Rounds2Phases.shortName;
    case ScheduleTemplates.$24teams11rounds3phases:
      return Sched24Teams11Rounds3Phases.shortName;
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
      return [ScheduleTemplates.$7Teams10Rounds, ScheduleTemplates.$7Teams13Rounds, ScheduleTemplates.$7TeamsDoubleRR];
    case 24:
      return [ScheduleTemplates.$24teams11rounds2phases, ScheduleTemplates.$24teams11rounds3phases];
    default:
      return [];
  }
}
