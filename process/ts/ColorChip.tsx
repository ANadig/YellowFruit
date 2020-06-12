/***********************************************************
ColorChip.tsx
Andrew Nadig

React component representing a chip color-coded to a
particular phase. Used for teams' divisions, games' phases,
and divisions' phases
***********************************************************/
import * as React from "react";

interface ColorChipProps {
  displayTitle: string;                   // name of phase, etc. to show in the chip
  colorNo: number;                        // index in list of chip colors
  phase?: string;                         // which phase a division chip corresponds to
  removeMe?: (phase: string) => void;     // how to handle a chip being removed
}

export class ColorChip extends React.Component<ColorChipProps, {}> {

  readonly CHIP_COLORS = ['yellow', 'light-green', 'orange', 'light-blue',
    'red', 'purple', 'teal', 'deep-purple', 'pink', 'green'];

  constructor(props: ColorChipProps) {
    super(props);
    this.removeMe = this.removeMe.bind(this);
  }

  /**
   * Tell the MainInterface (via the GameListEntry or TeamListEntry) to delete
   * the phase or divisions from the game or team.
   */
  removeMe(): void {
    this.props.removeMe(this.props.phase);
  }

  render() {
    let removeIcon = null, noDelete = '';
    if(this.props.removeMe) {
      removeIcon = ( <i className="close material-icons" onClick={this.removeMe}>close</i> );
    }
    else {
      noDelete = 'no-delete ';
    }
    let colorName = this.props.colorNo >=0 ?
      this.CHIP_COLORS[this.props.colorNo % this.CHIP_COLORS.length] : 'grey';

    // Need to wrap it in another div so that Materialize's code deleting the chip
    // doesn't delete the entire React element; app will crash otherwise
    return (
      <div className="chip-wrapper">
        <div className={`chip ${noDelete} accent-1 ${colorName}`}>
          {this.props.displayTitle}
          {removeIcon}
        </div>
      </div>
    );
  }

}
