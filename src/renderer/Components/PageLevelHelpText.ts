import { ApplicationPages } from '../Enums';

type HelpTextSection = {
  header?: string;
  content: string[];
};

const GeneralPageHelpText: HelpTextSection[] = [
  {
    header: 'General tournament attributes',
    content: [
      'The tournament name, location, dates, and question set fields are optional and appear at the top of the Standings page of the stat report if provided.',
    ],
  },
  {
    header: 'Packet names',
    content: [
      "Once you configure the tournament schedule in the Schedule form, you can specify the packet for each round here. Packet names are optional and are shown in their corresponding rounds on the Team Detail and Round Report pages of the stat report if provided. They are most helpful for packet submission tournaments or other situations where the order of packets isn't obvious.",
    ],
  },
  {
    header: 'Team and player attributes',
    content: ['Use these settings to determine which attributes appear in the stat report.'],
  },
];

const RulesPageHelpText: HelpTextSection[] = [
  {
    content: [
      "To ensure the integrity of game data, settings in this form can't be changed once you've begun entering games.",
    ],
  },
  {
    header: 'Divisors',
    content: [
      "A divisor is the greatest integer guaranteed to evenly divide a certain point total. Divisors are used to validate the correctness of bonus and lightning round totals. You should only change these settings if your tournament's questions have unusual or irregular bonus or lightning round formats. Divisor errors won't prevent you from saving games and can be overridden if needed.",
    ],
  },
];

const SchedulePageHelpText: HelpTextSection[] = [
  {
    content: [
      'Use this form to define the structure of your tournament. A tournament consists of one or more stages (sometimes called "phases"), each of which spans one or more rounds of play.',
      "You must define a schedule in order to enter game results. Games can't be entered for rounds that aren't defined in the schedule.",
    ],
  },
  {
    header: 'Templates',
    content: [
      'YellowFruit has pre-configured templates for most common tournament formats. When you use a template, YellowFruit is aware of the structure of the tourmament and can use the stats for a given stage to determine which teams should qualify for which pools in the subsequent stage (this determination can be overridden if needed).',
    ],
  },
  {
    header: 'Custom schedules',
    content: [
      'You can define your own schedule by customizing a template or adding new stages from scratch. If the button at the top right of the form is disabled and reads "custom", you are using a custom schedule, and you will need to assign teams to playoff pools manually during rebracketing.',
    ],
  },
  {
    header: 'Tiers',
    content: [
      'In many schedule templates, playoff stages are divided into "tiers", which represent a cohort of teams that are competing for the same final rank. For example, tier 1 might contain the top 8 teams competing for first place, tier 2 the next 8 teams competing for 9th place, etc.',
    ],
  },
  {
    header: 'Tiebreaker stages',
    content: [
      'Each standard stage may have one tiebreaker stage immediately after it. Tiebreaker stages cannot contain pools; they are for recording the results of games needed to break ties in the previous stage.',
    ],
  },
  {
    header: 'Finals stages',
    content: [
      'You can add any number of Finals stages at the end of the schedule. Finals stages are intended for any additional placement games that happen after playoff or superplayoff pool play has finished. Examples include overall finals, small school finals, or third place games.',
    ],
  },
];

const TeamsPageHelpText: HelpTextSection[] = [
  {
    header: 'Registration',
    content: [
      "Use this page to define teams and rosters. The sum of the pool sizes in the first stage of the tournament's schedule determines the maximum number of teams you can create.",
    ],
  },
  {
    header: 'Prelim Assignments',
    content: [
      'Use this page to assign teams to pools for the first stage of the tournament. If you are using a schedule template, you can rank teams and let YellowFruit snake seed them into the appropriate pools.',
    ],
  },
  {
    header: 'Rebracketing / Final Ranks',
    content: [
      "Use this page to review tournament standings and bracket teams into the appropriate playoff pools. If you're using a schedule template, YellowFruit suggests the most likely pool assignments, which you can either confirm or override.",
      "In the standings for the last stage of the tournament, you can override the final ranking of each team if needed. This is useful in situations involving finals or parallel-bracket placement games, where the ordering of teams in playoff pool play doesn't necessarily reflect the overall final rankings.",
      'Once you\'ve confirmed that the final rankings are correct, check the "Final rankings ready to publish" checkbox to show the final rankings at the top of the Standings page of the stat report.',
    ],
  },
];

const GamesPageHelpText: HelpTextSection[] = [
  {
    content: [
      "The By Pool page allows you to track the progress of round robin pools. Pools that run multiple round robins have multiple grids. Pools that aren't round robin can't be viewed on this page. How many round robins a pool runs is defined in the Schedule form.",
    ],
  },
];

const StatReportPageHelpText: HelpTextSection[] = [
  {
    content: [
      'The export button saves all six stat report pages at once, appending "_standings", "_individuals", etc. to the file name you provide.',
    ],
  },
];

export default function getAppPageHelpText(page: ApplicationPages) {
  switch (page) {
    case ApplicationPages.General:
      return GeneralPageHelpText;
    case ApplicationPages.Rules:
      return RulesPageHelpText;
    case ApplicationPages.Schedule:
      return SchedulePageHelpText;
    case ApplicationPages.Teams:
      return TeamsPageHelpText;
    case ApplicationPages.Games:
      return GamesPageHelpText;
    case ApplicationPages.StatReport:
      return StatReportPageHelpText;
    default:
      return undefined;
  }
}
