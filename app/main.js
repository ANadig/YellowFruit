var electron = require('electron');
var dialog = electron.dialog;
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var app = electron.app;
var ipc = electron.ipcMain;
var mainMenu, mainMenuTemplate, reportMenu, reportMenuTemplate;
var reportWindow;
var currentFile = '';
var unsavedData = false;

// load a new report window, or, if one is already open, reload and focus it
function showReportWindow() {
  if(reportWindow != undefined && !reportWindow.isDestroyed()) {
    reportWindow.focus();
    reportWindow.reload();
  }
  else {
    reportWindow = new BrowserWindow({
      width: 900,
      height: 500,
      show: false,
      autoHideMenuBar: true
    }); //reportWindow

    reportWindow.loadURL('file://' + __dirname + '/standings.html');
    reportWindow.setMenu(reportMenu);

    reportWindow.once('ready-to-show', function () {
      reportWindow.show();
    });
  }
} //showReportWindow

function exportHtmlReport(focusedWindow) {
  dialog.showSaveDialog(focusedWindow,
    {filters: [{name: 'HTML Webpages', extensions: ['html']}]},
    (fileName) => {
      if(fileName == undefined) { return; }
      var fileStart = fileName.replace(/.html/i, '');
      fileStart = fileStart.replace(/_(standings|individuals|games|teamdetail|playerdetail|rounds|statkey)/i, '');
      focusedWindow.webContents.send('exportHtmlReport', fileStart);
    }
  );
}

//open file dialog to save as a new file
function saveTournamentAs(focusedWindow) {
  dialog.showSaveDialog(focusedWindow,
    {filters: [{name: 'YellowFruit Tournament', extensions: ['yft']}]},
    (fileName) => {
      if(fileName != undefined) {
        currentFile = fileName;
        focusedWindow.webContents.send('saveTournamentAs', fileName);
      }
    }
  );
}

//called from the Save option. If it's a new tournament, redirect to Save As
function saveExistingTournament(focusedWindow) {
  if(currentFile != '') {
    focusedWindow.webContents.send('saveExistingTournament', currentFile);
  }
  else{
    saveTournamentAs(focusedWindow);
  }
}

//load a tournament from file
function openTournament(focusedWindow) {
  var willContinue = true, needToSave = false;
  if(unsavedData) {
    [willContinue, needToSave] = unsavedDataDialog(focusedWindow);
    if(needToSave) {
      saveExistingTournament(focusedWindow);
    }
  }
  if(willContinue) {
    dialog.showOpenDialog(focusedWindow,
      {filters: [{name: 'YellowFruit Tournament', extensions: ['yft']}]},
      (fileNameAry) => {
        if(fileNameAry != undefined) {
          currentFile = fileNameAry[0]; //open dialog doesn't allow selecting multiple files
          focusedWindow.webContents.send('openTournament', currentFile);
        }
      }
    );
  }
}

//close the current tournament and start a new one.
//prompt to save if there's unsaved data for a previously saved Tournament
//if there's data for a tournament that has never been saved, there's no option
//to save (because I can't figure out how to wait to clear out the data until
//after the user has finished Save As)
function newTournament(focusedWindow) {
  var willContinue = true, needToSave = false;
  if(unsavedData) {
    [willContinue, needToSave] = unsavedDataDialog(focusedWindow);
    if(needToSave) {
      saveExistingTournament(focusedWindow);
    }
  }
  if(willContinue) {
    focusedWindow.webContents.send('newTournament');
    currentFile = '';
    focusedWindow.setTitle('New Tournament');
  }
}

//generic dialog modal for unsaved data
function unsavedDataDialog(focusedWindow) {
  var choice, willContinue, needToSave;
  if(currentFile != '') {
    choice = dialog.showMessageBox(
      focusedWindow,
      {
        type: 'warning',
        buttons: ['&Save and continue', 'Continue without s&aving', 'Go ba&ck'],
        defaultId: 2,
        cancelId: 2,
        title: 'YellowFruit',
        message: 'You have unsaved data.'
      }
    );
    willContinue = choice != 2;
    needToSave = choice == 0;
  }
  else { //no current file
    choice = dialog.showMessageBox(
      focusedWindow,
      {
        type: 'warning',
        buttons: ['Continue without s&aving', 'Go ba&ck'],
        defaultId: 1,
        cancelId: 1,
        title: 'YellowFruit',
        message: 'You have unsaved data.'
      }
    );
    willContinue = choice == 0;
    needToSave = false;
  }
  return [willContinue, needToSave];
}

