import { createContext } from 'react';

export class GenericModalManager {
  /** Is there a message that we need to show in a modal dialog? */
  isOpen: boolean = false;

  /** Title of the modal currently being shown */
  title: string = '';

  /** Contents of the modal currently being shown */
  contents: string = '';

  /** Title of the "yes" option, if applicable */
  acceptButtonCaption: string = '';

  readonly defaultCancelButtonCaption = 'OK';

  /** Title of the "no"/"cancel" (or only) option */
  cancelButtonCaption: string = this.defaultCancelButtonCaption;

  /** What the Yes button should do */
  acceptCallback: () => void;

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
    if (yesButtonAction) this.acceptCallback = yesButtonAction;
    this.dataChangedReactCallback();
  }

  close(accept: boolean = false) {
    this.isOpen = false;
    if (accept) this.acceptCallback();
    this.dataChangedReactCallback();
  }
}

export const GenericModalContext = createContext<GenericModalManager>(new GenericModalManager());
