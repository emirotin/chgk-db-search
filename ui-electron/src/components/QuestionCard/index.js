import React from "react";
import { StyleSheet, Text, View } from "react-native";

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

const QuestionCard = ({ style, text }) => (
  <View style={[style, styles.card]}>
    <Text style={styles.text}>{text}</Text>
  </View>
);

export default QuestionCard;
