import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export async function callBackend(name, data) {
  return (await httpsCallable(functions, name)(data)).data;
}
