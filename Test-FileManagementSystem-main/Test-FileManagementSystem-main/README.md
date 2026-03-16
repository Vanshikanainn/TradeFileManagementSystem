package.json



{
  "name": "file-management-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "ng serve --no-open",
    "start:open": "ng serve --open",
    "build": "ng build",
    "prod": "ng serve --configuration production"
  },
  "dependencies": {
    "@angular/animations": "17.3.0",
    "@angular/cdk": "^17.3.10",
    "@angular/common": "17.3.0",
    "@angular/compiler": "17.3.0",
    "@angular/core": "17.3.0",
    "@angular/forms": "17.3.0",
    "@angular/material": "^17.3.10",
    "@angular/platform-browser": "17.3.0",
    "@angular/platform-browser-dynamic": "17.3.0",
    "@angular/router": "17.3.0",
    "rxjs": "~7.8.1",
    "tslib": "^2.6.2",
    "zone.js": "~0.14.2"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "17.3.0",
    "@angular/cli": "17.3.0",
    "@angular/compiler-cli": "17.3.0",
    "saas": "^1.0.0",
    "typescript": "~5.3.3"
  }
}


npm install @angular/animations@17 @angular/common@17 @angular/compiler@17 @angular/core@17 @angular/forms@17 @angular/platform-browser@17 @angular/platform-browser-dynamic@17 @angular/router@17 rxjs@~7.8.1 zone.js@~0.14.0 tslib


npm install -D @angular/cli@17 @angular/compiler-cli@17 @angular-devkit/build-angular@17 typescript@~5.3.3

npm install
npm start

# Install Angular Material + CDK (same major version as your Angular core)
npm install @angular/material@17 @angular/cdk@17

# Make sure Sass is available to process styles.scss
npm install -D sass
