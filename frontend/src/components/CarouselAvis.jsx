import { useState, useEffect } from 'react'

// Affiche une liste d'avis sous forme de cartes, groupées 4 par 4,
// avec défilement automatique (toutes les 6 secondes) et navigation
// manuelle via les flèches. Ne dépend d'aucune API — reçoit
// simplement un tableau d'avis déjà chargé par le composant parent.
//
// Format attendu pour chaque avis (compatible avec AvisPublicSerializer
// ET AvisSerializer) :
//   { id, note, commentaire, date_avis, passager_prenom }
// ou éventuellement { passager_nom, passager_prenom } selon la source.
const TAILLE_GROUPE = 4
const DELAI_AUTO_MS = 6000

export default function CarouselAvis({ avis = [], titre }) {
  const [groupeActif, setGroupeActif] = useState(0)

  const groupes = []
  for (let i = 0; i < avis.length; i += TAILLE_GROUPE) {
    groupes.push(avis.slice(i, i + TAILLE_GROUPE))
  }
  const nombreGroupes = groupes.length

  // ── Défilement automatique ──────────────────────────────────────
  useEffect(() => {
    if (nombreGroupes <= 1) return
    const intervalle = setInterval(() => {
      setGroupeActif((g) => (g + 1) % nombreGroupes)
    }, DELAI_AUTO_MS)
    return () => clearInterval(intervalle)
  }, [nombreGroupes])

  // Si le nombre d'avis change (nouveau chargement) et que le
  // groupe actif n'existe plus, on revient au premier.
  useEffect(() => {
    if (groupeActif >= nombreGroupes) setGroupeActif(0)
  }, [nombreGroupes, groupeActif])

  if (avis.length === 0) {
    return null
  }

  const precedent = () => {
    setGroupeActif((g) => (g - 1 + nombreGroupes) % nombreGroupes)
  }

  const suivant = () => {
    setGroupeActif((g) => (g + 1) % nombreGroupes)
  }

  const formaterDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const nomAffiche = (unAvis) =>
    unAvis.passager_prenom
      ? `${unAvis.passager_prenom}${
          unAvis.passager_nom ? ` ${unAvis.passager_nom.charAt(0)}.` : ''
        }`
      : 'Passager'

  return (
    <div>
      {titre && (
        <h3 className="font-bold text-gray-800 text-lg mb-3">{titre}</h3>
      )}

      <div className="flex items-center gap-2">
        {nombreGroupes > 1 && (
          <button
            onClick={precedent}
            aria-label="Avis précédents"
            className="shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
          >
            ←
          </button>
        )}

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden">
          {groupes[groupeActif]?.map((unAvis) => (
            <div
              key={unAvis.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-800 text-sm">
                  {nomAffiche(unAvis)}
                </p>
                <span className="text-yellow-400 text-sm">
                  {'★'.repeat(unAvis.note)}
                  <span className="text-gray-200">
                    {'★'.repeat(5 - unAvis.note)}
                  </span>
                </span>
              </div>

              {unAvis.commentaire && (
                <p className="text-gray-600 text-sm flex-1 line-clamp-4">
                  {unAvis.commentaire}
                </p>
              )}

              <p className="text-gray-400 text-xs mt-2">
                {formaterDate(unAvis.date_avis)}
              </p>
            </div>
          ))}
        </div>

        {nombreGroupes > 1 && (
          <button
            onClick={suivant}
            aria-label="Avis suivants"
            className="shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
          >
            →
          </button>
        )}
      </div>

      {nombreGroupes > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {groupes.map((_, index) => (
            <button
              key={index}
              onClick={() => setGroupeActif(index)}
              aria-label={`Groupe d'avis ${index + 1}`}
              className={`w-2 h-2 rounded-full transition ${
                index === groupeActif ? 'bg-blue-700' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}