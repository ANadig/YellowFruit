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
const nativeImage = electron.nativeImage;
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

const APP_ICON = process.platform === 'darwin' ?
  nativeImage.createFromPath(Path.resolve(__dirname, '..', 'icons', 'banana.icns')) :
  Path.resolve(__dirname, '..', 'icons', 'banana.ico');

var autoSaveIntervalId = null; // store the interval ID from setInterval here
const AUTO_SAVE_TIME_MS = 300000; //number of milliseconds between auto-saves. 300000=5min
var mainMenu, mainMenuTemplate, reportMenu, reportMenuTemplate, helpMenu, helpMenuTemplate;
var mainWindow; // keep track of which window is the main app window
var reportWindow; //to show the html report
var helpWindows  = {
  searchTips: null,
  keyboardShortcuts: null,
  aboutYF: null
}; // list of windows opened from the help menu
var currentFile = '';
var unsavedData = false;
// error message to show on startup
var startupMsg;

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
  try {
    let loadConfig = fs.readFileSync(userConfigFile, 'utf8');
    currentUserConfig = JSON.parse(loadConfig);
  }
  catch (e){
     setupUserConfig();
     startupMsg = 'User configuration file was corrupted and has been reset to application defaults.'
  }
}
else {
  setupUserConfig();
}

//Define parts of the menu that don't change dynamically here
const YF_MENU = {
  label: '&YellowFruit',
  submenu: [
    {
      label: 'View Full Report',
      accelerator: 'CmdOrCtrl+I',
      click(item, focusedWindow) {
        if(mainWindow) {
          mainWindow.webContents.send('compileStatReport');
          showReportWindow();
        }
      }
    },
    {
      label: 'Export Full Report',
      accelerator: 'CmdOrCtrl+U',
      click(item, focusedWindow) { exportHtmlReport(); }
    },
    {
      label: 'Export SQBS',
      click(item, focusedWindow) { trySqbsExport(); }
    },
    {
      label: 'Export QBJ 2.1',
      click(item, focusedWindow) { exportQbj(); }
    },
    {type: 'separator'},
    {
      label: 'New Tournament',
      accelerator: 'CmdOrCtrl+N',
      click(item, focusedWindow) { newTournament(); }
    },
    {
      label: 'Import Neg5 (QBJ 1.2)',
      click(item, focusedWindow) { importQbj(); }
    },
    {
      label: 'Import Rosters from SQBS',
      click(item, focusedWindow) { importRosters(); }
    },
    {
      label: 'Merge Tournament',
      click(item, focusedWindow) { mergeTournament(); }
    },
    {
      label: 'Open',
      accelerator: 'CmdOrCtrl+O',
      click(item, focusedWindow) { openTournament(); }
    },
    {
      label: 'Save As',
      click(item, focusedWindow) { saveTournamentAs(); }
    },
    {
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click(item, focusedWindow) { saveExistingTournament(false); }
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
        showHelpWindow('searchTips', 'searchtips.html', 550, 350);
      }
    },
    {
      label: 'Keyboard Shortcuts',
      click (item, focusedWindow) {
        showHelpWindow('keyboardShortcuts', 'keyboardshortcuts.html', 700, 400);
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
        showHelpWindow('aboutYF', 'AboutYF.html', 350, 200);
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
        if (mainWindow) mainWindow.reload()
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
      if(mainWindow) { mainWindow.webContents.send('openRptConfig'); }
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
            if(mainWindow) { toggleAutoSave(item.checked, mainWindow); }
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

/**
 * Toggle show year, show JV, etc.
 * @param  {MenuItem} item which menu item was selected
 */
function toggleFormSetting(item) {
  updateUserConfig(item.id, item.checked);
  if(mainWindow) {
    mainWindow.webContents.send('toggleFormField', item.id, item.checked);
  }
}

/**
 * Automatically save every 5 minutes.
 */
function startAutoSaveTimer() {
  autoSaveIntervalId = setInterval(() => {
    saveExistingTournament(true);
  }, AUTO_SAVE_TIME_MS);
}

/**
 * Turn auto-save on or off
 * @param  {boolean} autoSave whether autosave is being turned on or off
 */
function toggleAutoSave(autoSave) {
  if(!autoSave && autoSaveIntervalId != null) {
    clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
  }
  else {
    startAutoSaveTimer();
  }
}

/**
 * Set the user config file to the default values
 */
function setupUserConfig() {
  currentUserConfig = DEFAULT_USER_CONFIG;
  fs.writeFile(userConfigFile, JSON.stringify(currentUserConfig), 'utf8', function(err) {
    if (err) { console.log(err); }
  });
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
      icon: APP_ICON
    }); //reportWindow

    reportWindow.loadURL('file://' + __dirname + '/report_load_spinner.html');
    reportWindow.setMenu(reportMenu);
    reportWindow.once('ready-to-show', function () { reportWindow.show(); });
  }
} //showReportWindow

