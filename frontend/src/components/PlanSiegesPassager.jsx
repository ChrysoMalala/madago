export default function PlanSiegesPassager({ sieges, siegesChoisis, onToggle }) {

  // Séparer le chauffeur des sièges passagers
  const siegesChauffeur = sieges.filter(s => s.est_chauffeur)
  const siegesPassagers = sieges.filter(s => !s.est_chauffeur)

  // Calculer les dimensions de la zone d'affichage
  const tousLesSieges = [...siegesChauffeur, ...siegesPassagers]
  const maxX = Math.max(...tousLesSieges.map(s => (s.pos_x || 0) + 80), 400)
  const maxY = Math.max(...tousLesSieges.map(s => (s.pos_y || 0) + 80), 300)

  return (
    <div>
      {/* Légende */}
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-100 inline-block" />
          Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-blue-700 inline-block" />
          Sélectionné
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-200 inline-block" />
          Occupé
        </span>
      </div>

      {/* Zone du plan */}
      <div
        className="relative bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-auto"
        style={{ minHeight: `${maxY + 40}px`, minWidth: `${maxX + 40}px` }}
      >
        {/* Carré Chauffeur */}
        {siegesChauffeur.map(siege => (
          <div
            key={siege.id}
            style={{
              position: 'absolute',
              left: siege.pos_x || 0,
              top: siege.pos_y || 0,
            }}
            className="w-16 h-16 rounded-lg bg-gray-700 text-white flex flex-col items-center justify-center text-xs font-bold select-none"
          >
            🚗
            <span className="mt-1 text-center leading-tight">Chauffeur</span>
          </div>
        ))}

        {/* Sièges passagers */}
        {siegesPassagers.map(siege => {
          const disponible = siege.statut === 'disponible'
          const choisi = siegesChoisis.some(s => s.id === siege.id)

          return (
            <button
              key={siege.id}
              type="button"
              disabled={!disponible}
              onClick={() => disponible && onToggle(siege)}
              style={{
                position: 'absolute',
                left: siege.pos_x || 0,
                top: siege.pos_y || 0,
              }}
              className={`w-16 h-16 rounded-lg border-2 font-bold text-sm flex flex-col items-center justify-center gap-1 transition select-none ${
                choisi
                  ? 'bg-blue-700 text-white border-blue-700 shadow-lg scale-105'
                  : disponible
                  ? 'bg-blue-100 text-blue-800 border-blue-500 hover:bg-blue-200 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              <span>{disponible ? '🪑' : '❌'}</span>
              <span>{siege.numero_siege}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}