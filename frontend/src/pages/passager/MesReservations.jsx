import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LayoutPassager from '../../components/LayoutPassager'
import Spinner from '../../components/Spinner'
import MessageErreur from '../../components/MessageErreur'
import FormulaireAvis from '../../components/FormulaireAvis'
import api from '../../api/axios'

// Frais de transfert Mobile Money déduits uniquement en cas de
// remboursement à 100 % (annulation faite plus d'1h avant le départ).
// Purement informatif/calculé à l'affichage — rien n'est stocké en base.
const TAUX_FRAIS_TRANSFERT = 0.02

export default function MesReservations() {
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [ongletActif, setOngletActif] = useState('toutes')
  const [annulationEnCours, setAnnulationEnCours] = useState(null)
  const [telechargementEnCours, setTelechargementEnCours] = useState(null)

  // Réservation actuellement examinée pour annulation
  const [candidatAnnulation, setCandidatAnnulation] = useState(null)

  useEffect(() => {
    chargerReservations()
  }, [])

  const chargerReservations = async () => {
    try {
      const res = await api.get('/reservations/mes-reservations/')
      setReservations(res.data)
    } catch {
      setErreur('Erreur de chargement des réservations')
    } finally {
      setChargement(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CALCUL DU REMBOURSEMENT
  // ─────────────────────────────────────────────────────────────
  const calculerRemboursement = (reservation) => {
    const trajetInfo = reservation.trajet_details

    if (!trajetInfo?.date_depart || !trajetInfo?.heure_depart) {
      return null
    }

    const depart = new Date(
      `${trajetInfo.date_depart}T${trajetInfo.heure_depart}`
    )

    const maintenant = new Date()
    const heuresRestantes =
      (depart - maintenant) / (1000 * 60 * 60)

    const montant = parseFloat(
      reservation.prix_total || 0
    )

    if (heuresRestantes > 1) {
      const frais = montant * TAUX_FRAIS_TRANSFERT

      return {
        eligible100: true,
        pourcentage: 100,
        frais,
        montantRembourse: montant - frais,
        montant,
        heuresRestantes,
      }
    }

    return {
      eligible100: false,
      pourcentage: 50,
      frais: 0,
      montantRembourse: montant * 0.5,
      montant,
      heuresRestantes,
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PEUT ENCORE ANNULER ?
  // ─────────────────────────────────────────────────────────────
  const peutEncoreAnnuler = (reservation) => {
    const trajetInfo = reservation.trajet_details

    if (
      trajetInfo?.statut === 'en_cours' ||
      trajetInfo?.statut === 'termine'
    ) {
      return false
    }

    if (
      !trajetInfo?.date_depart ||
      !trajetInfo?.heure_depart
    ) {
      return true
    }

    const depart = new Date(
      `${trajetInfo.date_depart}T${trajetInfo.heure_depart}`
    )

    return new Date() < depart
  }

  const ouvrirConfirmationAnnulation = (reservation) => {
    setCandidatAnnulation(reservation)
  }

  const confirmerAnnulation = async () => {
    if (!candidatAnnulation) return

    const id = candidatAnnulation.id

    setAnnulationEnCours(id)
    setCandidatAnnulation(null)

    try {
      await api.put(`/reservations/${id}/annuler/`)
      await chargerReservations()
    } catch (err) {
      setErreur(
        err.response?.data?.erreur ||
        "Erreur lors de l'annulation"
      )
    } finally {
      setAnnulationEnCours(null)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TÉLÉCHARGEMENT DU BILLET
  // ─────────────────────────────────────────────────────────────
  const handleTelechargerBillet = async (id, reference) => {
    setTelechargementEnCours(id)
    setErreur('')

    try {
      const res = await api.get(
        `/reservations/${id}/billet/`,
        {
          responseType: 'blob',
        }
      )

      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/pdf',
        })
      )

      const lien = document.createElement('a')

      lien.href = url
      lien.setAttribute(
        'download',
        `billet_${reference || id}.pdf`
      )

      document.body.appendChild(lien)
      lien.click()
      lien.remove()

      window.URL.revokeObjectURL(url)
    } catch {
      setErreur(
        'Erreur lors du téléchargement du billet'
      )
    } finally {
      setTelechargementEnCours(null)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GROUPEMENT DES RÉSERVATIONS PAR COMMANDE
  // ─────────────────────────────────────────────────────────────
  const grouperParCommande = (liste) => {
    const groupes = {}

    liste.forEach((r) => {
      const cle =
        r.groupe_reservation ||
        `solo-${r.id}`

      if (!groupes[cle]) {
        groupes[cle] = []
      }

      groupes[cle].push(r)
    })

    return Object.values(groupes)
      .map((g) =>
        g.sort((a, b) => a.id - b.id)
      )
      .sort(
        (a, b) =>
          b[0].id - a[0].id
      )
  }

  const commandes =
    grouperParCommande(reservations)

  if (chargement) {
    return <Spinner />
  }

  // ─────────────────────────────────────────────────────────────
  // FILTRE DES COMMANDES
  // ─────────────────────────────────────────────────────────────
  const commandesFiltrees =
    commandes.filter((commande) => {
      if (ongletActif === 'toutes') {
        return true
      }

      return commande.some((r) => {
        if (ongletActif === 'confirmees') {
          return r.statut === 'confirmee'
        }

        if (ongletActif === 'annulees') {
          return r.statut === 'annulee'
        }

        if (ongletActif === 'remboursees') {
          return r.statut === 'remboursee'
        }

        return true
      })
    })

  const onglets = [
    {
      id: 'toutes',
      label: 'Toutes',
      count: commandes.length,
    },
    {
      id: 'confirmees',
      label: '✅ Confirmées',
      count: commandes.filter(
        (c) =>
          c.some(
            (r) =>
              r.statut === 'confirmee'
          )
      ).length,
    },
    {
      id: 'annulees',
      label: '❌ Annulées',
      count: commandes.filter(
        (c) =>
          c.some(
            (r) =>
              r.statut === 'annulee'
          )
      ).length,
    },
    {
      id: 'remboursees',
      label: '💰 Remboursées',
      count: commandes.filter(
        (c) =>
          c.some(
            (r) =>
              r.statut === 'remboursee'
          )
      ).length,
    },
  ]

  // ─────────────────────────────────────────────────────────────
  // BADGES DE STATUT
  // ─────────────────────────────────────────────────────────────
  const getBadgeStatut = (statut) => {
    switch (statut) {
      case 'confirmee':
        return 'bg-green-100 text-green-700'

      case 'annulee':
        return 'bg-red-100 text-red-700'

      case 'remboursee':
        return 'bg-blue-100 text-blue-700'

      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getLibelleStatut = (statut) => {
    switch (statut) {
      case 'confirmee':
        return '✅ Confirmée'

      case 'annulee':
        return '❌ Annulée'

      case 'remboursee':
        return '💰 Remboursée'

      default:
        return statut
    }
  }

  // ─────────────────────────────────────────────────────────────
  // AVIS
  //
  // Nouvelle règle :
  // 1 seul avis par passager ET par trajet.
  //
  // Si plusieurs réservations concernent le même trajet,
  // on choisit une seule réservation comme référence pour
  // afficher le formulaire.
  // ─────────────────────────────────────────────────────────────
  const trouverReservationAvis = (commande) => {
    const trajetId =
      commande[0]?.trajet_details?.id ||
      commande[0]?.trajet

    if (!trajetId) {
      return null
    }

    const reservationsDuTrajet =
      reservations.filter((r) => {
        const idTrajet =
          r.trajet_details?.id ||
          r.trajet

        return (
          String(idTrajet) ===
          String(trajetId)
        )
      })

    // Le trajet doit être terminé.
    const trajetTermine =
      commande[0]?.trajet_details?.statut ===
      'termine'

    if (!trajetTermine) {
      return null
    }

    // Le passager doit avoir effectivement participé
    // au trajet.
    const reservationPresente =
      reservationsDuTrajet.find(
        (r) =>
          r.statut === 'confirmee' &&
          r.present_a_bord === true
      )

    if (!reservationPresente) {
      return null
    }

    /*
     * Si l'une des réservations possède déjà un avis,
     * l'avis pour ce trajet a déjà été donné.
     */
    const reservationAvecAvis =
      reservationsDuTrajet.find(
        (r) => r.avis
      )

    if (reservationAvecAvis) {
      return {
        reservation: reservationAvecAvis,
        dejaAvis: true,
      }
    }

    return {
      reservation: reservationPresente,
      dejaAvis: false,
    }
  }

  return (
    <LayoutPassager>
      <div className="max-w-4xl mx-auto">

        {/* ─────────────────────────────────────────────
            TITRE
        ───────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            📋 Mes réservations
          </h1>

          <Link
            to="/passager/recherche"
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800"
          >
            + Nouvelle réservation
          </Link>
        </div>

        <MessageErreur message={erreur} />

        {/* ─────────────────────────────────────────────
            ONGLET
        ───────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {onglets.map((onglet) => (
            <button
              key={onglet.id}
              onClick={() =>
                setOngletActif(onglet.id)
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                ongletActif === onglet.id
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {onglet.label}

              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  ongletActif === onglet.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {onglet.count}
              </span>
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────────
            LISTE DES COMMANDES
        ───────────────────────────────────────────── */}
        {commandesFiltrees.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-400 text-lg mb-4">
              Aucune réservation dans cette catégorie
            </p>

            <Link
              to="/passager/recherche"
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800"
            >
              Trouver un trajet
            </Link>
          </div>
        ) : (
          <div className="space-y-4">

            {commandesFiltrees.map((commande) => {
              const premiere = commande[0]
              const trajetInfo =
                premiere.trajet_details

              const totalCommande =
                commande.reduce(
                  (s, r) =>
                    s +
                    parseFloat(
                      r.prix_total || 0
                    ),
                  0
                )

              const referenceCommande =
                premiere.groupe_reservation ||
                premiere.code_billet

              const auMoinsUneConfirmee =
                commande.some(
                  (r) =>
                    r.statut === 'confirmee'
                )

              /*
               * Recherche de la réservation de référence
               * pour l'avis.
               */
              const infoAvis =
                trouverReservationAvis(
                  commande
                )

              return (
                <div
                  key={referenceCommande}
                  className="bg-white rounded-xl shadow p-5"
                >

                  {/* ─────────────────────────────
                      EN-TÊTE
                  ───────────────────────────── */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {trajetInfo?.ville_depart ||
                          '—'}{' '}
                        →{' '}
                        {trajetInfo?.ville_arrivee ||
                          '—'}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {commande.length > 1
                          ? `Commande · ${commande.length} places`
                          : `Réservation #${premiere.id}`}

                        <span className="ml-2 text-gray-400">
                          · {referenceCommande}
                        </span>
                      </p>

                      {premiere.type_reservation ===
                        'autre_personne' && (
                        <p className="text-xs text-blue-700 mt-1">
                          🎫 Pour :{' '}
                          {
                            premiere.beneficiaire_prenom
                          }{' '}
                          {
                            premiere.beneficiaire_nom
                          }
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeStatut(
                        premiere.statut
                      )}`}
                    >
                      {getLibelleStatut(
                        premiere.statut
                      )}
                    </span>
                  </div>

                  {/* ─────────────────────────────
                      DÉTAILS TRAJET
                  ───────────────────────────── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4 p-3 bg-gray-50 rounded-lg">

                    <div>
                      <p className="text-gray-400 text-xs font-medium">
                        Date
                      </p>

                      <p className="font-medium">
                        {trajetInfo?.date_depart ||
                          '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs font-medium">
                        Heure
                      </p>

                      <p className="font-medium">
                        {trajetInfo?.heure_depart?.slice(
                          0,
                          5
                        ) || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs font-medium">
                        Sièges
                      </p>

                      <p className="font-medium">
                        {commande
                          .map(
                            (r) =>
                              `N°${
                                r
                                  .siege_details
                                  ?.numero_siege ??
                                '—'
                              }`
                          )
                          .join(', ')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs font-medium">
                        Prix total
                      </p>

                      <p className="font-bold text-blue-700">
                        {totalCommande.toLocaleString()}{' '}
                        Ar
                      </p>
                    </div>

                  </div>

                  {/* ─────────────────────────────
                      DÉTAIL PAR PLACE
                  ───────────────────────────── */}
                  {commande.length > 1 && (
                    <div className="mb-4 border rounded-lg divide-y">

                      {commande.map((r) => (
                        <div
                          key={r.id}
                          className="flex justify-between items-center px-3 py-2 text-sm"
                        >

                          <span>
                            Siège N°
                            {
                              r.siege_details
                                ?.numero_siege ??
                              '—'
                            }
                            {' · '}
                            {parseFloat(
                              r.prix_total
                            ).toLocaleString()}{' '}
                            Ar
                          </span>

                          <div className="flex items-center gap-2">

                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${getBadgeStatut(
                                r.statut
                              )}`}
                            >
                              {getLibelleStatut(
                                r.statut
                              )}
                            </span>

                            {r.statut ===
                              'confirmee' &&
                              peutEncoreAnnuler(
                                r
                              ) && (
                                <button
                                  onClick={() =>
                                    ouvrirConfirmationAnnulation(
                                      r
                                    )
                                  }
                                  disabled={
                                    annulationEnCours ===
                                    r.id
                                  }
                                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                >
                                  {annulationEnCours ===
                                  r.id
                                    ? '...'
                                    : 'Annuler'}
                                </button>
                              )}

                          </div>
                        </div>
                      ))}

                    </div>
                  )}

                  {/* ─────────────────────────────
                      ACTIONS
                  ───────────────────────────── */}
                  <div className="flex gap-3">

                    {auMoinsUneConfirmee && (
                      <>
                        <Link
                          to={`/trajets/${
                            trajetInfo?.id ||
                            premiere.trajet
                          }`}
                          className="flex-1 text-center border border-blue-700 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
                        >
                          👁️ Voir le trajet
                        </Link>

                        <button
                          onClick={() =>
                            handleTelechargerBillet(
                              premiere.id,
                              referenceCommande
                            )
                          }
                          disabled={
                            telechargementEnCours ===
                            premiere.id
                          }
                          className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50 transition"
                        >
                          {telechargementEnCours ===
                          premiere.id
                            ? 'Génération...'
                            : '🎫 Télécharger le billet'}
                        </button>
                      </>
                    )}

                    {commande.length === 1 &&
                      premiere.statut ===
                        'confirmee' &&
                      peutEncoreAnnuler(
                        premiere
                      ) && (
                        <button
                          onClick={() =>
                            ouvrirConfirmationAnnulation(
                              premiere
                            )
                          }
                          disabled={
                            annulationEnCours ===
                            premiere.id
                          }
                          className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition"
                        >
                          {annulationEnCours ===
                          premiere.id
                            ? 'Annulation...'
                            : '❌ Annuler'}
                        </button>
                      )}

                  </div>

                  {/* =====================================================
                      AVIS — UN SEUL AVIS PAR TRAJET
                      
                      Conditions :
                      1. Trajet terminé
                      2. Passager réellement présent à bord
                      3. Réservation confirmée
                      4. Aucun avis déjà laissé pour ce trajet
                      
                      Même si le passager possède plusieurs réservations
                      sur le même trajet, un seul formulaire est affiché.
                  ===================================================== */}

                  {infoAvis && (
                    <div className="mt-4">

                      {!infoAvis.dejaAvis ? (
                        <FormulaireAvis
                          reservationId={
                            infoAvis.reservation.id
                          }
                          onAvisSoumis={() =>
                            chargerReservations()
                          }
                        />
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">

                          <div className="flex items-center justify-between gap-3">

                            <span>
                              ✅ Vous avez déjà laissé
                              un avis pour ce trajet
                            </span>

                            {infoAvis.reservation
                              ?.avis?.note && (
                              <span className="font-semibold">
                                {'★'.repeat(
                                  infoAvis
                                    .reservation
                                    .avis.note
                                )}
                              </span>
                            )}

                          </div>

                        </div>
                      )}

                    </div>
                  )}

                </div>
              )
            })}

          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════
          MODALE — CONFIRMATION D'ANNULATION
      ═══════════════════════════════════════════════════════ */}
      {candidatAnnulation &&
        (() => {
          const info =
            calculerRemboursement(
              candidatAnnulation
            )

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">

                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  Confirmer l'annulation
                </h2>

                <p className="text-sm text-gray-500 mb-5">
                  Réservation #
                  {candidatAnnulation.id}

                  {candidatAnnulation.code_billet &&
                    ` · ${candidatAnnulation.code_billet}`}
                </p>

                {!info ? (
                  <p className="text-sm text-gray-500 mb-5">
                    Impossible de calculer le détail
                    du remboursement pour cette
                    réservation, mais vous pouvez tout
                    de même l'annuler.
                  </p>
                ) : (
                  <div
                    className={`rounded-xl p-4 mb-5 border ${
                      info.eligible100
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >

                    <p
                      className={`text-sm font-semibold mb-2 ${
                        info.eligible100
                          ? 'text-green-800'
                          : 'text-orange-800'
                      }`}
                    >
                      {info.eligible100
                        ? "✅ Annulation plus d'1h avant le départ"
                        : "⚠️ Annulation moins d'1h avant le départ"}
                    </p>

                    <div className="space-y-1 text-sm text-gray-700">

                      <div className="flex justify-between">
                        <span>
                          Montant payé
                        </span>

                        <span className="font-medium">
                          {info.montant.toLocaleString()}{' '}
                          Ar
                        </span>
                      </div>

                      {info.eligible100 ? (
                        <div className="flex justify-between">
                          <span>
                            Frais de transfert
                            Mobile Money (2 %)
                          </span>

                          <span className="font-medium text-red-600">
                            −{' '}
                            {info.frais.toLocaleString()}{' '}
                            Ar
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span>
                            Pénalité de retard
                            (50 % retenus)
                          </span>

                          <span className="font-medium text-red-600">
                            −{' '}
                            {(
                              info.montant * 0.5
                            ).toLocaleString()}{' '}
                            Ar
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between border-t pt-1 mt-1">

                        <span className="font-semibold text-gray-800">
                          Montant remboursé estimé
                        </span>

                        <span className="font-bold text-blue-700">
                          {info.montantRembourse.toLocaleString()}{' '}
                          Ar
                        </span>

                      </div>

                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      {info.eligible100
                        ? "Vous annulez suffisamment tôt : vous récupérez la totalité du montant, hors frais de transfert Mobile Money."
                        : "Le départ est prévu dans moins d'une heure : conformément aux conditions d'annulation, seul 50 % du montant vous sera remboursé."}
                    </p>

                  </div>
                )}

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      setCandidatAnnulation(null)
                    }
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Retour
                  </button>

                  <button
                    onClick={
                      confirmerAnnulation
                    }
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    Confirmer l'annulation
                  </button>

                </div>

              </div>

            </div>
          )
        })()}

    </LayoutPassager>
  )
}