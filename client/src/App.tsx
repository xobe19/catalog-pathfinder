import React, { useState } from "react";
import axios from "axios";
import "./App.css";

export const apiUrl = "http://18.60.247.88";

function App() {
  const [tokenIn, setTokenIn] = useState("");
  const [tokenOut, setTokenOut] = useState("");
  const [amount, setAmount] = useState("");
  const [isUserFriendly, setIsUserFriendly] = useState(true);

  const getQuote = async () => {
    try {
      const res = await axios.post(`${apiUrl}/quote`, {});
      console.log("Quote:", res.data);
    } catch (error) {
      console.error("Error fetching quote:", error);
    }
  };

  return (
    <div className="container">
      <input
        className="input"
        type="text"
        placeholder="Token In Address"
        value={tokenIn}
        onChange={(e) => setTokenIn(e.target.value)}
      />
      <input
        className="input"
        type="text"
        placeholder="Token Out Address"
        value={tokenOut}
        onChange={(e) => setTokenOut(e.target.value)}
      />
      <div className="checkbox-container">
        <input type="checkbox" checked={isUserFriendly} />
        <button className="button" onClick={getQuote}>
          Get Quote
        </button>
      </div>
    </div>
  );
}

export default App;
