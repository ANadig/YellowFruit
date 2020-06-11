/***********************************************************
RptConfigListEntry.tsx
Andrew Nadig

React component representing one selectable item in the list
of report configurations
***********************************************************/
import * as React from "react";

enum RptConfigTypes {
  Released = 'released', //TODO: remove the strings
  Custom = 'custom',
  AddNew = 'addNew',
}

interface RptConfigListEntryProps {
  title: string;
  type: RptConfigTypes;
  disabled: boolean;
  selected: boolean;
  onSelected: (title: string, type: RptConfigTypes) => void;
}

export class RptConfigListEntry extends React.Component<RptConfigListEntryProps, {}> {

  constructor(props: RptConfigListEntryProps) {
    super(props);
    this.selectSelf = this.selectSelf.bind(this);
  }

  /**
   * @return A className or '' depending on if this rpt config is selected
   */
  activeClass(): string {
    return this.props.selected ? 'active' : '';
  }

  /**
   * Mark this entry as selected, and tell the modal to mark all others as unselected
   */
  selectSelf(): void {
    if(this.props.disabled) { return; }
    this.props.onSelected(this.props.title, this.props.type);
  }

  render() {
    let rightIcon = null;
    if(this.props.type == RptConfigTypes.Released) {
      rightIcon = (
        <span className="secondary-content" title="This configuration cannot be edited">
        <i className="material-icons">lock</i></span>
      );
    }
    else if(this.props.type == RptConfigTypes.AddNew) {
      const title = this.props.disabled ? 'You may not add additional configurations' : 'Add a new configuration';
      rightIcon = (
        <span className="secondary-content" title={title}>
        <i className="material-icons">note_add</i></span>
      );
    }

    const disabledClass = this.props.disabled ? 'new-rpt-disabled' : '';
    return (
      <a href="#!" className={'collection-item truncate ' + this.activeClass() + ' ' + disabledClass} onClick={this.selectSelf}>
        {this.props.title}
        {rightIcon}
      </a>
    );
  }
}
