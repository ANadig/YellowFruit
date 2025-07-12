import { teamGetNameAndLetter } from '../Utils/GeneralUtils';
import { Player } from './Player';
import Registration from './Registration';
import { Team } from './Team';

/** Generate a list of Registration objects. Each registration has exactly one team; Caller is responsible for merging registrations for the same school if desired. */
export default function parseTeamsFromSqbsFile(fileContents: string) {
  const fileLines = fileContents.split('\n');

  // First line of the file is the number of teams
  const numTeams = parseInt(fileLines[0], 10);
  if (Number.isNaN(numTeams)) {
    throw new Error("Couldn't determine the number of teams in the file (line 1).");
  }

  const registrationList: Registration[] = [];
  let curLine = 1;
  for (let i = 0; i < numTeams; i++) {
    // First line of team is the number of players
    const numPlayers = parseRosterSize(fileLines, curLine++);
    // Second line is team name
    const registration = parseTeamName(fileLines, curLine++);
    // Subsequent lines are player names
    for (let j = 0; j < numPlayers; j++) {
      parsePlayerName(fileLines, curLine++, registration.teams[0]);
    }

    if (registrationList.find((r) => r.teams[0].name === registration.teams[0].name)) {
      throw new Error(
        fileLineError(`This file contains two teams named ${registration.teams[0].name}`, curLine - numPlayers - 1),
      );
    }

    registrationList.push(registration);
  }
  return registrationList;
}

/** Parse a line of the file that should be equal to 1 more than the number of players on the next team */
function parseRosterSize(fileLines: string[], lineNumber: number): number {
  const sectionSize = parseInt(fileLines[lineNumber], 10);
  if (Number.isNaN(sectionSize)) {
    throw new Error(fileLineError('Failed to parse team size', lineNumber)); // Show 1-indexed number to user
  }
  if (sectionSize - 1 > Team.maxPlayers) {
    throw new Error(
      fileLineError(
        `Team ${fileLines[lineNumber + 1]} has more than ${Team.maxPlayers} players, which is not allowed.`,
        lineNumber,
      ),
    );
  }
  if (sectionSize - 1 < 1) {
    throw new Error(fileLineError(`Team ${fileLines[lineNumber + 1]} has no players`, lineNumber));
  }
  return sectionSize - 1;
}

/** Generate a Registration object from a team name */
function parseTeamName(fileLines: string[], lineNumber: number) {
  const rawName = fileLines[lineNumber].trim();
  if (rawName === '') {
    throw new Error(fileLineError('Encountered a team with no name', lineNumber));
  }

  const [orgName, letter] = teamGetNameAndLetter(rawName);
  const registration = new Registration(orgName);
  const teamObj = new Team(rawName);
  if (letter) teamObj.letter = letter;

  registration.addTeam(teamObj);
  return registration;
}

/** Create a player based on the data on this line, and add it to the given team */
function parsePlayerName(fileLines: string[], lineNumber: number, team: Team) {
  const playerNameRaw = fileLines[lineNumber].trim();
  if (playerNameRaw === '') {
    throw new Error(fileLineError('Encountered a player with no name', lineNumber));
  }
  const [playerName, yearStr] = parseYearFromPlayerName(playerNameRaw);
  if (team.findPlayerByName(playerName)) {
    throw new Error(fileLineError(`Duplicate players on team ${team.name}`, lineNumber));
  }

  const player = new Player(playerName);
  if (yearStr) player.yearString = yearStr;

  team.players.push(player);
}

function parseYearFromPlayerName(rawName: string) {
  const yearIdx = rawName.search(/\(.{1,20}\)$/);
  if (yearIdx === -1) {
    return [rawName, ''];
  }
  // The player's fulle name, for some reason, is just "(12th grade)" or something
  if (yearIdx === 0) {
    return [rawName, ''];
  }

  const yearStr = rawName.substring(yearIdx + 1, rawName.length - 1); // drop the parentheses
  const playerName = rawName.substring(0, yearIdx).trim();
  return [playerName, yearStr];
}

function fileLineError(err: string, line: number) {
  return `${err} (line ${line + 1} of file).`;
}
