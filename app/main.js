/**********************************************************************
  YellowFruit, a quiz bowl statkeeping application

  Andrew Nadig
  2019

  Main.js
  The Electron main process.

************************************************************************/
const electron = require('electron');
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const app = electron.app;
const ipc = electron.ipcMain;
const shell = electron.shell;
require('dotenv').config(); //set NODE_ENV via the .env file in the root directory
const Path = require('path');
const fs = require('fs');
const _ = require('lodash');
const USER_CONFIG_FOLDER_PROD = Path.resolve(app.getPath('appData'), 'YellowFruit');
const USER_CONFIG_FILE_PROD = Path.resolve(USER_CONFIG_FOLDER_PROD, 'UserConfig.json');
const OLD_USER_CONFIG_FOLDER_PROD = Path.resolve(__dirname,  '..', '..', '..', '..', '..', 'YellowFruitUserData');
const OLD_USER_CONFIG_FILE_PROD = Path.resolve(OLD_USER_CONFIG_FOLDER_PROD, 'UserConfig.json');
const USER_CONFIG_FILE_DEV = Path.resolve(__dirname, '..', 'data', 'UserConfig.json');
const DEFAULT_USER_CONFIG = {
  autoSave: true,
  showYearField: true,
  showSmallSchool: true,
  showJrVarsity: true,
  showUGFields: true,
  showD2Fields: true
};
var currentUserConfig;
const OLD_CUSTOM_RPT_CONFIG_FILE_PROD = Path.resolve(OLD_USER_CONFIG_FOLDER_PROD, 'CustomRptConfig.json');
const CUSTOM_RPT_CONFIG_FILE_PROD = Path.resolve(USER_CONFIG_FOLDER_PROD, 'CustomRptConfig.json');

var autoSaveIntervalId = null; // store the interval ID from setInterval here
const AUTO_SAVE_TIME_MS = 300000; //number of milliseconds between auto-saves. 300000=5min
var mainMenu, mainMenuTemplate, reportMenu, reportMenuTemplate, helpMenu, helpMenuTemplate;
var mainWindowId; // keep track of which window is the main app window
var reportWindow; //to show the html report
var helpWindow; // one of several possible modals from the Help menu
var currentFile = '';
var unsavedData = false;

/*---------------------------------------------------------
This if statement is part of the app packaging code. I
didn't write it.
---------------------------------------------------------*/
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent(app)) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

// copy user config over to new location
if(process.env.NODE_ENV != 'development') {
  if(!fs.existsSync(USER_CONFIG_FOLDER_PROD)) {
    fs.mkdirSync(USER_CONFIG_FOLDER_PROD);
  }
  if(fs.existsSync(OLD_USER_CONFIG_FILE_PROD)) {
    fs.copyFileSync(OLD_USER_CONFIG_FILE_PROD, USER_CONFIG_FILE_PROD);
    fs.unlinkSync(OLD_USER_CONFIG_FILE_PROD);
  }
  if(fs.existsSync(OLD_CUSTOM_RPT_CONFIG_FILE_PROD)) {
    fs.copyFileSync(OLD_CUSTOM_RPT_CONFIG_FILE_PROD, CUSTOM_RPT_CONFIG_FILE_PROD);
    fs.unlinkSync(OLD_CUSTOM_RPT_CONFIG_FILE_PROD);
  }
}

// load user configuration
var userConfigFile = process.env.NODE_ENV != 'development' ? USER_CONFIG_FILE_PROD : USER_CONFIG_FILE_DEV;
if(fs.existsSync(userConfigFile)) {
  var loadConfig = fs.readFileSync(userConfigFile, 'utf8');
  currentUserConfig = JSON.parse(loadConfig);
}
else {
  currentUserConfig = DEFAULT_USER_CONFIG;
  fs.writeFile(userConfigFile, JSON.stringify(currentUserConfig), 'utf8', function(err) {
    if (err) { console.log(err); }
  });
}

