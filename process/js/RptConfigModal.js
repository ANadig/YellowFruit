/***********************************************************
RptConfigModal.js
Andrew Nadig

React component representing modal window for editing
report configurations
***********************************************************/
var React = require('react');
var _ = require('lodash');
var M = require('materialize-css');
var RptConfigListEntry = require('./RptConfigListEntry');

const MAX_CUSTOM_RPT_CONFIGS = 25;
const NEW_RPT_DUMMY_KEY = 'WAo2WKjY6Jx8QDnufmjz'; //aribitrary string that hopefully no one will use for an rpt name
const EMPTY_RPT_SETTINGS = {
  ppgOrPp20: 'ppg',
  smallSchool: false,
  jrVarsity: false,
  teamUG: false,
  teamD2: false,
  teamCombinedStatus: false,
  playerYear: false,
  playerUG: false,
  playerD2: false,
  playerCombinedStatus: false,
  papg: false,
  margin: false,
  phaseRecord: false,
  pptuh: false,
  pPerN: false,
  gPerN: false
}

class RptConfigModal extends React.Component {

  constructor(props) {
    super(props);
    var startRptName = Object.keys(this.props.releasedRptList)[0];
    var startRpt = this.props.releasedRptList[startRptName];
    this.state = {
      selectedRpt: startRptName,
      selectedRptType: 'released',
      rptName: startRptName,
      currentRptIsDefault: this.props.defaultRpt == startRptName,
      ppgOrPp20: startRpt.ppgOrPp20,
      smallSchool: startRpt.smallSchool,
      jrVarsity: startRpt.jrVarsity,
      teamUG: startRpt.teamUG,
      teamD2: startRpt.teamD2,
      teamCombinedStatus: startRpt.teamCombinedStatus,
      playerYear: startRpt.playerYear,
      playerUG: startRpt.playerUG,
      playerD2: startRpt.playerD2,
      playerCombinedStatus: startRpt.playerCombinedStatus,
      papg: startRpt.papg,
      margin: startRpt.margin,
      phaseRecord: startRpt.phaseRecord,
      pptuh: startRpt.pptuh,
      pPerN: startRpt.pPerN,
      gPerN: startRpt.gPerN,
      selectedPreview: 'teamStandings',
      unsavedDataExists: false
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleDefaultChange = this.handleDefaultChange.bind(this);
    this.selectRpt = this.selectRpt.bind(this);
    this.togglePreview = this.togglePreview.bind(this);
    this.attemptDeletion = this.attemptDeletion.bind(this);
    this.copyRpt = this.copyRpt.bind(this);
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
    // form scripting: you can't have combined and separate UG/D2 columns at the same time
    if(name == 'teamCombinedStatus' && value) {
      partialState.teamUG = false;
      partialState.teamD2 = false;
    }
    else if(name == 'playerCombinedStatus' && value) {
      partialState.playerUG = false;
      partialState.playerD2 = false;
    }
    else if((name == 'teamUG' || name == 'teamD2') && value) {
      partialState.teamCombinedStatus = false;
    }
    else if((name == 'playerUG' || name == 'playerD2') && value) {
      partialState.playerCombinedStatus = false;
    }
    partialState.unsavedDataExists = true;
    this.setState(partialState);
  } //handleChange

  /*---------------------------------------------------------
  Called when the default checkbox changes its value
  ---------------------------------------------------------*/
  handleDefaultChange(e) {
    const target = e.target;
    if(target.name != 'currentRptIsDefault') { return; }
    if(target.checked) {
      this.props.setDefaultRpt(this.state.selectedRpt);
    }
    else {
      this.props.clearDefaultRpt();
    }

    this.setState({
      currentRptIsDefault: target.checked
    });
  }

  /*---------------------------------------------------------
  Tell the MainInterface to update data when the form is
  submitted.
  ---------------------------------------------------------*/
  handleSubmit(e) {
    e.preventDefault();
    if(this.state.selectedRptType == 'released') { return; } // sanity check, shouldn't happen
    var acceptAndStay = e.target.name == 'acceptAndStay';
    var rptObj = {
      ppgOrPp20: this.state.ppgOrPp20,
      smallSchool: this.state.smallSchool,
      jrVarsity: this.state.jrVarsity,
      teamUG: this.state.teamUG,
      teamD2: this.state.teamD2,
      teamCombinedStatus: this.state.teamCombinedStatus,
      playerYear: this.state.playerYear,
      playerUG: this.state.playerUG,
      playerD2: this.state.playerD2,
      playerCombinedStatus: this.state.playerCombinedStatus,
      papg: this.state.papg,
      margin: this.state.margin,
      phaseRecord: this.state.phaseRecord,
      pptuh: this.state.pptuh,
      pPerN: this.state.pPerN,
      gPerN: this.state.gPerN
    }
    var trimmedName = this.state.rptName.trim();
    var rptToReplace = this.state.selectedRptType == 'custom' ? this.state.selectedRpt : null;
    this.props.modifyRptConfig(rptToReplace, rptObj, trimmedName, acceptAndStay);
    if(this.state.selectedRpt != trimmedName) {
      this.setState({
        selectedRpt: trimmedName,
        selectedRptType: 'custom'
      });
    }
  }

  /*---------------------------------------------------------
  Update the form with the settings for the configuration
  that the user has just selected
  ---------------------------------------------------------*/
  selectRpt(title, type) {
    if(type == 'addNew') { title = NEW_RPT_DUMMY_KEY; }
    var selectedSettings;
    if(type == 'released') { selectedSettings = this.props.releasedRptList[title]; }
    else if(type == 'custom') { selectedSettings = this.props.customRptList[title]; }
    else { selectedSettings = EMPTY_RPT_SETTINGS; } // else new rpt, clear form

    var smallSchool = selectedSettings.smallSchool
    var jrVarsity = selectedSettings.jrVarsity
    this.setState({
      selectedRpt: title,
      selectedRptType: type,
      currentRptIsDefault: this.props.defaultRpt == title,
      rptName: type == 'addNew' ? '' : title,
      ppgOrPp20: selectedSettings.ppgOrPp20,
      smallSchool: smallSchool != undefined ? smallSchool : false, // items that were added on later need special handling
      jrVarsity: jrVarsity != undefined ? jrVarsity : false,
      teamUG: selectedSettings.teamUG,
      teamD2: selectedSettings.teamD2,
      teamCombinedStatus: selectedSettings.teamCombinedStatus,
      playerYear: selectedSettings.playerYear,
      playerUG: selectedSettings.playerUG,
      playerD2: selectedSettings.playerD2,
      playerCombinedStatus: selectedSettings.playerCombinedStatus,
      papg: selectedSettings.papg,
      margin: selectedSettings.margin,
      phaseRecord: selectedSettings.phaseRecord,
      pptuh: selectedSettings.pptuh,
      pPerN: selectedSettings.pPerN,
      gPerN: selectedSettings.gPerN
    });
  }

  /*---------------------------------------------------------
  Tell the main process (via the MainInterface) to prompt
  the user to confirm that they want to delete this rpt
  ---------------------------------------------------------*/
  attemptDeletion(e) {
    this.props.attemptDeletion(this.state.selectedRpt);
  }

  /*---------------------------------------------------------
  Make a copy of the selected configuration
  ---------------------------------------------------------*/
  copyRpt(e) {
    if(Object.keys(this.props.customRptList).length >= MAX_CUSTOM_RPT_CONFIGS) { return; }
    var rptObj = {
      ppgOrPp20: this.state.ppgOrPp20,
      smallSchool: this.state.smallSchool,
      jrVarsity: this.state.jrVarsity,
      teamUG: this.state.teamUG,
      teamD2: this.state.teamD2,
      teamCombinedStatus: this.state.teamCombinedStatus,
      playerYear: this.state.playerYear,
      playerUG: this.state.playerUG,
      playerD2: this.state.playerD2,
      playerCombinedStatus: this.state.playerCombinedStatus,
      papg: this.state.papg,
      margin: this.state.margin,
      phaseRecord: this.state.phaseRecord,
      pptuh: this.state.pptuh,
      pPerN: this.state.pPerN,
      gPerN: this.state.gPerN
    }
    var copyNameStub = 'Copy of ' + this.state.selectedRpt;
    var uniqueName = copyNameStub;
    var counter = 2;
    while(this.nameisInvalid(uniqueName)) {
      uniqueName = copyNameStub + ' (' + counter++ + ')';
    }
    this.props.modifyRptConfig(null, rptObj, uniqueName, true);
    this.selectRpt(uniqueName, 'custom');
  }

  /*---------------------------------------------------------
  The list of collection items representing the available
  report configurations
  ---------------------------------------------------------*/
  getRptList() {
    var rptList = [];
    for(var r in this.props.releasedRptList) {
      rptList.push(
        <RptConfigListEntry key={r} title={r} type={'released'} disabled={false}
          selected={this.state.selectedRpt==r} onSelected={this.selectRpt}/>
      );
    }
    var sortedRpts = _.orderBy(Object.keys(this.props.customRptList), [(r) => { return r.toLowerCase(); }]);
    for(var i in sortedRpts) {
      var r = sortedRpts[i];
      rptList.push(
        <RptConfigListEntry key={r} title={r} type={'custom'} disabled={false}
          selected={this.state.selectedRpt==r} onSelected={this.selectRpt}/>
      );
    }
    var preventNewRpts = sortedRpts.length >= MAX_CUSTOM_RPT_CONFIGS;
    rptList.push(
      <RptConfigListEntry key={NEW_RPT_DUMMY_KEY} title={'(New)'} type={'addNew'} disabled={preventNewRpts}
        selected={this.state.selectedRpt==NEW_RPT_DUMMY_KEY} onSelected={this.selectRpt}/>
    );
    return rptList;
  }

  /*---------------------------------------------------------
  Names cannot be just whitespace, or be the same as the name
  of an existing report
  ---------------------------------------------------------*/
  nameisInvalid(name) {
    var trimmedName = name.trim();
    if(trimmedName == '') { return true; }
    if(trimmedName == this.state.selectedRpt) { return false; }
    var lowerKeys = Object.keys(this.props.releasedRptList).map((k,idx) => { return k.toLowerCase(); });
    if(lowerKeys.includes(trimmedName.toLowerCase())) { return true; }
    lowerKeys = Object.keys(this.props.customRptList).map((k,idx) => { return k.toLowerCase(); });
    if(lowerKeys.includes(trimmedName.toLowerCase())) { return true; }
    return false;
  }

  /*---------------------------------------------------------
  Hightlight the button of whichever table layout is being
  previewed
  ---------------------------------------------------------*/
  previewButtonToggled(whichButton) {
    if(whichButton == this.state.selectedPreview) {
      return 'teal lighten-1';
    }
    return 'grey lighten-5';
  }

  /*---------------------------------------------------------
  Set which table is being previewed
  ---------------------------------------------------------*/
  togglePreview(e) {
    this.setState({
      selectedPreview: e.target.name
    });
  }

  /*---------------------------------------------------------
  Whether or not the default checkbox should be disabled
  ---------------------------------------------------------*/
  disableDefaultCheckBox() {
    if(this.state.selectedRptType == 'addNew') { return 'disabled'; }
    if(this.state.selectedRpt == this.props.originalDefault && this.state.currentRptIsDefault) {
      return 'disabled';
    }
    return '';
  }

  /*---------------------------------------------------------
  Format Pwr/N option with strikethrough if the current
  tournament's settings make it irrelevant
  ---------------------------------------------------------*/
  formatPperN() {
    if(this.props.tournamentSettings.powers == 'none' || this.props.tournamentSettings.negs == 'no') {
      return ( <s>Powers per neg</s> );
    }
    return 'Powers per neg';
  }

  /*---------------------------------------------------------
  Format G/N option with strikethrough if the current
  tournament's settings make it irrelevant
  ---------------------------------------------------------*/
  formatGperN() {
    if(this.props.tournamentSettings.negs == 'no') {
      return ( <s>Gets per neg</s> );
    }
    return 'Gets per neg';
  }

  /*---------------------------------------------------------
  Lifecyle method.
  ---------------------------------------------------------*/
  componentDidUpdate(prevProps) {
    //needed so that labels aren't on top of data when text fields auto-populate
    M.updateTextFields();
    //if the selected report was just deleted, load something else
    if(this.props.releasedRptList[this.state.selectedRpt] == undefined &&
      this.props.customRptList[this.state.selectedRpt] == undefined &&
      this.state.selectedRptType != 'addNew') {
      var sortedRpts = _.orderBy(Object.keys(this.props.customRptList), [(r) => { return r.toLowerCase(); }]);
      var rptCount = sortedRpts.length;
      if(rptCount == 0) { this.selectRpt(this.props.originalDefault, 'released'); }
      else {
        var nextIdx = 0;
        while(sortedRpts[nextIdx] < this.state.selectedRpt) { nextIdx++; }
        if(nextIdx >= rptCount) { nextIdx = rptCount-1; }
        this.selectRpt(sortedRpts[nextIdx], 'custom');
      }
    }
    // discard unsaved data when the form closes
    if(!this.props.isOpen && this.state.unsavedDataExists) {
      this.selectRpt(this.state.selectedRpt, this.state.selectedRptType);
      this.setState({
        unsavedDataExists: false
      });
    }
  }


  render() {
    var invalidName = this.nameisInvalid(this.state.rptName);
    var disableFields = this.state.selectedRptType == 'released' ? 'disabled' : '';
    var disableDeleteButton = this.state.selectedRptType == 'released' || this.state.selectedRptType == 'addNew' ? 'disabled' : '';
    var disableAcceptButton = this.state.selectedRptType == 'released' || invalidName ? 'disabled' : '';
    var disableCopyButton = invalidName || Object.keys(this.props.customRptList).length >= MAX_CUSTOM_RPT_CONFIGS ||
      this.state.selectedRptType == 'addNew' ? 'disabled' : '';

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
            className={invalidName ? 'invalid' : ''} onChange={this.handleChange} value={this.state.rptName}/>
            <label htmlFor="rptName">Name</label>
          </div>
        </div>
        <div className="col s4" id="currentRptIsDefault">
          <label>
            <input type="checkbox" name="currentRptIsDefault" disabled={this.disableDefaultCheckBox()}
              checked={this.state.currentRptIsDefault} onChange={this.handleDefaultChange}/>
            <span title="Make this configuration the default for new tournaments">Default</span>
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
            <input name="ppgOrPp20" type="radio" value="pp20" disabled={disableFields}
            checked={this.state.ppgOrPp20=='pp20'} onChange={this.handleChange} />
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
            <input type="checkbox" name="smallSchool" disabled={disableFields}
              checked={this.state.smallSchool} onChange={this.handleChange}/>
            <span title="Small School">SS</span>&emsp;&emsp;
          </label>
          <label>
            <input type="checkbox" name="jrVarsity" disabled={disableFields}
              checked={this.state.jrVarsity} onChange={this.handleChange}/>
            <span>JV&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="teamUG" disabled={disableFields}
              checked={this.state.teamUG} onChange={this.handleChange}/>
            <span>UG&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="teamD2" disabled={disableFields}
              checked={this.state.teamD2} onChange={this.handleChange}/>
            <span>D2&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="teamCombinedStatus" disabled={disableFields}
              checked={this.state.teamCombinedStatus} onChange={this.handleChange}/>
            <span title="Show UG and D2 status in the same column. Use this for ACF-style eligibility rules where all D2 teams are UG.">Combined UG/D2</span>
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
            <input type="checkbox" name="playerUG" disabled={disableFields}
              checked={this.state.playerUG} onChange={this.handleChange}/>
            <span>UG&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="playerD2" disabled={disableFields}
              checked={this.state.playerD2} onChange={this.handleChange}/>
            <span>D2&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="playerCombinedStatus" disabled={disableFields}
              checked={this.state.playerCombinedStatus} onChange={this.handleChange}/>
            <span title="Show UG and D2 status in the same column. Use this for ACF-style eligibility rules where all D2 players are UG.">Combined UG/D2</span>
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
            <span>Margin&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="phaseRecord" disabled={disableFields}
              checked={this.state.phaseRecord} onChange={this.handleChange}/>
            <span title="Show teams' records in the grouping phase when viewing all games. Standings will be sorted by win percentage in this column.">This stage</span>
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
            <span>{this.formatPperN()}&emsp;&emsp;</span>
          </label>
          <label>
            <input type="checkbox" name="gPerN" disabled={disableFields}
              checked={this.state.gPerN} onChange={this.handleChange}/>
            <span>{this.formatGperN()}&emsp;&emsp;</span>
          </label>
        </div>
      </div>
    );

    //table cells for the team standings preview
    var tdRank = ( <td>Rank</td> );
    var tdTeam = ( <td>Team</td> );
    var tdSS = this.state.smallSchool ? ( <td>SS</td> ) : null;
    var tdJV = this.state.jrVarsity ? ( <td>JV</td> ) : null;
    var tdUG = this.state.teamUG ? ( <td>UG</td> ) : null;
    var tdD2 = this.state.teamD2 ? ( <td>D2</td> ) : null;
    var tdTmComb = this.state.teamCombinedStatus ? ( <td>UG/D2</td> ) : null;
    var tdW = ( <td>W</td> );
    var tdL = ( <td>L</td> );
    var tdT = ( <td>T</td> );
    var tdPct = ( <td>Pct.</td> );
    var tdPhaseRecord = this.state.phaseRecord ? ( <td>Stage</td> ) : null;
    var tdPPG = this.state.ppgOrPp20 == 'ppg' ? ( <td>PPG</td> ) : null;
    var tdPP20 = this.state.ppgOrPp20 == 'pp20' ? ( <td>PP20</td> ) : null;
    var tdPapg = this.state.ppgOrPp20 == 'ppg' && this.state.papg ? ( <td>PAPG</td> ) : null;
    var tdPap20 = this.state.ppgOrPp20 == 'pp20' && this.state.papg ? ( <td>PAP20</td> ) : null;
    var tdMrg = this.state.margin ? ( <td>Mrg.</td> ) : null;
    var tdPwr = this.props.tournamentSettings.powers != 'none' ? ( <td>15</td> ) : null;
    if(this.props.tournamentSettings.powers == '20pts') { tdPwr = ( <td>20</td> ) }
    var tdTen = ( <td>10</td> );
    var tdNeg = this.props.tournamentSettings.negs == 'yes' ? ( <td>-5</td> ) : null;
    var tdTuh = ( <td>TUH</td> );
    var tdPptuh = this.state.pptuh ? ( <td>PPTUH</td> ) : null;
    var tdPperN = this.state.pPerN && this.props.tournamentSettings.powers != 'none' &&
      this.props.tournamentSettings.negs == 'yes' ? ( <td>Pwr/N</td> ) : null;
    var tdGperN = this.state.gPerN && this.props.tournamentSettings.negs == 'yes' ? ( <td>G/N</td> ) : null;
    var tdBPts = this.props.tournamentSettings.bonuses != 'none' ? ( <td>BPts</td> ) : null;
    var tdBHrd = this.props.tournamentSettings.bonuses != 'none' ? ( <td>BHrd</td> ) : null;
    var tdPpb = this.props.tournamentSettings.bonuses != 'none' ? ( <td>PPB</td> ) : null;
    var tdBBHrd = this.props.tournamentSettings.bonuses == 'yesBb' ? ( <td>BBHrd</td> ) : null;
    var tdBbpts = this.props.tournamentSettings.bonuses == 'yesBb' ? ( <td>BBPts</td> ) : null;
    var tdPpbb = this.props.tournamentSettings.bonuses == 'yesBb' ? ( <td>PPBB</td> ) : null;

    //additional table cells for the individual standings preview
    var tdPlayer = ( <td>Player</td> );
    var tdYear = this.state.playerYear ? ( <td>Year</td> ) : null;
    var tdPlayerUG = this.state.playerUG ? ( <td>UG</td> ) : null;
    var tdPlayerD2 = this.state.playerD2 ? ( <td>D2</td> ) : null;
    var tdPlComb = this.state.playerCombinedStatus ? ( <td>UG/D2</td> ) : null;
    var tdDivision = this.props.usingDivisions ? ( <td>Division</td> ) : null;
    var tdGP = ( <td>GP</td> );

    //additional table cells for the team detail preview
    var tdRd = ( <td>Rd.</td> );
    var tdOpp = ( <td>Opponent</td> );
    var tdResult = ( <td>Result</td> );
    var tdPf = ( <td>PF</td> );
    var tdPa = ( <td>PA</td> );

    //additional table cells for the player detail preview
    var tdPlayerPts = ( <td>Pts</td> );

    var previewTables = {};

    previewTables.teamStandings = (
      <table>
        <tbody>
          <tr>
          {tdRank}{tdTeam}{tdSS}{tdJV}{tdUG}{tdD2}{tdTmComb}{tdW}{tdL}{tdT}{tdPct}{tdPhaseRecord}
            {tdPPG}{tdPP20}{tdPapg}{tdPap20}{tdMrg}{tdPwr}{tdTen}{tdNeg}{tdTuh}{tdPptuh}
            {tdPperN}{tdGperN}{tdBHrd}{tdBPts}{tdPpb}{tdBBHrd}{tdBbpts}{tdPpbb}
          </tr>
        </tbody>
      </table>
    );

    previewTables.individuals = (
      <table>
        <tbody>
          <tr>
          {tdRank}{tdPlayer}{tdYear}{tdPlayerUG}{tdPlayerD2}{tdPlComb}{tdTeam}{tdDivision}
            {tdGP}{tdPwr}{tdTen}{tdNeg}{tdTuh}{tdPptuh}{tdPperN}{tdGperN}{tdPPG}{tdPP20}
          </tr>
        </tbody>
      </table>
    );

    previewTables.teamDetail = (
      <table>
        <tbody>
          <tr>
          {tdRd}{tdOpp}{tdResult}{tdPf}{tdPa}{tdPwr}{tdTen}{tdNeg}{tdTuh}{tdPptuh}
            {tdPP20}{tdPperN}{tdGperN}{tdBHrd}{tdBPts}{tdPpb}{tdBBHrd}{tdBbpts}{tdPpbb}
          </tr>
        </tbody>
      </table>
    );

    previewTables.playerDetail = (
      <table>
        <tbody>
          <tr>
          {tdRd}{tdOpp}{tdResult}{tdPwr}{tdTen}{tdNeg}{tdTuh}{tdPptuh}{tdPperN}
            {tdGperN}{tdPlayerPts}{tdPP20}
          </tr>
        </tbody>
      </table>
    );

    return (
      <div className="modal modal-fixed-footer" id="rptConfig">
        <div className="modal-content">
          <h4>Report Settings</h4>
          <div className="row main-form">
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
          Preview:&emsp;
          <button type="button" className={'btn-flat btn-small ' + this.previewButtonToggled('teamStandings')}
            name="teamStandings" onClick={this.togglePreview}>Team Standings</button>
          <button type="button" className={'btn-flat btn-small ' + this.previewButtonToggled('individuals')}
            name="individuals" onClick={this.togglePreview}>Individuals</button>
          <button type="button" className={'btn-flat btn-small ' + this.previewButtonToggled('teamDetail')}
            name="teamDetail" onClick={this.togglePreview}>Team Detail</button>
          <button type="button" className={'btn-flat btn-small ' + this.previewButtonToggled('playerDetail')}
            name="playerDetail" onClick={this.togglePreview}>Player Detail</button>
          {previewTables[this.state.selectedPreview]}
        </div>

        <div className="modal-footer">
          <div className="row">
            <div className="col s3">
              <button type="button" accessKey={this.props.isOpen ? 'd' : ''}
                className={'btn red accent-1 ' + disableDeleteButton} onClick={this.attemptDeletion}>
                <span className="hotkey-underline">D</span>elete
              </button>&nbsp;
              <button type="button" accessKey={this.props.isOpen ? 'o' : ''}
                className={'btn deep-purple accent-1 ' + disableCopyButton} onClick={this.copyRpt}>
                C<span className="hotkey-underline">o</span>py
              </button>
            </div>
            <div className="col s9">
              <button type="button" accessKey={this.props.isOpen ? 'c' : ''} className="modal-close btn grey">
                <span className="hotkey-underline">C</span>lose
              </button>&nbsp;
              <button type="button" accessKey={this.props.isOpen ? 's' : ''} name="acceptAndStay"
                className={'btn blue accent-1 ' + disableAcceptButton} onClick={this.handleSubmit}>
                Accept & <span className="hotkey-underline">S</span>tay
              </button>&nbsp;
              <button type="button" accessKey={this.props.isOpen ? 'a' : ''} name="acceptAndClose"
                className={'modal-close btn green ' + disableAcceptButton} onClick={this.handleSubmit}>
                <span className="hotkey-underline">A</span>ccept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

module.exports=RptConfigModal
