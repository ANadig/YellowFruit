import { createContext } from 'react';
import { FileSwitchActionNames, FileSwitchActions } from '../../SharedUtils';

export class GenericModalManager {
  /** Is there a message that we need to show in a modal dialog? */
  isOpen: boolean = false;

  /** Title of the modal currently being shown */
  title: string = '';

  /** Contents of the modal currently being shown */
  contents: string = '';

  /** Title of the "yes" option, if applicable */
  acceptButtonCaption: string = '';

  readonly defaultCancelButtonCaption = '&OK';

  /** Title of the "no"/"cancel" (or only) option */
  cancelButtonCaption: string = this.defaultCancelButtonCaption;

  /** Used when prompting whether to save unsaved data */
  discardAndContinueButtonCaption: string = '';

  /** What the Yes button should do */
  acceptCallback: (saveData?: boolean) => void;

  /** Hook into the UI to tell it when it needs to update */
  dataChangedReactCallback: () => void;

  constructor() {
    this.acceptCallback = () => {};
    this.dataChangedReactCallback = () => {};
  }

  open(title: string, contents: string, noButton?: string, yesButton?: string, yesButtonAction?: () => void) {
    this.isOpen = true;
    this.title = title;
    this.contents = contents;
    this.cancelButtonCaption = noButton || this.defaultCancelButtonCaption;
    this.acceptButtonCaption = yesButton || '';
    this.discardAndContinueButtonCaption = '';
    if (yesButtonAction) this.acceptCallback = yesButtonAction;
    this.dataChangedReactCallback();
  }

  close(accept: boolean = false, saveData: boolean = false) {
    this.isOpen = false;
    if (accept) this.acceptCallback(saveData);
    this.dataChangedReactCallback();
    this.acceptCallback = () => {};
  }

  openUnsavedDataDialog(action: FileSwitchActions, continueAction: (saveData?: boolean) => void) {
    this.isOpen = true;
    this.title = FileSwitchActionNames[action];
    this.contents = 'You have unsaved data. Save before continuing?';
    this.acceptButtonCaption = '&Yes, save data';
    this.discardAndContinueButtonCaption = 'No, &discard data';
    this.cancelButtonCaption = 'G&o Back';
    this.acceptCallback = continueAction;
    this.dataChangedReactCallback();
  }
}

export const GenericModalContext = createContext<GenericModalManager>(new GenericModalManager());
