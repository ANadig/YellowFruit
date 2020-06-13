/***********************************************************
DivisionListEntry.tsx
Andrew Nadig

React component representing one division on the settings pane.
***********************************************************/
import * as React from "react";
import { ColorChip } from './ColorChip';

/**
 * Data associated with a drag event that identifies which division is being dragged
 */
export interface DraggableDivision {
  divisionName: string;
  phase: string;
}

interface DivisionListEntryProps {
  divisionName: string;
  phase: string;            // name this phase belongs to
  colorNo: number;          // item in the list of chip colors to use
  onDelete: (divName: string, phase: string) => void;   // called when deleting the division
  onEdit: (divName: string, phase: string) => void;     // called when opening the division for editing
  // called when another division is dropped on this one
  reorderDivisions: (droppedItem: DraggableDivision, receivingItem: DraggableDivision) => void;
  dragPhase: string;        // the phase of the division that the user is currently dragging
  setDragPhase: (phase: string) => void;                // called when the user starts to drag this division
}

interface DivisionListEntryState {
  dropTarget: boolean;    // can the user drop the division thay're dragging on to this one?
}

export class DivisionListEntry extends React.Component<DivisionListEntryProps, DivisionListEntryState>{

  constructor(props: DivisionListEntryProps) {
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

  /**
   * Tell the MainInterface to delete this division.
   */
  handleDelete(): void {
    this.props.onDelete(this.props.divisionName, this.props.phase);
  }

  /**
   * Tell the MainInterface to open this division for editing.
   */
  editDivision(): void {
    this.props.onEdit(this.props.divisionName, this.props.phase);
  }

  /**
   * Tell the page what is being dragged
   */
  onDragStart(e: any): void {
    e.dataTransfer.setData('DivisionListEntry', JSON.stringify({divisionName: this.props.divisionName, phase:this.props.phase}));
    this.props.setDragPhase(this.props.phase);
  }

  /**
   * Called when another division starts being dragged over this one. Make self visible
   * as a drop target if it's of the same phase as the division being dragged
   */
  onDragEnter(e: any): void {
    e.preventDefault();
    this.setState({
      dropTarget: this.props.phase == this.props.dragPhase
    });
  }

  /**
   * Respond to having another division dragged over this one (do nothing)
   */
  onDragOver(e: any): void {
    e.preventDefault();
  }

  /**
   * Called when another division stops being dragged over this one
   */
  onDragLeave(e: any): void {
    e.preventDefault();
    this.setState({
      dropTarget: false
    });
  }

  /**
   * Respond to having another division dropped over this one
   */
  onDrop(e: any): void {
    e.preventDefault();
    const droppedItem: DraggableDivision = JSON.parse(e.dataTransfer.getData('DivisionListEntry'));
    if(this.props.phase == droppedItem.phase) {
      this.props.reorderDivisions(droppedItem, {divisionName: this.props.divisionName, phase:this.props.phase});
    }
    this.setState({
      dropTarget: false
    });
  }


  render() {
    let phaseChip = null;
    const dropTarget = this.state.dropTarget ? 'drop-target' : '';
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
