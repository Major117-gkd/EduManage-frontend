import { Navigate } from 'react-router-dom';

export default function StudentLogin() {
  return <Navigate to="/login?profil=eleve" replace />;
}
