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
      <li className="pet-item">
        <div className="row">
          <div className="col s11 pet-info">
            <span className="pet-name">{this.props.singleItem.teamName}</span>
            <div className="apt-notes">{this.props.singleItem.roster.join(', ')}</div>
          </div>
          <div className="col s1">
            <button className="pet-delete btn red" title="Remove this team" onClick={this.handleDelete}>
            <i className="material-icons">delete</i></button>
          </div>
        </div>
      </li>
    )
  }
};

module.exports = TeamListEntry;
