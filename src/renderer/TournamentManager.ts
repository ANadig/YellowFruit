/* eslint-disable max-classes-per-file */
import { createContext } from 'react';
import Tournament from './DataModel/Tournament';
import { textFieldChanged } from './Utils/GeneralUtils';

/** A list of changes to the data that one or more components want to know about */
export enum DataSubscriptions {
  /** Dummy value for no changes */
  None,
  TournamentName,
  TournamentSiteName,
}

/** Holds the tournament the application is currently editing */
export class TournamentManager {
  /** The tournament being edited */
  tournament: Tournament;

  /** Hook into the UI to tell it when it needs to update */
  dataChangedCallback: () => void;

  unsavedData: boolean = false;

  readonly isNull: boolean = false;

  constructor() {
    this.tournament = new Tournament();
    this.dataChangedCallback = () => {};
  }

  /** Set the tournament's display name */
  setTournamentName(name: string): void {
    const trimmedName = name.trim();
    if (!textFieldChanged(this.tournament.name, trimmedName)) {
      return;
    }
    this.tournament.name = trimmedName;
    this.unsavedData = true;
    this.dataChangedCallback();
  }

  /** Set the free-text description of where the tournament is */
  setTournamentSiteName(siteName: string): void {
    const trimmedName = siteName.trim();
    if (!textFieldChanged(this.tournament.tournamentSite.name, trimmedName)) {
      return;
    }
    this.tournament.tournamentSite.name = trimmedName;
    this.unsavedData = true;
    this.dataChangedCallback();
  }
}

/** Represents an error state where we haven't properly created or loaded a tournament to edit */
class NullTournamentManager extends TournamentManager {
  readonly isNull: boolean = true;

  constructor() {
    super();
    this.tournament.name = 'NullTournamentManager';
  }
}

export const TournamentContext = createContext<TournamentManager>(new NullTournamentManager());
