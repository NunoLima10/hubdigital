import { useContext } from "react";
import { SumbmitContext } from "./../context/submit-context";

export function useSubmitForm() {
  const sumbmitContext = useContext(SumbmitContext);

  if (!sumbmitContext) {
    throw new Error("useSubmitForm must be used within SumbmitFromProvider");
  }
  return sumbmitContext;
}
