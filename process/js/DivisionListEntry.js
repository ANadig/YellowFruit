/***********************************************************
DivisionListEntry.js
Andrew Nadig

React component representing one division on the settings pane.
***********************************************************/
var React = require('react');
var ColorChip = require('./ColorChip');

class DivisionListEntry extends React.Component{

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
    this.editDivision = this.editDivision.bind(this);
  }

  /*---------------------------------------------------------
  Tell the MainInterface to delete this division.
  ---------------------------------------------------------*/
  handleDelete() {
    this.props.onDelete(this.props.divisionName, this.props.phase);
  }

  /*---------------------------------------------------------
  Tell the MainInterface to open this division for editing.
  ---------------------------------------------------------*/
  editDivision() {
    this.props.onOpenDivision(this.props.divisionName, this.props.phase);
  }

  render() {
    var phaseChip = null;
    if(this.props.phase != 'noPhase') {
      phaseChip = (
        <ColorChip key={this.props.phase}
          displayTitle = {this.props.phase}
          colorNo = {this.props.colorNo}
        />
      );
    }
    return(
      <a className="collection-item">
        <div>
          <div className="division-name">
            {this.props.divisionName}&emsp;
          </div>
          {phaseChip}
          <button className="btn-flat item-edit" title="Edit this division" onClick={this.editDivision}>
          <i className="material-icons">edit</i></button>
          <button className="secondary-content btn-flat item-delete" title="Delete this division" onClick={this.handleDelete}>
          <i className="material-icons">delete</i></button>
        </div>
      </a>
    )
  }
};

module.exports = DivisionListEntry;
