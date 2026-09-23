import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LayoutConducteur from '../../components/LayoutConducteur'
import Spinner from '../../components/Spinner'
import CarouselAvis from '../../components/CarouselAvis'
import api from '../../api/axios'

export default function TrajetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [trajet, setTrajet] = useState(null)
  const [passagers, setPassagers] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [messageAction, setMessageAction] = useState('')
  const [envoiDepart, setEnvoiDepart] = useState(false)

  const charger = async () => {
    setChargement(true)
    try {
      const [resTrajet, resPassagers] = await Promise.all([
        api.get(`/trajets/${id}/`),
        api.get(`/trajets/${id}/passagers/`),
      ])
      setTrajet(resTrajet.data)
      setPassagers(resPassagers.data)
    } catch (err) {
      console.error(err)
      setErreur('Impossible de charger ce trajet.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [id])

  // ── Marquer présent / en retard (pour TOUS les sièges de la
  //    commande à la fois — un groupe voyage ensemble) ────────────
  const marquerPassager = async (reservationIds, champ, valeur) => {
    try {
      await Promise.all(
        reservationIds.map((rid) =>
          api.put(`/trajets/${id}/reservations/${rid}/marquer/`, {
            [champ]: valeur,
          })
        )
      )
      setPassagers((prev) =>
        prev.map((p) =>
          reservationIds.includes(p.reservation_id) ? { ...p, [champ]: valeur } : p
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Regroupe les réservations par COMMANDE (groupe_reservation), pas
  // par compte : une même personne peut réserver pour elle-même ET
  // séparément pour un tiers — ce sont deux commandes distinctes qui
  // doivent rester sur deux lignes différentes. Les réservations
  // sans groupe_reservation (faites individuellement) forment
  // chacune leur propre groupe.
  const grouperParCommande = (liste) => {
    const groupes = {}
    liste.forEach((p) => {
      const cle = p.groupe_reservation || `solo-${p.reservation_id}`
      if (!groupes[cle]) groupes[cle] = []
      groupes[cle].push(p)
    })
    return Object.values(groupes)
  }

  // ── Vérifier si le bouton confirmer départ peut s'afficher ─────
  const peutConfirmerDepart = () => {
    if (!trajet || trajet.statut !== 'a_venir') return false

    const maintenant = new Date()
    const depart = new Date(`${trajet.date_depart}T${trajet.heure_depart}`)
    if (maintenant < depart) return false

    const passagersActifs = passagers.filter((p) => p.statut === 'confirmee')
    if (passagersActifs.length === 0) return true

    return passagersActifs.every((p) => p.present_a_bord || p.en_retard)
  }

  // ── Confirmer le départ ────────────────────────────────────────
  const confirmerDepart = async () => {
    setEnvoiDepart(true)
    setErreur('')
    setMessageAction('')
    try {
      const reponse = await api.put(`/trajets/${id}/confirmer-depart/`)
      setMessageAction(
        `✅ Départ confirmé ! ${
          reponse.data.montant_transfere > 0
            ? `${reponse.data.montant_transfere.toLocaleString()} Ar transférés (simulation)`
            : ''
        }`
      )
      charger()
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Impossible de confirmer le départ.')
    } finally {
      setEnvoiDepart(false)
    }
  }

  // ── Confirmer la fin ───────────────────────────────────────────
  const confirmerFin = async () => {
    setErreur('')
    setMessageAction('')
    try {
      await api.put(`/trajets/${id}/confirmer-fin/`)
      setMessageAction('✅ Trajet marqué comme terminé.')
      charger()
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Impossible de confirmer la fin.')
    }
  }

  if (chargement) {
    return (
      <LayoutConducteur>
        <div className="max-w-2xl mx-auto px-6 py-8"><Spinner /></div>
      </LayoutConducteur>
    )
  }

  if (!trajet) {
    return (
      <LayoutConducteur>
        <div className="max-w-2xl mx-auto px-6 py-8">
          <p className="text-red-600">{erreur || 'Trajet introuvable.'}</p>
        </div>
      </LayoutConducteur>
    )
  }

  const passagersConfirmes = passagers.filter((p) => p.statut === 'confirmee')
  // Le vrai statut utilisé par le backend pour toute réservation qui
  // ne donne plus lieu à un paiement est 'remboursee' — que ce soit
  // une auto-annulation par le passager (avant le départ) ou une
  // absence marquée "en retard" par le conducteur (après le départ).
  // 'annulee' existe encore dans STATUT_CHOICES pour compatibilité
  // avec d'anciennes données, mais n'est plus jamais attribué par le
  // backend actuel — filtrer dessus ne renverrait jamais rien.
  const passagersAnnules = passagers.filter((p) => p.statut === 'remboursee')
  const heureDepart = new Date(`${trajet.date_depart}T${trajet.heure_depart}`)
  const maintenant = new Date()
  const heureAtteinte = maintenant >= heureDepart

  // ── Détail financier ─────────────────────────────────────────
  // Le transfert des fonds au conducteur se fait au moment de
  // confirmer_depart (voir backend) : tant que le trajet est
  // "à venir", tous les paiements des réservations confirmées sont
  // donc encore en attente ; dès que le trajet passe "en cours" ou
  // "terminé", ils ont été transférés.
  const montantBrut = passagersConfirmes.reduce(
    (total, p) => total + parseFloat(p.montant || 0), 0
  )
  const tauxCommission = 0.10
  const commission = montantBrut * tauxCommission
  const netConducteur = montantBrut - commission
  const transfertEffectue = trajet.statut !== 'a_venir'

  const placesTotal = trajet.sieges
    ? trajet.sieges.filter((s) => !s.est_chauffeur).length
    : null

  return (
    <LayoutConducteur>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* ── Retour ── */}
        <button
          onClick={() => navigate('/conducteur/trajets')}
          className="text-sm text-gray-500 mb-4 hover:underline"
        >
          ← Retour à mes trajets
        </button>

        {/* ── Messages ── */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {erreur}
          </div>
        )}
        {messageAction && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 mb-4 text-sm">
            {messageAction}
          </div>
        )}

        {/* ── Infos trajet ── */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {trajet.ville_depart} → {trajet.ville_arrivee}
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            📅 {trajet.date_depart} à {trajet.heure_depart?.slice(0, 5)}
            {' · '}🚗 Véhicule #{trajet.vehicule}
          </p>
          <p className="text-gray-500 text-sm">
            📏 {trajet.distance_km} km
          </p>
        </div>

        {/* ── Détail financier ── */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            💰 Détail financier
          </h2>

          <span
            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
              transfertEffectue
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {transfertEffectue ? '✅ Transféré' : '⏳ En attente de transfert'}
          </span>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Places remplies</p>
              <p className="font-semibold text-gray-800">
                {passagersConfirmes.length}
                {placesTotal !== null ? `/${placesTotal}` : ''}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Montant brut</p>
              <p className="font-semibold text-gray-800">
                {montantBrut.toLocaleString()} Ar
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Commission (10 %)</p>
              <p className="font-semibold text-gray-800">
                {commission.toLocaleString()} Ar
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Net conducteur</p>
              <p className="font-bold text-blue-700">
                {netConducteur.toLocaleString()} Ar
              </p>
            </div>
          </div>
        </div>

        {/* ── Tableau des passagers ── */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🧑‍🤝‍🧑 Passagers
            </h2>

            {passagers.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Aucune réservation pour ce trajet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs border-b">
                      <th className="pb-2 pr-3">Nom</th>
                      <th className="pb-2 pr-3">E-mail</th>
                      <th className="pb-2 pr-3">Téléphone</th>
                      <th className="pb-2 pr-3">Ramassage / Dépose</th>
                      <th className="pb-2 pr-3">Montant</th>
                      <th className="pb-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouperParCommande(passagersConfirmes).map((groupe) => {
                      const premiere = groupe[0]
                      const reservationIds = groupe.map((p) => p.reservation_id)
                      const montantTotal = groupe.reduce(
                        (s, p) => s + parseFloat(p.montant || 0), 0
                      )
                      const sieges = groupe.map((p) => p.siege).join(', ')

                      return (
                        <tr key={reservationIds.join('-')} className="border-b last:border-0">
                          <td className="py-2 pr-3">
                            <p className="font-medium text-gray-800">{premiere.nom}</p>
                            {premiere.type_reservation === 'autre_personne' && (
                              <p className="text-xs text-blue-600">
                                Réservé pour un tiers
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              🪑 {groupe.length > 1 ? `Sièges ${sieges}` : `Siège N°${sieges}`}
                            </p>
                          </td>
                          <td className="py-2 pr-3 text-gray-600">{premiere.email}</td>
                          <td className="py-2 pr-3 text-gray-600">{premiere.telephone}</td>
                          <td className="py-2 pr-3 text-gray-600 text-xs">
                            <p>🟢 {premiere.point_ramassage}</p>
                            <p>🔴 {premiere.point_depose}</p>
                          </td>
                          <td className="py-2 pr-3 font-medium text-gray-800">
                            {montantTotal.toLocaleString()} Ar
                          </td>
                          <td className="py-2">
                            {!heureAtteinte ? (
                              <span
                                className="text-xs text-gray-400"
                                title={`Disponible à partir de ${trajet.heure_depart?.slice(0, 5)}`}
                              >
                                Disponible au départ
                              </span>
                            ) : premiere.present_a_bord ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                ✅ Installé
                              </span>
                            ) : premiere.en_retard ? (
                              <>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                  ⏰ En retard
                                </span>
                                <button
                                  onClick={() =>
                                    marquerPassager(reservationIds, 'en_retard', false)
                                  }
                                  className="block text-xs text-gray-400 hover:underline mt-1"
                                >
                                  Annuler le retard
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={premiere.present_a_bord}
                                    onChange={(e) =>
                                      marquerPassager(
                                        reservationIds,
                                        'present_a_bord',
                                        e.target.checked
                                      )
                                    }
                                    className="w-4 h-4 accent-green-600"
                                  />
                                  <span className="text-xs text-gray-600">Installé</span>
                                </label>
                                <button
                                  onClick={() =>
                                    marquerPassager(reservationIds, 'en_retard', true)
                                  }
                                  className="text-xs text-orange-600 hover:underline"
                                >
                                  En retard
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}

                    {grouperParCommande(passagersAnnules).map((groupe) => {
                      const premiere = groupe[0]
                      const reservationIds = groupe.map((p) => p.reservation_id)
                      const montantTotal = groupe.reduce(
                        (s, p) => s + parseFloat(p.montant || 0), 0
                      )
                      const sieges = groupe.map((p) => p.siege).join(', ')

                      return (
                        <tr key={reservationIds.join('-')} className="border-b last:border-0 opacity-50">
                          <td className="py-2 pr-3">
                            {premiere.nom}
                            <p className="text-xs text-gray-400">
                              🪑 {groupe.length > 1 ? `Sièges ${sieges}` : `Siège N°${sieges}`}
                            </p>
                          </td>
                          <td className="py-2 pr-3">{premiere.email}</td>
                          <td className="py-2 pr-3">{premiere.telephone}</td>
                          <td className="py-2 pr-3 text-xs">
                            <p>🟢 {premiere.point_ramassage}</p>
                            <p>🔴 {premiere.point_depose}</p>
                          </td>
                          <td className="py-2 pr-3">
                            {montantTotal.toLocaleString()} Ar
                          </td>
                          <td className="py-2">
                            {premiere.en_retard ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                🕐 Absent — remboursé 50%
                              </span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                ❌ Annulée par le passager
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Info heure (uniquement pertinent avant le départ) ── */}
            {trajet.statut === 'a_venir' && !heureAtteinte && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                ⏰ Le bouton "Confirmer le départ" sera disponible
                à partir de {trajet.heure_depart?.slice(0, 5)}.
              </div>
            )}

            {/* ── Bouton Confirmer le départ ── */}
            {trajet.statut === 'a_venir' && heureAtteinte && peutConfirmerDepart() && (
              <button
                onClick={confirmerDepart}
                disabled={envoiDepart}
                className="mt-4 w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50 transition"
              >
                {envoiDepart ? 'Confirmation...' : '🚦 Confirmer le départ'}
              </button>
            )}

            {/* ── Info passagers non cochés ── */}
            {trajet.statut === 'a_venir' && heureAtteinte && !peutConfirmerDepart() && passagersConfirmes.length > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                ⚠️ Cochez tous les passagers présents (ou marquez-les en retard)
                pour activer la confirmation du départ.
              </div>
            )}
          </div>

        {/* ── Bouton Confirmer fin (si en cours) ── */}
        {trajet.statut === 'en_cours' && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🏁 Trajet en cours
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Le trajet est en cours. Confirmez la fin une fois arrivé à destination.
            </p>
            <button
              onClick={confirmerFin}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              🏁 Confirmer la fin du trajet
            </button>
          </div>
        )}

        {/* ── Trajet terminé ── */}
        {trajet.statut === 'termine' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-green-800">Trajet terminé</p>
            <p className="text-sm text-green-600 mt-1">
              Ce trajet a été complété avec succès.
            </p>
          </div>
        )}

        {/* ── Avis reçus pour CE trajet précis ── */}
        {trajet.statut === 'termine' && (
          <div className="bg-white rounded-xl shadow p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                ⭐ Avis sur ce trajet
              </h2>
              {trajet.note_moyenne_trajet !== null && trajet.note_moyenne_trajet !== undefined && (
                <span className="text-sm font-semibold text-gray-700">
                  Note moyenne : ⭐ {trajet.note_moyenne_trajet}/5
                </span>
              )}
            </div>

            {!trajet.avis_trajet || trajet.avis_trajet.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                Aucun avis reçu pour ce trajet pour l'instant.
              </p>
            ) : (
              <CarouselAvis avis={trajet.avis_trajet} />
            )}
          </div>
        )}

      </div>
    </LayoutConducteur>
  )
}