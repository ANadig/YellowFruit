var $ = jQuery = require('jquery');
var _ = require('lodash');
var bootstrap = require('bootstrap');
var fs = eRequire('fs');
var loadTeams = JSON.parse(fs.readFileSync(teamDataLocation));
var loadGames = JSON.parse(fs.readFileSync(gameDataLocation));

var electron = eRequire('electron');
var ipc = electron.ipcRenderer;

var React = require('react');
var ReactDOM = require('react-dom');
var TeamListEntry = require('./TeamListEntry');
var Toolbar = require('./Toolbar');
var HeaderNav = require('./HeaderNav');
var AddTeam = require('./AddTeam');

class MainInterface extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      aptBodyVisible: false,
      orderBy: 'petName',
      orderDir: 'asc',
      queryText: '',
      myAppointments: loadTeams,
      myGames: loadGames,
      activePane: 'teams'  //either 'teams' or 'games'
    };
    this.toggleAptDisplay = this.toggleAptDisplay.bind(this);
    this.showAbout = this.showAbout.bind(this);
    this.addItem = this.addItem.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
    this.reOrder = this.reOrder.bind(this);
    this.searchApts = this.searchApts.bind(this);
  }

  componentDidMount() {
    ipc.on('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));
  } //componentDidMount

  componentWillUnmount() {
    ipc.removeListener('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));
  } //componentWillUnmount

  componentDidUpdate() {
    fs.writeFile(teamDataLocation, JSON.stringify(this.state.myAppointments), 'utf8', function(err) {
      if (err) {
        console.log(err);
      }
    });//writeFile
  } //componentDidUpdate

  toggleAptDisplay() {
    var tempVisibility = !this.state.aptBodyVisible;
    this.setState({
      aptBodyVisible: tempVisibility
    }); //setState
  } //toggleAptDisplay

  showAbout() {
    ipc.sendSync('openInfoWindow');
  } //showAbout

  addItem(tempItem) {
    var tempApts = this.state.myAppointments;
    tempApts.push(tempItem);
    this.setState({
      myAppointments: tempApts,
      aptBodyVisible: false
    }) //setState
  } //addItem

  deleteMessage(item) {
    var allApts = this.state.myAppointments;
    var newApts = _.without(allApts, item);
    this.setState({
      myAppointments: newApts
    }); //setState
  } //deleteMessage

  reOrder(orderBy, orderDir) {
    this.setState({
      orderBy: orderBy,
      orderDir: orderDir
    }) //setState
  } //reOrder

  searchApts(query) {
    this.setState({
      queryText: query
    }); //setState
  } //searchApts

  render() {
    var filteredApts = [];
    var queryText = this.state.queryText;
    var orderBy = this.state.orderBy;
    var orderDir = this.state.orderDir;
    var myAppointments = this.state.myAppointments;

    if(this.state.aptBodyVisible === true) {
      $('#addAppointment').modal('show');
    } else {
      $('#addAppointment').modal('hide');
    }

    for (var i = 0; i < myAppointments.length; i++) {
      if (
        (myAppointments[i].petName.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].ownerName.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].aptDate.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].aptNotes.toLowerCase().indexOf(queryText)!=-1)
      ) {
        filteredApts.push(myAppointments[i]);
      }
    }

    filteredApts = _.orderBy(filteredApts, function(item) {
      return item[orderBy].toLowerCase();
    }, orderDir); // order array

    filteredApts=filteredApts.map(function(item, index) {
      return(
        <TeamListEntry key = {index}
          singleItem = {item}
          whichItem =  {item}
          onDelete = {this.deleteMessage}
        />
      ) // return
    }.bind(this)); //Appointments.map

    return(
      <div className="application">
        <HeaderNav
          orderBy = {this.state.orderBy}
          orderDir =  {this.state.orderDir}
          onReOrder = {this.reOrder}
          onSearch= {this.searchApts}
        />
        <div className="interface">
          <Toolbar
            handleToggle = {this.toggleAptDisplay}
            handleAbout = {this.showAbout}
          />
          <AddTeam
            handleToggle = {this.toggleAptDisplay}
            addApt = {this.addItem}
          />
          <div className="container">
           <div className="row">
             <div className="appointments col-sm-12">
               <h2 className="appointments-headline">List of Teams</h2>
               <ul className="item-list media-list">{filteredApts}</ul>
               <button type="button" className="btn btn-success">Add Team</button>
               <h2 className="appointments-headline">List of Games</h2>
               <ul className="item-list media-list">{filteredApts}</ul>
               <button type="button" className="btn btn-success">Add Game</button>
             </div>{/* col-sm-12 */}
           </div>{/* row */}
          </div>{/* container */}
        </div>{/* interface */}
      </div>
    );
  } //render
};//MainInterface

ReactDOM.render(
  <MainInterface />,
  document.getElementById('petAppointments')
); //render
