import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { MarketAnalysisPage } from "./pages/MarketAnalysisPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { Root } from "./pages/Root";
import { AddPropertyPage } from "./pages/AddPropertyPage";
import { PropertiesPage } from "./pages/PropertiesPage";

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
      { path: "*", Component: HomePage },
      { path: "profile", Component: ProfilePage }
    ],
  },
]);
