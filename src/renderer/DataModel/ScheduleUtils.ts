import { Sched24Teams11Rounds2Phases, Sched24Teams11Rounds3Phases } from './Schedules/24-team';
import { Sched4TeamsTripleRR, Sched4TeamsQuadRR } from './Schedules/4-team';
import { Sched5Teams13Rounds, Sched5TeamsDoubleRR } from './Schedules/5-team';
import { Sched6Teams13RoundsSplit33, Sched6Teams13RoundsSplit42, Sched6TeamsDoubleRR } from './Schedules/6-team';
import StandardSchedule from './StandardSchedule';

export const sizesWithTemplates = [4, 5, 6, 24];

export enum ScheduleTemplates {
  $4teamsTripleRR,
  $4teamsQuadRR,
  $24teams11rounds2phases,
  $24teams11rounds3phases,
  $5teamsDoubleRR,
  $5teams13Rounds,
  $6teamsDoubleRR,
  $6teams13RoundsSplit33,
  $6teams13RoundsSplit42,
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
      return 'Triple Round Robin';
    case ScheduleTemplates.$4teamsQuadRR:
      return 'Quadruple Round Robin';
    case ScheduleTemplates.$5teamsDoubleRR:
      return 'Double Round Robin';
    case ScheduleTemplates.$5teams13Rounds:
      return '13 Rounds';
    case ScheduleTemplates.$6teamsDoubleRR:
      return 'Double Round Robin';
    case ScheduleTemplates.$6teams13RoundsSplit33:
      return '13 Rounds (3/3 Split)';
    case ScheduleTemplates.$6teams13RoundsSplit42:
      return '13 Rounds (4/2 Split)';
    case ScheduleTemplates.$24teams11rounds2phases:
      return '11 Rounds (2 Phases)';
    case ScheduleTemplates.$24teams11rounds3phases:
      return '11 Rounds (3 Phases)';
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
    case 24:
      return [ScheduleTemplates.$24teams11rounds2phases, ScheduleTemplates.$24teams11rounds3phases];
    default:
      return [];
  }
}
