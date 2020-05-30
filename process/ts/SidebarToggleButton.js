/***********************************************************
SidebarToggleButton.js
Andrew Nadig

React component representing the button that shows/hides
the sidebar
***********************************************************/
var React = require('react');


class SidebarToggleButton extends React.Component{

  constructor(props) {
    super(props);
    this.toggleMe = this.toggleMe.bind(this);
  }

  toggleMe() {
    this.props.toggle();
  }

  render() {
    var leftOrRight = this.props.sidebarOpen ? 'right-arrow' : 'left-arrow';
    var chevron = this.props.sidebarOpen ? 'chevron_right' : 'chevron_left';
    var tooltip = this.props.sidebarOpen ? 'Close the sidebar (Alt+Shift+Right)' : 'Open the sidebar (Alt+Shift+Left)';

    return (
      <div className={'sidebar-toggle ' + leftOrRight}>
        <button className={'btn grey lighten-1 ' + leftOrRight} onClick={this.toggleMe} title={tooltip}>
          <i className="medium material-icons">{chevron}</i>
        </button>
      </div>
    );
  }

}

module.exports = SidebarToggleButton;
