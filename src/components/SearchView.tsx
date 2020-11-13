import { IonList, IonCard, IonCardTitle, IonCardSubtitle } from '@ionic/react';
import React from 'react';
import { PageViewMode } from '../utils/SongUtils';
import './Components.css';


interface SearchViewProps
{
  searchString: any
  setSongNumber: (_: number) => void
  setPageViewMode: (_: PageViewMode) => void
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
    <IonList id="searchList">
      {FilterSongsList(props.searchString, songs.songs)}
    </IonList>
  );

  function FilterSongsList(searchString: any, songs: Song[])
  {
    let GenerateIonItem = (song: Song) => {
      return (
        <IonCard
          key={song.songNumber}
          onClick={() => UpdateParentState(song.songNumber)}>
            <IonCardTitle>{song.songNumber}. {song.title}</IonCardTitle>
            <IonCardSubtitle>{song.author}</IonCardSubtitle>
        </IonCard>
      );
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
      let authorWords = new Set(song.author.toLowerCase().split(" "));
      let titleWords = new Set(song.title.toLowerCase().split(" "));
      let matchCount: number = (new Set([...searchTerms].filter((i: string) => titleWords.has(i) || authorWords.has(i)))).size;
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
    props.setPageViewMode(PageViewMode.Song);
  }
};


export default SearchView;
