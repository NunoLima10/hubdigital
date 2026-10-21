import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/landing/landing";
import { NotFound } from "./pages/not-found/not-found";
import { ProjectPage } from "./pages/project/project";

export const PathConstants = {
  root: "/",
  project: "/projeto/:slug",
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
        <Route path={PathConstants.project} element={<ProjectPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
