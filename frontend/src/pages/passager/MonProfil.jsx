import { useState, useEffect } from 'react'
import LayoutPassager from '../../components/LayoutPassager'
import Spinner from '../../components/Spinner'
import MessageErreur from '../../components/MessageErreur'
import api from '../../api/axios'

export default function MonProfilPassager() {
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [modeEdition, setModeEdition] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
  })
  const [formMdp, setFormMdp] = useState({
    ancien_mdp: '',
    nouveau_mdp: '',
    confirmer_mdp: '',
  })
  const [modeMdp, setModeMdp] = useState(false)
  const [chargementSauvegarde, setChargementSauvegarde] = useState(false)

  useEffect(() => {
    api.get('/utilisateurs/moi/')
      .then(res => {
        setProfil(res.data)
        setForm({
          nom: res.data.nom,
          prenom: res.data.prenom,
          telephone: res.data.telephone,
          email: res.data.email,
        })
      })
      .catch(() => setErreur('Erreur de chargement du profil'))
      .finally(() => setChargement(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleChangeMdp = (e) => setFormMdp({ ...formMdp, [e.target.name]: e.target.value })

  const handleSauvegarder = async (e) => {
    e.preventDefault()
    setChargementSauvegarde(true)
    setErreur('')
    setSucces('')
    try {
      const res = await api.put('/utilisateurs/moi/', form)
      setProfil(res.data.utilisateur)
      setModeEdition(false)
      setSucces('Profil mis à jour avec succès !')
      setTimeout(() => setSucces(''), 3000)
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la mise à jour')
    } finally {
      setChargementSauvegarde(false)
    }
  }

  const handleChangerMdp = async (e) => {
    e.preventDefault()
    if (formMdp.nouveau_mdp !== formMdp.confirmer_mdp) {
      setErreur('Les mots de passe ne correspondent pas')
      return
    }
    setChargementSauvegarde(true)
    setErreur('')
    setSucces('')
    try {
      await api.put('/auth/changer-mdp/', {
        ancien_mdp: formMdp.ancien_mdp,
        mot_de_passe: formMdp.nouveau_mdp,
      })
      setModeMdp(false)
      setFormMdp({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' })
      setSucces('Mot de passe changé avec succès !')
      setTimeout(() => setSucces(''), 3000)
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors du changement de mot de passe')
    } finally {
      setChargementSauvegarde(false)
    }
  }

  if (chargement) return <Spinner />

  return (
    <LayoutPassager>
      <div className="max-w-2xl mx-auto">

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          👤 Mon profil
        </h1>

        <MessageErreur message={erreur} />

        {/* Message de succès */}
        {succes && (
          <div className="bg-green-100 text-green-700 border border-green-300 p-3 rounded-lg mb-4">
            ✅ {succes}
          </div>
        )}

        {/* Photo de profil */}
        <div className="bg-white rounded-xl shadow p-6 mb-4 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            {profil?.photo_profil ? (
              <img
                src={profil.photo_profil}
                alt="Photo de profil"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {profil?.prenom} {profil?.nom}
          </h2>
          <p className="text-gray-500 text-sm">{profil?.email}</p>
          <span className="inline-block mt-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
            🧳 Passager
          </span>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">
              Informations personnelles
            </h3>
            {!modeEdition && (
              <button
                onClick={() => setModeEdition(true)}
                className="text-blue-700 text-sm font-medium hover:underline">
                ✏️ Modifier
              </button>
            )}
          </div>

          {!modeEdition ? (
            /* Mode affichage */
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-400">Nom</span>
                <span className="font-medium">{profil?.nom}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-400">Prénom</span>
                <span className="font-medium">{profil?.prenom}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-400">E-mail</span>
                <span className="font-medium">{profil?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-400">Téléphone</span>
                <span className="font-medium">{profil?.telephone}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Membre depuis</span>
                <span className="font-medium">
                  {new Date(profil?.date_inscription).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ) : (
            /* Mode édition */
            <form onSubmit={handleSauvegarder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="+261 34 XX XXX XX"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModeEdition(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementSauvegarde}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {chargementSauvegarde ? 'Sauvegarde...' : '✅ Sauvegarder'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sécurité — Changer mot de passe */}
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Sécurité</h3>
            {!modeMdp && (
              <button
                onClick={() => setModeMdp(true)}
                className="text-blue-700 text-sm font-medium hover:underline">
                ✏️ Changer le mot de passe
              </button>
            )}
          </div>

          {!modeMdp ? (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-400">Mot de passe</span>
              <span className="font-medium">••••••••</span>
            </div>
          ) : (
            <form onSubmit={handleChangerMdp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ancien mot de passe
                </label>
                <input
                  type="password"
                  name="ancien_mdp"
                  value={formMdp.ancien_mdp}
                  onChange={handleChangeMdp}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="nouveau_mdp"
                  value={formMdp.nouveau_mdp}
                  onChange={handleChangeMdp}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="confirmer_mdp"
                  value={formMdp.confirmer_mdp}
                  onChange={handleChangeMdp}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModeMdp(false)
                    setFormMdp({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' })
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementSauvegarde}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {chargementSauvegarde ? 'Changement...' : '🔒 Changer'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Infos compte */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">Mon compte</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-400">Type de compte</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                Passager
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-400">Statut</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                ✅ Actif
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Inscription</span>
              <span className="font-medium">
                {new Date(profil?.date_inscription).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </LayoutPassager>
  )
}