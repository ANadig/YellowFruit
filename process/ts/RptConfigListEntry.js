/***********************************************************
RptConfigModal.js
Andrew Nadig

React component representing one selectable item in the list
of report configurations
***********************************************************/
var React = require('react');

class RptConfigListEntry extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    }
    this.selectSelf = this.selectSelf.bind(this);
  }

  isActive() {
    return this.props.selected ? 'active' : '';
  }

  selectSelf() {
    if(this.props.disabled) { return; }
    this.props.onSelected(this.props.title, this.props.type);
  }

  render() {
    var rightIcon = null;
    if(this.props.type == 'released') {
      rightIcon = (
        <span className="secondary-content" title="This configuration cannot be edited">
        <i className="material-icons">lock</i></span>
      );
    }
    else if(this.props.type == 'addNew') {
      var title = this.props.disabled ? 'You may not add additional configurations' : 'Add a new configuration';
      rightIcon = (
        <span className="secondary-content" title={title}>
        <i className="material-icons">note_add</i></span>
      );
    }

    var disabledClass = this.props.disabled ? 'new-rpt-disabled' : '';
    return (
      <a href="#!" className={'collection-item truncate ' + this.isActive() + ' ' + disabledClass} onClick={this.selectSelf}>
        {this.props.title}
        {rightIcon}
      </a>
    );
  }
}

module.exports=RptConfigListEntry
