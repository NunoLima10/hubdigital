import { useContext } from "react";
import { SubmitContext } from "./../context/submit-context";

export function useSubmitForm() {
  const submitContext = useContext(SubmitContext);

  if (!submitContext) {
    throw new Error("useSubmitForm must be used within SubmitProvider");
  }
  return submitContext;
}
