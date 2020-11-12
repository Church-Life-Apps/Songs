import { IonContent, IonPage, IonItem, IonLabel, IonList, IonSearchbar } from '@ionic/react';
import { render } from '@testing-library/react';
import { forceUpdate } from 'ionicons/dist/types/stencil-public-runtime';
import React, { useState } from 'react';
import './Components.css';


interface SearchViewProps
{
  setSongNumber: (_: number) => void
  setVisibleViewer: (_: string) => void
  lyricsOnlyMode: boolean
}

interface Song
{
  title: string,
  author: string,
  songNumber: number
}

/**
 * Search View.
 */
const SearchView: React.FC<SearchViewProps> = (props) => {
  const [searchString, setSearchString] = useState<string>();

  let songs;

  try 
  {
    songs = require("../resources/Songs_&_Hymns_Of_Life/BlackBookSongList.json");
    console.log(songs.songs);
  }
  catch (e)
  {
    console.log(e);
    throw e;
  }

  return (
    <IonPage>
      <IonContent>

        <IonSearchbar
          type="search"
          value={searchString}
          placeholder="Search for a song"
          onIonChange={(e) => setSearchString(e.detail.value!.toString())}
        ></IonSearchbar>

        <IonList id="searchList">
          {FilterSongsList(searchString, songs.songs)}
        </IonList>
      </IonContent>
    </IonPage>
  );

  function FilterSongsList(searchString: any, songs: Song[])
  {
    let GenerateIonItem = (song: Song) => {
      return <IonItem key={song.songNumber}><IonLabel onClick={(e) => UpdateParentState(song.songNumber)}>{song.songNumber}. {song.title} ({song.author})</IonLabel></IonItem>;
    };

    if (searchString === undefined || typeof(searchString) !== "string" || searchString.trim() === "" )
    {
      return songs.map(GenerateIonItem);
    }

    searchString = searchString.trim().toLowerCase();
    let searchNumber = Number(searchString);

    if (!isNaN(searchNumber))
    {
      if (searchNumber - 1 >= songs.length)
      {
        return;
      }
      return GenerateIonItem(songs[searchNumber - 1]);
    }

    let searchTerms: string[] = searchString.split(" ");
    
    let matches: Map<number, number> = new Map();

    songs.forEach((song: Song) => {
      let titleWords = new Set(song.title.toLowerCase().split(" "));
      let matchCount: number = (new Set([...searchTerms].filter((i: string) => titleWords.has(i)))).size;
      matches.set(song.songNumber, matchCount)
    })

    console.log(searchString);

    let matchesSorted = Array.from(matches.entries()).sort((a, b) => b[1] - a[1]).filter((s) => s[1] > 0);

    console.log(matchesSorted);

    return matchesSorted.map((s) => GenerateIonItem(songs[s[0]-1]));
  }

  function UpdateParentState(songNumber: number)
  {
    props.setSongNumber(songNumber);
    if (props.lyricsOnlyMode)
    {
      props.setVisibleViewer("lyrics");
    }
    else
    {
      props.setVisibleViewer("songs");
    }
  }
};


export default SearchView;