//Define parts of the menu that don't change dynamically here
const YF_MENU = {
  label: '&YellowFruit',
  submenu: [
    {
      label: 'View Full Report',
      accelerator: 'CmdOrCtrl+I',
      click(item, focusedWindow) {
        if(isMainWindow(focusedWindow)) {
          focusedWindow.webContents.send('compileStatReport');
        }
        showReportWindow();
      }
    },
    {
      label: 'Export Full Report',
      accelerator: 'CmdOrCtrl+U',
      click(item, focusedWindow) { exportHtmlReport(focusedWindow); }
    },
    {
      label: 'Export SQBS',
      click(item, focusedWindow) { trySqbsExport(focusedWindow); }
    },
    {
      label: 'Export QBJ 2.1',
      click(item, focusedWindow) { exportQbj(focusedWindow); }
    },
    {type: 'separator'},
    {
      label: 'New Tournament',
      accelerator: 'CmdOrCtrl+N',
      click(item, focusedWindow) { newTournament(focusedWindow); }
    },
    {
      label: 'Import Neg5 (QBJ 1.2)',
      click(item, focusedWindow) { importQbj(focusedWindow); }
    },
    {
      label: 'Import Rosters from SQBS',
      click(item, focusedWindow) { importRosters(focusedWindow); }
    },
    {
      label: 'Merge Tournament',
      click(item, focusedWindow) { mergeTournament(focusedWindow); }
    },
    {
      label: 'Open',
      accelerator: 'CmdOrCtrl+O',
      click(item, focusedWindow) { openTournament(focusedWindow); }
    },
    {
      label: 'Save As',
      click(item, focusedWindow) { saveTournamentAs(focusedWindow); }
    },
    {
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click(item, focusedWindow) { saveExistingTournament(focusedWindow); }
    },
    {type: 'separator'},
    {role: 'close'},
  ]
};
const EDIT_MENU_MACOS = {
  label: 'Edit',
  submenu: [
    {role: 'undo'},
    {role: 'redo'},
    {type: 'separator'},
    {role: 'cut'},
    {role: 'copy'},
    {role: 'paste'},
    {role: 'selectAll'}
  ]
}
const HELP_MENU = {
  label: '&Help',
  submenu: [
    {
      label: 'Search Tips',
      click (item, focusedWindow) {
        showHelpWindow(focusedWindow, 'searchtips.html', 550, 380);
      }
    },
    {
      label: 'Keyboard Shortcuts',
      click (item, focusedWindow) {
        showHelpWindow(focusedWindow, 'keyboardshortcuts.html', 700, 400);
      }
    },
    {
      label: 'More Tips',
      click (item, focusedWindow) {
          shell.openExternal('https://yellowfruit.app');
      }
    },
    {
      label: 'Get Help',
      click (item, focusedWindow) {
        shell.openExternal('https://hsquizbowl.org/forums/viewtopic.php?f=123&t=22932');
      }
    },
    {type: 'separator'},
    {
      label: 'About YellowFruit',
      click (item, focusedWindow) {
        showHelpWindow(focusedWindow, 'AboutYF.html', 375, 225);
      }
    }
  ]
};
const DEV_TOOLS_MENU = {
  label: 'Dev Tools',
  submenu:[
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
};
const REPORT_SUBMENU_STUB = [
  {
    label: 'Report Settings...',
    click (item, focusedWindow) {
      if(isMainWindow(focusedWindow)) { focusedWindow.webContents.send('openRptConfig'); }
    }
  },
  {type: 'separator'}
];

/*---------------------------------------------------------
Build the main menu.
---------------------------------------------------------*/
function buildMainMenu(rptSubMenu) {
  mainMenuTemplate = [YF_MENU];
  if(process.platform === 'darwin') { mainMenuTemplate.push(EDIT_MENU_MACOS); }
  mainMenuTemplate = mainMenuTemplate.concat([
    {
      label: '&Report Layout',
      submenu: rptSubMenu
    },
    {
      label: 'S&ettings',
      submenu: [
        {
          label: 'Track Year/Grade',
          id: 'showYearField',
          type: 'checkbox',
          checked: currentUserConfig.showYearField,
          click (item, focusedWindow) { toggleFormSetting(item); }
        },
        {
          label: 'Track Small School',
          id: 'showSmallSchool',
          type: 'checkbox',
          checked: currentUserConfig.showSmallSchool,
          click (item, focusedWindow) { toggleFormSetting(item); }
        },
        {
          label: 'Track Junior Varsity',
          id: 'showJrVarsity',
          type: 'checkbox',
          checked: currentUserConfig.showJrVarsity,
          click (item, focusedWindow) { toggleFormSetting(item); }
        },
        {
          label: 'Track Undergrad',
          id: 'showUGFields',
          type: 'checkbox',
          checked: currentUserConfig.showUGFields,
          click (item, focusedWindow) { toggleFormSetting(item); }
        },
        {
          label: 'Track Division 2',
          id: 'showD2Fields',
          type: 'checkbox',
          checked: currentUserConfig.showD2Fields,
          click (item, focusedWindow) { toggleFormSetting(item); }
        },
        {type: 'separator'},
        {
          label: 'Auto-save every 5 minutes',
          id: 'autoSave',
          type: 'checkbox',
          checked: currentUserConfig.autoSave,
          click(item, focusedWindow) {
            updateUserConfig(item.id, item.checked);
            var mainWin = BrowserWindow.fromId(mainWindowId);
            if(mainWin) { toggleAutoSave(item.checked, mainWin); }
          }
        }
      ]
    },
    HELP_MENU
  ]); // mainMenuTemplate

  // Add dev tools if not in production
  if(process.env.NODE_ENV == 'development') {
    mainMenuTemplate.push(DEV_TOOLS_MENU);
  }
  return Menu.buildFromTemplate(mainMenuTemplate);
}

/*---------------------------------------------------------
Whether this window is the main app window, not a help
window, etc.
---------------------------------------------------------*/
function isMainWindow(focusedWindow) {
  return focusedWindow && focusedWindow.id == mainWindowId;
}

/*---------------------------------------------------------
Toggle show year, show JV, etc.
---------------------------------------------------------*/
function toggleFormSetting(item) {
  updateUserConfig(item.id, item.checked);
  var mainWin = BrowserWindow.fromId(mainWindowId);
  if(mainWin) {
    mainWin.webContents.send('toggleFormField', item.id, item.checked);
  }
}

/*---------------------------------------------------------
Automatically save every 5 minutes.
---------------------------------------------------------*/
function startAutoSaveTimer(focusedWindow) {
  autoSaveIntervalId = setInterval(() => {
    saveExistingTournament(focusedWindow, true);
  }, AUTO_SAVE_TIME_MS);
}

/*---------------------------------------------------------
turn auto-save on or off
---------------------------------------------------------*/
function toggleAutoSave(autoSave, focusedWindow) {
  if(!autoSave && autoSaveIntervalId != null) {
    clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
  }
  else {
    startAutoSaveTimer(focusedWindow);
  }
}

/*---------------------------------------------------------
Write the specified item to the user config settings
---------------------------------------------------------*/
function updateUserConfig(item, value) {
  currentUserConfig[item] = value;
  fs.writeFile(userConfigFile, JSON.stringify(currentUserConfig), 'utf8', function(err) {
    if (err) { console.log(err); }
  });
}

/*---------------------------------------------------------
Load a new report window, or, if one is already open,
reload and focus it.
---------------------------------------------------------*/
function showReportWindow() {
  if(reportWindow != undefined && !reportWindow.isDestroyed()) {
    reportWindow.loadURL('file://' + __dirname + '/report_load_spinner.html');
    reportWindow.focus();
  }
  else {
    reportWindow = new BrowserWindow({
      width: 1050,
      height: 550,
      show: false,
      icon: Path.resolve(__dirname, '..', 'icons', 'banana.ico')
    }); //reportWindow

    reportWindow.loadURL('file://' + __dirname + '/report_load_spinner.html');
    reportWindow.setMenu(reportMenu);
    reportWindow.once('ready-to-show', function () { reportWindow.show(); });
  }
} //showReportWindow

/*---------------------------------------------------------
A small modal that loads one of the pages launched from
the Help menu
---------------------------------------------------------*/
function showHelpWindow(focusedWindow, fileName, width, height) {
  if(!focusedWindow) { return; }
  helpWindow = new BrowserWindow({
    width: width == null ? 550 : width,
    height: height == null ? 350 : height,
    show: false,
    parent: focusedWindow,
    modal: true,
    autoHideMenuBar: true,
    icon: Path.resolve(__dirname, '..', 'icons', 'banana.ico'),
    webPreferences: { nodeIntegration: true }
  });
  helpWindow.loadURL('file://' + __dirname + '/' + fileName);
  helpWindow.setMenu(helpMenu);
  helpWindow.once('ready-to-show', ()=>{ helpWindow.show(); });
  helpWindow.once('close', () => { focusedWindow.focus(); }); //prevent flickering
}

/**
 * Save the html stat reports to their respective files. The use can select any page of
 * the existing report in order to replace all pages with new verions.
 * @param  {BrowserWindow} focusedWindow window to attach modals to
 */
function exportHtmlReport(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }
  let fileName = dialog.showSaveDialogSync(focusedWindow,
    { filters: [{ name: 'HTML Webpages', extensions: ['html'] }] });
  if(fileName == undefined) { return; }
  let fileStart = fileName.replace(/.html/i, '');
  fileStart = fileStart.replace(/_(standings|individuals|games|teamdetail|playerdetail|rounds|statkey)/i, '');
  focusedWindow.webContents.send('exportHtmlReport', fileStart);
}

