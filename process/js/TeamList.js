var React = require('react');

class TeamList extends React.Component{

  render () {
    if (this.props.whichPaneActive != 'teamsPane') {
      return ()
    }
    return(
      <div className="container">
       <div className="row">
         <div className="appointments col-sm-12">
           <h2 className="appointments-headline">List of Teams</h2>
           <ul className="item-list media-list">{this.props.teamList}</ul>
           <button type="button" className="btn btn-success">Add Team</button>
         </div>
       </div>
      </div>
    )
  }

}

module.exports=TeamList;
