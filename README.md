# Notice
I archive this repository and remove the addon from addon stores because I cannot spare my time maintaining the code.  
If you want to keep using this addon, feel free to fork or copy source code to build.

# Build note

__To build add-on for Chrome, follow the procedure below.__

0. If you haven't created PEM file yet, create it by packaging src folder with Chrome browser and rename it from src.pem to key.pem.
1. Copy and paste key.pem into ./src/
2. Zip the contents of src directory by:
  ```
  cd ./src
  zip multiwindow_chrome-0.0.x.zip -r ./*
  ```
3. Upload to [Chrome developer site](https://chrome.google.com/webstore/developer/dashboard)

__To build add-on for Firefox, follow the procedure below.__

0. If you haven't installed `web-ext` npm module yet, install it by `npm install -g web-ext`
1. Remove key.pem if it exists under ./src
2. Dispatch build tool
  ```
  web-ext build -s src
  ```
3. Upload add-on file to [AMO](https://addons.mozilla.org/ja/developers/addons)

## 3rd party library

[simplebar](https://github.com/Grsmto/simplebar/tree/971043679c8762339845fe0ab8b55566bfab4fab)

