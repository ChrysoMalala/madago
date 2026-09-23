import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Pages publiques
import Accueil from "./pages/public/Accueil";
import Connexion from "./pages/public/Connexion";
import Inscription from "./pages/public/Inscription";
import DetailTrajet from "./pages/public/DetailTrajet";

// Pages conducteur
import TableauBordConducteur from "./pages/conducteur/TableauBord";
import MesVehicules from "./pages/conducteur/MesVehicules";
import AjouterVehicule from "./pages/conducteur/AjouterVehicule";
import MesTrajets from "./pages/conducteur/MesTrajets";
import PublierTrajet from "./pages/conducteur/PublierTrajet";
import MesRevenus from "./pages/conducteur/MesRevenus";
import MonProfilConducteur from "./pages/conducteur/MonProfil";
import InscriptionConducteur from "./pages/conducteur/InscriptionConducteur";
import TrajetDetail from "./pages/conducteur/TrajetDetail";
import ModifierVehicule from "./pages/conducteur/ModifierVehicule";
import MesAvis from "./pages/conducteur/MesAvis";

// Pages passager
import TableauBordPassager from "./pages/passager/TableauBord";
import RechercheTrajet from "./pages/passager/RechercheTrajet";
import MesReservations from "./pages/passager/MesReservations";
import MonProfilPassager from "./pages/passager/MonProfil";

// Pages administration
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminConducteurs from "./pages/admin/AdminConducteurs";
import AdminVehicules from "./pages/admin/AdminVehicules";
import AdminConducteurDetail from "./pages/admin/AdminConducteurDetail";

export default function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Pages publiques */}
            <Route path="/" element={<Accueil />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/trajets/:id" element={<DetailTrajet />} />

            {/* Tableau de bord conducteur */}
            <Route
              path="/conducteur"
              element={
                <ProtectedRoute role="conducteur">
                  <TableauBordConducteur />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/vehicules"
              element={
                <ProtectedRoute role="conducteur">
                  <MesVehicules />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/vehicules/ajouter"
              element={
                <ProtectedRoute role="conducteur">
                  <AjouterVehicule />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/trajets"
              element={
                <ProtectedRoute role="conducteur">
                  <MesTrajets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/trajets/:id"
              element={
                <ProtectedRoute role="conducteur">
                  <TrajetDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/trajets/publier"
              element={
                <ProtectedRoute role="conducteur">
                  <PublierTrajet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/revenus"
              element={
                <ProtectedRoute role="conducteur">
                  <MesRevenus />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/profil"
              element={
                <ProtectedRoute role="conducteur">
                  <MonProfilConducteur />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conducteur/avis"
              element={
                <ProtectedRoute role="conducteur">
                  <MesAvis />
                </ProtectedRoute>
              }
            />

            {/* Formulaire de demande conducteur :
                accessible à tout utilisateur connecté */}
            <Route
              path="/conducteur/inscription"
              element={
                <ProtectedRoute>
                  <InscriptionConducteur />
                </ProtectedRoute>
              }
            />

            {/* Pages passager */}
            <Route
              path="/passager"
              element={
                <ProtectedRoute role="passager">
                  <TableauBordPassager />
                </ProtectedRoute>
              }
            />

            <Route
              path="/passager/recherche"
              element={
                <ProtectedRoute role="passager">
                  <RechercheTrajet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/passager/reservations"
              element={
                <ProtectedRoute role="passager">
                  <MesReservations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/passager/profil"
              element={
                <ProtectedRoute role="passager">
                  <MonProfilPassager />
                </ProtectedRoute>
              }
            />

            {/* Administration */}
            <Route path="/admin-login" element={<AdminLogin />} />

            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/conducteurs"
              element={
                <AdminRoute>
                  <AdminConducteurs />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/vehicules"
              element={
                <AdminRoute>
                  <AdminVehicules />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/conducteurs/:id"
              element={
                <AdminRoute>
                  <AdminConducteurDetail />
                </AdminRoute>
              }
            />

            <Route path="/conducteur/vehicules/:id/modifier" element={<ModifierVehicule />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AdminAuthProvider>
  );
}