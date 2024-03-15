import React from "react";
import ReactDOM from "react-dom/client";
import App from ".";
import { ToastContainer } from 'react-toastify';
import "./App.css";
import "./index.css";
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <App />
    <ToastContainer />
  </>
);
