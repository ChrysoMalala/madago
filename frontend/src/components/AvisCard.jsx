export default function AvisCard({ avis }) {
  const { passager_prenom, passager_nom, note, commentaire, date_avis } = avis

  const formaterDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const couleurNote = (n) => {
    if (n >= 4) return 'bg-green-100 text-green-700'
    if (n === 3) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">

      {/* En-tête */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">
            {passager_prenom?.[0]}{passager_nom?.[0]}
          </div>

          {/* Nom + date */}
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {passager_prenom} {passager_nom}
            </p>
            <p className="text-gray-400 text-xs">
              {formaterDate(date_avis)}
            </p>
          </div>
        </div>

        {/* Badge note */}
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${couleurNote(note)}`}>
          {'★'.repeat(note)}{'☆'.repeat(5 - note)}
        </div>
      </div>

      {/* Commentaire */}
      {commentaire ? (
        <p className="text-gray-600 text-sm leading-relaxed">
          "{commentaire}"
        </p>
      ) : (
        <p className="text-gray-300 text-sm italic">
          Aucun commentaire
        </p>
      )}

    </div>
  )
}