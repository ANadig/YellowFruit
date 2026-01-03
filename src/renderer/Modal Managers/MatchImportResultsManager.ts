import { createContext } from 'react';
import MatchImportResult, { ImportResultStatus } from '../DataModel/MatchImportResult';
import { Round } from '../DataModel/Round';
import { StatsValidity } from '../DataModel/Match';
import { getFileNameFromPath } from '../Utils/GeneralUtils';
import Tournament from '../DataModel/Tournament';
import { Phase } from '../DataModel/Phase';

export default class MatchImportResultsManager {
  modalIsOpen: boolean = false;

  round?: Round;

  resultsList?: MatchImportResult[];

  dataChangedReactCallback: () => void;

  constructor() {
    this.dataChangedReactCallback = () => {};
  }

  reset() {
    delete this.round;
    delete this.resultsList;
  }

  openModal(resultsList: MatchImportResult[], round?: Round) {
    this.modalIsOpen = true;
    this.round = round;
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
    if (!this.resultsList) return;

    for (const res of this.resultsList) {
      if (res.proceedWithImport && res.match) {
        if (res.status === ImportResultStatus.ErrNonFatal) res.match.statsValidity = StatsValidity.omit;
        res.match.importedFile = getFileNameFromPath(res.filePath);
        Tournament.validateHaveTeamsPlayedInRound(res.match, res.round, res.phase, false);
        if (res.round) res.round.addMatch(res.match);
      }
    }
  }

  setProceedWithImport(rslt: MatchImportResult, val: boolean) {
    rslt.proceedWithImport = val;
    this.dataChangedReactCallback();
  }
}

export const MatchImportResultsModalContext = createContext<MatchImportResultsManager>(new MatchImportResultsManager());
