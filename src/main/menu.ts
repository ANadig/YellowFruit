import { app, Menu, BrowserWindow, MenuItemConstructorOptions, dialog } from 'electron';
import {
  exportQbjFile,
  importQbjTeams,
  importSqbsTeams,
  launchSqbsExportWorkflow,
  promptForStatReportLocation,
  requestToSaveYftFile,
  tryFileSwitchAction,
  yftSaveAs,
} from './FileUtils';
import { FileSwitchActions } from '../SharedUtils';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  /** Parts of the file menu common to MacOS and Windows */
  readonly subMenuFileCommonElements: MenuItemConstructorOptions[] = [
    {
      label: '&Export Stat Report',
      accelerator: 'CmdOrCtrl+U',
      click: () => {
        promptForStatReportLocation(this.mainWindow);
      },
    },
    {
      label: 'QBJ Schema',
      submenu: [
        {
          label: 'Export QBJ',
          click: () => {
            exportQbjFile(this.mainWindow);
          },
        },
        {
          label: 'Open QBJ Tournament',
          click: () => {
            tryFileSwitchAction(this.mainWindow, FileSwitchActions.ImportQbjTournament);
          },
        },
        {
          label: 'Import Teams and Rosters Only',
          click: () => {
            importQbjTeams(this.mainWindow);
          },
        },
      ],
    },
    {
      label: 'SQBS',
      submenu: [
        {
          label: 'Export SQBS Files',
          click: () => {
            launchSqbsExportWorkflow(this.mainWindow);
          },
        },
        {
          label: 'Import Teams and Rosters',
          click: () => {
            importSqbsTeams(this.mainWindow);
          },
        },
      ],
    },
    {
      type: 'separator',
    },
    {
      label: '&New Tournament',
      accelerator: 'CmdOrCtrl+N',
      click: () => {
        tryFileSwitchAction(this.mainWindow, FileSwitchActions.NewFile);
      },
    },
    {
      label: '&Open',
      accelerator: 'CmdOrCtrl+O',
      click: () => {
        tryFileSwitchAction(this.mainWindow, FileSwitchActions.OpenYftFile);
      },
    },
    {
      label: '&Save',
      accelerator: 'CmdOrCtrl+S',
      click: () => {
        requestToSaveYftFile(this.mainWindow);
      },
    },
    {
      label: 'Save &As...',
      click: () => {
        yftSaveAs(this.mainWindow);
      },
    },
  ];

  readonly subMenuHelp: MenuItemConstructorOptions = {
    label: '&Help',
    submenu: [
      {
        label: 'About YellowFruit',
        click: () => {
          dialog.showMessageBoxSync(this.mainWindow, {
            title: 'About YellowFruit',
            message: `YellowFruit\n\nVersion ${app.getVersion()}`,
          });
        },
      },
    ],
  };

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      this.setupDevelopmentEnvironment();
    }

    const template = process.platform === 'darwin' ? this.buildDarwinTemplate() : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Electron',
      submenu: [
        {
          label: 'About YellowFruit',
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide YellowFruit',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuFile: DarwinMenuItemConstructorOptions = {
      label: 'File',
      submenu: this.subMenuFileCommonElements,
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true' ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuFile, subMenuEdit, subMenuView, subMenuWindow, this.subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: this.subMenuFileCommonElements.concat([
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            },
          },
        ]),
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'CmdOrCtrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  },
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                  },
                },
                {
                  label: 'Toggle &Developer Tools',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.webContents.toggleDevTools();
                  },
                },
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                  },
                },
              ],
      },
      this.subMenuHelp,
    ];

    return templateDefault;
  }
}
