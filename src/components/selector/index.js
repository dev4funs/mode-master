import React from "react";
import "./index.css";
const Selector = ({ label, options, onChange, defaultValue, children }) => {
  return (
    <div className="selector">
      <div className="selector-label">{label}</div>
      <select
        name="Octave"
        id="Octave"
        className="selector-input"
        defaultValue={defaultValue}
        onChange={onChange}
      >
        {options &&
          options.map((item) => (
            <option value={item} key={`key-${item}`}>
              {item}
            </option>
          ))}
        {children}
      </select>
    </div>
  );
};

export default Selector;
