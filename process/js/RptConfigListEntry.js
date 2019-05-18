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

    return (
      <a href="#!" className={'collection-item ' + this.isActive()} onClick={this.selectSelf}>
        {this.props.title}
      </a>
    );
  }
}

module.exports=RptConfigListEntry
