import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import HomePage from "./pages/HomePage";
import BookPage from "./pages/BookPage";
import SongPage from "./pages/SongPage";
import { DbManager } from "./database/DbManager";
import { initGA, PageView } from "./tracking/GoogleAnalytics";

try {
  initGA();
  PageView();
} catch (e) {
  console.error(e);
}

export const AppName = "Hymnal App";

const App: React.FC = () => {
  DbManager.getInstance();
  return (
    <HashRouter>
      <Switch>
        <Route path="/" component={HomePage} exact />
        <Route path="/:bookId" component={BookPage} exact />
        <Route path="/:bookId/:songId" component={SongPage} exact />
      </Switch>
    </HashRouter>
  );
};

export default App;
