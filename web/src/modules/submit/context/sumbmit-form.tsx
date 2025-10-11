import { useCounter } from "@mantine/hooks";
import { createContext, PropsWithChildren } from "react";

import { useNavigate } from "@tanstack/react-router";

type SumbmitContextType = {
  active: number;
  isFist: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
};

export const SumbmitContext = createContext<SumbmitContextType | undefined>(
  undefined
);

function SumbmitProvider({ children }: PropsWithChildren) {
  const min = 0;
  const max = 4;
  const [step, handlers] = useCounter(0, { min, max });
  const navigate = useNavigate();

  const value = {
    active: step,
    isFist: step === min,
    isLast: step === max,
    next: handlers.increment,
    previous: handlers.decrement,
  };

  return (
    <SumbmitContext.Provider value={value}>{children}</SumbmitContext.Provider>
  );
}

export default SumbmitProvider;
