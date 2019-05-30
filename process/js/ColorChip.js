/***********************************************************
ColorChip.js
Andrew Nadig

React component representing a chip color-coded to a
particular phase. Used for both phases (games) and
divisions (teams).
***********************************************************/
var React = require('react');
const CHIP_COLORS = ['yellow', 'light-green', 'orange', 'light-blue',
  'red', 'purple', 'teal', 'deep-purple', 'pink', 'green'];

class ColorChip extends React.Component{

  constructor(props) {
    super(props);
    this.removeMe = this.removeMe.bind(this);
  }

  /*---------------------------------------------------------
  Tell the MainInterface (via the GameListEntry or
  TeamListEntry) to delete the phase or division from the
  game or team.
  ---------------------------------------------------------*/
  removeMe() {
    this.props.removeMe(this.props.phase);
  }

  render() {
    // Need to wrap it in another div so that Materialize's code deleting the chip
    // doesn't delete the entire React element; app will crash otherwise
    return (
      <div className="chip-wrapper">
        <div className={'chip accent-1 ' + CHIP_COLORS[this.props.colorNo % CHIP_COLORS.length]}>
          {this.props.displayTitle}
          <i className="close material-icons" onClick={this.removeMe}>close</i>
        </div>
      </div>
    );
  }

}

module.exports = ColorChip;
