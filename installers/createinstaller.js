const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const Path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')

  return Promise.resolve({
    appDirectory: Path.resolve(__dirname, '..', 'dist', 'pkg', 'YellowFruit-win32-x64'),
    authors: 'Andrew Nadig',
    noMsi: true,
    iconUrl: Path.resolve(__dirname, 'banana.ico'),
    outputDirectory: Path.resolve(__dirname, '..', 'dist', 'pkg'),
    exe: 'YellowFruit.exe',
    setupExe: 'Install-YellowFruit.exe'
  });
}
