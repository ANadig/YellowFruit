/***********************************************************
SettingsForm.js
Andrew Nadig

React component comprising the Settings pane of the UI,
including the tournament settings, phases, and divisions
cards.
***********************************************************/
var React = require('react');
var _ = require('lodash');
var $ = require('jquery');
var DivisionListEntry = require('./DivisionListEntry');
const DEF_PHASE_TOOLTIP = 'Team standings are grouped by this phase\'s divisions when all games are shown';
const DEF_PHASE_LINK_TOOLTIP = 'Click to change how teams are grouped when viewing all games';

class SettingsForm extends React.Component{

  constructor(props) {
    super(props);
    var divList = [], phaseAssnList = [];
    for(var phase in props.divisions) {
      for(var i in props.divisions[phase]) {
        divList.push(props.divisions[phase][i]);
        phaseAssnList.push(phase); // can be 'noPhase'
      }
    }
    var allPhases = Object.keys(props.divisions);

    this.state = {
      powers: props.settings.powers, // '20pts', '15pts', or 'none'
      negs: props.settings.negs, // whether there are negs
      bonuses: props.settings.bonuses, // 'yesBb', 'noBb', or 'none'
      playersPerTeam: props.settings.playersPerTeam,
      packets: props.packets,
      phases: _.without(allPhases, 'noPhase'),
      divisions: divList,
      phaseAssignments: phaseAssnList,
      defaultPhase: props.settings.defaultPhase,
      numberOfSavedPhases: _.without(allPhases, 'noPhase').length,
      editingSettings: false,
      editingPackets: false,
      editingPhases: false,
      needToReRender: false,
      dragPhase: null,
      oldDivisions: [],  //used to track what was changed while the card was open
    }
    this.handleChange = this.handleChange.bind(this);
    this.handlePacketChange = this.handlePacketChange.bind(this);
    this.handlePhaseChange = this.handlePhaseChange.bind(this);
    this.phaseToggle = this.phaseToggle.bind(this);
    this.settingsToggle = this.settingsToggle.bind(this);
    this.packetsToggle = this.packetsToggle.bind(this);
    this.setDefaultGrouping = this.setDefaultGrouping.bind(this);
    this.cancelSettings = this.cancelSettings.bind(this);
    this.cancelPackets = this.cancelPackets.bind(this);
    this.cancelPhases = this.cancelPhases.bind(this);
    this.newDivision = this.newDivision.bind(this);
    this.editDivision = this.editDivision.bind(this);
    this.deleteDivision = this.deleteDivision.bind(this);
    this.reorderDivisions = this.reorderDivisions.bind(this);
    this.setDragPhase = this.setDragPhase.bind(this);
  }

