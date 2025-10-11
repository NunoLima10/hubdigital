import { useContext } from "react";
import { SumbmitContext } from "./../context/sumbmit-form";

export function useSubmitForm() {
  const sumbmitContext = useContext(SumbmitContext);

  if (!sumbmitContext) {
    throw new Error("useSubmitForm must be used within SumbmitFromProvider");
  }
  return sumbmitContext;
}
