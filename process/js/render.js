var $ = jQuery = require('jquery');
var _ = require('lodash');
var M = require('materialize-css');
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
var StatSidebar = require('./StatSidebar');

//skip team1, team2 because comparing arrays is more complicated and I'm lazy
function gameEqual(g1, g2) {
  return g1.round == g2.round && g1.tuhtot == g2.tuhtot &&
    g1.ottu == g2.ottu && g1.forfeit == g2.forfeit && g1.team1 == g2.team1 &&
    g1.team2 == g2.team2 && g1.score1 == g2.score1 && g1.score2 == g2.score2 &&
    g1.notes == g2.notes;
}

//bonusesHeard for a single game
function bonusesHeard (game, whichTeam) {
  var tot = 0;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  for(var p in players) {
    pwr = parseFloat(players[p]["powers"]);
    gt = parseFloat(players[p]["gets"]);
    tot = isNaN(pwr) ? tot : tot+pwr;
    tot = isNaN(gt) ? tot : tot+gt;
  }
  return tot;
}

//bonus points for a single game
function bonusPoints(game, whichTeam) {
  var tuPts = 0;
  var players = whichTeam == 1 ? game.players1 : game.players2;
  var totalPoints = whichTeam == 1 ? game.score1 : game.score2;
  for(var p in players) {
    pwr = parseFloat(players[p]["powers"]);
    gt = parseFloat(players[p]["gets"]);
    ng = parseFloat(players[p]["negs"]);
    tuPts = isNaN(pwr) ? tuPts : tuPts+(15*pwr);
    tuPts = isNaN(gt) ? tuPts : tuPts+(10*gt);
    tuPts = isNaN(ng) ? tuPts : tuPts-(5*ng)
  }
  return parseFloat(totalPoints) - tuPts;
}

