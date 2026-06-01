// Polyfill de Buffer/global ANTES de qualquer import do web3.js
import { Buffer } from "buffer";
const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!g.Buffer) g.Buffer = Buffer;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
