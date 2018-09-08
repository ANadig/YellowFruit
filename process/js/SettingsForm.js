var React = require('react');
var _ = require('lodash');
var $ = require('jquery');
const defPhaseTooltip = 'Team standings are grouped by this phase\'s divisions when all games are shown';
const defPhaseLinkTooltip = 'Click to change how teams are grouped when viewing all games';

class SettingsForm extends React.Component{

  constructor(props) {
    super(props);
    var divList = [], phaseAssnList = [];
    for(var phase in props.divisions) {
      for(var i in props.divisions[phase]) {
        divList.push(props.divisions[phase][i]);
        if(phase != 'noPhase') { phaseAssnList.push(phase); }
      }
    }
    var allPhases = Object.keys(props.divisions);
    var firstPhase = allPhases.length == 0 ? 'noPhase' : allPhases[0];
    this.state = {
      powers: '15pts',
      negs: 'yes',
      bonuses: 'noBb',
      playersPerTeam: '4',
      phases: _.without(allPhases, 'noPhase'),
      divisions: divList,
      phaseAssignments: phaseAssnList,
      defaultPhase: firstPhase,
      numberOfSavedPhases: _.without(allPhases, 'noPhase').length,
      editingSettings: false,
      editingDivisions: false,
      editingPhases: false,
      needToReRender: false
    }
    this.handleChange = this.handleChange.bind(this);
    this.handlePhaseChange = this.handlePhaseChange.bind(this);
    this.handleDivisionChange = this.handleDivisionChange.bind(this);
    this.handlePhaseAssnChange = this.handlePhaseAssnChange.bind(this);
    this.divisionToggle = this.divisionToggle.bind(this);
    this.phaseToggle = this.phaseToggle.bind(this);
    this.settingsToggle = this.settingsToggle.bind(this);
    this.setDefaultGrouping = this.setDefaultGrouping.bind(this);
  }