function getSmallStandings(myTeams,myGames) {
  var summary = myTeams.map(function(item, index) {
    var obj =
      { teamName: item.teamName,
        wins: 0,
        losses: 0,
        ties: 0,
        points: 0,
        bHeard: 0,
        bPts: 0
      };
    return obj;
  }); //map
  for(var i in myGames) {
    var g = myGames[i];
    var idx1 = _.findIndex(summary, function (o) {
      return o.teamName == g.team1;
    });
    var idx2 = _.findIndex(summary, function (o) {
      return o.teamName == g.team2;
    });
    if(g.score1 > g.score2) {
      summary[idx1].wins += 1;
      summary[idx2].losses += 1;
    }
    else if(g.score2 > g.score1) {
      summary[idx1].losses += 1;
      summary[idx2].wins += 1;
    }
    else { //it's a tie
      summary[idx1].ties += 1;
      summary[idx2].ties += 1;
    }
    summary[idx1].points += parseFloat(g.score1);
    summary[idx2].points += parseFloat(g.score2);
    summary[idx1].bHeard += bonusesHeard(g,1);
    summary[idx2].bHeard += bonusesHeard(g,2);
    summary[idx1].bPts += bonusPoints(g,1);
    summary[idx2].bPts += bonusPoints(g,2);
  }
  console.log(summary);
  return summary;
}


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
      forceResetForms: false,
      editWhichTeam: null,
      tmAddOrEdit: 'add', //either 'add' or 'edit'
      editWhichGame: null,
      gmAddOrEdit: 'add'
    };
    this.openTeamAddWindow = this.openTeamAddWindow.bind(this);
    this.openGameAddWindow = this.openGameAddWindow.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
    this.onForceReset = this.onForceReset.bind(this);
    this.showAbout = this.showAbout.bind(this);
    this.addTeam = this.addTeam.bind(this);
    this.addGame = this.addGame.bind(this);
    this.modifyTeam = this.modifyTeam.bind(this);
    this.modifyGame = this.modifyGame.bind(this);
    this.deleteTeam = this.deleteTeam.bind(this);
    this.deleteGame = this.deleteGame.bind(this);
    this.openTeamForEdit = this.openTeamForEdit.bind(this);
    this.openGameForEdit = this.openGameForEdit.bind(this);
    this.onLoadTeamInModal = this.onLoadTeamInModal.bind(this);
    this.onLoadGameInModal = this.onLoadGameInModal.bind(this);
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
      forceResetForms: false,
      tmAddOrEdit: 'add',
      gmAddOrEdit: 'add'
    });
  }

  showAbout() {
    ipc.sendSync('openInfoWindow');
  } //showAbout

  addTeam(tempItem) {
    var tempTms = this.state.myTeams.slice();
    tempTms.push(tempItem);
    this.setState({
      myTeams: tempTms,
      tmWindowVisible: false
    }) //setState
  } //addTeam

  addGame(tempItem) {
    var tempGms = this.state.myGames.slice();
    tempGms.push(tempItem);
    this.setState({
      myGames: tempGms,
      gmWindowVisible: false
    }) //setState
  } //addTeam

  modifyTeam(oldTeam, newTeam) {
    var tempTeamAry = this.state.myTeams.slice();
    var oldTeamIdx = _.indexOf(tempTeamAry, oldTeam);
    tempTeamAry[oldTeamIdx] = newTeam;
    this.setState({
      myTeams: tempTeamAry,
      tmWindowVisible: false
    });
  }

  modifyGame(oldGame, newGame) {
    var tempGameAry = this.state.myGames.slice();
    var oldGameIdx = _.findIndex(tempGameAry, function (o) {
       return gameEqual(o, oldGame)
     });
    tempGameAry[oldGameIdx] = newGame;
    this.setState({
      myGames: tempGameAry,
      gmWindowVisible: false
    });
  }

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

  openTeamForEdit(item) {
    this.setState({
      editWhichTeam: item,
      tmAddOrEdit: 'edit'
    });
    this.openTeamAddWindow();
  }

  openGameForEdit(item) {
    this.setState({
      editWhichGame: item,
      gmAddOrEdit: 'edit'
    });
    this.openGameAddWindow();
  }

  onLoadTeamInModal() {
    this.setState({
      editWhichTeam: null
    });
  }

  onLoadGameInModal() {
    this.setState({
      editWhichGame: null
    });
  }

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

    $('select').formSelect(); //initialize all dropdowns
    $('.fixed-action-btn').floatingActionButton(); //initialize floating button
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
      filteredGames = myGames.slice(); // don't filter games
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
      filteredTeams = myTeams.slice(); // don't filter teams
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
      filteredGames = _.orderBy(filteredGames, function(item) {
        return item.round;
      }, 'asc'); // order array
    }

    //make a react element for each item in the lists
    filteredTeams=filteredTeams.map(function(item, index) {
      return(
        <TeamListEntry key = {index}
          singleItem = {item}
          whichItem =  {item}
          onDelete = {this.deleteTeam}
          onOpenTeam = {this.openTeamForEdit}
        />
      ) // return
    }.bind(this)); //filteredTeams.map
    filteredGames=filteredGames.map(function(item, index) {
      return(
        <GameListEntry key = {index}
          singleItem = {item}
          whichItem =  {item}
          onDelete = {this.deleteGame}
          onOpenGame = {this.openGameForEdit}
        />
      ) // return
    }.bind(this)); //filteredGames.map

    //need to make a deep copy of this object
    //to prevent player stats from updating before I tell them to
    var gameToLoadCopy = this.state.editWhichGame == null ? null : $.extend(true, {}, this.state.editWhichGame);

    return(
      <div className="application">
        <div className="interface">
          <AddTeamModal
            teamToLoad = {this.state.editWhichTeam}
            onLoadTeamInModal = {this.onLoadTeamInModal}
            addOrEdit = {this.state.tmAddOrEdit}
            addTeam = {this.addTeam}
            modifyTeam = {this.modifyTeam}
            forceReset = {this.state.forceResetForms}
            onForceReset = {this.onForceReset}
          />
          <AddGameModal
            // gameToLoad = {this.state.editWhichGame}
            gameToLoad = {gameToLoadCopy}
            onLoadGameInModal = {this.onLoadGameInModal}
            addOrEdit = {this.state.gmAddOrEdit}
            addGame = {this.addGame}
            modifyGame = {this.modifyGame}
            teamData = {myTeams.slice()} //copy array to prevent unwanted state updates
            forceReset = {this.state.forceResetForms}
            onForceReset = {this.onForceReset}
          />

          <div className="row">
            <div id="main-window" className="col s12 m12 l8">
              <HeaderNav
                orderBy = {this.state.orderBy}
                orderDir =  {this.state.orderDir}
                onReOrder = {this.reOrder}
                onSearch= {this.searchLists}
                setPane = {this.setPane}
                whichPaneActive = {activePane}
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
            </div>
            <div id="stat-sidebar" className="col l4 hide-on-med-and-down">
              <StatSidebar
                standings = {getSmallStandings(myTeams, myGames)}
              />
            </div>

          </div>
        </div>{/* interface */}
      </div>
    );
  } //render
};//MainInterface

ReactDOM.render(
  <MainInterface />,
  document.getElementById('statsInterface')
); //render
