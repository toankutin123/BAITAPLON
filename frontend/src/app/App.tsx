import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { UserChatBubble } from "./components/UserChatBubble";
import { AdminChatFloatingPanel } from "./components/AdminChatFloatingPanel";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
      <UserChatBubble />
      <AdminChatFloatingPanel />
    </AuthProvider>
  );
}