/**
 * A small child window that loads one of the pages launched from the help menus
 * @param  {string} windowName    which window to load
 * @param  {string} fileName      html page to load in the window
 * @param  {number} width         window width. Default: 550
 * @param  {number} height        window height. Default: 350
 */
function showHelpWindow(windowName, fileName, width, height) {
  if(!mainWindow) { return; }
  // if this window is already open, don't open another one.
  if(helpWindows[windowName]) {
    helpWindows[windowName].focus();
    return;
  }
  let helpWindow = new BrowserWindow({
    width: width == null ? 550 : width,
    height: height == null ? 350 : height,
    show: false,
    parent: mainWindow,
    modal: false,
    autoHideMenuBar: true,
    icon: APP_ICON,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true }
  });
  helpWindows[windowName] = helpWindow;
  helpWindow.loadURL('file://' + __dirname + '/' + fileName);
  helpWindow.setMenu(helpMenu);
  helpWindow.once('ready-to-show', ()=>{ helpWindow.show(); });
  helpWindow.once('close', () => {
    mainWindow.focus(); //prevent flickering
    helpWindows[windowName] = null;
  });
}

/**
 * Save the html stat reports to their respective files. The use can select any page of
 * the existing report in order to replace all pages with new verions.
 */
function exportHtmlReport() {
  if(!mainWindow) { return; }
  let fileName = dialog.showSaveDialogSync(mainWindow,
    { filters: [{ name: 'HTML Webpages', extensions: ['html'] }] });
  if(fileName == undefined) { return; }
  let fileStart = fileName.replace(/.html/i, '');
  fileStart = fileStart.replace(/_(standings|individuals|games|teamdetail|playerdetail|rounds|statkey)/i, '');
  mainWindow.webContents.send('exportHtmlReport', fileStart);
}

/**
 * Attempt to export the data in SQBS format. The user may then get a warning
 * about losing some of their data
 */
function trySqbsExport() {
  if(!mainWindow) { return; }
  mainWindow.webContents.send('trySqbsExport');
}

/**
 * Prompt the user to select a file name for the SQBS file export
 */
function sqbsSaveDialog() {
  if(!mainWindow) { return; }
  let fileName = dialog.showSaveDialogSync(mainWindow,
    { filters: [{ name: 'SQBS tournament', extensions: ['sqbs'] }] });
  if(fileName === undefined) { return; }
  mainWindow.webContents.send('exportSqbsFile', fileName);
}

/**
 * Export tournament in the tournament schema format
 */
function exportQbj() {
  if(!mainWindow) { return; }
  let fileName = dialog.showSaveDialogSync(mainWindow,
    { filters: [{ name: 'Tournament Schema', extensions: ['qbj'] }] });
  if(fileName === undefined) { return; }
  mainWindow.webContents.send('exportQbj', fileName);
}

/**
 * Prompt the user to select a file name for the data
 */
function saveTournamentAs() {
  if(!mainWindow) { return; }
  let fileName = dialog.showSaveDialogSync(mainWindow,
    { filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }] });
  if(fileName !== undefined) {
    currentFile = fileName;
    mainWindow.webContents.send('saveTournamentAs', fileName);
  }
}

/**
 * Save the tournament. If we don't have a file to save to, redirect to Save As
 * @param  {boolean} fromAutoSave  whether the auto-save functionality is
 *                                 calling this
 */
function saveExistingTournament(fromAutoSave) {
  if(!mainWindow) { return; }
  if(currentFile != '') {
    mainWindow.webContents.send('saveExistingTournament', currentFile);
  }
  else if(!fromAutoSave) {
    saveTournamentAs(mainWindow);
  }
}

/**
 * Load a tournament from a file.
 */
function openTournament() {
  if(!mainWindow) { return; }

  let willContinue = true, needToSave = false;
  if(unsavedData) {
    [willContinue, needToSave] = unsavedDataDialog('Open Tournament');
    if(needToSave) {
      saveExistingTournament(false);
    }
  }
  if(willContinue) {
    let fileNameAry = dialog.showOpenDialogSync(mainWindow,
      {filters: [{name: 'YellowFruit Tournament', extensions: ['yft']}]});
    if(fileNameAry !== undefined) {
      currentFile = fileNameAry[0]; //open dialog doesn't allow selecting multiple files
      mainWindow.webContents.send('openTournament', currentFile);
      unsavedData = false;
    }
  }
}

