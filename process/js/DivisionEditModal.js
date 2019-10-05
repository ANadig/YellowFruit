/***********************************************************
DivisionEditModal.js
Andrew Nadig

React component comprising the Modal window containing the
form for entering and editing teams.
***********************************************************/
var React = require('react');
var $ = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');

class DivisionEditModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      divisionName: '',
      phase: 'noPhase',
      originalDivLoaded: null
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
  }

  /*---------------------------------------------------------
  Lifecyle method. Need an extra render when opening or
  closing in order for fields to populate and clear properly.
  ---------------------------------------------------------*/
  componentDidUpdate(prevProps) {
    //needed so that labels aren't on top of data when the edit form opens
    M.updateTextFields();
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

  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  }

  /*---------------------------------------------------------
  Send data to mainInterface when the form is submitted
  ---------------------------------------------------------*/
  handleAdd(e) {
    e.preventDefault();
    if(!this.props.isOpen) { return; }
    this.props.addDivision(this.state.divisionName, this.state.phase);
    this.resetState();
  }

  /*---------------------------------------------------------
  Once we're done with the form, clear the data.
  ---------------------------------------------------------*/
  resetState() {
    this.setState({
      divisionName: '',
      phase: 'noPhase',
      originalDivLoaded: null
    });
  }

  /*---------------------------------------------------------
  Populate form with the existing team's data. Also keep a
  pointer to this team so the MainInterface can remember
  which team to modify.
  ---------------------------------------------------------*/
  loadDivision() {
    this.setState({
      divisionName: this.props.divisionToLoad.divisionName,
      phase: this.props.divisionToLoad.phase,
      originalDivLoaded: this.props.divisionToLoad
    });
  }

  /*---------------------------------------------------------
  Title at the top of the window
  ---------------------------------------------------------*/
  getModalHeader() {
    return this.props.addOrEdit == 'add' ? 'New division' : 'Edit division';
  }

  disabledButton() {
    return '';
  }

  render() {
    var errorIcon = null, errorMessage = null;
    var acceptHotKey = '';

    var phaseList = Object.keys(this.props.divisions);
    var phaseOptionList = phaseList.map(function(phase, idx) {
      return ( <option key={idx} value={phase}>{phase}</option> );
    });
    var nullOption = (<option key={-1} value="noPhase">Phase...</option>);
    phaseOptionList = [nullOption].concat(phaseOptionList);

    //Don't allow Enter key to submit form
    $(document).on("keypress", "#editDivision :input:not(textarea)", function(event) {
      return event.keyCode != 13;
    });

    return (
      <div className="modal modal-fixed-footer" id="editDivision">
        <form onSubmit={this.handleAdd}>
          <div className="modal-content">
            <h4>{this.getModalHeader()}</h4>
            <div className="row">
              <div className="col s8">
                <div className="input-field">
                  <input type="text" id="divisionName" name="divisionName" onChange={this.handleChange} value={this.state.divisionName}/>
                  <label htmlFor="divisionName">Name</label>
                </div>
              </div>
              <div className="col s4">
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
              <div className="col s5 l7 qb-validation-msg">
                {errorIcon}&nbsp;{errorMessage}
              </div>
              <div className="col s7 l5">
                <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                  <span className="hotkey-underline">C</span>ancel
                </button>&nbsp;
                <button type="submit" accessKey={acceptHotKey} className={'modal-close btn green ' + this.disabledButton()}>
                  <span className="hotkey-underline">A</span>ccept
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

}

module.exports=DivisionEditModal;
