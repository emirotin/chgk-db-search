import React from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: "#333",
    padding: "10px"
  },
  textInput: {
    backgroundColor: "white"
  },
  text: {
    color: "white"
  }
});

const Toolbar = ({ style }) => (
  <View style={[style, styles.toolbar]}>
    <Text style={styles.text}>SOME TEXT</Text>
    <TextInput style={styles.textInput} autoFocus />
  </View>
);

export default Toolbar;
