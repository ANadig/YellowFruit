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
      rightIcon = (
        <span className="secondary-content" title="Add a new configuration">
        <i className="material-icons">note_add</i></span>
      );
    }

    return (
      <a href="#!" className={'collection-item truncate ' + this.isActive()} onClick={this.selectSelf}>
        {this.props.title}
        {rightIcon}
      </a>
    );
  }
}

module.exports=RptConfigListEntry
