import React from 'react';
import { IonApp, IonContent } from '@ionic/react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import HomePage from './pages/HomePage';
import SearchView from './components/SearchView';
import SongViewer from './components/SongViewer';
import LyricViewer from './components/LyricViewer';
import SettingsView from './components/SettingsView';

const App: React.FC = () => (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={HomePage} exact/>
        <Route path="/song" component={SongViewer} />
      </Switch>
    </BrowserRouter>
);

export default App;
