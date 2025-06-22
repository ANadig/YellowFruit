import { createContext } from 'react';
import MatchImportResult, { ImportResultStatus } from '../DataModel/MatchImportResult';
import { Round } from '../DataModel/Round';
import { StatsValidity } from '../DataModel/Match';
import { getFileNameFromPath } from '../Utils/GeneralUtils';
import Tournament from '../DataModel/Tournament';
import { Phase } from '../DataModel/Phase';

export default class MatchImportResultsManager {
  modalIsOpen: boolean = false;

  phase?: Phase;

  round?: Round;

  resultsList?: MatchImportResult[];

  dataChangedReactCallback: () => void;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    delete this.round;
    delete this.phase;
    delete this.resultsList;
  }

  openModal(round: Round, phase: Phase, resultsList: MatchImportResult[]) {
    this.modalIsOpen = true;
    this.round = round;
    this.phase = phase;
    this.resultsList = resultsList;
    this.dataChangedReactCallback();
  }

  closeModal(shouldSave: boolean) {
    if (shouldSave) {
      this.finishImport();
    }
    this.modalIsOpen = false;
    this.reset();
    this.dataChangedReactCallback();
  }

  finishImport() {
    if (!this.resultsList || !this.round) return;

    for (const res of this.resultsList) {
      if (res.proceedWithImport && res.match) {
        if (res.status === ImportResultStatus.ErrNonFatal) res.match.statsValidity = StatsValidity.omit;
        res.match.importedFile = getFileNameFromPath(res.filePath);
        Tournament.validateHaveTeamsPlayedInRound(res.match, this.round, this.phase, false);
        this.round.addMatch(res.match);
      }
    }
  }

  setProceedWithImport(rslt: MatchImportResult, val: boolean) {
    rslt.proceedWithImport = val;
    this.dataChangedReactCallback();
  }
}

export const MatchImportResultsModalContext = createContext<MatchImportResultsManager>(new MatchImportResultsManager());