/*---------------------------------------------------------
Attempt to export the data in SQBS format. The user may
then get a warning about losing some of their data.
---------------------------------------------------------*/
function trySqbsExport(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }
  focusedWindow.webContents.send('trySqbsExport');
}

/**
 * Prompt the user to select a file name for the SQBS file export
 * @param  {BrowserWindow} focusedWindow window to attach modals to
 */
function sqbsSaveDialog(focusedWindow) {
  let fileName = dialog.showSaveDialogSync(focusedWindow,
    { filters: [{ name: 'SQBS tournament', extensions: ['sqbs'] }] });
  if(fileName === undefined) { return; }
  focusedWindow.webContents.send('exportSqbsFile', fileName);
}

/**
 * Export tournament in the tournament schema format
 * @param  {BrowserWindow} focusedWindow window to attach modals to
 */
function exportQbj(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }
  let fileName = dialog.showSaveDialogSync(focusedWindow,
    { filters: [{ name: 'Tournament Schema', extensions: ['qbj'] }] });
  if(fileName === undefined) { return; }
  focusedWindow.webContents.send('exportQbj', fileName);
}

/**
 * Prompt the user to select a file name for the data
 * @param  {BrowserWindow} focusedWindow window to attach modals to
 */
function saveTournamentAs(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }
  let fileName = dialog.showSaveDialogSync(focusedWindow,
    { filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }] });
  if(fileName !== undefined) {
    currentFile = fileName;
    focusedWindow.webContents.send('saveTournamentAs', fileName);
  }
}

