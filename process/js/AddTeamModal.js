var React = require('react');

var defaultDate = new Date();
defaultDate.setDate(defaultDate.getDate() + 14);

function formatDate(date, divider) {
  var someday = new Date(date);
  var month = someday.getUTCMonth() + 1;
  var day = someday.getUTCDate();
  var year = someday.getUTCFullYear();

  if (month <= 9) { month = '0' + month; }
  if (day <= 9) { day = '0' + day; }

  return ('' + year + divider + month + divider + day);
}

class AddTeamModal extends React.Component{

  constructor(props) {
    super(props);
    this.toggleTmAddWindow = this.toggleTmAddWindow.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
  }

  toggleTmAddWindow() {
    this.props.handleToggle();
  }

  handleAdd(e) {
    e.preventDefault();
    var tempItem = {
      teamName: this.inputTeamName.value,
      roster: this.inputTmRoster.value,
    } //tempitems

    this.props.addTeam(tempItem);

    this.inputTeamName.value = '';
    this.inputTmRoster.value = '';

  } //handleAdd

  render() {
    return(
      <div className="modal fade" id="addTeam" tabIndex="-1" role="dialog">
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
                    id="petName" ref={(ref) => this.inputTeamName = ref } placeholder="Team Name" />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptNotes">Roster</label>
                <div className="col-sm-9">
                  <textarea className="form-control" rows="4" cols="50"
                    id="aptNotes"  ref={(ref) => this.inputTmRoster = ref } placeholder="One player per line"></textarea>
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
