import {
  Box,
} from '@chakra-ui/react';
import PaymentsSubNav from '../components/payments/PaymentsSubNav';
import { Navigate, useLocation } from 'react-router-dom';

export default function Payments() {

  
  const location = useLocation();
  
    // Redirige /register vers /register/absences (qui redirige lui-même vers
    // la catégorie Élèves) par défaut.
    if (location.pathname === '/payments') {
      return <Navigate to="/payments/eleves" replace />;
    }

  return (
    <Box dir="rtl">
      <PaymentsSubNav />

      </Box>
  );
}