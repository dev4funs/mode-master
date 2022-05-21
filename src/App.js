import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import "./styles.css";
import * as Tone from "tone";
import classNames from "classnames";
import { KEYS, MODELS } from "./static";
import { Description, NoteButton } from "./components";

Array.prototype.sample = function () {
  return this[Math.floor(Math.random() * this.length)];
};

// Function which creates a 12x16 grid,
// with our chosen notes on the vertical axis
const DEFAULT_OCTAVE = 4;
const DEFAULT_MODE = "Ionian";
const DEFAULT_NOTES = [
  "B",
  "A#",
  "A",
  "G#",
  "G",
  "F#",
  "F",
  "E",
  "D#",
  "D",
  "C#",
  "C",
].map((key) => key + DEFAULT_OCTAVE);

function GenerateGrid(notes) {
  const grid = [];
  console.log("show notes");
  for (let i = 0; i < 16; i++) {
    grid.push(notes.map((note) => ({ note: note, isActive: false })));
  }
  return grid;
}

Tone.Transport.bpm.value = 70;

//Notice the new PolySynth in use here, to support multiple notes at once
const synth = new Tone.PolySynth().toDestination();
// Our chosen octave for our five notes. Try changing this for higher or lower notes

export default function App() {
  // Sequencer ref for Sequencer Object
  const Sequencer = useRef(null);

  //string to handle the key of sequencer
  const [key, setKey] = useState("C");

  //number to handle the octave of sequencer
  const [octave, setOctave] = useState(DEFAULT_OCTAVE);

  //string to handle the octave of sequencer
  const [mode, setMode] = useState(DEFAULT_MODE);

  // A nested array of objects is not performant, but is easier to understand
  // performance is not an issue at this stage anyway
  const [grid, setGrid] = useState(GenerateGrid(DEFAULT_NOTES));

  // Boolean to handle if music is played or not
  const [isPlaying, setIsPlaying] = useState(false);

  // Used to visualize which column is making sound
  const [currentColumn, setCurrentColumn] = useState(null);

  const notes = useMemo(() => {
    const startIndex = KEYS.findIndex((item) => key === item);
    const notesWithOctave = KEYS.slice(startIndex).map((note) => note + octave);

    const octavePlusOne = parseInt(octave) + 1;
    console.log("octave", typeof octavePlusOne);
    const notesWithOctavePlusOne = KEYS.slice(0, startIndex).map(
      (note) => note + octavePlusOne
    );
    // return notesWithOctave.concat(notesWithOctavePlusOne).reverse();
    return notesWithOctave.concat(notesWithOctavePlusOne);
  }, [key, octave]);

  const notesOnMode = useMemo(() => {
    let index = 0;
    const _notes = notes.reverse();
    const _notesOnMode = [];
    for (const interval of MODELS[mode]) {
      _notesOnMode.push(_notes[index]);
      if (interval === "Whole") {
        index += 2;
      } else if (interval === "Half") {
        index++;
      }
    }
    console.log("show _notesOnMode", _notesOnMode);
    return _notesOnMode;
  }, [mode, notes]);

  useEffect(() => {
    console.log("show notes", notes);
    setGrid(GenerateGrid(notes));
  }, notes);

  // Updates our Grid's state
  // Written to be intelligble, not performant
  function handleNoteClick(clickedColumn, clickedNote) {
    // Shallow copy of our grid with updated isActive
    let updatedGrid = grid.map((column, columnIndex) =>
      column.map((cell, cellIndex) => {
        let cellCopy = cell;

        // Flip isActive for the clicked note-cell in our grid
        if (columnIndex === clickedColumn && cellIndex === clickedNote) {
          cellCopy.isActive = !cell.isActive;
        }

        return cellCopy;
      })
    );

    //Updates the grid with the new note toggled
    setGrid(updatedGrid);
  }

  const PlayMusic = async () => {
    //@param callback
    //@param "events" to send with callback
    //@param subdivision  to engage callback

    if (isPlaying) {
      // Turn of our player if music is currently playing
      setIsPlaying(false);
      setCurrentColumn(null);
      await Tone.Transport.stop();
      await Sequencer.current.stop();
      await Sequencer.current.clear();
      await Sequencer.current.dispose();
      return;
    }

    // Variable for storing our note in a appropriate format for our synth
    let music = [];

    grid.forEach((column) => {
      let columnNotes = [];
      column.map(
        (shouldPlay) =>
          //If isActive, push the given note, with our chosen octave
          shouldPlay.isActive && columnNotes.push(shouldPlay.note)
      );
      music.push(columnNotes);
    });

    // Starts our Tone context
    await Tone.start();

    Sequencer.current = new Tone.Sequence(
      (time, column) => {
        // Highlight column with styling
        setCurrentColumn(column);

        //Sends the active note to our PolySynth
        synth.triggerAttackRelease(music[column], "8n", time);
      },
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      "8n"
    );

    setIsPlaying(true);
    // Toggles playback of our musical masterpiece
    await Sequencer.current.start();
    await Tone.Transport.start();
  };

  const generateNotesBasedOnMode = useCallback(() => {
    // const _notes = notesOnMode.concat(["*", "*"]);
    const _notes = notesOnMode;

    const newGrid = GenerateGrid(notes);
    console.log(newGrid);
    const newNotes = [];
    for (let i = 0; i < 16; i++) {
      const randomNote = _notes.sample();
      if (randomNote !== "*") {
        const findIndex = newGrid[i].findIndex(
          ({ note }) => note === randomNote
        );
        newGrid[i][findIndex].isActive = true;
      }
      newNotes.push(randomNote);
    }
    setGrid(newGrid);
  }, [notesOnMode]);

  return (
    <div className="App">
      <div className="header">
        <div className="title">
          <h1>Mode Master</h1>
        </div>
        <div className="function-buttons">
          <label className="key-selector-label">Key</label>
          <select
            name="key"
            id="key"
            className="key-selector"
            onChange={(e) => {
              if (isPlaying) PlayMusic();
              setKey(e.target.value);
            }}
          >
            {KEYS.map((_key) => (
              <option value={_key} key={`key-${_key}`}>
                {_key}
              </option>
            ))}
          </select>
          <label className="key-selector-label">Octave</label>
          <select
            name="Octave"
            id="Octave"
            className="key-selector"
            defaultValue={DEFAULT_OCTAVE}
            onChange={(e) => {
              if (isPlaying) PlayMusic();
              setOctave(e.target.value);
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((octave) => (
              <option value={octave} key={`key-${octave}`}>
                {octave}
              </option>
            ))}
          </select>

          <label className="key-selector-label">Mode</label>
          <select
            name="mode"
            id="mode"
            className="key-selector"
            defaultValue={"Ionian"}
            onChange={(e) => {
              if (isPlaying) PlayMusic();
              setMode(e.target.value);
            }}
          >
            {Object.keys(MODELS).map((_mode) => (
              <option value={_mode} key={`key-${_mode}`}>
                {_mode}
              </option>
            ))}
          </select>
          <button
            className="generate-button"
            onClick={generateNotesBasedOnMode}
          >
            Generate
          </button>
          <button className="play-button" onClick={PlayMusic}>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>

      <div className="sequencer">
        <div className="key-column">
          {notes.map((note) => (
            <div
              key={`key+${note}`}
              className={
                notesOnMode.includes(note) ? "row-key-onMode" : "row-key"
              }
            >
              {note}
            </div>
          ))}
        </div>
        {grid.map((column, columnIndex) => (
          <div
            className={classNames("note-column", {
              "note-column--active": currentColumn === columnIndex,
            })}
            key={columnIndex + "column"}
          >
            {column.map(({ note, isActive }, noteIndex) => (
              <NoteButton
                note={note}
                isActive={isActive}
                onClick={() => handleNoteClick(columnIndex, noteIndex)}
                key={note + columnIndex}
              />
            ))}
          </div>
        ))}
      </div>

      <Description />
    </div>
  );
}

// const NoteButton = ({ note, isActive, ...rest }) => {
//   const classes = isActive ? "note note--active" : "note";
//   return (
//     <button className={classes} {...rest}>
//       {note}
//     </button>
//   );
// };