/*---------------------------------------------------------
Save the tournament. If we don't have a file to save to,
redirect to Save As.
---------------------------------------------------------*/
function saveExistingTournament(focusedWindow, fromAutoSave) {
  if(currentFile != '') {
    var mainWin = BrowserWindow.fromId(mainWindowId);
    if(mainWin) { mainWin.webContents.send('saveExistingTournament', currentFile); }
  }
  else if(!fromAutoSave && isMainWindow(focusedWindow)) {
    saveTournamentAs(focusedWindow);
  }
}

/**
 * Load a tournament from a file.
 * @param  {BrowserWindow} focusedWindow window to attach modals to
 */
function openTournament(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }

  let willContinue = true, needToSave = false;
  if(unsavedData) {
    [willContinue, needToSave] = unsavedDataDialog(focusedWindow, 'Open Tournament');
    if(needToSave) {
      saveExistingTournament(focusedWindow);
    }
  }
  if(willContinue) {
    let fileNameAry = dialog.showOpenDialogSync(focusedWindow,
      {filters: [{name: 'YellowFruit Tournament', extensions: ['yft']}]});
    if(fileNameAry !== undefined) {
      currentFile = fileNameAry[0]; //open dialog doesn't allow selecting multiple files
      focusedWindow.webContents.send('openTournament', currentFile);
      unsavedData = false;
    }
  }
}

