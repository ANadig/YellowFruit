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
import { Sched25Teams10Rounds, Sched25Teams10RoundsTop2Parallel } from './Schedules/25-team';
import { Sched26Teams11RoundsNoWC, Sched26Teams11RoundsWC } from './Schedules/26-team';
import { Sched27Teams11Rounds2PPlusF, Sched27Teams13Rounds6to10, Sched27Teams13Rounds9to6 } from './Schedules/27-team';
import { Sched28Teams11Rounds2PPlusF, Sched28Teams13Rounds6to10 } from './Schedules/28-team';
import { Sched29Teams11Rounds2PPlusF, Sched29Teams13Rounds6to10 } from './Schedules/29-team';
import { Sched30Teams11Rounds2PPlusF, Sched30Teams13Rounds6to10 } from './Schedules/30-team';
import { Sched4TeamsTripleRR, Sched4TeamsQuadRR } from './Schedules/4-team';
import { Sched5Teams13Rounds, Sched5TeamsDoubleRR } from './Schedules/5-team';
import { Sched6Teams13RoundsSplit33, Sched6Teams13RoundsSplit42, Sched6TeamsDoubleRR } from './Schedules/6-team';
import { Sched7Teams13Rounds, Sched7Teams10Rounds, Sched7TeamsDoubleRR, Sched7TeamsSingleRR } from './Schedules/7-team';
import { Sched8Teams10Rounds, Sched8Teams13Rounds, Sched8TeamsDoubleRR, Sched8TeamsSingleRR } from './Schedules/8-team';
import {
  Sched9Teams12Rounds333,
  Sched9Teams12Rounds432,
  Sched9Teams14Rounds,
  Sched9TeamsSingleRR,
} from './Schedules/9-team';

export const sizesWithTemplates = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
];

export function getStdSchedule(shortName: string, size: number | string) {
  if (typeof size === 'string') return null;
  return getTemplateList(size).find((sch) => sch.shortName === shortName) ?? null;
}

export function getTemplateList(size: number | string) {
  if (typeof size === 'string') return [];

  switch (size) {
    case 4:
      return [Sched4TeamsTripleRR, Sched4TeamsQuadRR];
    case 5:
      return [Sched5TeamsDoubleRR, Sched5Teams13Rounds];
    case 6:
      return [Sched6TeamsDoubleRR, Sched6Teams13RoundsSplit33, Sched6Teams13RoundsSplit42];
    case 7:
      return [Sched7TeamsSingleRR, Sched7Teams10Rounds, Sched7Teams13Rounds, Sched7TeamsDoubleRR];
    case 8:
      return [Sched8TeamsSingleRR, Sched8Teams10Rounds, Sched8Teams13Rounds, Sched8TeamsDoubleRR];
    case 9:
      return [Sched9TeamsSingleRR, Sched9Teams12Rounds333, Sched9Teams12Rounds432, Sched9Teams14Rounds];
    case 10:
      return [Sched10TeamsSingleRR, Sched10Teams12Rounds433, Sched10Teams12Rounds442];
    case 11:
      return [Sched11Teams8Rounds, Sched11TeamsSingleRR];
    case 12:
      return [
        Sched12Teams8Rounds,
        Sched12Teams9Rounds,
        Sched12Teams10Rounds,
        Sched12TeamsSingleRR,
        Sched12Teams14Rounds,
      ];
    case 13:
      return [Sched13TeamsSingleRR];
    case 14:
      return [Sched14Teams10Rounds, Sched14Teams11Rounds, Sched14Teams12Rounds, Sched14TeamsSingleRR];
    case 15:
      return [Sched15Teams9Rounds, Sched15Teams10Rounds, Sched15Teams11Rounds];
    case 16:
      return [Sched16Teams9Rounds, Sched16Teams10Rounds, Sched16Teams11Rounds];
    case 17:
      return [Sched17Teams9Rounds, Sched17Teams10Rounds, Sched17Teams12Rounds];
    case 18:
      return [
        Sched18Teams9Rounds,
        Sched18Teams10Rounds,
        Sched18Teams12Rounds6to9,
        Sched18Teams12Rounds9to6,
        Sched18Teams14Rounds,
      ];
    case 19:
      return [Sched19Teams11Rounds, Sched19Teams12Rounds, Sched19Teams13Rounds, Sched19Teams14Rounds];
    case 20:
      return [
        Sched20Teams9Rounds,
        Sched20Teams11Rounds2x10,
        Sched20Teams11Rounds4x5,
        Sched20Teams12Rounds,
        Sched20Teams13Rounds,
        Sched20Teams14Rounds,
      ];
    case 21:
      return [Sched21Teams11Rounds, Sched21Teams12Rounds, Sched21Teams14Rounds, Sched21Teams14RoundsNoCO];
    case 22:
      return [
        Sched22Teams11Rounds5Prelim,
        Sched22Teams11Rounds7Prelim,
        Sched22Teams13Rounds,
        Sched22Teams14Rounds967Split,
        Sched22Teams14Rounds976Split,
      ];
    case 23:
      return [
        Sched23Teams8Rounds,
        Sched23Teams9Rounds,
        Sched23Teams10Rounds,
        Sched23Teams11Rounds2Phases5Prelim,
        Sched23Teams11Rounds2Phases7Prelim,
        Sched23Teams11Rounds3Phases,
        Sched23Teams13Rounds,
      ];
    case 24:
      return [
        Sched24Teams8Rounds,
        Sched24Teams9Rounds,
        Sched24Teams10Rounds,
        Sched24Teams11Rounds2Phases5Prelim,
        Sched24Teams11Rounds2Phases7Prelim,
        Sched24Teams11Rounds3Phases,
        Sched24Teams14Rounds,
      ];
    case 25:
      return [Sched25Teams10Rounds, Sched25Teams10RoundsTop2Parallel];
    case 26:
      return [Sched26Teams11RoundsWC, Sched26Teams11RoundsNoWC];
    case 27:
      return [Sched27Teams11Rounds2PPlusF, Sched27Teams13Rounds6to10, Sched27Teams13Rounds9to6];
    case 28:
      return [Sched28Teams11Rounds2PPlusF, Sched28Teams13Rounds6to10];
    case 29:
      return [Sched29Teams11Rounds2PPlusF, Sched29Teams13Rounds6to10];
    case 30:
      return [Sched30Teams11Rounds2PPlusF, Sched30Teams13Rounds6to10];
    default:
      return [];
  }
}
