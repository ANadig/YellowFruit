var React = require('react');

class TeamListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
    this.editTeam = this.editTeam.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.state = {
      selected: props.selected
    };
  }

  //tell the mainInterface to delete me
  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  //tell the mainInterface to open the modal to edit me
  editTeam() {
    this.props.onOpenTeam(this.props.whichItem);
  }

  handleToggle() {
    this.props.onSelectTeam(this.props.whichItem);
    this.setState({
      selected: !this.state.selected
    });
  }

  //don't allow editing a team while it's selected
  canEdit() {
    return this.state.selected ? 'disabled' : '';
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
          <label>
            <input type="checkbox" className="filled-in team-checkbox" checked={this.state.selected}
            title="Select to assign divisions" onChange={this.handleToggle}/>
            <span>&nbsp;</span>
          </label>

          <div className="team-name">
            {this.props.singleItem.teamName}&emsp;
          </div>
          <div className="chip yellow">
            Division 1<i className="close material-icons">close</i>
          </div>
          <button className={'btn-flat item-edit ' + this.canEdit()} title="Edit this team" onClick={this.editTeam}>
          <i className="material-icons">edit</i></button>
          {deleteButton}
          <br/>{this.props.singleItem.roster.join(', ')}
        </div>
      </a>
    )
  }
};

module.exports = TeamListEntry;
