import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import "./Components.css";
import MusicViewer from "./MusicViewer";
import { getSongbookById, makeThreeDigits, Songbook, SongViewMode } from "../utils/SongUtils";
import { IonToggle } from "@ionic/react";
import { isDesktop } from "../utils/PlatformUtils";
//Import Event tracking
import { triggerSongView } from "../tracking/EventFunctions";
import { useParams } from "react-router";

const imageSuffix = ".png";
const alt = "No Song Found";

const songsWithTwoTunes = [156, 216, 278, 478];

// Props are kind of like the parameters for the constructor of this class.
interface MusicViewProps {
  songNumber: number;
  setMusicPageUrl: Dispatch<SetStateAction<string>>;
}

/**
 * Song Viewer React Functional Component.
 */
const MusicView: React.FC<MusicViewProps> = (props: MusicViewProps) => {
  const widthPixels = isDesktop() ? window.innerWidth / 2 : window.innerWidth;
  const [secondTune, setSecondTune] = useState<boolean>(false);
  const [width] = useState<number>(widthPixels);
  // Natural size of the music image while the full-screen viewer is open, undefined when closed.
  const [viewerImageSize, setViewerImageSize] = useState<{ width: number; height: number }>();
  const [songbook, setSongbook] = useState<Songbook>();
  const { bookId } = useParams<{ bookId: string }>();

  // Probably update this behavior later if other hymnals have songs with 2 tunes also.
  const songHasTwoTunes = songsWithTwoTunes.includes(props.songNumber) && bookId === "shl";
  const secondTuneSuffix = songHasTwoTunes && secondTune ? "-B" : "";

  const url = songbook?.musicUrl + makeThreeDigits(props.songNumber) + secondTuneSuffix + imageSuffix;
  useEffect(() => {
    props.setMusicPageUrl(url);
  });

  useEffect(() => {
    triggerSongView(props.songNumber, SongViewMode.Music);
  }, [props.songNumber]);

  useEffect(() => {
    getSongbookById(bookId).then(book => {
      setSongbook(book);
    });
  }, [bookId]);

  // Close the viewer when the song or tune changes.
  useEffect(() => {
    setViewerImageSize(undefined);
  }, [url]);

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
        // Tap or click the music to open it full screen, where it can be zoomed.
        onClick={e => {
          const img = e.currentTarget;
          if (img.naturalWidth > 0) {
            setViewerImageSize({ width: img.naturalWidth, height: img.naturalHeight });
          }
        }}
        src={url}
        alt={alt}
      />

      {viewerImageSize && (
        <MusicViewer
          src={url}
          alt={alt}
          imageWidth={viewerImageSize.width}
          imageHeight={viewerImageSize.height}
          onClose={() => setViewerImageSize(undefined)}
        />
      )}
    </div>
  );
};

export default MusicView;
