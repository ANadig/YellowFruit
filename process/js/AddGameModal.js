var React = require('react');

class AddGameModal extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      round: '',
      team1: '',
      team2: '',
      score1: '',
      score2: '',
      players1: [],
      players2: [],
      notes: ''
    };
    this.toggleGmAddWindow = this.toggleGmAddWindow.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
  } //constructor

  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    var partialState = {};
    partialState[name] = value;
    this.setState(partialState);
  } //handleChange

  toggleGmAddWindow() {
    this.props.handleToggle();
  }

  handleAdd(e) {
    e.preventDefault();
    var tempItem = {
      petName: this.inputPetName.value,
      ownerName: this.inputPetOwner.value,
      aptDate: this.inputAptDate.value + ' ' + this.inputAptTime.value,
      aptNotes: this.inputAptNotes.value,
    } //tempitems

    this.props.addGame(tempItem);

    this.inputPetName.value = '';
    this.inputPetOwner.value = '';
    this.inputAptDate.value = formatDate(defaultDate, '-');
    this.inputAptTime.value = '09:00';
    this.inputAptNotes.value = '';

  } //handleAdd

  render() {
    return(
      <div className="modal fade" id="addGame" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.toggleGmAddWindow} aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">Add a Game</h4>
            </div>

            <form className="modal-body add-appointment form-horizontal" onSubmit={this.handleAdd}>
              <div className="form-group">
                <select id="tm1Name" name="team1" onChange={this.handleChange}>
                  <option value="a">First Option</option>
                  <option value="b">Second Option</option>
                </select>
                <input type="number" className="form-control"
                  id="tm1Score" name="score1" onChange={this.handleChange}/>
                <select id="tm2Name" name="team2" onChange={this.handleChange}>
                  <option value="a">First Option</option>
                  <option value="b">Second Option</option>
                </select>
                <input type="number" className="form-control"
                  id="tm2Score" name="score2" onChange={this.handleChange}/>
              </div>

              <table><tbody>
                <tr>
                  <th/>
                  <th>15</th>
                  <th>10</th>
                  <th>-5</th>
                </tr>
                <tr>
                  <td>Player 1</td>
                  <td>
                    <input type="number" className="form-control"
                      id="tm1Score" size="3" ref={(ref) => this.inputP1Pwr = ref }/>
                  </td>
                  <td>
                    <input type="number" className="form-control"
                      id="tm1Score" ref={(ref) => this.inputP1Get = ref }/>
                  </td>
                  <td>
                    <input type="number" className="form-control"
                      id="tm1Score" ref={(ref) => this.inputP1Neg = ref }/>
                  </td>
                </tr>

              </tbody>
              </table>


              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptNotes">Game Notes</label>
                <div className="col-sm-9">
                  <textarea className="form-control" rows="4" cols="50"
                    id="aptNotes"  name="notes" onChange={this.handleChange} placeholder="Notes about this game"></textarea>
                </div>
              </div>
              <div className="form-group">
                <div className="col-sm-offset-3 col-sm-9">
                  <div className="pull-right">
                    <button type="button" className="btn btn-default"  onClick={this.toggleGmAddWindow}>Cancel</button>&nbsp;
                    <button type="submit" className="btn btn-primary">Add Game</button>
                  </div>
                </div>
              </div>
            </form>
          </div> /* modal-content */
        </div>
      </div>
    ) //return
  } //render
}; //AddGame

module.exports=AddGameModal;
