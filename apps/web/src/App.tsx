import { type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { AppProviders } from "./providers/AppProviders";
import { Dashboard } from "./routes/Dashboard";
import { Login } from "./routes/Login";
import { Passport } from "./routes/Passport";
import { PlantDetail } from "./routes/PlantDetail";
import { RegisterPlant } from "./routes/RegisterPlant";

function Protected({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
}

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/passport/:id" element={<Passport />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/register"
          element={
            <Protected>
              <RegisterPlant />
            </Protected>
          }
        />
        <Route
          path="/plant/:id"
          element={
            <Protected>
              <PlantDetail />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProviders>
      <Router />
    </AppProviders>
  );
}
