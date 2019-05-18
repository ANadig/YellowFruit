/***********************************************************
RptConfigModal.js
Andrew Nadig

React component representing modal window for editing
report configurations
***********************************************************/
var React = require('react');
var M = require('materialize-css');
var RptConfigListEntry = require('./RptConfigListEntry');

const NEW_RPT_DUMMY_KEY = 'WAo2WKjY6Jx8QDnufmjz'; //aribitrary string that hopefully no one will use for an rpt name
const EMPTY_RPT_SETTINGS = {
  ppgOrPp20: 'ppg',
  teamUG: false,
  teamD2: false,
  playerYear: false,
  playerD2: false,
  papg: false,
  margin: false,
  pptuh: false,
  pPerN: false,
  gPerN: false
}

class RptConfigModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedRpt: '',
      lockDownFields: false,
      rptName: '',
      currentRptIsDefault: false,
      ppgOrPp20: 'ppg',
      teamUG: false,
      teamD2: false,
      playerYear: false,
      playerD2: false,
      papg: false,
      margin: false,
      pptuh: false,
      pPerN: false,
      gPerN: false
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.selectRpt = this.selectRpt.bind(this);
  }

  /*---------------------------------------------------------
  Called any time a value in the form changes.
  This is a controlled component, so the state is the single
  source of truth.
  ---------------------------------------------------------*/
  handleChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  /*---------------------------------------------------------
  Tell the MainInterface to update data when the form is
  submitted.
  ---------------------------------------------------------*/
  handleSubmit(e) {
    e.preventDefault();
    // this.props.handleSubmit(this.state.phaseSelections);
  }

  selectRpt(title, type) {
    var lockDownFields = type == 'released';
    if(type == 'addNew') { title = NEW_RPT_DUMMY_KEY; }
    var selectedSettings;
    if(type == 'released') { selectedSettings = this.props.releasedRptList[title]; }
    else if(type == 'custom') { selectedSettings = this.props.customRptList[title]; }
    else { selectedSettings = EMPTY_RPT_SETTINGS; } // else new rpt, clear form
    this.setState({
      selectedRpt: title,
      lockDownFields: lockDownFields,
      rptName: type == 'addNew' ? '' : title,
      ppgOrPp20: selectedSettings.ppgOrPp20,
      teamUG: selectedSettings.teamUG,
      teamD2: selectedSettings.teamD2,
      playerYear: selectedSettings.playerYear,
      playerD2: selectedSettings.playerD2,
      papg: selectedSettings.papg,
      margin: selectedSettings.margin,
      pptuh: selectedSettings.pptuh,
      pPerN: selectedSettings.pPerN,
      gPerN: selectedSettings.gPerN
    });
  }

  /*---------------------------------------------------------
  The list of collection items representing the available
  report configurations
  ---------------------------------------------------------*/
  getRptList() {
    var rptList = [];
    for(var r in this.props.releasedRptList) {
      rptList.push(
        <RptConfigListEntry key={r} title={r} type={'released'}
          selected={this.state.selectedRpt==r} onSelected={this.selectRpt}/>
      );
    }
    for(var r in this.props.customRptList) {
      rptList.push(
        <RptConfigListEntry key={r} title={r} type={'custom'}
          selected={this.state.selectedRpt==r} onSelected={this.selectRpt}/>
      );
    }
    rptList.push(
      <RptConfigListEntry key={NEW_RPT_DUMMY_KEY} title={'(New)'} type={'addNew'}
        selected={this.state.selectedRpt==NEW_RPT_DUMMY_KEY} onSelected={this.selectRpt}/>
    );
    return rptList;
  }

  /*---------------------------------------------------------
  Lifecyle method.
  ---------------------------------------------------------*/
  componentDidUpdate(prevProps) {
    //needed so that labels aren't on top of data when the edit form opens
    M.updateTextFields();
  }


  render() {
    var disableFields = this.state.lockDownFields ? 'disabled' : '';

    var rptCollection = (
      <div className="collection">
        {this.getRptList()}
      </div>
    );

    var nameRow = (
      <div className="row">
        <div className="col s8">
          <div className="input-field">
            <input type="text" id="rptName" name="rptName" disabled={disableFields}
            onChange={this.handleChange} value={this.state.rptName}/>
            <label htmlFor="rptName">Name</label>
          </div>
        </div>
        <div className="col s4" id="currentRptIsDefault">
          <label>
            <input type="checkbox" name="currentRptIsDefault" checked={this.state.currentRptIsDefault} onChange={this.handleChange}/>
            <span>Default</span>
          </label>
        </div>
      </div>
    );

    var ppgRow = (
      <div className="row">
        <div className="col s3">
          Track points...
        </div>
        <div className="col s9" >
          <label>
            <input name="ppgOrPp20" type="radio"  value="ppg" disabled={disableFields}
            checked={this.state.ppgOrPp20=='ppg'} onChange={this.handleChange} />
            <span>per game&emsp;&emsp;</span>
          </label>
          <label>
            <input name="ppgOrPp20" type="radio" value="pper20" disabled={disableFields}
            checked={this.state.ppgOrPp20=='pper20'} onChange={this.handleChange} />
            <span>per 20 toss-ups</span>
          </label>
        </div>
      </div>
    );

    var teamStatusRow = (
      <div className="row">
        <div className="col s3">
          Team status
        </div>
        <div className="col s9" >
          <label>
            <input type="checkbox" name="teamUG" disabled={disableFields}
              checked={this.state.teamUG} onChange={this.handleChange}/>
            <span>Undergrad&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="teamD2" disabled={disableFields}
              checked={this.state.teamD2} onChange={this.handleChange}/>
            <span>Div. 2</span>
          </label>
        </div>
      </div>
    );

    var playerStatusRow = (
      <div className="row">
        <div className="col s3">
          Player status
        </div>
        <div className="col s9" >
          <label>
            <input type="checkbox" name="playerYear" disabled={disableFields}
              checked={this.state.playerYear} onChange={this.handleChange}/>
            <span>Year/Grade&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="playerD2" disabled={disableFields}
              checked={this.state.playerD2} onChange={this.handleChange}/>
            <span>Div. 2</span>
          </label>
        </div>
      </div>
    );

    var teamStandingsRow = (
      <div className="row">
        <div className="col s3">
          Team Standings
        </div>
        <div className="col s9" >
          <label>
            <input type="checkbox" name="papg" disabled={disableFields}
              checked={this.state.papg} onChange={this.handleChange}/>
            <span>Pts. against per {this.state.ppgOrPp20 == 'ppg' ? 'game' : '20 TUH'}&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="margin" disabled={disableFields}
              checked={this.state.margin} onChange={this.handleChange}/>
            <span>Margin</span>
          </label>
        </div>
      </div>
    );

    var otherRow = (
      <div className="row">
        <div className="col s3">
          Other
        </div>
        <div className="col s9" >
          <label>
            <input type="checkbox" name="pptuh" disabled={disableFields}
              checked={this.state.pptuh} onChange={this.handleChange}/>
            <span>Pts. per TUH&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="pPerN" disabled={disableFields}
              checked={this.state.pPerN} onChange={this.handleChange}/>
            <span>Powers per neg&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="gPerN" disabled={disableFields}
              checked={this.state.gPerN} onChange={this.handleChange}/>
            <span>Gets per neg</span>
          </label>
        </div>
      </div>
    );

    return (
      <div className="modal modal-fixed-footer" id="rptConfig">
        <form onSubmit={this.handleSubmit}>
          <div className="modal-content">
            <h4>Report Settings</h4>
            <div className="row">
              <div className="col s3 rptList">
                {rptCollection}
              </div>
              <div className="col s9">
                {nameRow}
                {ppgRow}
                {teamStatusRow}
                {playerStatusRow}
                {teamStandingsRow}
                {otherRow}
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
              <span className="hotkey-underline">C</span>ancel
            </button>&nbsp;
            <button type="submit" accessKey={this.props.isOpen ? 'a' : ''} className={'modal-close btn green '}>
              <span className="hotkey-underline">A</span>ccept
            </button>
          </div>
        </form>
      </div>
    );
  }

}

module.exports=RptConfigModal
