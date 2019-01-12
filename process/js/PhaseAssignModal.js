/***********************************************************
PhaseAssignModal.js
Andrew Nadig

React component representing modal window for assigning
phases to games.
***********************************************************/
var React = require('react');
var _ = require('lodash');

class PhaseAssignModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      phaseSelections: []
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  /*---------------------------------------------------------
  Called any time a value in the form changes.
  This is a controlled component, so the state is the single
  source of truth.
  ---------------------------------------------------------*/
  handleChange(e) {
    const target = e.target;
    const checked = target.checked;
    const name = target.name;
    if(checked && name == 'delete') {
      this.setState({
        phaseSelections: ['delete']
      });
      return;
    }
    var tempPhSel = this.state.phaseSelections;
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

  /*---------------------------------------------------------
  Tell the MainInterface to update data when the form is
  submitted.
  ---------------------------------------------------------*/
  handleSubmit(e) {
    e.preventDefault();
    this.props.handleSubmit(this.state.phaseSelections);
  }

  /*---------------------------------------------------------
  A list of checkboxes, one for each phase, plus one to
  delete phases.
  ---------------------------------------------------------*/
  getPhaseOptions() {
    var deleteBox = (
      <p key={'delete'}>
        <label>
          <input name="delete" type="checkbox"
            checked={this.state.phaseSelections.includes('delete')} onChange={this.handleChange}/>
          <span>Delete all phases</span>
        </label>
      </p>
    );
    var checkboxes = [deleteBox];
    for(var phase in this.props.divisions) {
      var box = (
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
    var phaseOptions = this.getPhaseOptions();

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
            <button type="submit" accessKey={this.props.isOpen ? 'a' : ''} className={'modal-close btn green '}>
              <span className="hotkey-underline">A</span>ccept
            </button>
          </div>
        </form>
      </div>
    );
  }

}

module.exports=PhaseAssignModal
