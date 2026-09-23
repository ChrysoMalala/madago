import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import adminApi from '../../api/adminAxios'

const FILTRES = [
  { cle: 'en_attente', label: 'En attente' },
  { cle: 'valide', label: 'Validés' },
  { cle: 'suspendu', label: 'Suspendus' },
  { cle: 'rejete', label: 'Rejetés' },
  { cle: 'tous', label: 'Tous' },
]

const BADGES = {
  en_attente: { texte: '⏳ En attente', classe: 'bg-yellow-100 text-yellow-800' },
  valide: { texte: '✅ Validé', classe: 'bg-green-100 text-green-800' },
  rejete: { texte: '❌ Rejeté', classe: 'bg-red-100 text-red-800' },
  suspendu: { texte: '⛔ Suspendu', classe: 'bg-orange-100 text-orange-800' },
}

export default function AdminVehicules() {
  const [filtre, setFiltre] = useState('en_attente')
  const [vehicules, setVehicules] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const [rejetOuvert, setRejetOuvert] = useState(null)
  const [motifRejet, setMotifRejet] = useState('')

  const charger = async (statut) => {
    setChargement(true)
    setErreur('')
    try {
      const params = statut === 'tous' ? {} : { statut }
      const reponse = await adminApi.get('/admin/vehicules/', { params })
      setVehicules(reponse.data)
    } catch (err) {
      console.error(err)
      setErreur('Impossible de charger les véhicules.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger(filtre) }, [filtre])

  const changerStatut = async (id, statut) => {
    try {
      await adminApi.put(`/admin/vehicules/${id}/valider/`, {
        statut,
        motif_rejet: statut === 'rejete' ? motifRejet : undefined,
      })
      setRejetOuvert(null)
      setMotifRejet('')
      charger(filtre)
    } catch (err) {
      console.error(err)
      setErreur('Impossible de mettre à jour ce véhicule.')
    }
  }

  return (
    <AdminLayout titre="Validation des véhicules">
      <div className="flex gap-2 mb-6 border-b">
        {FILTRES.map((f) => (
          <button
            key={f.cle}
            onClick={() => setFiltre(f.cle)}
            className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
              filtre === f.cle ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {erreur && <p className="text-red-600 text-sm mb-4">{erreur}</p>}

      {chargement ? (
        <p className="text-slate-500">Chargement...</p>
      ) : vehicules.length === 0 ? (
        <p className="text-center text-slate-500 py-16">Aucun véhicule dans cette catégorie.</p>
      ) : (
        <div className="space-y-4">
          {vehicules.map((v) => {
            const badge = BADGES[v.statut_validation] || BADGES.en_attente
            return (
              <div key={v.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800">{v.marque} {v.modele}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.classe}`}>
                    {badge.texte}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-1">👤 Conducteur : {v.conducteur_nom}</p>
                <p className="text-sm text-slate-500 mb-3">
                  🪪 {v.immatriculation} · {v.annee} · {v.nombre_places} places
                </p>

                {v.statut_validation === 'rejete' && v.motif_rejet && (
                  <p className="text-sm text-red-600 mb-3">Motif : {v.motif_rejet}</p>
                )}

                {v.statut_validation === 'en_attente' && (
                  <div className="flex gap-2 items-center flex-wrap">
                    <button onClick={() => changerStatut(v.id, 'valide')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                      ✅ Valider
                    </button>
                    {rejetOuvert === v.id ? (
                      <>
                        <input value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)}
                          placeholder="Motif du rejet"
                          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]" />
                        <button onClick={() => changerStatut(v.id, 'rejete')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
                          Confirmer le rejet
                        </button>
                        <button onClick={() => { setRejetOuvert(null); setMotifRejet('') }}
                          className="text-slate-500 text-sm">Annuler</button>
                      </>
                    ) : (
                      <button onClick={() => setRejetOuvert(v.id)}
                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200">
                        ❌ Rejeter
                      </button>
                    )}
                  </div>
                )}

                {v.statut_validation === 'valide' && (
                  <button onClick={() => changerStatut(v.id, 'suspendu')}
                    className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200">
                    ⛔ Suspendre
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}