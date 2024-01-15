import { Sched24Teams11Rounds2Phases, Sched24Teams11Rounds3Phases } from './Schedules/24-team';
import { Sched4TeamsTripleRR, Sched4TeamsQuadRR } from './Schedules/4-team';
import StandardSchedule from './StandardSchedule';

export enum ScheduleTemplates {
  $4teamsTripleRR,
  $4teamsQuadRR,
  $24teams11rounds2phases,
  $24teams11rounds3phases,
}

export function makeSchedule(template: ScheduleTemplates): StandardSchedule | null {
  switch (template) {
    case ScheduleTemplates.$4teamsTripleRR:
      return new Sched4TeamsTripleRR();
    case ScheduleTemplates.$4teamsQuadRR:
      return new Sched4TeamsQuadRR();
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
    case 24:
      return [ScheduleTemplates.$24teams11rounds2phases, ScheduleTemplates.$24teams11rounds3phases];
    default:
      return [];
  }
}
