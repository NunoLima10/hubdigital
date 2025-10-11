import { ErrorBoundary } from "react-error-boundary";
import { Erro } from "./error";
import { AppProvider } from "./provider";
import { AppRouter } from "./router";

export default function App() {
  return (
    <ErrorBoundary fallback={<Erro />}>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </ErrorBoundary>
  );
}
