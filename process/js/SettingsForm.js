var React = require('react');
var _ = require('lodash');
var $ = require('jquery');

class SettingsForm extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      powers: '15pts',
      negs: 'yes',
      bonuses: 'noBb',
      playersPerTeam: '4',
      phases: [],
      divisions: [],
      phaseAssignments: [],
      editingSettings: false,
      editingDivisions: false,
      editingPhases: false,
      needToReRender: false,
    }
    this.handleChange = this.handleChange.bind(this);
    this.handlePhaseChange = this.handlePhaseChange.bind(this);
    this.handleDivisionChange = this.handleDivisionChange.bind(this);
    this.handlePhaseAssnChange = this.handlePhaseAssnChange.bind(this);
    this.divisionToggle = this.divisionToggle.bind(this);
    this.phaseToggle = this.phaseToggle.bind(this);
    this.settingsToggle = this.settingsToggle.bind(this);
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
  }

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
      this.setState({
        editingPhases: false
      });
    }
  }

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
      this.setState({
        editingDivisions: false
      });
    }
  }

  getSettingsButtonCaption() {
    return this.state.editingSettings ? 'Save' : 'Edit';
  }

  getPhaseButtonCaption() {
    return this.state.editingPhases ? 'Save' : 'Edit';
  }

  getDivisionButtonCaption() {
    return this.state.editingDivisions ? 'Save' : 'Edit';
  }

  componentDidUpdate(prevProps) {
    if(this.state.needToReRender) {
      this.setState({
        needToReRender: false
      });
    }
  }

  render(){
    console.log(this.state);

    if (this.props.whichPaneActive != 'settingsPane') {
      return null;
    }

    var settingsDisabled = this.state.editingSettings ? '' : 'disabled';
    var phaseCard, divisionCard, phasePickers, playersPerTeamDisplay;

    if(!this.state.editingDivisions) {
      var divList = this.state.divisions.map(function(divName, idx) {
        var phaseAssn = this.state.phaseAssignments[idx] == undefined ?
          'No phase' : this.state.phaseAssignments[idx]
        return (
          <div  key={idx} className="col s12">
            <li>{divName + ' (' + phaseAssn + ')'}</li>
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
      divisionCard = (
        <div className="col s6">
          <ul>{divFields}</ul>
        </div>
      );

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
    } //else editing divisions

    if(!this.state.editingPhases) {
      var phaseList = this.state.phases.map(function(phaseName, idx) {
        return (<li key={idx}>{phaseName}</li>);
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



      // phaseCard = (
      //   <div className="input-field">
      //     <textarea className="materialize-textarea" id="phaseString"
      //     name="phaseString" onChange={this.handleChange}
      //     value={this.state.phaseString} placeholder="One phase per line" />
      //   </div>
      // );

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
                  <button className="btn-flat" onClick={this.settingsToggle}>
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
                </div>
                <div className="card-action">
                  <button className="btn-flat" onClick={this.phaseToggle}>
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
                </div>
                <div className="card-action">
                  <button className="btn-flat" onClick={this.divisionToggle}>
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
