import { useState, useEffect } from 'react'
import LayoutConducteur from '../../components/LayoutConducteur'
import Spinner from '../../components/Spinner'
import CarouselAvis from '../../components/CarouselAvis'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// ⚠️ HYPOTHÈSE À VÉRIFIER : ce composant suppose que useAuth() expose
// profilConducteur.id (identifiant du conducteur connecté), d'après
// le AuthContext.jsx du document de référence initial. Si votre vrai
// AuthContext.jsx expose ça différemment, il suffit d'adapter la
// ligne "const { profilConducteur } = useAuth()" ci-dessous.
export default function MesAvis() {
  const { profilConducteur } = useAuth()

  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!profilConducteur?.id) return

    const charger = async () => {
      try {
        const res = await api.get(`/avis/conducteur/${profilConducteur.id}/`)
        setDonnees(res.data)
      } catch (err) {
        setErreur('Impossible de charger vos avis.')
      } finally {
        setChargement(false)
      }
    }

    charger()
  }, [profilConducteur?.id])

  if (chargement) {
    return (
      <LayoutConducteur>
        <div className="max-w-4xl mx-auto px-6 py-8"><Spinner /></div>
      </LayoutConducteur>
    )
  }

  return (
    <LayoutConducteur>
      <div className="max-w-4xl mx-auto px-6 py-8">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          ⭐ Mes avis
        </h1>

        {erreur && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {erreur}
          </div>
        )}

        {donnees && (
          <>
            {/* ── Note générale ── */}
            <div className="bg-white rounded-xl shadow p-6 mb-6 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">
                  Note générale
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ⭐ {donnees.note_moyenne ? Number(donnees.note_moyenne).toFixed(1) : '—'}
                  <span className="text-base font-normal text-gray-400">/5</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs font-medium mb-1">
                  Total des avis
                </p>
                <p className="text-2xl font-semibold text-gray-700">
                  {donnees.total_avis}
                </p>
              </div>
            </div>

            {/* ── Carousel de tous les avis, tous trajets confondus ── */}
            <div className="bg-white rounded-xl shadow p-6">
              {donnees.avis.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Vous n'avez pas encore reçu d'avis.
                </p>
              ) : (
                <CarouselAvis
                  avis={donnees.avis}
                  titre="Avis reçus sur vos trajets terminés"
                />
              )}
            </div>
          </>
        )}

      </div>
    </LayoutConducteur>
  )
}