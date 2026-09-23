import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { useDraggable, useDroppable } from "@dnd-kit/core";

// ============================================================
// SIÈGE PLACÉ DANS LE PLAN
// ============================================================

function CarrePlan({ siege, position }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: siege.id,
    });

  const style = {
    position: "absolute",
    left: position.x,
    top: position.y,

    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px) ${
          isDragging ? "scale(1.06)" : ""
        }`
      : undefined,

    opacity: isDragging ? 0.75 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 50 : 10,
    touchAction: "none",

    transition: isDragging ? "none" : "box-shadow 0.2s ease, opacity 0.2s ease",
  };

  // ----------------------------------------------------------
  // Chauffeur
  // ----------------------------------------------------------

  if (siege.estChauffeur) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        title="Chauffeur"
        className="
          group
          w-[72px]
          h-[72px]
          rounded-2xl
          bg-slate-800
          border
          border-slate-700
          text-white
          flex
          flex-col
          items-center
          justify-center
          select-none
          shadow-lg
          hover:shadow-xl
          hover:bg-slate-900
        "
      >
        <span className="text-xl leading-none">🚗</span>

        <span
          className="
            mt-1
            text-[10px]
            font-bold
            uppercase
            tracking-wide
          "
        >
          Chauffeur
        </span>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Siège passager
  // ----------------------------------------------------------

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      title={`Place ${siege.numero}`}
      className="
        group
        w-[72px]
        h-[72px]
        rounded-2xl
        border-2
        border-blue-400
        bg-blue-50
        text-blue-800
        flex
        flex-col
        items-center
        justify-center
        select-none
        shadow-md
        hover:border-blue-600
        hover:bg-blue-100
        hover:shadow-lg
      "
    >
      <span
        className="
          text-xl
          leading-none
          transition-transform
          group-hover:scale-110
        "
      >
        🪑
      </span>

      <span
        className="
          mt-1
          text-[11px]
          font-bold
          leading-none
        "
      >
        Place {siege.numero}
      </span>
    </div>
  );
}

// ============================================================
// SIÈGE DANS LA RÉSERVE
// ============================================================

function CarreReserve({ siege }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: siege.id,
    });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px) ${
          isDragging ? "scale(1.06)" : ""
        }`
      : undefined,

    opacity: isDragging ? 0.7 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
    zIndex: isDragging ? 50 : 1,

    transition: isDragging ? "none" : "box-shadow 0.2s ease, opacity 0.2s ease",
  };

  // ----------------------------------------------------------
  // Chauffeur dans réserve
  // ----------------------------------------------------------

  if (siege.estChauffeur) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        title="Glisser le chauffeur dans le plan"
        className="
          w-[68px]
          h-[68px]
          rounded-xl
          bg-slate-800
          border
          border-slate-700
          text-white
          flex
          flex-col
          items-center
          justify-center
          select-none
          shadow-md
          hover:bg-slate-900
          hover:shadow-lg
        "
      >
        <span className="text-lg">🚗</span>

        <span
          className="
            mt-1
            text-[9px]
            font-bold
            uppercase
          "
        >
          Chauffeur
        </span>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Siège passager dans réserve
  // ----------------------------------------------------------

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      title={`Glisser la place ${siege.numero} dans le véhicule`}
      className="
        group
        w-[68px]
        h-[68px]
        rounded-xl
        border-2
        border-slate-300
        bg-white
        text-slate-600
        flex
        flex-col
        items-center
        justify-center
        select-none
        shadow-sm
        hover:border-blue-400
        hover:bg-blue-50
        hover:text-blue-700
        hover:shadow-md
      "
    >
      <span
        className="
          text-lg
          transition-transform
          group-hover:scale-110
        "
      >
        🪑
      </span>

      <span
        className="
          mt-1
          text-[10px]
          font-bold
        "
      >
        Place {siege.numero}
      </span>
    </div>
  );
}

// ============================================================
// ZONE DROPPABLE
// ============================================================

