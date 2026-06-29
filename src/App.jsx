import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import RecoverPassword from "./pages/RecoverPassword";
import ResetPassword from "./pages/ResetPassword";
import Bills from "./pages/Bills";
import More from "./pages/More";
import Accounts from "./pages/Accounts";
import Cards from "./pages/Cards";
import Exchange from "./pages/Exchange";
import TransactionDetails from "./pages/TransactionDetails";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/bills" element={<Bills />} />
      <Route path="/more" element={<More />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/cards" element={<Cards />} />
      <Route path="/exchange" element={<Exchange />} />
      <Route path="/transactions/:id" element={<TransactionDetails />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}