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

const SearchResults = ({
  style,
  state: { count, page, pagesCount, results }
}) => (
  <View style={[style, styles.panel]}>
    <Text style={styles.text}>
      Результатов: {count}, с. {page} из {pagesCount}
    </Text>
    {results.map((question, n) => (
      <QuestionCard key={n} question={question} />
    ))}
  </View>
);

export default SearchResults;
