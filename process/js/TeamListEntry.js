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
      <li className="pet-item media">
        <div className="media-left">
          <a className="pet-delete btn" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></a>
        </div>
        <div className="pet-info media-body">
          <div className="pet-head">
            <span className="pet-name">{this.props.singleItem.teamName}</span>
          </div>
          <div className="apt-notes">{this.props.singleItem.roster.join(', ')}</div>
        </div>
      </li>
    )
  }
};

module.exports = TeamListEntry;
