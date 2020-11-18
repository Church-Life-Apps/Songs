import { IonList, IonCard, IonCardTitle, IonCardSubtitle } from "@ionic/react";
import React from "react";
import { useParams, useHistory } from "react-router-dom";
import "./Components.css";

interface SearchViewProps {
  searchString: any;
}

interface Song {
  title: string;
  author: string;
  songNumber: number;
}

/**
 * Search View.
 */
const SearchView: React.FC<SearchViewProps> = (props) => {
  const { bookId } = useParams<{ bookId: string }>();
  let history = useHistory();
  let songs = require("../resources/Songs_&_Hymns_Of_Life/BlackBookSongList.json");

  return (
    <IonList id="searchList">
      {FilterSongsList(props.searchString, songs.songs)}
    </IonList>
  );

  function FilterSongsList(searchString: any, songs: Song[]) {
    let GenerateIonItem = (song: Song) => {
      return (
        <IonCard
          key={song.songNumber}
          onClick={() => {
            history.push(`/${bookId}/${song.songNumber}`);
          }}
        >
          <IonCardTitle>
            {song.songNumber}. {song.title}
          </IonCardTitle>
          <IonCardSubtitle>{song.author}</IonCardSubtitle>
        </IonCard>
      );
    };

    if (
      searchString === undefined ||
      typeof searchString !== "string" ||
      searchString.trim() === ""
    ) {
      return songs.map(GenerateIonItem);
    }

    searchString = searchString.trim().toLowerCase();
    let searchNumber = Number(searchString);

    if (!isNaN(searchNumber)) {
      if (searchNumber - 1 >= songs.length) {
        return;
      }
      return GenerateIonItem(songs[searchNumber - 1]);
    }

    let searchTerms: string[] = searchString.split(" ");

    let matches: Map<number, number> = new Map();

    songs.forEach((song: Song) => {
      let authorWords = new Set(song.author.toLowerCase().split(" "));
      let titleWords = new Set(song.title.toLowerCase().split(" "));
      let matchCount: number = new Set(
        [...searchTerms].filter(
          (i: string) => titleWords.has(i) || authorWords.has(i)
        )
      ).size;
      matches.set(song.songNumber, matchCount);
    });

    console.log(searchString);

    let matchesSorted = Array.from(matches.entries())
      .sort((a, b) => b[1] - a[1])
      .filter((s) => s[1] > 0);

    console.log(matchesSorted);

    return matchesSorted.map((s) => GenerateIonItem(songs[s[0] - 1]));
  }
};

export default SearchView;
