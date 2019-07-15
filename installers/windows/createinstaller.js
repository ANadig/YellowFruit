const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')

  return Promise.resolve({
    appDirectory: 'dist/pkg/YellowFruit-win32-x64',
    authors: 'Andrew Nadig',
    noMsi: true,
    iconUrl: 'C:/Users/awnad/Desktop/banana.ico',
    outputDirectory: 'C:/Users/awnad/Desktop/YellowFruit-installer-win',
    exe: 'YellowFruit.exe',
    setupExe: 'Install-YellowFruit.exe'
  });
}
