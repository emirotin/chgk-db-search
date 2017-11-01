import React, { Component } from "react";
import { StyleSheet } from "react-native";

import Toolbar from "../Toolbar";
import SearchResults from "../SearchResults";

const PAGE_SIZE = 10;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
      page: 1,
      pagesCount: 100,
      results: [
        {
          question: "<div>Hello <em>world!</em> <b>BOLD</strong></b>"
        }
      ]
    };
  }

  onSearchChange(searchParams) {
    //
  }

  render() {
    return [
      <Toolbar
        style={styles.toolbar}
        key="Toolbar"
        onSearchChange={this.onSearchChange.bind(this)}
      />,
      <SearchResults
        style={styles.results}
        key="SearchResults"
        state={this.state}
      />
    ];
  }
}

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
