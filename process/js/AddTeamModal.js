var React = require('react');

class AddTeamModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      teamName: '',
      teamRoster: ''
    };
    this.resetState = this.resetState.bind(this);
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
      teamRoster: ''
    });
  }

  handleAdd(e) {
    e.preventDefault();
    var tempItem = {
      teamName: this.state.teamName,
      roster: this.state.teamRoster.split('\n')
    } //tempitems

    this.props.addTeam(tempItem);

    this.resetState();
  } //handleAdd

  componentDidUpdate(prevProps) {
    if(this.props.forceReset) {
      this.resetState();
      //seting mainInterface's forceReset to false will avoid infinite loop
      this.props.onForceReset();
    }
  }

  render() {
    return(
      <div className="modal" id="addTeam">
        <button type="button" className="modal-close"><span aria-hidden="true">&times;</span></button>
        <h4>Add a Team</h4>

        <form onSubmit={this.handleAdd}>
          <label htmlFor="petName">Team</label>
          <input type="text"
            id="petName" name="teamName" onChange={this.handleChange}
            value={this.state.teamName} placeholder="Team Name" />
          <label htmlFor="aptNotes">Roster</label>
          <textarea rows="4" cols="50"
            id="aptNotes" name="teamRoster" onChange={this.handleChange}
            value={this.state.teamRoster} placeholder="One player per line"></textarea>
          <button type="button" className="modal-close">Cancel</button>&nbsp;
          <button type="submit" className="modal-close">Add Team</button>
        </form>
      </div>
    ) //return
  } //render
}; //AddTeam

module.exports=AddTeamModal;
