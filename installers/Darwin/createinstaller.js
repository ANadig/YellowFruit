var createDMG = require('electron-installer-dmg');

createDMG({
    appPath: 'C:/YellowFruit packages/Darwin/YellowFruit-darwin-x64',
    out: 'C:/Users/awnad/Desktop',
    name: 'YellowFruit',
    overwrite: true
  },
  function done (err) {
    console.log('something went wrong...');
    console.log(err);
  }
);
