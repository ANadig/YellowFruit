document.getElementById("version").innerHTML = "First";

// import * as electron from "electron";

try {
    document.getElementById("version").innerHTML = "After require";
    const ipc = electron.ipcRenderer;
    document.getElementById("version").innerHTML = "After IPC";
}
catch (e) {}

// // try {
// // import { electron } from "electron";

// // document.getElementById("version").innerHTML = "First";
// //     // let electron;

// //       // electron = require('electron');
// //       const electronRemote = require('@electron/remote/main');
// //       document.getElementById("version").innerHTML = "After require";
// //     const ipc = electron.ipcRenderer;
// //     const {app} = electronRemote;
// //     document.getElementById("version").innerHTML = "AFter remote and ipcrenderer";
// //     document.getElementById("version").innerHTML = app.getVersion();
// //     document.getElementById("version").innerHTML = "Do I run? " + app.getVersion();
// //     } catch (e) {
// //       document.getElementById("version").innerHTML = "From JS: " + JSON.stringify(e) + e;
// //     }