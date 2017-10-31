import { AppRegistry } from "react-native";
import App from "./components/App";

AppRegistry.registerComponent("ChgkSearch", () => App);
AppRegistry.runApplication("ChgkSearch", {
  rootTag: document.getElementById("root")
});
