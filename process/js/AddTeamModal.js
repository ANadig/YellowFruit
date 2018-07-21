var React = require('react');

class AddTeamModal extends React.Component{

  constructor(props) {
    super(props);
    // console.log("Props.teamData: " + this.props.teamData.teamName + ", " + this.props.teamData.roster);
    this.state = {
      teamName: '',
      rosterString: ''
    };
    this.resetState = this.resetState.bind(this);
    this.loadTeam = this.loadTeam.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  resetState() {
    this.setState({
      teamName: '',
      rosterString: ''
    });
  }

  loadTeam() {
    this.setState({
      teamName: this.props.teamToLoad.teamName,
      rosterString: this.props.teamToLoad.roster.join('\n')
    })
  }

  handleAdd(e) {
    e.preventDefault();
    var tempItem = {
      teamName: this.state.teamName,
      roster: this.state.rosterString.split('\n')
    } //tempitems

    this.props.addTeam(tempItem);

    this.resetState();
  } //handleAdd

  componentDidUpdate(prevProps) {
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
    return(
      <div className="modal" id="addTeam">
        <div className="modal-content">
          <h4>Add a Team</h4>

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
                <button type="button" className="modal-close btn grey">Cancel</button>&nbsp;
                <button type="submit" className="modal-close btn green">Add Team</button>
              </div>
          </form>
        </div>
      </div>
    ) //return
  } //render
}; //AddTeam

module.exports=AddTeamModal;