  //called any time a value in the form changes
  //this is a controlled component, so the state is the single source of truth
  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  handlePhaseChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichPhase = name.replace('phase', '');
    var tempPhases = this.state.phases.slice();
    tempPhases[whichPhase] = value;
    this.setState({
      phases: tempPhases
    });
  }

  //special handling for the division fields
  handleDivisionChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichDiv = name.replace('division', '');
    var tempDivs = this.state.divisions.slice();
    if(value == '' && tempDivs[whichDiv] == undefined) { return; } //don't add null divisions
    tempDivs[whichDiv] = value;
    var tempPA = this.state.phaseAssignments.slice();
    if(tempPA[whichDiv] == undefined) {
      tempPA[whichDiv] == 'nullPhase';
    }
    this.setState({
      divisions: tempDivs
    });
  }

  //special handling for the phase-division mapping fields
  handlePhaseAssnChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var whichPA = name.replace('phaseAssn', '');
    var tempPA = this.state.phaseAssignments.slice();
    tempPA[whichPA] = value;
    this.setState({
      phaseAssignments: tempPA
    });
  }

  //settings card - open for editing or close and save
  settingsToggle() {
    if(!this.state.editingSettings) {
      this.setState({
        editingSettings: true
      });
      if(this.state.editingPhases) {
        this.phaseToggle();
      }
      if(this.state.editingDivisions) {
        this.divisionToggle();
      }
    }
    else {
      this.setState({
        editingSettings: false
      });
    }
  } //settingsToggle

  //phases card - open for editing or close and save
  phaseToggle() {
    if(!this.state.editingPhases) {
      this.setState({
        editingPhases: true,
      });
      if(this.state.editingDivisions) {
        this.divisionToggle();
      }
      if(this.state.editingSettings) {
        this.settingsToggle();
      }
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
          tempPhaseAssns[i] = '';
        }
      }
      this.setState({
        editingPhases: false,
        phases: tempPhases,
        phaseAssignments: tempPhaseAssns,
        numberOfSavedPhases: tempPhases.length
      });
      this.props.saveDivisions(tempPhases, this.state.divisions, tempPhaseAssns);
    }
  } //phaseToggle

  //divisions card - open for editing or close and save
  divisionToggle() {
    if(!this.state.editingDivisions) {
      this.setState({
        editingDivisions: true,
        needToReRender: true
      });
      if(this.state.editingPhases) {
        this.phaseToggle();
      }
      if(this.state.editingSettings) {
        this.settingsToggle();
      }
    }
    else {
      //remove null divisions and their corresponding phase assignments
      var tempDivs = this.state.divisions.map(function(str) { return str.trim(); });
      var tempPhaseAssns = this.state.divisions.map(function(div, idx) {
        return div != '' ? this.state.phaseAssignments[idx] : '';
      }.bind(this));
      tempDivs = _.without(tempDivs, '');
      tempPhaseAssns = _.without(tempPhaseAssns, '');
      this.setState({
        divisions: tempDivs,
        phaseAssignments: tempPhaseAssns,
        editingDivisions: false
      });
      this.props.saveDivisions(this.state.phases, tempDivs, tempPhaseAssns);
    }
  } //divisionToggle

  getSettingsButtonCaption() {
    if(this.state.editingSettings) {
      return ( <span>S<span className="hotkey-underline">a</span>ve</span> );
    }
    return 'Edit';
  }

  getPhaseButtonCaption() {
    if(this.state.editingPhases) {
      return ( <span>S<span className="hotkey-underline">a</span>ve</span> );
    }
    return 'Edit';
  }

  getDivisionButtonCaption() {
    if(this.state.editingDivisions) {
      return ( <span>S<span className="hotkey-underline">a</span>ve</span> );
    }
    return 'Edit';
  }

  //are there two players with the same name?
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

  //add the disabled class to the save button if necessary
  phaseSaveDisabled() {
    return this.state.editingPhases && this.phasesHasDups() ? 'disabled' : '';
  }

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

  //are there two divisions in the same phase with the same name?
  divsHasDups() {
    for(var i in this.state.divisions) {
      for(var j=(+i)+1; j<this.state.divisions.length; j++) {
        if(this.state.divisions[i].toLowerCase().trim() == this.state.divisions[j].toLowerCase().trim() &&
          this.state.phaseAssignments[i] == this.state.phaseAssignments[j]) {
            return true;
          }
      }
    }
    return false;
  }

  //add the disabled class to the save button if necessary
  divisionSaveDisabled() {
    return this.state.editingDivisions && this.divsHasDups() ? 'disabled' : '';
  }

  divisionSaveError() {
    if(this.state.editingDivisions && this.divsHasDups()) {
      return (
        <div>
          <i className="material-icons red-text text-darken-4 qb-modal-error">error</i>
          &nbsp;Duplicate divisions
        </div>
      );
    }
    return null;
  }

  //are there errors anywhere? (If so, you will be forced to fix them)
  togglesDisabled() {
    return (this.state.editingPhases && this.phasesHasDups()) ||
      (this.state.editingDivisions && this.divsHasDups());
  }

  //set the default phase as the one that was just clicked on, unless, it's
  //already the default, in which case remove the default
  setDefaultGrouping(e) {
    const target = e.target;
    const name = target.name;
    var newDefault = name == this.state.defaultPhase ? 'noPhase' : name;
    this.setState({
      defaultPhase: newDefault
    });
    this.props.setDefaultGrouping(newDefault);
  }

  //the component needs two renders to get the phase dropdowns to display immediately
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

    var settingsDisabled = this.state.editingSettings ? '' : 'disabled';
    var phaseCard, divisionCard, phasePickers, playersPerTeamDisplay;
    var phaseError = this.phaseSaveError();
    var divisionError = this.divisionSaveError();
    var phaseSaveDisabled = this.phaseSaveDisabled();
    var divisionSaveDisabled = this.divisionSaveDisabled();
    var togglesDisabled = this.togglesDisabled() ? 'disabled' : '';
    var settingsHotKey = this.state.editingSettings ? 'a' : '';
    var phaseHotKey = phaseError == null && this.state.editingPhases ? 'a' : '';
    var divHotKey = divisionError == null && this.state.editingDivisions ? 'a' : '';

    if(!this.state.editingDivisions) {
      var divList = this.state.divisions.map(function(divName, idx) {
        var pa = this.state.phaseAssignments[idx];
        var phaseAssn = '';
        if(this.state.numberOfSavedPhases > 0 && (pa == undefined || pa == '')) {
          phaseAssn = ( <span className="noPhase">(No phase)</span> );
        }
        else if(pa != undefined && pa != '') { phaseAssn = '(' + pa + ')'; }
        return (
          <div  key={idx} className="col s12">
            <li>{divName}&nbsp;{phaseAssn}</li>
          </div>
        );
      }.bind(this));
      divisionCard = (<ul>{divList}</ul>);
      phasePickers = null;
    }
    else {
      var tempDivs = this.state.divisions.slice();
      tempDivs.push('');
      var divFields = tempDivs.map(function(divName, idx) {
        return (
          <li key={idx}>
            <div className="input-field tight-input">
              <input id={'division'+idx} type="text" name={'division'+idx} placeholder="Add a division"
                value={tempDivs[idx]} onChange={this.handleDivisionChange}/>
            </div>
          </li>
        );
      }.bind(this));
      var columnWidth = this.state.phases.length > 0 ? 's6' : 's12';
      divisionCard = (
        <div className={'col ' + columnWidth}>
          <ul>{divFields}</ul>
        </div>
      );

      if(this.state.phases.length == 0) { phasePickers = null; }
      else {
        var phaseOptionList = this.state.phases.map(function(phaseName, idx) {
          return (<option key={idx} value={phaseName}>{phaseName}</option>);
        });
        var nullOption = (<option key={-1} value="nullPhase">Phase...</option>);
        phaseOptionList = [nullOption].concat(phaseOptionList);
        var phasePickerElems = divFields.map(function(item, idx) {
          return (
            <li key={idx}>
              <div className="input-field tight-input">
                <select id={'phaseAssn'+idx} name={'phaseAssn'+idx}
                value={this.state.phaseAssignments[idx]} onChange={this.handlePhaseAssnChange}>
                  {phaseOptionList}
                </select>
              </div>
            </li>
          );
        }.bind(this));
        phasePickers = (
          <div className="col s6">
            <ul>{phasePickerElems}</ul>
          </div>
        );
      }//else we need phasePickers
    } //else editing divisions

    if(!this.state.editingPhases) {
      var phaseList = this.state.phases.map((phaseName, idx) => {
        var icon = this.state.defaultPhase == phaseName ?
          ( <i className="material-icons" title={defPhaseTooltip}>playlist_add_check</i> ) : null;
        return (
          <li key={idx}>
            <a onClick={this.setDefaultGrouping} name={phaseName}
            title={defPhaseLinkTooltip}>{phaseName}</a>&nbsp;{icon}
          </li>
        );
      });
      phaseCard = (<ul>{phaseList}</ul>);
    }
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

    if(!this.state.editingSettings) {
      var playersPerTeamDisplay =
        (<h6>Players per team: {this.state.playersPerTeam}</h6>);
    }
    else {
      playersPerTeamDisplay = (
        <span className="players-per-team">
          <h6>Players per team:</h6>
          <div className="input-field">
            <input id="playersPerTeam" type="number" name="playersPerTeam" disabled={settingsDisabled}
              value={this.state.playersPerTeam} onChange={this.handleChange}/>
          </div>
        </span>
      );
    }

    $('select').formSelect(); //initialize all dropdowns

    return(
      <div className="container">
        <div className = "row">
          <div className="col s6">
            <div className="row settings-tournsettings">
              <div id="settingsCard" className="card">
                <div className="card-content">
                  <span className="card-title">Settings</span>
                  <h6>Powers</h6>
                  <p>
                    <label>
                      <input name="powers" type="radio" value="20pts" disabled={settingsDisabled}
                      checked={this.state.powers=='20pts'} onChange={this.handleChange} />
                      <span>20 points</span>
                    </label>
                  </p>
                  <p>
                    <label>
                      <input name="powers" type="radio" value="15pts" disabled={settingsDisabled}
                      checked={this.state.powers=='15pts'} onChange={this.handleChange} />
                      <span>15 points</span>
                    </label>
                  </p>
                  <p>
                    <label>
                      <input name="powers" type="radio" value="noPowers" disabled={settingsDisabled}
                      checked={this.state.powers=='noPowers'} onChange={this.handleChange} />
                      <span>No powers</span>
                    </label>
                  </p>

                  <h6>Interrupt Penalties</h6>
                  <p>
                    <label>
                      <input name="negs" type="radio" value="yes" disabled={settingsDisabled}
                      checked={this.state.negs=='yes'} onChange={this.handleChange} />
                      <span>-5 points</span>
                    </label>
                  </p>
                  <p>
                    <label>
                      <input name="negs" type="radio" value="no" disabled={settingsDisabled}
                      checked={this.state.negs=='no'} onChange={this.handleChange} />
                      <span>No penalties</span>
                    </label>
                  </p>

                  <h6>Bonuses</h6>
                  <p>
                    <label>
                      <input name="bonuses" type="radio" value="noBb" disabled={settingsDisabled}
                      checked={this.state.bonuses=='noBb'} onChange={this.handleChange} />
                      <span>Without bouncebacks</span>
                    </label>
                  </p>
                  <p>
                    <label>
                      <input name="bonuses" type="radio" value="yesBb" disabled={settingsDisabled}
                      checked={this.state.bonuses=='yesBb'} onChange={this.handleChange} />
                      <span>With bouncebacks</span>
                    </label>
                  </p>
                  <p>
                    <label>
                      <input name="bonuses" type="radio" value="none" disabled={settingsDisabled}
                      checked={this.state.bonuses=='none'} onChange={this.handleChange} />
                      <span>No bonuses</span>
                    </label>
                  </p>

                  {playersPerTeamDisplay}

                </div>
                <div className="card-action">
                  <button className={"btn-flat " + togglesDisabled}
                    accessKey={settingsHotKey} onClick={this.settingsToggle}>
                  {this.getSettingsButtonCaption()}</button>
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
                </div>
              </div>
            </div>


            <div className="row settings-divisions">
              <div className="card">
                <div className="card-content">
                  <span className="card-title">Divisions</span>
                  <div className="row">
                    {divisionCard}
                    {phasePickers}
                  </div>
                  {divisionError}
                </div>
                <div className="card-action">
                  <button className={"btn-flat " + togglesDisabled}
                    accessKey={divHotKey} onClick={this.divisionToggle}>
                  {this.getDivisionButtonCaption()}</button>
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
