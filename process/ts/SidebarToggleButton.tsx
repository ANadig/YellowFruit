/***********************************************************
SidebarToggleButton.tsx
Andrew Nadig

React component representing the button that shows/hides
the sidebar
***********************************************************/
import * as React from "react";

interface ToggleButtonProps {
  sidebarOpen: boolean;
  toggle: () => void;
}

export class SidebarToggleButton extends React.Component<ToggleButtonProps, {}> {

  constructor(props: ToggleButtonProps) {
    super(props);
    this.toggleMe = this.toggleMe.bind(this);
  }

  /**
   * Toggle the button to open or close the sidebar
   */
  toggleMe(): void {
    this.props.toggle();
  }

  render() {
    const leftOrRight = this.props.sidebarOpen ? 'right-arrow' : 'left-arrow';
    const chevron = this.props.sidebarOpen ? 'chevron_right' : 'chevron_left';
    const tooltip = this.props.sidebarOpen ? 'Close the sidebar (Alt+Shift+Right)' : 'Open the sidebar (Alt+Shift+Left)';

    return (
      <div className={'sidebar-toggle ' + leftOrRight}>
        <button className={'btn grey lighten-1 ' + leftOrRight} onClick={this.toggleMe} title={tooltip}>
          <i className="medium material-icons">{chevron}</i>
        </button>
      </div>
    );
  }

}
