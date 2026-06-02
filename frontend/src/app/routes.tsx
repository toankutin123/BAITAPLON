import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { MarketAnalysisPage } from "./pages/MarketAnalysisPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { Root } from "./pages/Root";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { AddPropertyPage } from "./pages/AddPropertyPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { BecomeSellerPage } from "./pages/BecomeSellerPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ChatWithAdminPage } from "./pages/ChatWithAdminPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "dashboard", Component: DashboardPage },
      { path: "admin", Component: AdminDashboardPage },
      { path: "market-analysis", Component: MarketAnalysisPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "properties", Component: PropertiesPage },
      { path: "add-property", Component: AddPropertyPage },
      { path: "become-seller", Component: BecomeSellerPage },
      { path: "*", Component: HomePage },
      { path: "properties/:id", Component: PropertyDetailPage },
      { path: "profile", Component: ProfilePage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password", Component: ResetPasswordPage },
      { path: "chat-with-admin", Component: ChatWithAdminPage }
    ],
  },
]);
