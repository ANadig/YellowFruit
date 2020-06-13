/***********************************************************
DivAssignModal.js
Andrew Nadig

React component representing modal window for assigning
divisions to teams.
***********************************************************/
import * as React from "react";
import { PhaseList } from "./qbtypes";

interface DivAssignModalProps {
  isOpen: boolean;
  divisions: PhaseList;
  handleSubmit: (divSelections: DivSelectionList) => void;
  usingPhases: boolean;
}

interface DivSelectionList {
  [phaseName: string]: string;  // index divisions to assign by each division's phase
}

interface DivAssignModalState {
  divSelections: DivSelectionList;
}

export class DivAssignModal extends React.Component<DivAssignModalProps, DivAssignModalState>{

  constructor(props: DivAssignModalProps) {
    super(props);
    let divs: DivSelectionList = {};
    for(let p in props.divisions) {
      divs[p] = 'ignore';
    }
    this.state = {
      divSelections: divs
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  /**
   * Called any time a value in the form changes. This is a controlled component, so
   * the state is the single source of truth.
   */
  handleChange(e: any): void {
    const target = e.target;
    const value = target.value; //division name
    const name = target.name; //phase number
    let tempSelections = this.state.divSelections;
    tempSelections[name] = value;
    this.setState({
      divSelections: tempSelections
    });
  }

  /**
   * Tell the MainInterface to update data when the form is submitted
   */
  handleSubmit(e: any): void {
    e.preventDefault();
    this.props.handleSubmit(this.state.divSelections);
  }

  /**
   * A set of radio buttons for selecting the divisions for a given phase. An option for
   * each division, plus an option not to change the division for that phase, and an
   * option to remove divisions for that phase.
   * If there are divisions but no phases, call this with 'noPhase' in order to get all
   * divisions with no "ignore" option.
   */
  getPhaseSection(phase: string): JSX.Element {
    const divsInPhase = this.props.divisions[phase];
    let ignoreOption = null;
    if(phase != 'noPhase') {
      ignoreOption = (
        <p key={'ignore'}>
          <label>
            <input name={phase} type="radio" value="ignore"
            checked={this.state.divSelections[phase] == 'ignore'} onChange={this.handleChange} />
            <span>No change</span>
          </label>
        </p>
      );
    }
    const removeOption = (
      <p key={'remove'}>
        <label>
          <input name={phase} type="radio" value="remove"
          checked={this.state.divSelections[phase] == 'remove'} onChange={this.handleChange} />
          <span>Remove divisions</span>
        </label>
      </p>
    );

    let divRadios = divsInPhase.map(function(div: string) {
      return (
        <p key={div}>
          <label>
            <input name={phase} type="radio" value={div}
            checked={this.state.divSelections[phase] == div} onChange={this.handleChange} />
            <span>{div}</span>
          </label>
        </p>
      );
    }.bind(this));
    divRadios = [ignoreOption, removeOption].concat(divRadios);

    const header = phase == 'noPhase' ? null : ( <h6>{phase}</h6> );
    return (
      <div key={phase} className="row">
        {header}
        {divRadios}
      </div>
    );
  } //getPhaseSection



  render() {
    let phaseSections = [];
    for(let p in this.props.divisions) {
      //ignore divisions with no phase, unless the tournament has no phases at all
      if((!this.props.usingPhases || p != 'noPhase') && this.props.divisions[p].length > 0) {
        phaseSections.push(this.getPhaseSection(p));
      }
    }

    if(phaseSections.length == 0) {
      phaseSections = [( <span key={0}>No available divisions to assign</span> )];
    }

    return (
      <div className="modal modal-fixed-footer" id="assignDivisions">
        <form onSubmit={this.handleSubmit}>
          <div className="modal-content">
            <h4>Assign Divisions</h4>
            {phaseSections}
          </div>
          <div className="modal-footer">
            <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
              <span className="hotkey-underline">C</span>ancel
            </button>&nbsp;
            <button type="submit" accessKey={this.props.isOpen ? 'a' : ''} className={'modal-close btn green '}>
              <span className="hotkey-underline">A</span>ccept
            </button>
          </div>
        </form>
      </div>
    );
  }

}