function ZoneDroppable({ id, children, className = "", style }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${className}

        transition-all
        duration-200

        ${
          isOver
            ? `
              ring-4
              ring-blue-200
              border-blue-500
            `
            : ""
        }
      `}
    >
      {children}
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function PlanSieges({
  sieges,
  setSieges,
  positions,
  setPositions,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  );

  // ----------------------------------------------------------
  // Séparation plan / réserve
  // ----------------------------------------------------------

  const siegesPlan = sieges.filter((siege) => siege.zone === "plan");

  const siegesReserve = sieges.filter((siege) => siege.zone === "reserve");

  const passagersPlan = siegesPlan.filter((siege) => !siege.estChauffeur);

  const passagersTotal = sieges.filter((siege) => !siege.estChauffeur);

  const chauffeurPlan = siegesPlan.some((siege) => siege.estChauffeur);

  const nombreConfigure = passagersPlan.length;
  const nombreTotal = passagersTotal.length;

  const configurationComplete = nombreConfigure > 0 && chauffeurPlan;

  // ==========================================================
  // DIMENSIONS DYNAMIQUES DU PLAN
  // ==========================================================

  const hauteurPlan = () => {
    if (siegesPlan.length === 0) {
      return 340;
    }

    const maxY = Math.max(
      ...siegesPlan.map((siege) => (positions[siege.id]?.y || 30) + 100),
    );

    return Math.max(340, maxY + 50);
  };

  const largeurPlan = () => {
    if (siegesPlan.length === 0) {
      return 500;
    }

    const maxX = Math.max(
      ...siegesPlan.map((siege) => (positions[siege.id]?.x || 30) + 100),
    );

    return Math.max(500, maxX + 50);
  };

  // ==========================================================
  // DRAG & DROP
  // ==========================================================

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;

    if (!active) {
      return;
    }

    const siegeActif = sieges.find((siege) => siege.id === active.id);

    if (!siegeActif) {
      return;
    }

    // --------------------------------------------------------
    // RÉSERVE -> PLAN
    // --------------------------------------------------------

    if (siegeActif.zone === "reserve" && over?.id === "zone-plan") {
      const positionDepart = positions[active.id] || {
        x: 40,
        y: 60,
      };

      setPositions((precedentes) => ({
        ...precedentes,

        [active.id]: {
          x: Math.max(10, positionDepart.x + delta.x),

          y: Math.max(45, positionDepart.y + delta.y),
        },
      }));

      setSieges(
        sieges.map((siege) =>
          siege.id === active.id
            ? {
                ...siege,
                zone: "plan",
              }
            : siege,
        ),
      );

      return;
    }

    // --------------------------------------------------------
    // PLAN -> RÉSERVE
    // --------------------------------------------------------

    if (siegeActif.zone === "plan" && over?.id === "zone-reserve") {
      setSieges(
        sieges.map((siege) =>
          siege.id === active.id
            ? {
                ...siege,
                zone: "reserve",
              }
            : siege,
        ),
      );

      return;
    }

    // --------------------------------------------------------
    // DÉPLACEMENT LIBRE DANS LE PLAN
    // --------------------------------------------------------

    if (siegeActif.zone === "plan") {
      const positionActuelle = positions[active.id] || {
        x: 40,
        y: 60,
      };

      setPositions((precedentes) => ({
        ...precedentes,

        [active.id]: {
          x: Math.max(10, positionActuelle.x + delta.x),

          y: Math.max(45, positionActuelle.y + delta.y),
        },
      }));
    }
  };

  // ==========================================================
  // AFFICHAGE
  // ==========================================================

  return (
    <div className="w-full">
      {/* ======================================================
          EN-TÊTE / INFORMATIONS
      ====================================================== */}

      <div
        className="
          mb-5
          rounded-2xl
          border
          border-slate-200
          bg-slate-50
          p-4
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-sm
                font-semibold
                text-slate-800
              "
            >
              Configuration du véhicule
            </p>

            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-slate-500
              "
            >
              Glissez les éléments depuis la zone « À placer » vers le véhicule,
              puis positionnez-les comme dans votre véhicule réel.
            </p>
          </div>

          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >
            <span
              className="
                rounded-full
                border
                border-blue-200
                bg-blue-50
                px-3
                py-1.5
                text-xs
                font-semibold
                text-blue-700
              "
            >
              🪑 {nombreConfigure}/{nombreTotal} places
            </span>

            <span
              className={`
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                font-semibold

                ${
                  chauffeurPlan
                    ? `
                      border-emerald-200
                      bg-emerald-50
                      text-emerald-700
                    `
                    : `
                      border-amber-200
                      bg-amber-50
                      text-amber-700
                    `
                }
              `}
            >
              {chauffeurPlan ? "✓ Chauffeur placé" : "🚗 Chauffeur à placer"}
            </span>
          </div>
        </div>

        {/* Barre progression */}

        {nombreTotal > 0 && (
          <div className="mt-4">
            <div
              className="
                mb-1.5
                flex
                items-center
                justify-between
                text-[11px]
                text-slate-500
              "
            >
              <span>Places configurées</span>

              <span className="font-semibold">
                {Math.round((nombreConfigure / nombreTotal) * 100)}%
              </span>
            </div>

            <div
              className="
                h-2
                overflow-hidden
                rounded-full
                bg-slate-200
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-blue-600
                  transition-all
                  duration-300
                "
                style={{
                  width: `${(nombreConfigure / nombreTotal) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          AIDE
      ====================================================== */}

      <div
        className="
          mb-5
          flex
          items-start
          gap-3
          rounded-xl
          border
          border-blue-100
          bg-blue-50/60
          px-4
          py-3
        "
      >
        <div
          className="
            flex
            h-8
            w-8
            flex-shrink-0
            items-center
            justify-center
            rounded-lg
            bg-white
            shadow-sm
          "
        >
          🖱️
        </div>

        <div>
          <p
            className="
              text-xs
              font-semibold
              text-blue-900
            "
          >
            Comment organiser le plan ?
          </p>

          <p
            className="
              mt-0.5
              text-xs
              leading-5
              text-blue-700
            "
          >
            Glissez le chauffeur et les sièges vers le véhicule. Vous pouvez
            ensuite les déplacer librement pour reproduire la disposition
            réelle.
          </p>
        </div>
      </div>

      {/* ======================================================
          DND CONTEXT
      ====================================================== */}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="
            flex
            flex-col
            gap-5
            xl:flex-row
            xl:items-start
          "
        >
          {/* ==================================================
              PLAN DU VÉHICULE
          ================================================== */}

          <div className="min-w-0 flex-1">
            <div
              className="
                mb-3
                flex
                flex-wrap
                items-center
                justify-between
                gap-2
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-600
                  "
                >
                  🚐 Plan de mon véhicule
                </p>

                <p
                  className="
                    mt-0.5
                    text-[11px]
                    text-slate-400
                  "
                >
                  Vue du dessus
                </p>
              </div>

              <span
                className="
                  rounded-lg
                  bg-slate-100
                  px-2.5
                  py-1
                  text-[11px]
                  font-medium
                  text-slate-600
                "
              >
                {nombreConfigure} place
                {nombreConfigure > 1 ? "s" : ""} réservable
                {nombreConfigure > 1 ? "s" : ""}
              </span>
            </div>

            {/* Scroll horizontal si petit écran */}

            <div
              className="
                w-full
                overflow-x-auto
                pb-2
              "
            >
              <div
                className="
                  mx-auto
                  w-fit
                  min-w-full
                "
              >
                {/* AVANT */}

                <div
                  className="
                    mb-2
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-slate-400
                  "
                >
                  <span className="h-px w-8 bg-slate-200" />

                  <span>▲ Avant</span>

                  <span className="h-px w-8 bg-slate-200" />
                </div>

                <ZoneDroppable
                  id="zone-plan"
                  style={{
                    minHeight: `${hauteurPlan()}px`,
                    minWidth: `${largeurPlan()}px`,
                    position: "relative",
                  }}
                  className="
                    relative
                    overflow-visible
                    rounded-[42px]
                    border-[3px]
                    border-slate-300
                    bg-gradient-to-b
                    from-slate-50
                    to-white
                    shadow-inner
                  "
                >
                  {/* Pare-brise */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      left-1/2
                      top-3
                      h-3
                      w-40
                      -translate-x-1/2
                      rounded-b-xl
                      border
                      border-slate-200
                      bg-slate-200/70
                    "
                  />

                  {/* Ligne centrale légère */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      bottom-8
                      left-1/2
                      top-10
                      border-l
                      border-dashed
                      border-slate-200
                    "
                  />

                  {/* Zone vide */}

                  {siegesPlan.length === 0 && (
                    <div
                      className="
                        pointer-events-none
                        absolute
                        inset-0
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-8
                        text-center
                        select-none
                      "
                    >
                      <div
                        className="
                          mb-3
                          flex
                          h-14
                          w-14
                          items-center
                          justify-center
                          rounded-2xl
                          border
                          border-blue-100
                          bg-blue-50
                          text-2xl
                        "
                      >
                        🪑
                      </div>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-slate-500
                        "
                      >
                        Votre plan est vide
                      </p>

                      <p
                        className="
                          mt-1
                          max-w-xs
                          text-xs
                          leading-5
                          text-slate-400
                        "
                      >
                        Glissez les éléments depuis la zone « À placer » vers
                        cette zone.
                      </p>
                    </div>
                  )}

                  {/* Sièges placés */}

                  {siegesPlan.map((siege) => (
                    <CarrePlan
                      key={siege.id}
                      siege={siege}
                      position={
                        positions[siege.id] || {
                          x: 40,
                          y: 60,
                        }
                      }
                    />
                  ))}

                  {/* Indication arrière */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      bottom-3
                      left-1/2
                      -translate-x-1/2
                      rounded-full
                      bg-slate-100/90
                      px-3
                      py-1
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-widest
                      text-slate-400
                    "
                  >
                    Arrière
                  </div>
                </ZoneDroppable>
              </div>
            </div>
          </div>

          {/* ==================================================
              RÉSERVE
          ================================================== */}

          <div
            className="
              w-full
              xl:w-[210px]
              xl:flex-shrink-0
            "
          >
            <div
              className="
                mb-3
                flex
                items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-600
                  "
                >
                  📦 À placer
                </p>

                <p
                  className="
                    mt-0.5
                    text-[11px]
                    text-slate-400
                  "
                >
                  Éléments disponibles
                </p>
              </div>

              <span
                className="
                  flex
                  min-w-7
                  items-center
                  justify-center
                  rounded-full
                  bg-blue-100
                  px-2
                  py-1
                  text-[11px]
                  font-bold
                  text-blue-700
                "
              >
                {siegesReserve.length}
              </span>
            </div>

            <ZoneDroppable
              id="zone-reserve"
              className="
                min-h-[160px]
                rounded-2xl
                border-2
                border-dashed
                border-slate-300
                bg-slate-50
                p-4
              "
            >
              {siegesReserve.length > 0 ? (
                <div
                  className="
                    grid
                    grid-cols-3
                    gap-3
                    sm:grid-cols-4
                    md:grid-cols-5
                    lg:grid-cols-6
                    xl:grid-cols-2
                  "
                >
                  {siegesReserve.map((siege) => (
                    <CarreReserve key={siege.id} siege={siege} />
                  ))}
                </div>
              ) : (
                <div
                  className="
                    flex
                    min-h-[125px]
                    flex-col
                    items-center
                    justify-center
                    px-3
                    text-center
                  "
                >
                  <span className="text-2xl">✓</span>

                  <p
                    className="
                      mt-2
                      text-xs
                      font-semibold
                      text-emerald-700
                    "
                  >
                    Tout est placé
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      leading-4
                      text-slate-400
                    "
                  >
                    Glissez un élément ici pour le retirer du plan.
                  </p>
                </div>
              )}
            </ZoneDroppable>
          </div>
        </div>
      </DndContext>

      {/* ======================================================
          ÉTAT DE CONFIGURATION
      ====================================================== */}

      <div className="mt-5">
        {configurationComplete ? (
          <div
            className="
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3
            "
          >
            <div
              className="
                flex
                h-8
                w-8
                flex-shrink-0
                items-center
                justify-center
                rounded-full
                bg-emerald-100
              "
            >
              ✓
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-emerald-800
                "
              >
                Plan prêt
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  leading-5
                  text-emerald-700
                "
              >
                Le chauffeur est positionné et {nombreConfigure} place
                {nombreConfigure > 1 ? "s" : ""} passager
                {nombreConfigure > 1 ? "s sont" : " est"} réservable
                {nombreConfigure > 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-amber-200
              bg-amber-50
              px-4
              py-3
            "
          >
            <div
              className="
                flex
                h-8
                w-8
                flex-shrink-0
                items-center
                justify-center
                rounded-full
                bg-amber-100
              "
            >
              !
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-amber-800
                "
              >
                Configuration incomplète
              </p>

              <div
                className="
                  mt-1
                  space-y-1
                  text-xs
                  text-amber-700
                "
              >
                <p>
                  {chauffeurPlan ? "✓" : "•"} Chauffeur{" "}
                  {chauffeurPlan ? "positionné" : "à positionner"}
                </p>

                <p>
                  {nombreConfigure > 0 ? "✓" : "•"} {nombreConfigure}/
                  {nombreTotal} place
                  {nombreTotal > 1 ? "s" : ""} passager configurée
                  {nombreConfigure > 1 ? "s" : ""}
                </p>

                {nombreConfigure === 0 && (
                  <p className="font-medium">
                    Placez au moins un siège passager dans le véhicule pour
                    continuer.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
