import React, { useEffect, useState } from "react";
import "./Components.css";
import { getSongbookById, makeThreeDigits, Songbook, SongViewMode } from "../utils/SongUtils";
import { IonToggle } from "@ionic/react";
import { isBrowser } from "../utils/PlatformUtils";
//Import Event tracking
import { triggerSongView } from "../tracking/EventFunctions";
import { useParams } from "react-router";

const imageSuffix = ".png";
const alt = "No Song Found";

const songsWithTwoTunes = [156, 216, 278, 478];

// Props are kind of like the parameters for the constructor of this class.
interface MusicViewProps {
  songNumber: number;
}

/**
 * Song Viewer React Functional Component.
 */
const MusicView: React.FC<MusicViewProps> = (props: MusicViewProps) => {
  const widthPixels = isBrowser() ? window.innerWidth / 2 : window.innerWidth;
  const [secondTune, setSecondTune] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(widthPixels);
  const [zoomed, setZoomed] = useState<boolean>(false);
  const [songbook, setSongbook] = useState<Songbook>();
  const { bookId } = useParams<{ bookId: string }>();

  // Probably update this behavior later if other hymnals have songs with 2 tunes also.
  const songHasTwoTunes = songsWithTwoTunes.includes(props.songNumber) && bookId === "shl";
  const secondTuneSuffix = songHasTwoTunes && secondTune ? "-B" : "";

  const url = songbook?.musicUrl + makeThreeDigits(props.songNumber) + secondTuneSuffix + imageSuffix;

  useEffect(() => {
    triggerSongView(props.songNumber, SongViewMode.Music);
  }, [props.songNumber]);

  useEffect(() => {
    getSongbookById(bookId).then((book) => {
      setSongbook(book);
    });
  }, [bookId]);

  // TODO: Add Pinch and Zoom to image.
  return (
    <div>
      {/* Second Tune Toggler  */}
      {songHasTwoTunes && (
        <div id="songToggler">
          <IonToggle checked={secondTune} onIonChange={() => setSecondTune(!secondTune)} />
        </div>
      )}

      {/* image */}
      <img
        style={{ width: width }}
        id="musicView"
        className="song-page-center"
        onDoubleClick={() => {
          if (zoomed) {
            setWidth(widthPixels);
          } else setWidth(widthPixels * 2);
          setZoomed(!zoomed);
        }}
        src={url}
        alt={alt}
      />
    </div>
  );
};

export default MusicView;
