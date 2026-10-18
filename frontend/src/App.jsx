import {Routes,Route} from 'react-router-dom';
import Home from './pages/Home';
import AboutYala from './pages/AboutYala';
import ExperiencePage from './pages/ExperiencePage';
import ReviewsPage from './pages/ReviewsPage';
import ContactPage from './pages/ContactPage';
import Packages from './pages/Packages';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import DashboardRouter from './pages/DashboardRouter';
import AccountPage from './pages/AccountPage';
import NotificationsPage from './pages/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import SafariBot from './components/SafariBot';
import ActionFeedback from './components/ActionFeedback';
export default function App(){return <><Routes><Route path="/" element={<Home/>}/><Route path="/packages" element={<Packages/>}/><Route path="/experience" element={<ExperiencePage/>}/><Route path="/reviews" element={<ReviewsPage/>}/><Route path="/about-yala" element={<AboutYala/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/book/:packageId" element={<ProtectedRoute><BookingPage/></ProtectedRoute>}/><Route path="/pay/:bookingId" element={<ProtectedRoute><PaymentPage/></ProtectedRoute>}/><Route path="/dashboard" element={<ProtectedRoute><DashboardRouter/></ProtectedRoute>}/><Route path="/account" element={<ProtectedRoute><AccountPage/></ProtectedRoute>}/><Route path="/notifications" element={<ProtectedRoute><NotificationsPage/></ProtectedRoute>}/><Route path="*" element={<Home/>}/></Routes><ActionFeedback/><SafariBot/></>}
