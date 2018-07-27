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
    this.validateTeam = this.validateTeam.bind(this);
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

  //are there two players with the same name?
  rosterHasDups() {
    var rosterAry = this.state.rosterString.split('\n');
    rosterAry = rosterAry.map(function(item, idx) {
      return item.toLowerCase().trim();
    });
    rosterAry = _.without(rosterAry, '');
    rosterAry = _.orderBy(rosterAry);
    // console.log(rosterAry.length);
    for(var i=0; i < (rosterAry.length - 1); i++) {
      if (rosterAry[i] == rosterAry[i+1]) { return true; }
    }
    return false;
  }

  //verify that the form data can be submitted
  //returns [boolean, error level, error message]
  validateTeam() {
    if(!this.props.isOpen) { return [true, '', '']; } //just in case
    if(!this.props.validateTeamName(this.state.teamName.trim(), this.state.originalTeamLoaded)) {
      return [false, 'error', 'There is already a team named ' + this.state.teamName];
    }
    if(this.state.teamName.trim() == '') { return [false, 'silent', '']; } //team name can't be just whitespace
    if(this.state.rosterString.trim() == '') { return [false, 'silent', '']; } //likewise for roster
    if(this.state.rosterString.split('\n').length > 30) {
      return [false, 'error', 'Cannot have more than 30 players on a team'];
    } // fairly aribitrary limit to make sure no one does anything ridiculous
    if(this.rosterHasDups()) { return [true, 'warning', 'Roster contains two or more players with the same name']; }
    return [true, '', ''];
  }

  //add the disabled attribute to the submit button
  disabledButton(isTeamValid) {
    return isTeamValid ? '' : 'disabled';
  }

  //returns a jsx element containing the appropriate icon (or null if no error)
  getErrorIcon(errorLevel) {
    if(errorLevel == '') { return null; }
    if(errorLevel == 'error') {
      return ( <i className="material-icons red-text text-darken-4 qb-modal-error">error</i> );
    }
    if(errorLevel == 'warning') {
      return ( <i className="material-icons yellow-text text-accent-4 qb-modal-error">warning</i> );
    }
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

    var [teamIsValid, errorLevel, errorMessage] = this.validateTeam();

    var errorIcon = this.getErrorIcon(errorLevel);

    //Don't allow Enter key to submit form unless the form is valid
    $(document).on("keypress", "#addTeam :input:not(textarea)", function(event) {
      return teamIsValid || event.keyCode != 13;
    });

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
                <div className="row">
                  <div className="col s5 l8 qb-validation-msg">
                    {errorIcon}&nbsp;{errorMessage}
                  </div>
                  <div className="col s7 l4">
                    <button type="button" className="modal-close btn grey">Cancel</button>&nbsp;
                    <button type="submit" className={'modal-close btn green ' + this.disabledButton(teamIsValid)}> {this.getSubmitCaption()}</button>
                  </div>
                </div>
              </div>
          </form>
        </div>
      </div>
    ) //return
  } //render
}; //AddTeam

module.exports=AddTeamModal;
