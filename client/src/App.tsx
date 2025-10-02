import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Missions from "./pages/Missions";
import MissionDetails from "./pages/MissionDetails";
import Pet from "./pages/Pet";
import Shop from "./pages/Shop";
import Tests from "./pages/Tests";
import BottomNav from "./components/BottomNav";
import styles from "./App.module.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/missions" element={<Missions />} />
      <Route path="/missions/:code" element={<MissionDetails />} />
      <Route path="/pet" element={<Pet />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/tests" element={<Tests />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  const location = useLocation();
  const hideNav = ["/login", "/register"];

  return (
    <div className={styles.appShell}>
      <main className={styles.main}>
        <AppRoutes />
      </main>
      {!hideNav.includes(location.pathname) && <BottomNav />}
    </div>
  );
}
