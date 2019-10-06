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
    this.state = {
      dropTarget: false
    }
    this.handleDelete = this.handleDelete.bind(this);
    this.editDivision = this.editDivision.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDrop = this.onDrop.bind(this);
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
    this.props.onEdit(this.props.divisionName, this.props.phase);
  }

  /*---------------------------------------------------------
  Tell the page what is being dragged
  ---------------------------------------------------------*/
  onDragStart(e) {
    e.dataTransfer.setData('DivisionListEntry', JSON.stringify({divisionName: this.props.divisionName, phase:this.props.phase}));
    this.props.setDragPhase(this.props.phase);
  }

  /*---------------------------------------------------------
  Called when another division starts being dragged over
  this one. Make self visible as a drop target if it's of
  the same phase as the division being dragged
  ---------------------------------------------------------*/
  onDragEnter(e) {
    e.preventDefault();
    this.setState({
      dropTarget: this.props.phase == this.props.dragPhase
    });
  }

  /*---------------------------------------------------------
  Respond to having another division dragged over this one
  ---------------------------------------------------------*/
  onDragOver(e) {
    e.preventDefault();
  }

  /*---------------------------------------------------------
  Called when another division stops being dragged over
  this one
  ---------------------------------------------------------*/
  onDragLeave(e) {
    e.preventDefault();
    this.setState({
      dropTarget: false
    });
  }

  /*---------------------------------------------------------
  Respond to having another division dropped over this one
  ---------------------------------------------------------*/
  onDrop(e) {
    e.preventDefault();
    var droppedItem = JSON.parse(e.dataTransfer.getData('DivisionListEntry'));
    if(this.props.phase == droppedItem.phase) {
      this.props.reorderDivisions(droppedItem, {divisionName: this.props.divisionName, phase:this.props.phase});
    }
    this.setState({
      dropTarget: false
    });
  }


  render() {
    var phaseChip = null;
    var dropTarget = this.state.dropTarget ? 'drop-target' : '';
    if(this.props.phase != 'noPhase') {
      phaseChip = (
        <ColorChip key={this.props.phase}
          displayTitle = {this.props.phase}
          colorNo = {this.props.colorNo}
        />
      );
    }
    return(
      <a className={'collection-item ' + dropTarget} onDoubleClick={this.editDivision} draggable="true" onDragStart={this.onDragStart}
      onDragEnter={this.onDragEnter} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave} onDrop={this.onDrop}>
        <div className="division-name">
          {this.props.divisionName}&emsp;
        </div>
        {phaseChip}
        <button className="btn-flat item-edit" title="Edit this division" onClick={this.editDivision}>
        <i className="material-icons">edit</i></button>
        <button className="secondary-content btn-flat item-delete" title="Delete this division" onClick={this.handleDelete}>
        <i className="material-icons">delete</i></button>
      </a>
    )
  }
};

module.exports = DivisionListEntry;
