import {
  IonContent,
  IonPage,
  IonItem,
  IonHeader,
  IonSearchbar,
} from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useState } from "react";
import SearchView from "../components/SearchView";
import { useHistory } from "react-router-dom";

/**
 * Book Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const BookPage: React.FC = () => {
  // the search string inputted by the user
  const [searchString, setSearchString] = useState<string>();

  let history = useHistory();

  let searchView = <SearchView searchString={searchString} />;
  let searchBar = RenderSearchBar();

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar backButtonOnClick={() => history.push("/")} />
      </IonHeader>
      <IonItem>{searchBar}</IonItem>
      <IonContent>{searchView}</IonContent>
    </IonPage>
  );

  function RenderSearchBar() {
    return (
      <IonSearchbar
        type="search"
        value={searchString}
        placeholder="Search for a song"
        onIonChange={(e) => setSearchString(e.detail.value!.toString())}
      ></IonSearchbar>
    );
  }
};

export default BookPage;
