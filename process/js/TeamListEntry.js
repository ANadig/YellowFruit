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
      <li className="qb-item">
        <div className="row team-listing">
          <div className="col s11">
            <span className="team-name">{this.props.singleItem.teamName}</span>
            <div className="item-notes">{this.props.singleItem.roster.join(', ')}</div>
          </div>
          <div className="col s1">
            <button className="item-delete btn red" title="Remove this team" onClick={this.handleDelete}>
            <i className="material-icons">delete</i></button>
          </div>
        </div>
      </li>
    )
  }
};

module.exports = TeamListEntry;
