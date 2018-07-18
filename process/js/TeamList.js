var React = require('react');
var $ = jQuery = require('jquery');

class TeamList extends React.Component{

  constructor(props) {
    super(props);
    this.addTeam = this.addTeam.bind(this);
  }

  addTeam () {
    this.props.handleToggle();
  }


  render () {
    if (this.props.whichPaneActive != 'teamsPane') {
      return null;
    }
    return(
      <div className="container">
       <div className="row">
         <div className="appointments col-sm-12">
           <h2 className="appointments-headline">List of Teams</h2>
           <ul className="item-list media-list">{this.props.teamList}</ul>
           <button type="button" className="btn btn-success" onClick={this.addTeam}>Add Team</button>
         </div>
       </div>
      </div>
    )
  }

}

module.exports=TeamList;
