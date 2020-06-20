/***********************************************************
DivisionEditModal.tsx
Andrew Nadig

React component comprising the Modal window containing the
form for entering and editing teams.
***********************************************************/
import * as React from 'react';
import * as $ from 'jquery';
import * as _ from 'lodash';
import * as M from 'materialize-css';
import { PhaseList, FormValidation } from './YfTypes';
import { DraggableDivision } from './DivisionListEntry';

interface DivisionEditModalProps {
  isOpen: boolean;
  addOrEdit: 'add' | 'edit';
  divisionToLoad: DraggableDivision;
  onLoadDivInModal: () => void;
  divisions: PhaseList;
  addDivision: (divName: string, phase: string, acceptAndStay: boolean) => void;
  modifyDivision: (oldDivision: DraggableDivision, newDivName: string, newPhase: string, acceptAndStay: boolean) => void;
  validateName: (newDivName: string, newPhase: string, savedDivision: DraggableDivision) => boolean;
  forceReset: boolean;
  onForceReset: () => void;
}

interface DivisionEdiModalState {
  divisionName: string;
  phase: string;
  originalDivLoaded: DraggableDivision;
}

export class DivisionEditModal extends React.Component<DivisionEditModalProps, DivisionEdiModalState> {

  constructor(props: DivisionEditModalProps) {
    super(props);
    this.state = {
      divisionName: '',
      phase: 'noPhase',
      originalDivLoaded: null
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
  }

  /**
   * Lifecycle method
   */
  componentDidMount(): void {
    //Don't allow Enter key to submit form
    $(document).on("keydown", "#editDivision :input:not(textarea)", function(event) {
      return event.keyCode != 13;
    });
  }

  /**
   * Lifecyle method. Need an extra render when opening or closing in order for fields
   * to populate and clear properly.
   * @param  _prevProps unused
   */
  componentDidUpdate(_prevProps: any) {
    //needed so that labels aren't on top of data when the edit form opens
    M.updateTextFields();
    //needed so that dropdown shows its value
    M.FormSelect.init(document.querySelectorAll('select#phase'));
    if(this.props.forceReset) {
      this.resetState();
      //setting mainInterface's forceReset to false will avoid infinite loop
      this.props.onForceReset();
    }
    if(this.props.divisionToLoad != null) {
      this.loadDivision();
      //setting mainInterface's editWhichDivision to null will avoid infinite loop
      this.props.onLoadDivInModal();
    }
  }

  /**
   * Update state when a value in the form changes
   * @param  e event
   */
  handleChange(e: any): void {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    let partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  }

  /**
   * Send data to mainInterface when the form is submitted
   * @param  e event
   */
  handleAdd(e: any): void {
    e.preventDefault();
    if(!this.props.isOpen) { return; }
    const acceptAndStay = e.target.name == 'acceptAndStay';
    const newDivName = this.state.divisionName.trim();
    if(this.props.addOrEdit == 'add') {
      this.props.addDivision(newDivName, this.state.phase, acceptAndStay);
    }
    else {
      this.props.modifyDivision(this.state.originalDivLoaded, this.state.divisionName,
        this.state.phase, acceptAndStay);
    }
    this.resetState();
  }

  /**
   * Once we're done with the form, clear the data.
   */
  resetState(): void {
    this.setState({
      divisionName: '',
      phase: 'noPhase',
      originalDivLoaded: null
    });
  }

  /**
   * Populate form with the existing team's data. Also keep a pointer to this team so
   * the MainInterface can remember which team to modify.
   */
  loadDivision(): void {
    this.setState({
      divisionName: this.props.divisionToLoad.divisionName,
      phase: this.props.divisionToLoad.phase,
      originalDivLoaded: this.props.divisionToLoad
    });
  }

  /**
   * Whether there are any issues with the team.
   * @return FormValidation tuple
   */
  validateDivision(): FormValidation {
    if(this.state.divisionName.trim() == '') { return [false, null, '']; } // name can't be just whitespace
    if(!this.props.validateName(this.state.divisionName.trim(), this.state.phase, this.state.originalDivLoaded)) {
      return [false, 'error', 'Duplicate division'];
    }
    if(this.props.addOrEdit == 'edit' && this.state.originalDivLoaded != null &&
      this.state.phase != this.state.originalDivLoaded.phase) {
        return [true, 'warning', 'This division will be removed from all teams'];
      }
    return [true, null, ''];
  }

  /**
   * Title at the top of the window
   * @return  string to display
   */
  getModalHeader(): string {
    return this.props.addOrEdit == 'add' ? 'New division' : 'Edit division';
  }

  /**
   * Disabled attribute to add to the the submit button.
   * @param  isValid  whether the data can be saved
   * @return 'disabled' or ''
   */
  disabledButton(isValid: boolean): string {
    return isValid ? '' : 'disabled';
  }

  /**
   * Returns a JSX element containing the appropriate icon (or null if no error)
   * @param  errorLevel type of message.
   * @return icon element
   */
  getErrorIcon(errorLevel: 'error' | 'warning' | 'info'): JSX.Element {
    if(errorLevel == 'error') {
      return ( <i className="material-icons red-text text-darken-4 qb-modal-error">error</i> );
    }
    if(errorLevel == 'warning') {
      return ( <i className="material-icons yellow-text text-accent-4 qb-modal-error">warning</i> );
    }
    return null;
  }



  render() {
    const [isValid, errorLevel, errorMessage] = this.validateDivision();
    const errorIcon = this.getErrorIcon(errorLevel);
    const acceptHotKey = isValid ? 'a' : '';
    const acceptStayHotKey = isValid ? 's' : '';

    const phaseList = _.without(Object.keys(this.props.divisions), 'noPhase');
    let phaseOptionList = phaseList.map(function(phase, idx) {
      return ( <option key={idx} value={phase}>{phase}</option> );
    });
    var nullOption = (<option key={-1} value="noPhase">Phase...</option>);
    phaseOptionList = [nullOption].concat(phaseOptionList);

    return (
      <div className="modal modal-fixed-footer" id="editDivision">
        <div className="modal-content">
          <h4>{this.getModalHeader()}</h4>
          <div className="row">
            <div className="col s7 l8">
              <div className="input-field">
                <input type="text" id="divisionName" name="divisionName" maxLength={100}
                  onChange={this.handleChange} value={this.state.divisionName}/>
                <label htmlFor="divisionName">Name</label>
              </div>
            </div>
            <div className="col s5 l4">
              <div className="phase-select">
                <select id="phase" name="phase" value={this.state.phase} onChange={this.handleChange}>
                  {phaseOptionList}
                </select>
              </div>
            </div>
          </div>
        </div> {/* modal content */}
        <div className="modal-footer">
          <div className="row">
            <div className="col s4 l5 qb-validation-msg">
              {errorIcon}&nbsp;{errorMessage}
            </div>
            <div className="col s8 l7">
              <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                <span className="hotkey-underline">C</span>ancel
              </button>&nbsp;
              <button accessKey={acceptStayHotKey} name="acceptAndStay" onClick={this.handleAdd}
              className={'btn blue accent-1 ' + this.disabledButton(isValid)}>
                <span className="hotkey-underline">S</span>ave & New
              </button>&nbsp;
              <button accessKey={acceptHotKey} name="acceptAndClose" onClick={this.handleAdd}
              className={'modal-close btn green ' + this.disabledButton(isValid)}>
                S<span className="hotkey-underline">a</span>ve
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

}
