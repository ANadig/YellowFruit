# YellowFruit
QB Stats App

Like SQBS but better?

Pre-built Windows installers are provided at https://github.com/ANadig/YellowFruit/releases.

## Running/Building

1. Ensure node and npm are installed on your system
2. Download and unzip latest source code archive from https://github.com/ANadig/YellowFruit/releases. Alternatively clone this git repository and checkout a tag. 
3. In unzipped directory, run `npm ci && npm run build`  
4. YF can be started with `npm start`

### (Optional) Packaging

1. Run `npm run pack-linux` if on Linux, `npm run pack-darwin` if on Mac, or `npm run pack-win` if on Windows
2. Application can be found in `dist/pkg/YellowFruit-{linux,darwin,win32}-x64`  
3. (Optional on Windows) Create an installer with `npm run make-winstaller`

## Developing

1. Ensure node and npm are installed on your system
2. Clone this git repository  
3. Run `npm install` in the cloned directory
4. Run `npm run watch` to open YellowFruit in live-rebuilding mode 
