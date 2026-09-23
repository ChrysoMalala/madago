from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.contrib import messages
from .models import Conducteur


@admin.register(Conducteur)
class ConducteurAdmin(admin.ModelAdmin):

    # ── Liste ──────────────────────────────────────────────────────────
    list_display = (
        'id',
        'nom_complet',
        'email_conducteur',
        'statut_badge',
        'operateur_mobile_money',
        'date_creation',
    )
    list_filter = ('statut_validation', 'operateur_mobile_money')
    search_fields = (
        'utilisateur__email',
        'utilisateur__nom',
        'utilisateur__prenom',
        'numero_cin',
        'numero_permis',
    )
    ordering = ('-date_creation',)
    actions = ['approuver_conducteurs', 'rejeter_conducteurs']

    # ── Détail ─────────────────────────────────────────────────────────
    readonly_fields = (
        'date_creation',
        'date_validation',
        'note_moyenne',
        'apercu_cin_recto',
        'apercu_cin_verso',
        'apercu_permis_recto',
        'apercu_permis_verso',
    )

    fieldsets = (
        ('👤 Informations personnelles', {
            'fields': (
                'utilisateur',
                'date_naissance',
                'lieu_naissance',
            )
        }),
        ('🪪 Carte d\'identité (CIN)', {
            'fields': (
                'numero_cin',
                'apercu_cin_recto',
                'cin_recto',
                'apercu_cin_verso',
                'cin_verso',
            )
        }),
        ('🚗 Permis de conduire', {
            'fields': (
                'numero_permis',
                'categorie_permis',
                'apercu_permis_recto',
                'permis_recto',
                'apercu_permis_verso',
                'permis_verso',
            )
        }),
        ('📞 Contact d\'urgence', {
            'fields': (
                'contact_urgence_nom',
                'contact_urgence_telephone',
            )
        }),
        ('💳 Mobile Money', {
            'fields': (
                'operateur_mobile_money',
                'numero_mobile_money',
                'titulaire_mobile_money',
            )
        }),
        ('✅ Validation du dossier', {
            'fields': (
                'statut_validation',
                'motif_rejet',
                'date_validation',
                'note_moyenne',
                'date_creation',
            )
        }),
    )

    # ── Colonnes personnalisées ────────────────────────────────────────
    def nom_complet(self, obj):
        return f"{obj.utilisateur.prenom} {obj.utilisateur.nom}"
    nom_complet.short_description = 'Nom complet'

    def email_conducteur(self, obj):
        return obj.utilisateur.email
    email_conducteur.short_description = 'Email'

    def statut_badge(self, obj):
        styles = {
            'en_attente': ('#f59e0b', '⏳ En attente'),
            'valide':     ('#10b981', '✅ Validé'),
            'rejete':     ('#ef4444', '❌ Rejeté'),
        }
        couleur, label = styles.get(
            obj.statut_validation,
            ('#888', obj.statut_validation)
        )
        return format_html(
            '<span style="color:{}; font-weight:bold;">{}</span>',
            couleur, label
        )
    statut_badge.short_description = 'Statut'

    # ── Aperçus images ─────────────────────────────────────────────────
    def _apercu(self, champ, label):
        if champ:
            return format_html(
                '<a href="{}" target="_blank">'
                '<img src="{}" style="max-height:200px; border-radius:8px; border:1px solid #ddd;"/>'
                '</a>',
                champ.url, champ.url
            )
        return "Aucune image uploadée"

    def apercu_cin_recto(self, obj):
        return self._apercu(obj.cin_recto, 'CIN recto')
    apercu_cin_recto.short_description = 'Aperçu CIN recto'

    def apercu_cin_verso(self, obj):
        return self._apercu(obj.cin_verso, 'CIN verso')
    apercu_cin_verso.short_description = 'Aperçu CIN verso'

    def apercu_permis_recto(self, obj):
        return self._apercu(obj.permis_recto, 'Permis recto')
    apercu_permis_recto.short_description = 'Aperçu permis recto'

    def apercu_permis_verso(self, obj):
        return self._apercu(obj.permis_verso, 'Permis verso')
    apercu_permis_verso.short_description = 'Aperçu permis verso'

    # ── Action : Approuver ─────────────────────────────────────────────
    @admin.action(description="✅ Approuver les conducteurs sélectionnés")
    def approuver_conducteurs(self, request, queryset):
        count = queryset.exclude(statut_validation='valide').update(
            statut_validation='valide',
            date_validation=timezone.now(),
            motif_rejet=None,
        )
        self.message_user(
            request,
            f"{count} conducteur(s) approuvé(s) avec succès.",
            messages.SUCCESS
        )

    # ── Action : Rejeter ───────────────────────────────────────────────
    @admin.action(description="❌ Rejeter les conducteurs sélectionnés")
    def rejeter_conducteurs(self, request, queryset):
        count = queryset.exclude(statut_validation='rejete').update(
            statut_validation='rejete',
            date_validation=timezone.now(),
            motif_rejet='Dossier incomplet ou non conforme.',
        )
        self.message_user(
            request,
            f"{count} conducteur(s) rejeté(s).",
            messages.WARNING
        )

    # ── Sauvegarde : mise à jour date_validation auto ──────────────────
    def save_model(self, request, obj, form, change):
        if change and 'statut_validation' in form.changed_data:
            obj.date_validation = timezone.now()
        super().save_model(request, obj, form, change)