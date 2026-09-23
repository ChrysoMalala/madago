import { useState } from 'react'
import api from '../api/axios'

export default function FormulaireAvis({ reservationId, onAvisSoumis }) {
  const [note, setNote] = useState(0)
  const [noteHover, setNoteHover] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  const libelles = {
    1: 'Très mauvais',
    2: 'Mauvais',
    3: 'Moyen',
    4: 'Bien',
    5: 'Excellent',
  }

  const handleSoumettre = async (e) => {
    e.preventDefault()
    if (note === 0) {
      setErreur('Veuillez sélectionner une note')
      return
    }
    setChargement(true)
    setErreur('')
    try {
      await api.post('/avis/', {
        reservation: reservationId,
        note,
        commentaire: commentaire.trim() || null,
      })
      setSucces(true)
      if (onAvisSoumis) onAvisSoumis()
    } catch (err) {
      setErreur(
        err.response?.data?.erreur ||
        'Impossible de soumettre l\'avis.'
      )
    } finally {
      setChargement(false)
    }
  }

  // ── Succès ───────────────────────────────────────────
  if (succes) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <p className="font-semibold text-green-700 text-lg">
          Merci pour votre avis !
        </p>
        <p className="text-green-600 text-sm mt-1">
          Votre avis a bien été enregistré.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-bold text-gray-800 text-lg mb-4">
        ⭐ Laisser un avis
      </h3>

      <form onSubmit={handleSoumettre} className="space-y-4">

        {/* Sélecteur d'étoiles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note * (obligatoire)
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((etoile) => (
              <button
                key={etoile}
                type="button"
                onClick={() => setNote(etoile)}
                onMouseEnter={() => setNoteHover(etoile)}
                onMouseLeave={() => setNoteHover(0)}
                className="text-3xl transition-transform hover:scale-110 focus:outline-none"
              >
                <span className={
                  etoile <= (noteHover || note)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }>
                  ★
                </span>
              </button>
            ))}
            {(noteHover || note) > 0 && (
              <span className="ml-2 text-sm font-medium text-gray-600">
                {libelles[noteHover || note]}
              </span>
            )}
          </div>
        </div>

        {/* Commentaire */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commentaire (facultatif)
          </label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Décrivez votre expérience avec ce conducteur..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {commentaire.length} / 500
          </p>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
            ⚠️ {erreur}
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={chargement || note === 0}
          className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 transition"
        >
          {chargement ? 'Envoi en cours...' : '✅ Soumettre mon avis'}
        </button>

      </form>
    </div>
  )
}