  /*---------------------------------------------------------
  Called any time a value in the settings section changes.
  This is a controlled component, so the state is the single
  source of truth.
  ---------------------------------------------------------*/
  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  /*---------------------------------------------------------
  Called when the list of packet names is changed.
  ---------------------------------------------------------*/
  handlePacketChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichPacket = name.replace('packet', '');
    var tempPackets = $.extend(true, {}, this.state.packets);
    tempPackets[whichPacket] = value;
    for(var i=getPacketRounds(this.state.packets, this.props.gameIndex).length; tempPackets[i]==''; i++) {
      delete tempPackets[i];
    }
    this.setState({
      packets: tempPackets
    });
  }

  /*---------------------------------------------------------
  Called when the list of phases is changed. Immediately
  updates the list of phases; conflicts with division, team,
  and game data are not handled until the phase card is
  saved (via phaseToggle)
  ---------------------------------------------------------*/
  handlePhaseChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichPhase = name.replace('phase', '');
    var tempPhases = this.state.phases.slice();
    tempPhases[whichPhase] = value;
    for(var last=tempPhases.pop(); last==''; last=tempPhases.pop()) { } // remove blank lines
    if(last != undefined) { tempPhases.push(last); }
    this.setState({
      phases: tempPhases
    });
  }

  /*---------------------------------------------------------
  Settings card - open for editing or close and save.
  ---------------------------------------------------------*/
  settingsToggle() {
    if(!this.state.editingSettings) {
      if(this.props.haveGamesBeenEntered) { return; }
      this.props.editingSettings(true);
      this.setState({
        editingSettings: true
      });
      if(this.state.editingPhases) { this.phaseToggle(); }
      if(this.state.editingPackets) { this.packetsToggle(); }
    }
    else {
      this.props.editingSettings(false);
      var settingsObj = {
        powers: this.state.powers,
        negs: this.state.negs,
        bonuses: this.state.bonuses,
        playersPerTeam: this.state.playersPerTeam
      };
      this.props.saveSettings(settingsObj);
      this.setState({
        editingSettings: false
      });
    }
  } //settingsToggle

  /*---------------------------------------------------------
  Packets card - open for editing or close and save.
  ---------------------------------------------------------*/
  packetsToggle() {
    if(!this.state.editingPackets) {
      this.setState({
        editingPackets: true
      });
      if(this.state.editingSettings) { this.settingsToggle(); }
      if(this.state.editingPhases) { this.phaseToggle(); }
    }
    else {
      var tempPackets = this.state.packets;
      for(var r in tempPackets) {
        if(tempPackets[r] == '') { delete tempPackets[r]; }
      }
      this.props.savePackets(tempPackets);
      this.setState({
        packets: tempPackets,
        editingPackets: false
      });
    }
  } // packetsToggle

  /*---------------------------------------------------------
  Phases card - open for editing or close and save.
  ---------------------------------------------------------*/
  phaseToggle() {
    if(!this.state.editingPhases) {
      this.setState({
        editingPhases: true,
      });
      if(this.state.editingSettings) { this.settingsToggle(); }
      if(this.state.editingPackets) { this.packetsToggle(); }
    }
    else {
      var tempPhases = this.state.phases.map(function(str) { return str.trim(); });
      tempPhases = _.without(tempPhases, '');
      var tempPhaseAssns = this.state.phaseAssignments.slice();
      for(var i in tempPhaseAssns) {
        var idx = _.findIndex(this.state.phases, function(p) {
          return p == tempPhaseAssns[i];
        });
        if(idx == -1) {
          tempPhaseAssns[i] = 'noPhase';
        }
      }
      this.props.savePhases(tempPhases, this.state.divisions, tempPhaseAssns);
      this.setState({
        editingPhases: false,
        phases: tempPhases,
        phaseAssignments: tempPhaseAssns,
        numberOfSavedPhases: tempPhases.length,
      });
    }
  } //phaseToggle

  /*---------------------------------------------------------
  Discard changes made to settings card.
  ---------------------------------------------------------*/
  cancelSettings() {
    if(this.state.editingSettings) {
      this.setState({
        powers: this.props.settings.powers,
        negs: this.props.settings.negs,
        bonuses: this.props.settings.bonuses,
        playersPerTeam: this.props.settings.playersPerTeam,
        editingSettings: false
      });
    }
  }

  /*---------------------------------------------------------
  Discard changes made to packet names card.
  ---------------------------------------------------------*/
  cancelPackets() {
    if(this.state.editingPackets) {
      this.setState({
        packets: this.props.packets,
        editingPackets: false
      });
    }
  }

  /*---------------------------------------------------------
  Discard changes made to phases card.
  ---------------------------------------------------------*/
  cancelPhases() {
    if(this.state.editingPhases) {
      var allPhases = Object.keys(this.props.divisions);
      this.setState({
        phases: _.without(allPhases, 'noPhase'),
        editingPhases: false
      });
    }
  }

  /*---------------------------------------------------------
  Open the (blank) division edit modal
  ---------------------------------------------------------*/
  newDivision() {
    this.props.newDivision();
  }

  /*---------------------------------------------------------
  Open a division for editing
  ---------------------------------------------------------*/
  editDivision(division, phase) {
    this.props.editDivision({divisionName: division, phase: phase});
  }

  /*---------------------------------------------------------
  Delete a single division
  ---------------------------------------------------------*/
  deleteDivision(division, phase) {
    this.props.deleteDivision({divisionName: division, phase: phase});
  }

  /*---------------------------------------------------------
  reorder the list of divisions so that droppedItem is
  immediately above receivingItem
  ---------------------------------------------------------*/
  reorderDivisions(droppedItem, receivingItem) {
    this.props.reorderDivisions(droppedItem, receivingItem);
  }

  /*---------------------------------------------------------
  Track the phase of the division being dragged so that
  DivisionListEntrys know when to make themselves visible
  as drag targets
  ---------------------------------------------------------*/
  setDragPhase(phase) {
    this.setState({
      dragPhase: phase
    });
  }

  /*---------------------------------------------------------
  Settings card edit/save button
  ---------------------------------------------------------*/
  getSettingsButtonCaption() {
    if(this.state.editingSettings) {
      return ( <span>S<span className="hotkey-underline">a</span>ve</span> );
    }
    return 'Edit';
  }

  /*---------------------------------------------------------
  Packet card edit/save button
  ---------------------------------------------------------*/
  getPacketsButtonCaption() {
    if(this.state.editingPackets) {
      return ( <span>S<span className="hotkey-underline">a</span>ve</span> );
    }
    return 'Edit';
  }

  /*---------------------------------------------------------
  Phase card edit/save button
  ---------------------------------------------------------*/
  getPhaseButtonCaption() {
    if(this.state.editingPhases) {
      return ( <span>S<span className="hotkey-underline">a</span>ve</span> );
    }
    return 'Edit';
  }

  /*---------------------------------------------------------
  Are there two phases with the same name?
  ---------------------------------------------------------*/
  phasesHasDups() {
    var phases = this.state.phases.map(function(item, idx) {
      return item.toLowerCase().trim();
    });
    phases = _.without(phases, '');
    phases = _.orderBy(phases);
    for(var i=0; i < (phases.length - 1); i++) {
      if (phases[i] == phases[i+1]) { return true; }
    }
    return false;
  }

  /*---------------------------------------------------------
  Add the disabed class the save button
  ---------------------------------------------------------*/
  phaseSaveDisabled() {
    return this.state.editingPhases && this.phasesHasDups() ? 'disabled' : '';
  }

  /*---------------------------------------------------------
  JSX element to display duplicate phase error.
  ---------------------------------------------------------*/
  phaseSaveError() {
    if(this.state.editingPhases && this.phasesHasDups()) {
      return (
        <div>
          <i className="material-icons red-text text-darken-4 qb-modal-error">error</i>
          &nbsp;Duplicate phases
        </div>
      );
    }
    return null;
  }

  /*---------------------------------------------------------
  Are there errors anywhere in the settings pane?
  ---------------------------------------------------------*/
  togglesDisabled() {
    return (this.state.editingPhases && this.phasesHasDups());
  }

  /*---------------------------------------------------------
  Disable settings card edit button, because you can't
  change the tournament format after you've entered games.
  ---------------------------------------------------------*/
  settingsBtnAddlClasses() {
    if(this.props.haveGamesBeenEntered) {
      return ' tooltipped settings-edit-disabled';
    }
    return '';
  }

  /*---------------------------------------------------------
  Tooltip for when settings editing is disabled.
  ---------------------------------------------------------*/
  settingsBtnTooltip() {
    if(this.props.haveGamesBeenEntered) {
      return 'Settings cannot be modified once games have been entered';
    }
    return '';
  }

  /*---------------------------------------------------------
  JSX element for settings card cancel button
  ---------------------------------------------------------*/
  settingsCancelButton() {
    if(this.state.editingSettings) {
      return (
        <button className="btn-flat" accessKey="C" onClick={this.cancelSettings}>
          <span className="hotkey-underline">C</span>ancel</button>
      );
    }
    return null;
  }

  /*---------------------------------------------------------
  JSX element for packets card cancel button
  ---------------------------------------------------------*/
  packetsCancelButton() {
    if(this.state.editingPackets) {
      return (
        <button className="btn-flat" accessKey="C" onClick={this.cancelPackets}>
          <span className="hotkey-underline">C</span>ancel</button>
      );
    }
    return null;
  }

  /*---------------------------------------------------------
  JSX element for phase card cancel button
  ---------------------------------------------------------*/
  phasesCancelButton() {
    if(this.state.editingPhases) {
      return (
        <button className="btn-flat" accessKey="C" onClick={this.cancelPhases}>
          <span className="hotkey-underline">C</span>ancel</button>
      );
    }
    return null;
  }

  /*---------------------------------------------------------
  Set the default phase for grouping teams to the one that
  was just clicked on, unless it's already the default, in
  which case remove the default.
  ---------------------------------------------------------*/
  setDefaultGrouping(e) {
    const target = e.target;
    const name = target.name;
    var newDefault = name == this.state.defaultPhase ? 'noPhase' : name;
    this.setState({
      defaultPhase: newDefault
    });
    this.props.setDefaultGrouping(newDefault);
  }

  /*---------------------------------------------------------
  For display when the settings card is read-only.
  ---------------------------------------------------------*/
  powerString() {
    if(this.props.settings.powers == 'none') { return 'No powers'; }
    var powerValue = this.props.settings.powers == '15pts' ? 15 : 20;
    return 'Powers: ' + powerValue + ' points';
  }

  /*---------------------------------------------------------
  For display when the settings card is read-only.
  ---------------------------------------------------------*/
  negString() {
    if(this.props.settings.negs == 'yes') { return 'Interrupt penalties: -5 points'; }
    return 'No interrupt penalties';
  }

  /*---------------------------------------------------------
  For display when the settings card is read-only.
  ---------------------------------------------------------*/
  bonusString() {
    if(this.props.settings.bonuses == 'none') { return 'No bonuses'; }
    if(this.props.settings.bonuses == 'yesBb') { return 'Bonuses with bouncebacks'; }
    return 'Bonuses without bouncebacks';
  }

  /*---------------------------------------------------------
  The component needs two renders to get the phase dropdowns
  to display immmediately.
  ---------------------------------------------------------*/
  componentDidUpdate(prevProps) {
    if(this.state.needToReRender) {
      this.setState({
        needToReRender: false
      });
    }
  }


  render(){
    if (this.props.whichPaneActive != 'settingsPane') {
      return null;
    }

    var packetCard, phaseCard, divisionCard, playersPerTeamDisplay;
    var phaseError = this.phaseSaveError();
    var phaseSaveDisabled = this.phaseSaveDisabled();
    var togglesDisabled = this.togglesDisabled() ? ' disabled' : '';
    var settingsHotKey = this.state.editingSettings ? 'a' : '';
    var packetsHotkey = this.state.editingPackets ? 'a' : '';
    var phaseHotKey = phaseError == null && this.state.editingPhases ? 'a' : '';

    //list of divisions
    var divList = this.state.divisions.map((divName, idx) => {
      let phase = this.state.phaseAssignments[idx]
      return (
        <DivisionListEntry key = {divName+phase}
          divisionName = {divName}
          phase = {phase}
          colorNo = {this.state.phases.indexOf(phase)}
          onDelete = {this.deleteDivision}
          onEdit = {this.editDivision}
          reorderDivisions = {this.reorderDivisions}
          dragPhase = {this.state.dragPhase}
          setDragPhase = {this.setDragPhase}
        />
      );
    });
    if(divList.length > 0) {
      divisionCard = (<ul className="collection">{divList}</ul>);
    }
    else { divisionCard = null; }

    // read-only list of phases
    if(!this.state.editingPhases) {
      var phaseList = this.state.phases.map((phaseName, idx) => {
        if(this.state.divisions.length > 0) {
          var icon = this.state.defaultPhase == phaseName ?
            ( <i className="material-icons default-phase" title={DEF_PHASE_TOOLTIP}>playlist_add_check</i> ) : null;
          return (
            <li key={idx}>
              <a onClick={this.setDefaultGrouping} name={phaseName}
              title={DEF_PHASE_LINK_TOOLTIP}>{phaseName}</a>&nbsp;{icon}
            </li>
          );
        }
        return ( <li key={idx}>{phaseName} </li> );
      });//phases.map
      phaseCard = (<ul>{phaseList}</ul>);
    }
    // editable list of phases
    else {
      var tempPhases = this.state.phases.slice();
      tempPhases.push('');
      var phaseFields = tempPhases.map(function(phaseName, idx) {
        return (
          <li key={idx}>
            <div className="input-field tight-input">
              <input id={'phase'+idx} type="text" name={'phase'+idx} placeholder="Add a phase"
                value={tempPhases[idx]} onChange={this.handlePhaseChange}/>
            </div>
          </li>
        );
      }.bind(this));
      phaseCard = ( <ul>{phaseFields}</ul> );
    } //else editing phases

    var powersDisplay, negsDisplay, bonusDisplay, playersPerTeamDisplay, settingsList;
    // read-only list of settings
    if(!this.state.editingSettings) {
      powersDisplay = ( <li>{this.powerString()}</li> );
      negsDisplay = ( <li>{this.negString()}</li> );
      bonusDisplay = ( <li>{this.bonusString()}</li> );
      playersPerTeamDisplay = (<li>Players per team: {this.state.playersPerTeam}</li>);
      settingsList = ( <ul>{powersDisplay}{negsDisplay}{bonusDisplay}{playersPerTeamDisplay}</ul> );
    }
    // editable settings controls
    else {
      powersDisplay = (
        <div>
          <h6>Powers</h6>
          <p>
            <label>
              <input name="powers" type="radio" value="20pts"
              checked={this.state.powers=='20pts'} onChange={this.handleChange} />
              <span>20 points</span>
            </label>
          </p>
          <p>
            <label>
              <input name="powers" type="radio" value="15pts"
              checked={this.state.powers=='15pts'} onChange={this.handleChange} />
              <span>15 points</span>
            </label>
          </p>
          <p>
            <label>
              <input name="powers" type="radio" value="none"
              checked={this.state.powers=='none'} onChange={this.handleChange} />
              <span>No powers</span>
            </label>
          </p>
        </div>
      );//powersDisplay
      negsDisplay = (
        <div>
          <h6>Interrupt Penalties</h6>
          <p>
            <label>
              <input name="negs" type="radio" value="yes"
              checked={this.state.negs=='yes'} onChange={this.handleChange} />
              <span>-5 points</span>
            </label>
          </p>
          <p>
            <label>
              <input name="negs" type="radio" value="no"
              checked={this.state.negs=='no'} onChange={this.handleChange} />
              <span>No penalties</span>
            </label>
          </p>
        </div>
      );//negsDisplay
      bonusDisplay = (
        <div>
          <h6>Bonuses</h6>
          <p>
            <label>
              <input name="bonuses" type="radio" value="noBb"
              checked={this.state.bonuses=='noBb'} onChange={this.handleChange} />
              <span>Without bouncebacks</span>
            </label>
          </p>
          <p>
            <label>
              <input name="bonuses" type="radio" value="yesBb"
              checked={this.state.bonuses=='yesBb'} onChange={this.handleChange} />
              <span>With bouncebacks</span>
            </label>
          </p>
          <p>
            <label>
              <input name="bonuses" type="radio" value="none"
              checked={this.state.bonuses=='none'} onChange={this.handleChange} />
              <span>No bonuses</span>
            </label>
          </p>
        </div>
      );//bonusDisplay
      playersPerTeamDisplay = (
        <span className="players-per-team">
          <h6>Players per team:</h6>
          <div className="input-field">
            <input id="playersPerTeam" type="number" name="playersPerTeam"
              min="1" max="30" step="1"
              value={this.state.playersPerTeam} onChange={this.handleChange}/>
          </div>
        </span>
      );
      settingsList = ( <div>{powersDisplay}{negsDisplay}{bonusDisplay}{playersPerTeamDisplay}</div> );
    }//else editing settings


    var packetRounds = getPacketRounds(this.state.packets, this.props.gameIndex);
    var packetFieldCol = null, packetNumCol = null;
    // read-only list of packets
    if(!this.state.editingPackets) {
      if(!packetNamesExist(this.state.packets)) { packetCard = null; }
      else {
        var packetList = packetRounds.map((round, idx) => {
          var roundDisplay = this.state.packets[round] == undefined ? '' : this.state.packets[round];
          return ( <li key={idx}>{round + ': ' + roundDisplay} </li> );
        });//phases.map
        packetNumCol = (<ul>{packetList}</ul>);
      }
    }
    // editable list of packets
    else {
      var tempPackets = $.extend(true, {}, this.state.packets);
      var lastRound = +(packetRounds[packetRounds.length-1]);
      if(isNaN(lastRound)) { lastRound = 0; }
      packetRounds.push(lastRound+1);
      for(var i in packetRounds) {
        var r = packetRounds[i];
        if(tempPackets[r] == undefined) { tempPackets[r] = ''; }
      }
      var packetNums = packetRounds.map((roundNo, idx) => {
        return (
          <div key={roundNo} className="packet-num">
            {roundNo + ':'}
          </div>
        );
      });
      var packetFields = packetRounds.map((roundNo, idx) => {
        return (
          <li key={roundNo}>
            <div className="input-field tight-input">
              <input id={'packet'+roundNo} type="text" name={'packet'+roundNo} placeholder="Packet name"
                value={tempPackets[roundNo]} onChange={this.handlePacketChange}/>
            </div>
          </li>
        );
      });
      packetNumCol = (
        <div className="col s1">
          <ul>{packetNums}</ul>
        </div>
      );
      packetFieldCol = (
        <div className="col s11">
          <ul>{packetFields}</ul>
        </div>
      );
    } //else editing phases

    $('select').formSelect(); //initialize all dropdowns

    return(
      <div className="container">
        <div className = "row">
          <div className="col s6">
            <div className="row settings-tournsettings">
              <div id="settingsCard" className="card">
                <div className="card-content">
                  <span className="card-title">Settings</span>
                  {settingsList}
                </div>
                <div className="card-action">
                  <button className={"btn-flat" + this.settingsBtnAddlClasses() + togglesDisabled}
                    accessKey={settingsHotKey} data-tooltip={this.settingsBtnTooltip()}
                    onClick={this.settingsToggle}>
                  {this.getSettingsButtonCaption()}</button>
                  {this.settingsCancelButton()}
                </div>
              </div>
            </div>
            <div className="row settings-packets">
              <div id="packetsCard" className="card">
                <div className="card-content">
                  <span className="card-title">Packet Names</span>
                  <div className="row">
                    {packetNumCol}
                    {packetFieldCol}
                  </div>
                </div>
                <div className="card-action">
                  <button className={"btn-flat" + togglesDisabled}
                    accessKey={packetsHotkey} onClick={this.packetsToggle}>
                  {this.getPacketsButtonCaption()}</button>
                  {this.packetsCancelButton()}
                </div>
              </div>
            </div>
          </div>
          <div className="col s6 divs-and-phases">
            <div className="row settings-phases">
              <div className="card">
                <div className="card-content">
                  <span className="card-title">Phases</span>
                    {phaseCard}
                    {phaseError}
                </div>
                <div className="card-action">
                  <button className={'btn-flat ' + togglesDisabled}
                    accessKey={phaseHotKey} onClick={this.phaseToggle}>
                  {this.getPhaseButtonCaption()}</button>
                  {this.phasesCancelButton()}
                </div>
              </div>
            </div>

            <div className="row settings-divisions">
              <div className="card">
                <div className="card-content">
                  <span className="card-title">Divisions</span>
                    {divisionCard}
                </div>
                <div className="card-action">
                  <button className="btn-flat" accessKey={'d'} onClick={this.newDivision}>
                  Add <span className="hotkey-underline">D</span>ivision</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

module.exports=SettingsForm
