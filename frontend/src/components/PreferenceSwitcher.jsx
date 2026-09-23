import { useAuth } from '../context/AuthContext'

/**
 * Deux icônes cliquables : une pour basculer clair/sombre, une pour
 * basculer français/malagasy. À intégrer dans la Navbar (ou tout
 * autre en-tête commun), pour être visible sur toutes les pages.
 */
export default function PreferenceSwitcher() {
  const { theme, langue, basculerTheme, basculerLangue, t } = useAuth()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={basculerTheme}
        title={theme === 'clair' ? t('theme_basculer_sombre') : t('theme_basculer_clair')}
        aria-label={theme === 'clair' ? t('theme_basculer_sombre') : t('theme_basculer_clair')}
        className="w-9 h-9 flex items-center justify-center rounded-full text-lg
                   hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        {theme === 'clair' ? '🌙' : '☀️'}
      </button>

      <button
        onClick={basculerLangue}
        title={t('langue_basculer')}
        aria-label={t('langue_basculer')}
        className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold
                   hover:bg-gray-100 dark:hover:bg-gray-700 transition
                   text-gray-600 dark:text-gray-300"
      >
        {langue === 'fr' ? 'FR' : 'MG'}
      </button>
    </div>
  )
}