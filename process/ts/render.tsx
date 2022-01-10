/***********************************************************
render.tsx
Andrew Nadig

Entry point for the Electron renderer process. Simply
creates a single instance of the MainInterface component,
which holds everything else within it
***********************************************************/

import * as React from "react";
import * as ReactDOM from "react-dom";

// // import * as electron from "electron";

import { MainInterface } from "./MainInterface";

ReactDOM.render(
  <MainInterface/>,
  document.getElementById('statsInterface')
);