/**
 * Close the current tournament and start a new one. Prompt to save the tournament if
 * there's unsaved data. If it would be a Save As situation, force to user to go back.
 */
function newTournament() {
  if(!mainWindow) { return; }

  let willContinue = true, needToSave = false;
    if(unsavedData) {
      [willContinue, needToSave] = unsavedDataDialog('Create New Tournament');
      if(needToSave) {
        saveExistingTournament(false);
      }
    }
    if(willContinue) {
      mainWindow.webContents.send('newTournament');
      currentFile = '';
      mainWindow.setTitle('YellowFruit - New Tournament');
      unsavedData = false;
    }
}

/**
 * Prompt the user to select a QBJ file to import
 */
function importQbj() {
  if(!mainWindow) { return; }

  let willContinue = true, needToSave = false;
  if(unsavedData) {
    [willContinue, needToSave] = unsavedDataDialog('Import QBJ');
    if(needToSave) {
      saveExistingTournament(false);
    }
  }
  if(willContinue) {
    let fileNameAry = dialog.showOpenDialogSync(mainWindow,
      { filters: [{ name: 'Tournament Schema', extensions: ['qbj'] }] });
    if(fileNameAry !== undefined) {
      mainWindow.setTitle('YellowFruit - New Tournament');
      unsavedData = false;
      mainWindow.webContents.send('importQbj', fileNameAry[0]);
    }
  }
}

/**
 * Prompt the user to select an SQBS file from which to import rosters
 */
function importRosters() {
  if(!mainWindow) { return; }
  let fileNameAry = dialog.showOpenDialogSync(mainWindow,
    { filters: [{ name: 'SQBS Tournament', extensions: ['sqbs'] }] });
  if(fileNameAry !== undefined) {
    mainWindow.webContents.send('importRosters', fileNameAry[0]);
  }
}

/**
 * Prompt the user to select a YellowFruit tournament to merge into the current file
 */
function mergeTournament() {
  if(!mainWindow) { return; }

  let fileNameAry = dialog.showOpenDialogSync(mainWindow,
    { filters: [{ name: 'YellowFruit Tournament', extensions: ['yft'] }] });
  if(fileNameAry !== undefined) {
    mainWindow.webContents.send('mergeTournament', fileNameAry[0]);
  }
}

/**
 * Generic dialog modal for warning the user there is unsaved data.
 * @param  {string} caption              caption for the window title
 * @return {string[]}                    [willContinue, needToSave]: whether we're going
 *                                       to keep going with whatever the user tried to
 *                                       do, and whether we need to save the file before
 *                                       continuing
 */
 function unsavedDataDialog(caption) {
   if(!mainWindow) { return; }
   let choice, willContinue, needToSave;
   if(currentFile != '') {
     choice = dialog.showMessageBoxSync(
       mainWindow,
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
       mainWindow,
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

/**
 * Set which report configuration is currently being used
 * @param {MenuItem} item          which configuration was selectd
 */
function setActiveRptConfig(item) {
  if(mainWindow) {
    mainWindow.webContents.send('setActiveRptConfig', item.id);
  }
}

/**
 * Show a modal window with some message
 * @param  {string} type    window type (error, warning, info)
 * @param  {string} title   window title
 * @param  {string} message message text
 */
function genericModal(type, title, message) {
  dialog.showMessageBox(
    mainWindow,
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
  let splashWindow = new BrowserWindow({
    width: 346,
    height: 149,
    frame: false,
    show: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true }
  });
  splashWindow.loadURL('file://' + __dirname + '/splash.html');
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  let appWindow = new BrowserWindow({
    width: 1250,
    height: 710,
    show: false,
    title: 'YellowFruit - New Tournament',
    icon: APP_ICON,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true }
  }); //appWindow

  mainWindow = appWindow;
  appWindow.loadURL('file://' + __dirname + '/index.html');

  appWindow.once('ready-to-show', function() {
    splashWindow.close();
    appWindow.show();

    appWindow.webContents.send('loadReportConfig', process.env.NODE_ENV);

    for(let conf in currentUserConfig) {
      appWindow.webContents.send('toggleFormField', conf, currentUserConfig[conf]);
    }

    if(currentUserConfig.autoSave) { startAutoSaveTimer(); }

    const argsLength = process.defaultApp ? 3 : 2;
    if (process.argv.length >= argsLength) {
      appWindow.webContents.send('openTournament', process.argv[argsLength-1]);
    }

    if(startupMsg) {
      genericModal('info', 'YellowFruit', startupMsg);
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
    genericModal(type, title, message);
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
        click (item, focusedWindow) { setActiveRptConfig(item); }
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
        click (item, focusedWindow) { setActiveRptConfig(item); }
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
