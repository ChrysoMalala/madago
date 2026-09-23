import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import adminApi from '../../api/adminAxios'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts'

const COULEURS_DONUT = ['#F59E0B', '#10B981', '#EF4444']
const COULEURS_REVENUS = {
  brut: '#6366F1',
  commission: '#F59E0B',
  net: '#10B981',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [graphiques, setGraphiques] = useState(null)
  const [alertes, setAlertes] = useState([])
  const [prioritaires, setPrioritaires] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const charger = async () => {
      try {
        const reponse = await adminApi.get('/admin/dashboard/stats/')
        setStats(reponse.data.stats)
        setGraphiques(reponse.data.graphiques)
        setAlertes(reponse.data.alertes)
        setPrioritaires(reponse.data.prioritaires)
      } catch (err) {
        console.error(err)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [])

  const CARTES = stats ? [
    { label: 'Conducteurs en attente', valeur: stats.conducteurs_en_attente, icone: '⏳', couleur: 'text-yellow-600', bg: 'bg-yellow-50', lien: '/admin/conducteurs' },
    { label: 'Conducteurs validés',    valeur: stats.conducteurs_valides,    icone: '✅', couleur: 'text-green-600',  bg: 'bg-green-50',  lien: '/admin/conducteurs' },
    { label: 'Véhicules en attente',   valeur: stats.vehicules_en_attente,   icone: '🚗', couleur: 'text-yellow-600', bg: 'bg-yellow-50', lien: '/admin/vehicules' },
    { label: 'Véhicules validés',      valeur: stats.vehicules_valides,      icone: '✅', couleur: 'text-green-600',  bg: 'bg-green-50',  lien: '/admin/vehicules' },
    { label: "Trajets actifs aujourd'hui", valeur: stats.trajets_actifs,     icone: '🗺️', couleur: 'text-blue-600',  bg: 'bg-blue-50',   lien: null },
    { label: 'Commissions simulées',   valeur: `${stats.total_commissions.toLocaleString()} Ar`, icone: '💰', couleur: 'text-indigo-600', bg: 'bg-indigo-50', lien: null },
  ] : []

  if (chargement) {
    return (
      <AdminLayout titre="Tableau de bord">
        <p className="text-slate-500">Chargement des statistiques...</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout titre="Tableau de bord">

      {/* ── Cartes statistiques ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {CARTES.map((c) => (
          <div
            key={c.label}
            onClick={() => c.lien && navigate(c.lien)}
            className={`${c.bg} rounded-xl p-5 ${c.lien ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
          >
            <p className="text-2xl mb-2">{c.icone}</p>
            <p className={`text-3xl font-bold ${c.couleur}`}>{c.valeur}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Graphiques ── */}
      {graphiques && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

          {/* Graphique 1 — Répartition statuts conducteurs */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              👤 Répartition des conducteurs
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={graphiques.repartition_conducteurs}
                  dataKey="valeur"
                  nameKey="statut"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {graphiques.repartition_conducteurs.map((_, i) => (
                    <Cell key={i} fill={COULEURS_DONUT[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val} conducteur(s)`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique 2 — Évolution des inscriptions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              📈 Évolution des inscriptions
            </h2>
            {graphiques.evolution_inscriptions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-16">Aucune donnée disponible</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={graphiques.evolution_inscriptions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="conducteurs"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Inscriptions"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Graphique 3 — Réservations par mois */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              🎫 Réservations par mois
            </h2>
            {graphiques.evolution_reservations.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-16">Aucune donnée disponible</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={graphiques.evolution_reservations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="reservations"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    name="Réservations"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Graphique 4 — Revenus et commissions par mois */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              💰 Revenus et commissions (Ar)
            </h2>
            {graphiques.evolution_revenus.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-16">Aucune donnée disponible</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={graphiques.evolution_revenus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val.toLocaleString()} Ar`} />
                  <Legend />
                  <Bar dataKey="brut"       fill={COULEURS_REVENUS.brut}       radius={[4,4,0,0]} name="Brut" />
                  <Bar dataKey="commission" fill={COULEURS_REVENUS.commission} radius={[4,4,0,0]} name="Commission" />
                  <Bar dataKey="net"        fill={COULEURS_REVENUS.net}        radius={[4,4,0,0]} name="Net conducteur" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      )}

      {/* ── Alertes urgentes ── */}
      {alertes.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            ⚠️ Alertes urgentes ({alertes.length})
          </h2>
          <div className="space-y-2">
            {alertes.map((alerte, i) => (
              <div
                key={i}
                onClick={() => navigate(`/admin/conducteurs/${alerte.conducteur_id}`)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer hover:opacity-80 transition ${alerte.classe}`}
              >
                <div className="flex items-center gap-2">
                  <span>{alerte.icone}</span>
                  <div>
                    <p className="text-sm font-medium">{alerte.texte}</p>
                    <p className="text-xs opacity-70">👤 {alerte.conducteur_nom}</p>
                  </div>
                </div>
                <span className="text-sm">›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dossiers prioritaires ── */}
      {prioritaires.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            📋 Dossiers prioritaires ({prioritaires.length})
          </h2>
          <div className="space-y-2">
            {prioritaires.map((p, i) => (
              <div
                key={i}
                onClick={() => navigate(`/admin/conducteurs/${p.id}`)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer hover:opacity-80 transition ${p.classe}`}
              >
                <div className="flex items-center gap-2">
                  <span>{p.icone}</span>
                  <p className="text-sm font-medium">{p.texte}</p>
                </div>
                <span className="text-sm">›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tout est en ordre ── */}
      {alertes.length === 0 && prioritaires.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-slate-600 font-semibold">Tout est en ordre !</p>
          <p className="text-slate-400 text-sm mt-1">Aucune alerte ni dossier en attente.</p>
        </div>
      )}

    </AdminLayout>
  )
}