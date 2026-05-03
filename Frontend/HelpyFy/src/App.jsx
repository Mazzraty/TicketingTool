import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return (
    <>
      <Toaster />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </>
  );
}