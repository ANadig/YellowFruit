var React = require('react');
const chipColors = ['yellow', 'light-green', 'orange', 'light-blue',
  'red', 'purple', 'teal', 'deep-purple'];

class ColorChip extends React.Component{

  constructor(props) {
    super(props);
    this.removeMe = this.removeMe.bind(this);
  }

  removeMe() {
    this.props.removeMe(this.props.phase);
  }

  render() {
    //need to wrap it in another div so that materialize's code deleting the chip
    //doesn't delete the entire React element; app will crash otherwise
    return (
      <div className="chip-wrapper">
        <div className={'chip accent-1 ' + chipColors[this.props.colorNo % chipColors.length]}>
          {this.props.displayTitle}
          <i className="close material-icons" onClick={this.removeMe}>close</i>
        </div>
      </div>
    );
  }

}

module.exports = ColorChip;
