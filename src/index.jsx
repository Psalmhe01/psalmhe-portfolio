import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import App from "./App.jsx";
import reportWebVitals from "./reportWebVitals";
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
  primaryColor: "dark",
  fontFamily: "'Afacad Flux', 'Montserrat', sans-serif",
  headings: {
    fontFamily: "'Afacad Flux', 'Montserrat', sans-serif",
    fontWeight: "700",
  },
  // You can define your specific brand colors here to match the original CSS
  colors: {
    brand: [
      "#f5f5f5", // 0
      "#e0e0e0", // 1
      "#bdbdbd", // 2
      "#9e9e9e", // 3
      "#757575", // 4
      "#616161", // 5
      "#424242", // 6
      "#212121", // 7
      "#1a1a1a", // 8
      "#0a0a0a", // 9
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: "xs",
        variant: "filled",
      },
    },
    Container: {
      defaultProps: {
        size: "xl",
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
