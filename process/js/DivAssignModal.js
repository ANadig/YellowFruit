var React = require('react');

class DivAssignModal extends React.Component{

  constructor(props) {
    super(props);
    var divs = {};
    for(var p in props.divisions) {
      divs[p] = 'ignore';
    }
    this.state = {
      divSelections: divs
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const target = e.target;
    const value = target.value; //division name
    const name = target.name; //phase number
    var tempSelections = this.state.divSelections;
    tempSelections[name] = value;
    this.setState({
      divSelections: tempSelections
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.handleSubmit(this.state.divSelections);
  }

  //a set of radio buttons for selecting the divisions for a given phase
  getPhaseSection(phase) {
    var divsInPhase = this.props.divisions[phase];
    var ignoreOption = (
      <p key={'ignore'}>
        <label>
          <input name={phase} type="radio" value="ignore"
          checked={this.state.divSelections[phase] == 'ignore'} onChange={this.handleChange} />
          <span>No change</span>
        </label>
      </p>
    );
    var removeOption = (
      <p key={'remove'}>
        <label>
          <input name={phase} type="radio" value="remove"
          checked={this.state.divSelections[phase] == 'remove'} onChange={this.handleChange} />
          <span>Remove divisions</span>
        </label>
      </p>
    );

    var divRadios = divsInPhase.map(function(div, idx) {
      return (
        <p key={div}>
          <label>
            <input name={phase} type="radio" value={div}
            checked={this.state.divSelections[phase] == div} onChange={this.handleChange} />
            <span>{div}</span>
          </label>
        </p>
      );
    }.bind(this));
    divRadios = [ignoreOption, removeOption].concat(divRadios);

    return (
      <div key={phase} className="row">
        <h6>{phase}</h6>
        {divRadios}
      </div>
    );
  } //getPhaseSection



  render() {
    var phaseSections = [];
    for(var p in this.props.divisions) {
      phaseSections.push(this.getPhaseSection(p));
    }

    return (
      <div className="modal modal-fixed-footer" id="assignDivisions">
        <form onSubmit={this.handleSubmit}>
          <div className="modal-content">
            <h4>Assign Divisions</h4>
            {phaseSections}
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

module.exports=DivAssignModal
