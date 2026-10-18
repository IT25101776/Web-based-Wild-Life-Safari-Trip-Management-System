import {Navigate} from 'react-router-dom'; import {useAuth} from '../context/AuthContext';
export default function ProtectedRoute({children}){const {user,loading}=useAuth();if(loading)return <div className="page-loader"><div className="spinner"/>Loading Safari Lanka...</div>;return user?children:<Navigate to="/login" replace/>}