/**
 * Close the current tournament and start a new one. Prompt to save the tournament if
 * there's unsaved data. If it would be a Save As situation, force to user to go back.
 * @param  {BrowserWindow} focusedWindow window to attach modals to
 */
function newTournament(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }

  let willContinue = true, needToSave = false;
    if(unsavedData) {
      [willContinue, needToSave] = unsavedDataDialog(focusedWindow, 'Create New Tournament');
      if(needToSave) {
        saveExistingTournament(focusedWindow);
      }
    }
    if(willContinue) {
      focusedWindow.webContents.send('newTournament');
      currentFile = '';
      focusedWindow.setTitle('YellowFruit - New Tournament');
      unsavedData = false;
    }
}

/**
 * Prompt the user to select a QBJ file to import
 * @param  {BrowserWindow} focusedWindow window to attach modals to
 */
function importQbj(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }

  let willContinue = true, needToSave = false;
  if(unsavedData) {
    [willContinue, needToSave] = unsavedDataDialog(focusedWindow, 'Import QBJ');
    if(needToSave) {
      saveExistingTournament(focusedWindow);
    }
  }
  if(willContinue) {
    let fileNameAry = dialog.showOpenDialogSync(focusedWindow,
      { filters: [{ name: 'Tournament Schema', extensions: ['qbj'] }] });
    if(fileNameAry !== undefined) {
      focusedWindow.setTitle('YellowFruit - New Tournament');
      unsavedData = false;
      focusedWindow.webContents.send('importQbj', fileNameAry[0]);
    }
  }
}

/**
 * Prompt the user to select an SQBS file from which to import rosters
 * @param  {BrowserWindow} focusedWindow parent window to attach modals to
 */
function importRosters(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }
  let fileNameAry = dialog.showOpenDialogSync(focusedWindow,
    { filters: [{ name: 'SQBS Tournament', extensions: ['sqbs'] }] });
  if(fileNameAry !== undefined) {
    focusedWindow.webContents.send('importRosters', fileNameAry[0]);
  }
}

/**
 * Prompt the user to select a YellowFruit tournament to merge into the current file
 * @param  {BrowserWindow} focusedWindow parent window to attach modals to
 */
function mergeTournament(focusedWindow) {
  if(!isMainWindow(focusedWindow)) { return; }

  let fileNameAry = dialog.showOpenDialogSync(focusedWindow,
    { filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }] });
  if(fileNameAry !== undefined) {
    focusedWindow.webContents.send('mergeTournament', fileNameAry[0]);
  }
}

