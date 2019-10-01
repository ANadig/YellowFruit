/***********************************************************
DivisionEditModal.js
Andrew Nadig

React component comprising the Modal window containing the
form for entering and editing teams.
***********************************************************/
var React = require('react');
var $ = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');

class DivisionEditModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      divisionName: '',
      phase: ''
    }
  }

  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  }

  handleAdd() {

  }

  /*---------------------------------------------------------
  Title at the top of the window
  ---------------------------------------------------------*/
  getModalHeader() {
    return this.props.addOrEdit == 'add' ? 'New division' : 'Edit division';
  }

  disabledButton() {
    return '';
  }

  render() {
    var errorIcon = null, errorMessage = null;
    var acceptHotKey = 'a';

    return (
      <div className="modal modal-fixed-footer" id="editDivision">
        <form onSubmit={this.handleAdd}>
          <div className="modal-content">
            <h4>{this.getModalHeader()}</h4>
            <div className="row">
              <div className="col l10 s8">
                <div className="input-field">
                  <input type="text" id="divisionName" name="divisionName" onChange={this.handleChange} value={this.state.divisionName}/>
                  <label htmlFor="divisionName">Name</label>
                </div>
              </div>
              <div className="col l2 s4">
                <div>
                  <select id="phaseAssignment" name="phaseAssignment"
                    value={this.state.phaseAssignment} onChange={this.handlePhaseAssnChange}>
                  </select>
                </div>
              </div>
            </div>
          </div> {/* modal content */}
          <div className="modal-footer">
            <div className="row">
              <div className="col s5 l8 qb-validation-msg">
                {errorIcon}&nbsp;{errorMessage}
              </div>
              <div className="col s7 l4">
                <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                  <span className="hotkey-underline">C</span>ancel
                </button>&nbsp;
                <button type="submit" accessKey={acceptHotKey} className={'modal-close btn green ' + this.disabledButton()}>
                  <span className="hotkey-underline">A</span>ccept
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

}

module.exports=DivisionEditModal;
