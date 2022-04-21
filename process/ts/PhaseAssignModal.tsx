/***********************************************************
PhaseAssignModal.tsx
Andrew Nadig

React component representing modal window for assigning
phases to games.
***********************************************************/
import * as React from "react";
import * as _ from 'lodash';
import { PhaseList } from "./YfTypes";

interface PhaseAssignModalProps {
  isOpen: boolean;           // whether the modal is open
  divisions: PhaseList;       // entire divisions structure for the tournment
  handleSubmit: (phaseSelections: string[]) => void;
}

interface PhaseAssignModalState {
  phaseSelections: string[];  // list of phases the user has selected to add to this game
}

export class PhaseAssignModal extends React.Component<PhaseAssignModalProps, PhaseAssignModalState> {

  constructor(props: PhaseAssignModalProps) {
    super(props);
    this.state = {
      phaseSelections: []
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  /**
   * Called anytime a value in the form changes.
   * This is a controlled component, so the state is the single source of truth.
   * @param  e  event
   */
  handleChange(e: any): void {
    const target = e.target;
    const checked = target.checked;
    const name = target.name;
    if(checked && name == 'delete') {
      this.setState({
        phaseSelections: ['delete']
      });
      return;
    }
    let tempPhSel = this.state.phaseSelections;
    if(checked && !tempPhSel.includes(name)) {
      tempPhSel.push(name);
      _.pull(tempPhSel, 'delete');
    }
    else if(!checked && tempPhSel.includes(name)) {
      _.pull(tempPhSel, name);
    }
    this.setState({
      phaseSelections: tempPhSel
    });
  } //handleChange

  /**
   * Tell the MainInterface to update data when the form is submitted
   * @param e event
   */
  handleSubmit(e: any): void {
    e.preventDefault();
    this.props.handleSubmit(this.state.phaseSelections);
  }

  /**
   * A list of checkboxes, one for each phase, plus one to delete phases
   * @return      List of checkbox elements
   */
  getPhaseOptions(): JSX.Element[] {
    const deleteBox = (
      <p key={'delete'}>
        <label>
          <input name="delete" type="checkbox"
            checked={this.state.phaseSelections.includes('delete')} onChange={this.handleChange}/>
          <span>Delete all phases</span>
        </label>
      </p>
    );
    let checkboxes = [deleteBox];
    for(let phase in this.props.divisions) {
      let box = (
        <p key={phase}>
          <label>
            <input name={phase} type="checkbox"
              checked={this.state.phaseSelections.includes(phase)} onChange={this.handleChange}/>
            <span>{phase}</span>
          </label>
        </p>
      );
      checkboxes.push(box);
    }
    return checkboxes;
  }//getPhaseOptions

  render() {
    const phaseOptions = this.getPhaseOptions();

    return (
      <div className="modal modal-fixed-footer" id="assignPhases">
        <form onSubmit={this.handleSubmit}>
          <div className="modal-content">
            <h4>Add Phases</h4>
            {phaseOptions}
          </div>
          <div className="modal-footer">
            <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
              <span className="hotkey-underline">C</span>ancel
            </button>&nbsp;
            <button type="submit" accessKey={this.props.isOpen ? 'a' : ''} className="modal-close btn green">
              <span className="hotkey-underline">A</span>ccept
            </button>
          </div>
        </form>
      </div>
    );
  }

}
