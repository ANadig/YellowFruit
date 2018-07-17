var React = require('react');

class AddTeamModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      teamName: '',
      teamRoster: ''
    };
    this.toggleTmAddWindow = this.toggleTmAddWindow.bind(this);
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

  toggleTmAddWindow() {
    this.props.handleToggle();
  }

  handleAdd(e) {
    e.preventDefault();
    var tempItem = {
      teamName: this.state.teamName,
      roster: this.state.teamRoster.split('\n')
    } //tempitems

    this.props.addTeam(tempItem);

    this.setState({
      teamName: '',
      teamRoster: ''
    });
  } //handleAdd

  render() {
    return(
      <div className="modal" id="addTeam" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.toggleTmAddWindow} aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">Add a Team</h4>
            </div>

            <form className="modal-body add-appointment form-horizontal" onSubmit={this.handleAdd}>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="petName">Team</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="petName" name="teamName" onChange={this.handleChange}
                    value={this.state.teamName} placeholder="Team Name" />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptNotes">Roster</label>
                <div className="col-sm-9">
                  <textarea className="form-control" rows="4" cols="50"
                    id="aptNotes" name="teamRoster" onChange={this.handleChange}
                    value={this.state.teamRoster} placeholder="One player per line"></textarea>
                </div>
              </div>
              <div className="form-group">
                <div className="col-sm-offset-3 col-sm-9">
                  <div className="pull-right">
                    <button type="button" className="btn btn-default"  onClick={this.toggleTmAddWindow}>Cancel</button>&nbsp;
                    <button type="submit" className="btn btn-primary">Add Team</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    ) //return
  } //render
}; //AddTeam

module.exports=AddTeamModal;
