import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MarkdownView as Markdown } from "react-native-markdown-view";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eee",
    padding: "10px",
    borderColor: "#333",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "3px",
    marginTop: "10px"
  },
  text: {
    color: "#333"
  }
});

const QuestionCard = ({ style, question }) => (
  <View style={[style, styles.card]}>
    <Markdown
      styles={{
        strong: {
          color: "red"
        }
      }}
    >
      {question.question}
    </Markdown>
  </View>
);

export default QuestionCard;
