import "./index.css";
import React from "react";
import { MODELS } from "../../static";
const Description = () => {
  return (
    <div className="description-container">
      <div>Description</div>
      <div>
        {Object.keys(MODELS).map((item, i) => (
          <div key={i}>
            <div>{item}:</div>
            <div>intervals:{MODELS[item].join("-")}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Description;
