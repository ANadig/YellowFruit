/**
 * Development harness for the room application.
 *
 * Starts a real TournamentServer, serving the real built room bundle, backed by a small sample
 * tournament. This lets the browser room app be exercised end to end without launching Electron.
 *
 *   npm run room:harness
 *
 * Then open the printed URL. Final submissions are printed to the console instead of going to the
 * YellowFruit renderer.
 */
import path from 'path';
import TournamentServer from '../main/server/TournamentServer';
import { ITournamentSnapshot, defaultServerPort } from '../main/server/ServerTypes';
import scoringRulesToModaqGameFormat from '../renderer/Services/YellowFruitScoringRulesToModaq';
import { CommonRuleSets, ScoringRules } from '../renderer/DataModel/ScoringRules';

const sampleTeamNames = ['Ninety Six A', 'Greenwood A', 'Emerald A', 'Abbeville A'];

function makeSampleSnapshot(): ITournamentSnapshot {
  const formatResult = scoringRulesToModaqGameFormat(new ScoringRules(CommonRuleSets.AcfPowers));
  return {
    name: 'Harness Invitational',
    rounds: [1, 2, 3].map((n) => ({ number: n, name: String(n) })),
    teams: sampleTeamNames.map((name) => ({
      name,
      players: [1, 2, 3, 4].map((i) => ({ name: `${name} Player ${i}` })),
    })),
    gameFormat: formatResult.ok ? formatResult.gameFormat : null,
    gameFormatErrors: formatResult.ok ? [] : formatResult.errors,
    gameFormatWarnings: formatResult.ok ? formatResult.warnings : [],
    timedRounds: false,
  };
}

async function main() {
  const port = Number(process.env.ROOM_HARNESS_PORT) || defaultServerPort;
  const server = new TournamentServer({
    roomBundleDirectory: path.resolve(__dirname, '../../release/app/dist/room'),
    onFinalSubmission: (submission) => {
      /* eslint-disable no-console */
      console.log('--- FINAL SUBMISSION ---');
      console.log(`session ${submission.sessionId}`);
      console.log(`round ${submission.roundNumber}: ${submission.leftTeam} vs ${submission.rightTeam}`);
      console.log(JSON.stringify(submission.qbj).slice(0, 400));
      /* eslint-enable no-console */
    },
    onSessionsChanged: (sessions) => {
      for (const session of sessions) {
        const score = session.score ? `${session.score.leftPoints}-${session.score.rightPoints}` : 'no score';
        // eslint-disable-next-line no-console
        console.log(
          `[${session.displayState}] R${session.roundNumber} ${session.leftTeam} vs ${session.rightTeam}: ${score}`,
        );
      }
    },
  });

  server.setTournamentSnapshot(makeSampleSnapshot());
  const status = await server.start(port);
  if (!status.running) {
    // eslint-disable-next-line no-console
    console.error(status.errorMessage);
    process.exit(1);
  }

  /* eslint-disable no-console */
  console.log(`Room harness listening on http://127.0.0.1:${port}`);
  for (const address of status.addresses) console.log(`  LAN: ${address}`);
  /* eslint-enable no-console */
}

main();
