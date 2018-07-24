var React = require('react');
var $ = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');

class AddTeamModal extends React.Component{

  constructor(props) {
    super(props);
    // console.log("Props.teamData: " + this.props.teamData.teamName + ", " + this.props.teamData.roster);
    this.state = {
      teamName: '',
      rosterString: '',
      originalTeamLoaded: null
    };
    this.resetState = this.resetState.bind(this);
    this.loadTeam = this.loadTeam.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  //called any time a value in the form changes
  //this is a controlled component, so the state is the single source of truth
  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  //once we're done with the form, erase the data from state
  resetState() {
    this.setState({
      teamName: '',
      rosterString: '',
      originalTeamLoaded: null
    });
  }

  //populate form with the existing team's data
  //Also, keep a pointer to this team so the mainInterface can remember
  //which team to modify
  loadTeam() {
    this.setState({
      teamName: this.props.teamToLoad.teamName,
      rosterString: this.props.teamToLoad.roster.join('\n'),
      originalTeamLoaded: this.props.teamToLoad
    });
  }

  //called when the form is submitted. Tell the mainInterface to create
  //a new team or modify an existing one as appropriate
  handleAdd(e) {
    e.preventDefault();
    //split roster into array, trim each element, then remove blank lines
    var rosterAry = this.state.rosterString.split('\n');
    rosterAry = rosterAry.map(function(s,idx) { return s.trim(); });
    rosterAry = _.without(rosterAry, '');

    var tempItem = {
      teamName: this.state.teamName.trim(),
      roster: rosterAry
    } //tempitems

    if(this.props.addOrEdit == 'add') {
      this.props.addTeam(tempItem);
    }
    else {
      this.props.modifyTeam(this.state.originalTeamLoaded, tempItem);
    }

    this.resetState();
  } //handleAdd

  //title at the top left
  getModalHeader() {
    return this.props.addOrEdit == 'add' ? 'New team' : 'Edit team';
  }

  //for the green button at the bottom
  getSubmitCaption() {
    return this.props.addOrEdit == 'add' ? 'Add team' : 'Save team';
  }

  //verify that the form data can be submitted
  validateTeam() {
    if(!this.props.isOpen) { return true; } //just in case
    if(this.state.teamName.trim() == '') { return false; } //team name can't be just whitespace
    if(this.state.rosterString.trim() == '') { return false; } //likewise for roster
    return this.props.validateTeamName(this.state.teamName.trim(), this.state.originalTeamLoaded);
  }

  //wrapper around validateTeam to add the disabled attribute to the submit button
  disabledButton() {
    return this.validateTeam() ? '' : 'disabled';
  }

  componentDidUpdate(prevProps) {
    //needed so that labels aren't on top of data when the edit form opens
    M.updateTextFields();
    if(this.props.forceReset) {
      this.resetState();
      //setting mainInterface's forceReset to false will avoid infinite loop
      this.props.onForceReset();
    }
    if(this.props.teamToLoad != null) {
      this.loadTeam();
      //setting mainInterface's editWhichTeam to null will avoid infinite loop
      this.props.onLoadTeamInModal();
    }
  }

  render() {

    //Don't allow Enter key to submit form unless the form is valid
    $(document).on("keypress", "#addTeam :input:not(textarea)", function(event) {
      return this.validateTeam() || event.keyCode != 13;
    }.bind(this));

    return(
      <div className="modal" id="addTeam">
        <div className="modal-content">
          <h4>{this.getModalHeader()}</h4>

          <form onSubmit={this.handleAdd}>
            <div className="row">
              <div className="input-field">
                <input type="text" id="teamName" name="teamName" onChange={this.handleChange} value={this.state.teamName}/>
                <label htmlFor="teamName">Team Name</label>
              </div>
            </div>
            <div className="row">
              <div className="input-field">
                <textarea className="materialize-textarea" id="rosterString" name="rosterString" onChange={this.handleChange} value={this.state.rosterString} placeholder="One player per line" />
                <label htmlFor="rosterString">Roster</label>
              </div>
            </div>
              <div className="modal-footer">
                <span>Warning message&emsp;</span>
                <button type="button" className="modal-close btn grey">Cancel</button>&nbsp;
                <button type="submit" className={'modal-close btn green ' + this.disabledButton()}>{this.getSubmitCaption()}</button>
              </div>
          </form>
        </div>
      </div>
    ) //return
  } //render
}; //AddTeam

module.exports=AddTeamModal;
