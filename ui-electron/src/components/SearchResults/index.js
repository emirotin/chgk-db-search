import React from "react";
import { StyleSheet, Text, View } from "react-native";
import QuestionCard from "../QuestionCard";

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#eef",
    padding: "10px"
  },
  text: {
    color: "#336"
  }
});

const SearchResults = ({ style }) => (
  <View style={[style, styles.panel]}>
    <Text style={styles.text}>SOME TEXT</Text>
    {[1, 2, 3].map(n => <QuestionCard key={n} text={n} />)}
  </View>
);

export default SearchResults;
