import React from "react";
import { StyleSheet, /* Text, */ View } from "react-native";
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
    flexDirection: "initial"
  }
});

const FORMATTED_STYLES = {
  b: {
    color: "red"
  }
};

const FormattedView = ({ text }) => (
  <HTMLView value={`<div>${text}</div>`} stylesheet={FORMATTED_STYLES} />
);

const QuestionCard = ({ style, question }) => (
  <View style={[style, styles.card]}>
    <FormattedView text={question.question} />
  </View>
);

export default QuestionCard;
