# Songs

An Ionic web, Android and iOS app for the SHL and SFG songbooks

The web app is hosted here: https://church-life-apps.github.io/

# Contributors

Feel free to contact us if you are interested in contributing, or just send a PR! Let us know if you have any questions or run into any problems.

# Developer Setup

[Clone](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository-from-github/cloning-a-repository) this repository.

To setup your develop environment, you will need to install [Node.js](https://nodejs.org/en/download/), and run `npm install` in the root directory.

Use `npm start` to run the app locally.

You can also use `npm run build` to build the app, and `npm run test` to run tests.

# Android

To run the app on Android app follow these steps:

1. Install Android Studio if you don't already have it.
2. Navigate to the root directory of this project in Terminal.
3. To open Android studio with the project code, run `npx cap open android`
4. To update the Android version with the latest web code, run `ionic capacitor sync`.
5. Connect your Android device to your computer, or with an emulator run the app.

Info came from this guide: https://www.joshmorony.com/deploying-capacitor-applications-to-android-development-distribution/
We will need it when we want to deploy to Google Play store.

# iOS

To run the app on iPhone follow these steps:

1. Requires an IPhone and a Mac computer.
2. Install XCode if you don't already have it (XCode only runs on Mac).
   - Install cocoapods, and create a user to be a developer (don't need paid developer account yet)
3. Navigate to the root directory of this project in Terminal.
4. To open XCode with the project code, run `npx cap open ios`
5. To update the iOS version with the latest web code, run `ionic capacitor sync`.
6. Connect your iPhone to your computer, or with an simulator run the app.
