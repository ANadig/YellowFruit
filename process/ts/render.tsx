/***********************************************************
render.tsx
Andrew Nadig

Entry point for the Electron renderer process. Simply
creates a single instance of the MainInterface component,
which holds everything else within it
***********************************************************/

import * as React from "react";
import * as ReactDOM from "react-dom/client";

import { MainInterface } from "./MainInterface";

const root = ReactDOM.createRoot(document.getElementById('statsInterface'));
root.render(<MainInterface/>);
