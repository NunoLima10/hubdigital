import { Center } from "@mantine/core";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/landing/landing";

export const PathConstants = {
  root: "/",
  route1: "route/1",
} as const;

// interface ProtectedProps {
//   component: React.ReactNode;
// }

// function Protected({ component }: ProtectedProps) {
//   const { token } = useAuth();
//   if (token) return component;

//   return <Navigate to={PathConstants.root}></Navigate>;
// }

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PathConstants.root} element={<Landing />} />
        <Route
          path={PathConstants.route1}
          element={<Center>{PathConstants.route1}</Center>}
        />

        <Route path="*" element={<Center>Not Found</Center>} />
      </Routes>
    </BrowserRouter>
  );
}
