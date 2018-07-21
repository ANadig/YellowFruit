var React = require('react');

class TeamListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleDelete() {
    this.props.onDelete(this.props.whichItem);
  }

  render() {
    return(
      <a className="collection-item" title="Edit this team">

        <div>
          <span className="team-name">{this.props.singleItem.teamName}</span>
          <button className="secondary-content btn-flat item-delete" title="Remove this team" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></button>
          <br/>{this.props.singleItem.roster.join(', ')}
        </div>
      </a>
    )
  }
};

module.exports = TeamListEntry;
