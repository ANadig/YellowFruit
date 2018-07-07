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
var TeamList = require('./TeamList');
var GameList = require('./GameList');

class MainInterface extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      aptBodyVisible: false,
      orderBy: 'petName',
      orderDir: 'asc',
      queryText: '',
      myTeams: loadTeams,
      myGames: loadGames,
      activePane: 'teamsPane'  //either 'teams' or 'games'
    };
    this.toggleAptDisplay = this.toggleAptDisplay.bind(this);
    this.showAbout = this.showAbout.bind(this);
    this.addItem = this.addItem.bind(this);
    this.deleteTeam = this.deleteTeam.bind(this);
    this.deleteGame = this.deleteGame.bind(this);
    this.reOrder = this.reOrder.bind(this);
    this.searchLists = this.searchLists.bind(this);
    this.setPane = this.setPane.bind(this);
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
    fs.writeFile(teamDataLocation, JSON.stringify(this.state.myTeams), 'utf8', function(err) {
      if (err) {
        console.log(err);
      }
    });//writeFile - teams
    fs.writeFile(gameDataLocation, JSON.stringify(this.state.myGames), 'utf8', function(err) {
      if (err) {
        console.log(err);
      }
    });//writeFile - games
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
    var tempApts = this.state.myTeams;
    tempApts.push(tempItem);
    this.setState({
      myTeams: tempApts,
      aptBodyVisible: false
    }) //setState
  } //addItem

  deleteTeam(item) {
    var allTeams = this.state.myTeams;
    var newTeams = _.without(allTeams, item);
    this.setState({
      myTeams: newTeams
    }); //setState
  } //deleteTeam

  deleteGame(item) {
    var allGames = this.state.myGames;
    var newGames = _.without(allGames, item);
    this.setState({
      myGames: newGames
    }); //setState
  } //deleteGame

  reOrder(orderBy, orderDir) {
    this.setState({
      orderBy: orderBy,
      orderDir: orderDir
    }) //setState
  } //reOrder

  searchLists(query) {
    this.setState({
      queryText: query
    }); //setState
  } //searchLists

  setPane(pane) {
    this.setState({
      activePane: pane
    });
  } //setPane

  render() {
    var filteredTeams = [];
    var filteredGames = [];
    var queryText = this.state.queryText;
    var orderBy = this.state.orderBy;
    var orderDir = this.state.orderDir;
    var myTeams = this.state.myTeams;
    var myGames = this.state.myGames;
    var activePane = this.state.activePane;

    if(this.state.aptBodyVisible === true) {
      $('#addAppointment').modal('show');
    } else {
      $('#addAppointment').modal('hide');
    }

    if (activePane == 'teamsPane') {
      filteredGames = myGames; // don't filter games
      //Filter list of teams
      for (var i = 0; i < myTeams.length; i++) {
        if (
          (myTeams[i].petName.toLowerCase().indexOf(queryText)!=-1) ||
          (myTeams[i].ownerName.toLowerCase().indexOf(queryText)!=-1) ||
          (myTeams[i].aptDate.toLowerCase().indexOf(queryText)!=-1) ||
          (myTeams[i].aptNotes.toLowerCase().indexOf(queryText)!=-1)
        ) {
          filteredTeams.push(myTeams[i]);
        }
      }
      filteredTeams = _.orderBy(filteredTeams, function(item) {
        return item[orderBy].toLowerCase();
      }, orderDir); // order array
    }

    else if (activePane == 'gamesPane') {
      filteredTeams = myTeams; // don't filter teams
      //Filter list of games
      for (var i = 0; i < myGames.length; i++) {
        if (
          (myGames[i].petName.toLowerCase().indexOf(queryText)!=-1) ||
          (myGames[i].ownerName.toLowerCase().indexOf(queryText)!=-1) ||
          (myGames[i].aptDate.toLowerCase().indexOf(queryText)!=-1) ||
          (myGames[i].aptNotes.toLowerCase().indexOf(queryText)!=-1)
        ) {
          filteredGames.push(myGames[i]);
        }
      }
      filteredGames = _.orderBy(filteredGames, function(item) {
        return item[orderBy].toLowerCase();
      }, orderDir); // order array
    }

    //make a react element for each item in the lists
    filteredTeams=filteredTeams.map(function(item, index) {
      return(
        <TeamListEntry key = {index}
          singleItem = {item}
          whichItem =  {item}
          onDelete = {this.deleteTeam}
        />
      ) // return
    }.bind(this)); //filteredTeams.map
    filteredGames=filteredGames.map(function(item, index) {
      return(
        <TeamListEntry key = {index}
          singleItem = {item}
          whichItem =  {item}
          onDelete = {this.deleteGame}
        />
      ) // return
    }.bind(this)); //filteredGames.map

    return(
      <div className="application">
        <HeaderNav
          orderBy = {this.state.orderBy}
          orderDir =  {this.state.orderDir}
          onReOrder = {this.reOrder}
          onSearch= {this.searchLists}
          setPane = {this.setPane}
        />
        <div className="interface">
          <Toolbar
            handleToggle = {this.toggleAptDisplay}
            handleAbout = {this.showAbout}
          />
          <AddTeam
            handleToggle = {this.toggleAptDisplay}
            addTeam = {this.addItem}
          />
          <TeamList
            whichPaneActive = {activePane}
            teamList = {filteredTeams}
          />
          <GameList
            whichPaneActive = {activePane}
            gameList = {filteredGames}
          />
        </div>{/* interface */}
      </div>
    );
  } //render
};//MainInterface

ReactDOM.render(
  <MainInterface />,
  document.getElementById('petAppointments')
); //render
