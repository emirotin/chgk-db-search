import React from "react";
import { StyleSheet, Text, View } from "react-native";
import HTMLView from "react-native-htmlview";

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
  },
  noFlex: {
    flexDirectio: "initial"
  }
});

const QuestionCard = ({ style, question }) => (
  <View style={[style, styles.card]}>
    <HTMLView
      value={question.question}
      stylesheet={{
        strong: {
          color: "red"
        }
      }}
    />
  </View>
);

export default QuestionCard;
