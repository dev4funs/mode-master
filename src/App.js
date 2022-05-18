import React, { useState, useEffect } from "react";
import "./styles.css";
import * as Tone from "tone";
import classNames from "classnames";
import { KEYS, MODELS } from "./static";
// Function which creates a 5x8 grid,
// with our chosen notes on the vertical axis
function GenerateGrid() {
  const grid = [];
  for (let i = 0; i < 16; i++) {
    let column = [
      { note: "B", isActive: false },
      { note: "A#", isActive: false },
      { note: "A", isActive: false },
      { note: "G#", isActive: false },
      { note: "G", isActive: false },
      { note: "F#", isActive: false },
      { note: "F", isActive: false },
      { note: "E", isActive: false },
      { note: "D#", isActive: false },
      { note: "D", isActive: false },
      { note: "C#", isActive: false },
      { note: "C", isActive: false },
    ];
    grid.push(column);
  }
  return grid;
}

//Notice the new PolySynth in use here, to support multiple notes at once
const synth = new Tone.PolySynth().toDestination();

// Our chosen octave for our five notes. Try changing this for higher or lower notes
const CHOSEN_OCTAVE = "5";

export default function App() {
  // A nested array of objects is not performant, but is easier to understand
  // performance is not an issue at this stage anyway
  const [grid, setGrid] = useState(GenerateGrid());

  // Boolean to handle if music is played or not
  const [isPlaying, setIsPlaying] = useState(false);

  // Used to visualize which column is making sound
  const [currentColumn, setCurrentColumn] = useState(null);

  //string to handle the key of sequencer
  const [key, setKey] = useState("C");

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
    // Variable for storing our note in a appropriate format for our synth
    let music = [];

    grid.forEach((column) => {
      let columnNotes = [];
      column.map(
        (shouldPlay) =>
          //If isActive, push the given note, with our chosen octave
          shouldPlay.isActive &&
          columnNotes.push(shouldPlay.note + CHOSEN_OCTAVE)
      );
      music.push(columnNotes);
    });

    // Starts our Tone context
    await Tone.start();

    // Tone.Sequence()
    //@param callback
    //@param "events" to send with callback
    //@param subdivision  to engage callback
    const Sequencer = new Tone.Sequence(
      (time, column) => {
        // Highlight column with styling
        setCurrentColumn(column);

        //Sends the active note to our PolySynth
        synth.triggerAttackRelease(music[column], "8n", time);
      },
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      "8n"
    );

    if (isPlaying) {
      // Turn of our player if music is currently playing
      setIsPlaying(false);
      setCurrentColumn(null);

      await Tone.Transport.stop();
      await Sequencer.stop();
      await Sequencer.clear();
      await Sequencer.dispose();

      return;
    }

    setIsPlaying(true);
    // Toggles playback of our musical masterpiece
    await Sequencer.start();
    await Tone.Transport.start();
  };

  useEffect(() => {
    console.log(key);
  }, [key]);

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
              setKey(e.target.value);
            }}
          >
            {KEYS.map((_key) => (
              <option value={_key} key={`key-${_key}`}>
                {_key}
              </option>
            ))}
          </select>
          <button className="generate-button" onClick={() => {}}>
            Generate
          </button>
          <button className="play-button" onClick={() => PlayMusic()}>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>

      <div className="sequencer">
        <div className="key-column">
          {grid[0].map(({ note, isActive }, noteIndex) => (
            <div key={`key+${note}`} className="row-key">
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
    </div>
  );
}

const NoteButton = ({ note, isActive, ...rest }) => {
  const classes = isActive ? "note note--active" : "note";
  return (
    <button className={classes} {...rest}>
      {note}
    </button>
  );
};