//initialize window and menubars and set up ipc listeners
app.on('ready', function() {
  var appWindow;
  appWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    show: false,
    title: 'YellowFruit - New Tournament'
  }); //appWindow

  appWindow.loadURL('file://' + __dirname + '/index.html');

  appWindow.once('ready-to-show', function() {
    appWindow.show();
  }); //ready-to-show

  appWindow.on('close', function(e) {
    var willClose = true;
    if(unsavedData) {
      var choice = dialog.showMessageBox(
        appWindow,
        {
          type: 'warning',
          buttons: ['Quit &Anyway', 'Go Ba&ck'],
          defaultId: 1,
          cancelId: 1,
          title: 'YellowFruit',
          message: 'You have unsaved data.'
        }
      );
      willClose = choice == 0;
    }
    if(willClose) {
      if(reportWindow != undefined && !reportWindow.isDestroyed()) {
        reportWindow.close();
      }
    }
    else {
      e.preventDefault();
    }
  });//appwindow.on close


  ipc.on('setWindowTitle', (event, arg) => {
    event.returnValue = '';
    appWindow.setTitle('YellowFruit - ' + arg);
  });

  ipc.on('unsavedData', (event, arg) => {
    event.returnValue = '';
    if(!appWindow.getTitle().endsWith('*')) {
      appWindow.setTitle(appWindow.getTitle() + '*');
    }
    unsavedData = true;
  });

  //if render process doesn't have a file to save to, redirect to save-as
  ipc.on('successfulSave', (event, arg) => {
    event.returnValue = '';
    unsavedData = false;
  });

  mainMenuTemplate = [
    {
      label: '&YellowFruit',
      submenu: [
        {
          label: 'View Full Report',
          accelerator: process.platform === 'darwin' ? 'Command+I': 'Ctrl+I',
          click(item, focusedWindow) {
            focusedWindow.webContents.send('compileStatReport');
            showReportWindow();
          }
        },
        {
          label: 'Export Full Report',
          accelerator: process.platform === 'darwin' ? 'Command+U': 'Ctrl+U',
          click(item, focusedWindow) {
            exportHtmlReport(focusedWindow);
          }
        },
        {type: 'separator'},
        {
          label: 'New Tournament',
          accelerator: process.platform === 'darwin' ? 'Command+N': 'Ctrl+N',
          click(item, focusedWindow) {
            newTournament(focusedWindow);
          }
        },
        {
          label: 'Open',
          accelerator: process.platform === 'darwin' ? 'Command+O': 'Ctrl+O',
          click(item, focusedWindow) {
            openTournament(focusedWindow);
          }
        },
        {
          label: 'Save As',
          click(item, focusedWindow) {
            saveTournamentAs(focusedWindow);
          }
        },
        {
          label: 'Save',
          accelerator: process.platform === 'darwin' ? 'Command+S':'Ctrl+S',
          click(item, focusedWindow) {
            saveExistingTournament(focusedWindow);
          }
        },
        {type: 'separator'},
        {role: 'close'},
      ]
    },{
      label: '&Edit',
      submenu: [
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {type: 'separator'},
        {
          label: 'Add Team',
          accelerator: process.platform === 'darwin' ? 'Command+T':'Ctrl+T',
          click(item,focusedWindow) {
            if (focusedWindow == appWindow) focusedWindow.webContents.send('addTeam');
          }
        },
        {
          label: 'Add Game',
          accelerator: process.platform === 'darwin' ? 'Command+G':'Ctrl+G',
          click(item,focusedWindow) {
            if (focusedWindow == appWindow) focusedWindow.webContents.send('addGame');
          }
        }
      ]
    },{
        label: '&View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click (item, focusedWindow) {
              if (focusedWindow) focusedWindow.reload()
            }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click (item, focusedWindow) {
              if (focusedWindow) focusedWindow.webContents.toggleDevTools()
            }
          }
        ]
      },
  ]; // mainMenuTemplate

  reportMenuTemplate = [
    {
      label: 'YellowFruit',
      submenu: [{role: 'close'}]
    }
  ]; // reportMenuTemplate

  mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  reportMenu = Menu.buildFromTemplate(reportMenuTemplate);
  // Menu.setApplicationMenu(mainMenu);
  appWindow.setMenu(mainMenu);

}); //app is ready
