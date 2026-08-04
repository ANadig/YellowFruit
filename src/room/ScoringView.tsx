/**
 * The scorekeeping screen: a narrow host-owned status bar above MODAQ.
 *
 * MODAQ stays the primary interface. Everything YellowFruit adds is confined to one compact bar, so a
 * scorekeeper's eyes stay on the scoresheet rather than on our chrome. The bar carries the things
 * MODAQ cannot know — which room this is, which round, whether the result has reached tournament
 * control — plus the question number, which MODAQ tracks internally but doesn't expose to a host.
 *
 * It also says plainly that questions are read externally and that this is a scoresheet rather than a
 * packet, because the structural packet MODAQ needs in order to have any scoring cycles at all can
 * otherwise be mistaken for real question content.
 */
import { ModaqControl, IGameFormat, IPacket, IPlayer } from 'modaq';
import { IModaqGameFormat } from '../renderer/Services/YellowFruitScoringRulesToModaq';
import buildScaffoldPacket, { describeScoringBands, scaffoldPacketName } from './ScaffoldPacket';

/** MODAQ's custom-export callback shape, from modaq's ICustomExport */
export interface IModaqCustomExport {
  type: 'QBJ';
  label: string;
  customExportInterval: number;
  onExport: unknown;
}

export interface IScoringViewProps {
  // eslint-disable-next-line react/require-default-props
  roomName?: string;
  roundName: string;
  leftTeamName: string;
  rightTeamName: string;
  gameFormat: IModaqGameFormat;
  players: IPlayer[];
  /** localStorage key for MODAQ's own game persistence. Stable per session. */
  // eslint-disable-next-line react/require-default-props
  storeName?: string;
  customExport: IModaqCustomExport;
  online: boolean;
  /** Number of questions played so far, from the most recent snapshot */
  questionsPlayed: number;
  /** True once a final has been sent and is waiting on tournament control */
  awaitingReview: boolean;
  /** Set when the last automatic upload didn't land */
  // eslint-disable-next-line react/require-default-props
  snapshotError?: string;
}

export default function ScoringView(props: IScoringViewProps) {
  const {
    roomName,
    roundName,
    leftTeamName,
    rightTeamName,
    gameFormat,
    players,
    storeName,
    customExport,
    online,
    questionsPlayed,
    awaitingReview,
    snapshotError,
  } = props;

  const packet = buildScaffoldPacket(gameFormat) as unknown as IPacket;

  // The question being played is the one after the last one with a buzz recorded on it.
  const currentQuestion = Math.min(questionsPlayed + 1, gameFormat.regulationTossupCount + 20);
  const inOvertime = currentQuestion > gameFormat.regulationTossupCount;

  return (
    <div className="room-scoring">
      {!online && (
        <div className="room-banner room-banner-warning">
          <strong>YellowFruit is not reachable.</strong> Keep scoring &mdash; this game is saved on this device and will
          be sent when the connection comes back.
        </div>
      )}
      {snapshotError !== undefined && snapshotError !== '' && online && (
        <div className="room-banner room-banner-warning">
          The last automatic update didn&apos;t reach YellowFruit ({snapshotError}). Scoring is unaffected.
        </div>
      )}

      <header className="room-statusbar">
        <div className="room-statusbar-main">
          {roomName !== undefined && <span className="room-statusbar-room">{roomName}</span>}
          <span className="room-statusbar-sep" aria-hidden="true">
            ·
          </span>
          <span>Round {roundName}</span>
          <span className="room-statusbar-sep" aria-hidden="true">
            ·
          </span>
          <span className="room-statusbar-teams">
            {leftTeamName} <span className="room-statusbar-vs">vs</span> {rightTeamName}
          </span>
        </div>

        <div className="room-statusbar-meta">
          <span className={inOvertime ? 'room-tag room-tag-overtime' : 'room-tag'}>
            {inOvertime ? `Overtime · Q${currentQuestion}` : `Question ${currentQuestion}`}
          </span>
          {awaitingReview && <span className="room-tag room-tag-pending">Awaiting review</span>}
          <span className={online ? 'room-status room-status-online' : 'room-status room-status-offline'}>
            <span className="room-status-dot" aria-hidden="true" />
            {online ? 'Connected' : 'Offline'}
          </span>
        </div>
      </header>

      <p className="room-scoresheet-note">
        Digital scoresheet &mdash; questions are read externally. {describeScoringBands(gameFormat)}
      </p>

      <div className="room-modaq">
        <ModaqControl
          players={players}
          gameFormat={gameFormat as IGameFormat}
          packet={packet}
          packetName={scaffoldPacketName}
          hideNewGame
          persistState
          storeName={storeName}
          customExport={customExport as any}
        />
      </div>
    </div>
  );
}
