var React = require('react');

class TeamListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
    this.editTeam = this.editTeam.bind(this);
  }

  //tell the mainInterface to delete me
  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  //tell the mainInterface to open the modal to edit me
  editTeam() {
    this.props.onOpenTeam(this.props.whichItem);
  }

  getDeleteButton() {
    if(this.props.numGamesPlayed == 0) {
      return (
        <button className="secondary-content btn-flat item-delete" title="Remove this team" onClick={this.handleDelete}>
        <i className="material-icons">delete</i></button>
      );
    }
    var gameWord = this.props.numGamesPlayed == 1 ? 'game' : 'games';
    var tooltip = this.props.singleItem.teamName + ' has played ' + this.props.numGamesPlayed + ' ' + gameWord;
    return (
      <span className="secondary-content btn-flat disabled-item-delete tooltipped"
        data-tooltip={tooltip} data-position="left">
      <i className="material-icons">delete</i></span>
    );
  }

  render() {

    var deleteButton = this.getDeleteButton();

    return(
      <a className="collection-item">
        <div>
        <span className="btn-flat item-edit team-checkbox" title="Select team to add divisions">
        <i className="material-icons">check_box_outline_blank</i></span>
          <div className="team-name">
            {this.props.singleItem.teamName}&emsp;
            <div className="chip teal">
              Division 1<i className="close material-icons">close</i>
            </div>
            <button className="btn-flat item-edit" title="Edit this team" onClick={this.editTeam}>
            <i className="material-icons">edit</i></button>
          </div>
          {deleteButton}
          <br/>{this.props.singleItem.roster.join(', ')}
        </div>
      </a>
    )
  }
};

module.exports = TeamListEntry;
