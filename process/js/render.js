var $ = jQuery = require('jquery');
var _ = require('lodash');
var materialize = require('materialize-css');
var fs = eRequire('fs');
var loadTeams = JSON.parse(fs.readFileSync(teamDataLocation));
var loadGames = JSON.parse(fs.readFileSync(gameDataLocation));

var electron = eRequire('electron');
var ipc = electron.ipcRenderer;

var React = require('react');
var ReactDOM = require('react-dom');
var TeamListEntry = require('./TeamListEntry');
var GameListEntry = require('./GameListEntry');
//var Toolbar = require('./Toolbar');
var HeaderNav = require('./HeaderNav');
var AddTeamModal = require('./AddTeamModal');
var AddGameModal = require('./AddGameModal');
var TeamList = require('./TeamList');
var GameList = require('./GameList');

class MainInterface extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      tmWindowVisible: false,
      gmWindowVisible: false,
      orderBy: 'teamName',
      orderDir: 'asc',
      queryText: '',
      myTeams: loadTeams,
      myGames: loadGames,
      activePane: 'teamsPane',  //either 'teamsPane' or 'gamesPane'
      forceResetForms: false
    };
    this.openTeamAddWindow = this.openTeamAddWindow.bind(this);
    this.openGameAddWindow = this.openGameAddWindow.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
    this.onForceReset = this.onForceReset.bind(this);
    this.showAbout = this.showAbout.bind(this);
    this.addTeam = this.addTeam.bind(this);
    this.addGame = this.addGame.bind(this);
    this.deleteTeam = this.deleteTeam.bind(this);
    this.deleteGame = this.deleteGame.bind(this);
    this.reOrder = this.reOrder.bind(this);
    this.searchLists = this.searchLists.bind(this);
    this.setPane = this.setPane.bind(this);
  }

  componentDidMount() {
    ipc.on('addAppointment', function(event,message) {
      this.openTeamAddWindow();
    }.bind(this));
  } //componentDidMount

  componentWillUnmount() {
    ipc.removeListener('addAppointment', function(event,message) {
      this.openTeamAddWindow();
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

  openTeamAddWindow() {
    this.setState({
      tmWindowVisible: true
    });
  }

  openGameAddWindow() {
    this.setState({
      gmWindowVisible: true
    });
  }

  onModalClose() {
    this.setState({
      tmWindowVisible: false,
      gmWindowVisible: false,
      forceResetForms: true
    });
  }

  onForceReset() {
    this.setState({
      forceResetForms: false
    });
  }

  showAbout() {
    ipc.sendSync('openInfoWindow');
  } //showAbout

  addTeam(tempItem) {
    var tempTms = this.state.myTeams;
    tempTms.push(tempItem);
    this.setState({
      myTeams: tempTms,
      tmWindowVisible: false
    }) //setState
  } //addTeam

  addGame(tempItem) {
    var tempGms = this.state.myGames;
    tempGms.push(tempItem);
    this.setState({
      myGames: tempGms,
      gmWindowVisible: false
    }) //setState
  } //addTeam

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

    $('.modal').modal({
      onCloseEnd: this.onModalClose
    }); //initialize all modals
    if(this.state.tmWindowVisible === true) {
      $('#addTeam').modal('open');
    }
    if(this.state.gmWindowVisible === true) {
      $('#addGame').modal('open');
    }

    if (activePane == 'teamsPane') {
      filteredGames = myGames; // don't filter games
      //Filter list of teams
      for (var i = 0; i < myTeams.length; i++) {
        if (
          (myTeams[i].teamName.toLowerCase().indexOf(queryText)!=-1) ||
          (myTeams[i].roster.join(', ').toLowerCase().indexOf(queryText)!=-1)
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
          (myGames[i].team1.toLowerCase().indexOf(queryText)!=-1) ||
          (myGames[i].team2.toLowerCase().indexOf(queryText)!=-1)
        ) {
          filteredGames.push(myGames[i]);
        }
      }
      // don't sort games right now
      // filteredGames = _.orderBy(filteredGames, function(item) {
      //   return item[orderBy].toLowerCase();
      // }, orderDir); // order array
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
        <GameListEntry key = {index}
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
          <AddTeamModal
            addTeam = {this.addTeam}
            forceReset = {this.state.forceResetForms}
            onForceReset = {this.onForceReset}
          />
          <AddGameModal
            addGame = {this.addGame}
            teamData = {myTeams}
            forceReset = {this.state.forceResetForms}
            onForceReset = {this.onForceReset}
          />
          <TeamList
            whichPaneActive = {activePane}
            teamList = {filteredTeams}
            openModal = {this.openTeamAddWindow}
          />
          <GameList
            whichPaneActive = {activePane}
            gameList = {filteredGames}
            openModal = {this.openGameAddWindow}
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
