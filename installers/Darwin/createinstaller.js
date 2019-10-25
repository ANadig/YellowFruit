const createDMG = require('electron-installer-dmg');
const Path = require('path')

createDMG({
    appPath: Path.resolve(__dirname, '..', '..', 'dist', 'pkg', 'YellowFruit-darwin-x64'),
    title: 'YellowFruit-installer',
    out: Path.resolve(__dirname, '..', '..', 'dist', 'pkg'),
    icon: Path.resolve(__dirname, 'banana.icns'),
    name: 'YellowFruit',
    overwrite: true
  },
  function done (err) {
    console.log('something went wrong...');
    console.log(err);
  }
);
