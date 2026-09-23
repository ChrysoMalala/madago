import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import adminApi from '../../api/adminAxios'

const FILTRES = [
  { cle: 'en_attente', label: 'En attente' },
  { cle: 'valide', label: 'Validés' },
  { cle: 'rejete', label: 'Rejetés' },
  { cle: 'tous', label: 'Tous' },
]

const BADGES_STATUT = {
  en_attente: { texte: '⏳ En attente', classe: 'bg-yellow-100 text-yellow-800' },
  valide:     { texte: '✅ Validé',     classe: 'bg-green-100 text-green-800' },
  rejete:     { texte: '❌ Rejeté',     classe: 'bg-red-100 text-red-800' },
}

export default function AdminConducteurs() {
  const navigate = useNavigate()
  const [filtre, setFiltre] = useState('en_attente')
  const [conducteurs, setConducteurs] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')

  const charger = async (statut) => {
    setChargement(true)
    setErreur('')
    try {
      const params = statut === 'tous' ? {} : { statut }
      const reponse = await adminApi.get('/conducteurs/', { params })
      setConducteurs(reponse.data)
    } catch (err) {
      console.error(err)
      setErreur('Impossible de charger les conducteurs.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger(filtre) }, [filtre])

  const conducteursFiltres = conducteurs.filter((c) => {
    if (!recherche.trim()) return true
    const cible = `${c.utilisateur_info?.nom} ${c.utilisateur_info?.prenom} ${c.utilisateur_info?.telephone} ${c.utilisateur_info?.email} ${c.numero_permis}`.toLowerCase()
    return cible.includes(recherche.toLowerCase())
  })

  return (
    <AdminLayout titre="Conducteurs">
      {/* ── Onglets filtres ── */}
      <div className="flex gap-2 mb-4 border-b">
        {FILTRES.map((f) => (
          <button key={f.cle} onClick={() => setFiltre(f.cle)}
            className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
              filtre === f.cle
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Recherche ── */}
      <input
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher par nom, téléphone, email, permis..."
        className="w-full border rounded-lg px-4 py-2 mb-6 text-sm"
      />

      {erreur && <p className="text-red-600 text-sm mb-4">{erreur}</p>}

      {chargement ? (
        <p className="text-slate-500">Chargement...</p>
      ) : conducteursFiltres.length === 0 ? (
        <p className="text-center text-slate-500 py-16">
          Aucun conducteur dans cette catégorie.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow divide-y divide-slate-100">
          {conducteursFiltres.map((c) => {
            const badge = BADGES_STATUT[c.statut_validation] || BADGES_STATUT.en_attente
            const alertes = c.alertes || []

            return (
              <button
                key={c.id}
                onClick={() => navigate(`/admin/conducteurs/${c.id}`)}
                className="w-full flex justify-between items-start px-5 py-4 hover:bg-slate-50 transition text-left"
              >
                {/* ── Infos principales ── */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">
                      {c.utilisateur_info?.prenom} {c.utilisateur_info?.nom}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classe}`}>
                      {badge.texte}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    📱 {c.utilisateur_info?.telephone} · {c.utilisateur_info?.email}
                  </p>

                  {/* ── Badges d'alerte ── */}
                  {alertes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {alertes.map((alerte, index) => (
                        <span
                          key={index}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alerte.classe}`}
                        >
                          {alerte.icone} {alerte.texte}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Flèche ── */}
                <span className="text-slate-400 text-sm ml-4 mt-1">›</span>
              </button>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}