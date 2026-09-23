export default function NoteGlobale({ noteMoyenne, totalAvis, repartition }) {

  if (totalAvis === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-gray-400 text-sm">
          Aucun avis pour le moment
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">

      {/* Note globale */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-5xl font-bold text-yellow-500">
            {parseFloat(noteMoyenne).toFixed(1)}
          </p>
          <p className="text-yellow-400 text-xl mt-1">
            {'★'.repeat(Math.round(noteMoyenne))}
            {'☆'.repeat(5 - Math.round(noteMoyenne))}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {totalAvis} avis
          </p>
        </div>

        {/* Barres de répartition */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((etoile) => {
            const data = repartition?.[String(etoile)] || { nombre: 0, pourcentage: 0 }
            return (
              <div key={etoile} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-4 text-right">
                  {etoile}
                </span>
                <span className="text-yellow-400">★</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${data.pourcentage}%` }}
                  />
                </div>
                <span className="text-gray-400 w-8 text-right">
                  {data.nombre}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}