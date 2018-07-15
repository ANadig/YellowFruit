var React = require('react');

class PlayerRow extends React.Component{
  render(){
    return(
      <tr>
        <td>{this.props.playerName}</td>
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
    )
  }
}

module.exports=PlayerRow