/**
 * Generic dialog modal for warning the user there is unsaved data.
 * @param  {BrowserWindow} focusedWindow parent window of the modal dialog
 * @param  {string} caption              caption for the window title
 * @return {string[]}                    [willContinue, needToSave]: whether we're going
 *                                       to keep going with whatever the user tried to
 *                                       do, and whether we need to save the file before
 *                                       continuing
 */
 function unsavedDataDialog(focusedWindow, caption) {
   let choice, willContinue, needToSave;
   if(currentFile != '') {
     choice = dialog.showMessageBoxSync(
       focusedWindow,
       {
         type: 'warning',
         buttons: ['&Save and continue', 'Continue without s&aving', 'Go ba&ck'],
         defaultId: 2,
         cancelId: 2,
         title: 'YellowFruit - ' + caption,
         message: 'You have unsaved data.',
         normalizeAccessKeys: true
       }
     );
     willContinue = choice != 2;
     needToSave = choice == 0;
   }
   else { //no current file
     choice = dialog.showMessageBoxSync(
       focusedWindow,
       {
         type: 'warning',
         buttons: ['Continue without s&aving', 'Go ba&ck'],
         defaultId: 1,
         cancelId: 1,
         title: 'YellowFruit',
         message: 'You have unsaved data.',
         normalizeAccessKeys: true
       }
     );
     willContinue = choice == 0;
     needToSave = false;
   }
   return [willContinue, needToSave];
 }

/*---------------------------------------------------------
Set which report configuration is currently being used
---------------------------------------------------------*/
function setActiveRptConfig(item, focusedWindow) {
  var mainWin = BrowserWindow.fromId(mainWindowId);
  if(mainWin) { mainWin.webContents.send('setActiveRptConfig', item.id); }
}

/*---------------------------------------------------------
Once there are no windows open, close the app entirely.
---------------------------------------------------------*/
app.on('window-all-closed', function() {
  app.quit();
});

/*---------------------------------------------------------
Prevent malicious actors from opening aribitrary web pages
from within the app, although that shouldn't be possible
in the first place.
---------------------------------------------------------*/
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

