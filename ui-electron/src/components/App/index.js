import React from "react";
import { StyleSheet } from "react-native";

import Toolbar from "../Toolbar";
import SearchResults from "../SearchResults";

// Components
const App = () => [
  <Toolbar style={styles.toolbar} key="Toolbar" />,
  <SearchResults style={styles.results} key="SearchResults" />
];

// Styles
const styles = StyleSheet.create({
  toolbar: {
    flexGrow: 0,
    flexShrink: 0
  },
  results: {
    flexGrow: 1,
    flexShrink: 1
  }
});

export default App;
