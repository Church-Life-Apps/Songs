import React, { useEffect } from "react";
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
import { initGA, PageView } from "./tracking/GoogleAnalytics";
import { logPlatforms } from "./utils/PlatformUtils";
import { THEME_KEY, DARK_THEME, LIGHT_THEME } from "./utils/StorageUtils";

try {
  initGA();
  PageView();
} catch (e) {
  console.error(e);
}

const App: React.FC = () => {
  logPlatforms();

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const localStorageTheme = window.localStorage.getItem(THEME_KEY);

    if (localStorageTheme === DARK_THEME || (prefersDark.matches && localStorageTheme !== LIGHT_THEME)) {
      document.body.classList.toggle(DARK_THEME);
    }
  }, []);

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