/*---------------------------------------------------------
Initialize window and menubars, and set up ipc listeners
---------------------------------------------------------*/
app.on('ready', function() {
  var splashWindow = new BrowserWindow({
    width: 346,
    height: 149,
    frame: false,
    show: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: true }
  });
  splashWindow.loadURL('file://' + __dirname + '/splash.html');
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  var icon = process.platform === 'darwin' ?
    Path.resolve(__dirname, '..', 'icons', 'banana.icns') :
    Path.resolve(__dirname, '..', 'icons', 'banana.ico');

  var appWindow;
  appWindow = new BrowserWindow({
    width: 1250,
    height: 710,
    show: false,
    title: 'YellowFruit - New Tournament',
    icon: icon,
    webPreferences: { nodeIntegration: true }
  }); //appWindow

  mainWindowId = appWindow.id;
  appWindow.loadURL('file://' + __dirname + '/index.html');

  appWindow.once('ready-to-show', function() {
    splashWindow.close();
    appWindow.show();

    appWindow.webContents.send('loadReportConfig', process.env.NODE_ENV);

    for(var conf in currentUserConfig) {
      appWindow.webContents.send('toggleFormField', conf, currentUserConfig[conf]);
    }

    if(currentUserConfig.autoSave) { startAutoSaveTimer(appWindow); }

    var argsLength = process.defaultApp ? 3 : 2;
    if (process.argv.length >= argsLength) {
      appWindow.webContents.send('openTournament', process.argv[argsLength-1]);
    }
  }); //ready-to-show

  /*---------------------------------------------------------
  Warn user if exiting with unsaved data.
  ---------------------------------------------------------*/
  appWindow.on('close', function(e) {
    let willClose = true;
    if(unsavedData) {
      let choice = dialog.showMessageBoxSync(
        appWindow,
        {
          type: 'warning',
          buttons: ['Quit &Anyway', 'Go Ba&ck'],
          defaultId: 1,
          cancelId: 1,
          title: 'YellowFruit',
          message: 'You have unsaved data.',
          normalizeAccessKeys: true
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

  /*---------------------------------------------------------
  Set the window title to the name of the file.
  ---------------------------------------------------------*/
  ipc.on('setWindowTitle', (event, arg) => {
    event.returnValue = '';
    appWindow.setTitle('YellowFruit - ' + arg);
  });

  /*---------------------------------------------------------
  Add an asterisk to the window title when there's unsaved
  data.
  ---------------------------------------------------------*/
  ipc.on('unsavedData', (event, arg) => {
    event.returnValue = '';
    if(!appWindow.getTitle().endsWith('*')) {
      appWindow.setTitle(appWindow.getTitle() + '*');
    }
    unsavedData = true;
  });

  /*---------------------------------------------------------
  Called after data is saved to a file.
  ---------------------------------------------------------*/
  ipc.on('successfulSave', (event, arg) => {
    event.returnValue = '';
    unsavedData = false;
  });

  /*---------------------------------------------------------
  Load the html report once the renderer process has finished
  writing the files
  ---------------------------------------------------------*/
  ipc.on('statReportReady', (event) => {
    event.returnValue = '';
    if(reportWindow != undefined) {
      reportWindow.focus();
      reportWindow.loadURL('file://' + __dirname + '/standings.html');
    }
  });

  /*---------------------------------------------------------
  Make the user confirm that they want to delete a division
  ---------------------------------------------------------*/
  ipc.on('tryDivDelete', (event, message) => {
    event.returnValue = '';
    let choice = dialog.showMessageBoxSync(
      appWindow,
      {
        type: 'warning',
        buttons: ['&Delete', 'Go Ba&ck'],
        defaultId: 1,
        cancelId: 1,
        title: 'YellowFruit',
        message: 'Are you sure you want to delete this division?\n\n' + message,
        normalizeAccessKeys: true
      }
    );
    if(choice == 0) { event.sender.send('confirmDivDeletion'); }
    else if(choice == 1) { event.sender.send('cancelDivDeletion'); }
  }); //on tryDivDelete

  /*---------------------------------------------------------
  When the user tries to delete a game, prompt them to
  confirm that they want to do this.
  ---------------------------------------------------------*/
  ipc.on('tryGameDelete', (event, message) => {
    event.returnValue = '';
    let choice = dialog.showMessageBoxSync(
      appWindow,
      {
        type: 'warning',
        buttons: ['&Delete', 'Go Ba&ck'],
        defaultId: 1,
        cancelId: 1,
        title: 'YellowFruit',
        message: 'Are you sure you want to delete this game?\n\n' + message,
        normalizeAccessKeys: true
      }
    );
    if(choice == 0) { event.sender.send('confirmGameDeletion'); }
    else if(choice == 1) { event.sender.send('cancelGameDeletion'); }
  });//on tryGameDelete

  /*---------------------------------------------------------
  Export data in SQBS format
  ---------------------------------------------------------*/
  ipc.on('exportSqbsFile', (event) => {
    event.returnValue = '';
    sqbsSaveDialog(appWindow);
  });

  /*---------------------------------------------------------
  If the user has games that can't be converted correctly
  to SQBS format, alert them to that fact.
  ---------------------------------------------------------*/
  ipc.on('confirmLossySQBS', (event, badGameAry) => {
    event.returnValue = '';
    let choice = dialog.showMessageBoxSync(
      appWindow,
      {
        type: 'warning',
        buttons: ['Export &Anyway', '&Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'YellowFruit',
        message: 'The following games exceed SQBS\'s limit of eight players per team:\n\n' +
          badGameAry.join('\n') +
          '\n\nOnly the first eight players in these games will be used.',
        normalizeAccessKeys: true
      }
    );
    if(choice == 0) { sqbsSaveDialog(appWindow); }
  });//on confirmLossySQBS

  /*---------------------------------------------------------
  Prompt the user to confirm that they want to delete this
  report configuration
  ---------------------------------------------------------*/
  ipc.on('rptDeletionPrompt', (event, rptName) => {
    event.returnValue = '';
    let choice = dialog.showMessageBoxSync(
      appWindow,
      {
        type: 'warning',
        buttons: ['&Delete', 'Go Ba&ck'],
        defaultId: 1,
        cancelId: 1,
        title: 'YellowFruit',
        message: 'Are you sure you want to delete \"' + rptName + '\"?',
        normalizeAccessKeys: true
      }
    );
    if(choice == 0) { event.sender.send('rptDeleteConfirmation', rptName); }
  });

  /*---------------------------------------------------------
  Show errors that the render process catches
  ---------------------------------------------------------*/
  ipc.on('genericModal', (event, type, title, message, isFatal) => {
    event.returnValue = '';
    if(isFatal && reportWindow != undefined) {
      reportWindow.close();
    }
    dialog.showMessageBoxSync(
      appWindow,
      {
        type: type,
        buttons: ['&OK'],
        defaultID: 0,
        cancelId: 0,
        title: title,
        message: message,
        normalizeAccessKeys: true
      }
    );
  });

  /*---------------------------------------------------------
  Close whichever help window is open
  ---------------------------------------------------------*/
  ipc.on('closeHelpWindow', (event) => {
    event.returnValue = '';
    if(helpWindow != undefined) {
      helpWindow.close();
    }
  });

  /*---------------------------------------------------------
  Add items to the report menu corresponding to the available
  report configurations
  activeRpt will have its checked property set.
  ---------------------------------------------------------*/
  ipc.on('rebuildMenus', (event, releasedRptList, customRptList, activeRpt) => {
    event.returnValue = '';
    var rptSubMenu = REPORT_SUBMENU_STUB.slice();
    for(var r in releasedRptList) {
      rptSubMenu.push({
        label: r,
        id: r,
        type: 'radio',
        checked: r == activeRpt,
        click (item, focusedWindow) { setActiveRptConfig(item, focusedWindow); }
      });
    }
    var sortedRpts = _.orderBy(Object.keys(customRptList), [(r) => { return r.toLowerCase(); }]);
    for(var i in sortedRpts) {
      var r = sortedRpts[i];
      rptSubMenu.push({
        label: r,
        id: r,
        type: 'radio',
        checked: r == activeRpt,
        click (item, focusedWindow) { setActiveRptConfig(item, focusedWindow); }
      });
    }
    var newMainMenu = buildMainMenu(rptSubMenu);
    for(var conf in currentUserConfig) { // keep user settings in sync
      let item = newMainMenu.getMenuItemById(conf);
      item.checked = currentUserConfig[conf];
    }
    if(process.platform === 'darwin') { Menu.setApplicationMenu(newMainMenu); }
    else { appWindow.setMenu(newMainMenu); }
  }); //on rebuildMenus

  //set up the menu bars
  helpMenuTemplate = [
    {
      label: 'YellowFruit',
      submenu: [{role: 'close'}]
    }
  ]; // reportMenuTemplate
  reportMenuTemplate = [
    {
      label: 'YellowFruit',
      submenu: [
      {
        label: 'Print',
        accelerator: 'CmdOrCtrl+P',
        click (item, focusedWindow) {
          if(focusedWindow) focusedWindow.webContents.print({printBackgroud: true}); }
      },
      {role: 'close'}]
    }
  ];

  mainMenu = buildMainMenu(REPORT_SUBMENU_STUB);
  helpMenu = Menu.buildFromTemplate(helpMenuTemplate);
  reportMenu = Menu.buildFromTemplate(reportMenuTemplate);
  if(process.platform === 'darwin') { Menu.setApplicationMenu(mainMenu); }
  else { appWindow.setMenu(mainMenu); }
}); //app is ready


///////////////////////////////////////////////////////////////////////////
// Install code mostly taken from a tutorial
///////////////////////////////////////////////////////////////////////////


//things that happen during (windows) install
function handleSquirrelEvent(application) {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function(command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {
                detached: true
            });
        } catch (error) {}

        return spawnedProcess;
    };

    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            application.quit();
            return true;
    }
};
