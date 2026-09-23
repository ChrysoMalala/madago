"""
Génération du billet PDF pour une réservation.

Le billet contient :
- Les informations complètes du trajet (villes, date, heure, siège)
- Le titulaire du billet (personne qui voyage réellement)
- Le compte ayant effectué la réservation
- Un QR code encodant le code_billet (usage informatif pour l'instant)
"""

import io

import qrcode
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib import colors


def _generer_image_qr(contenu):
    """
    Génère une image QR (en mémoire, sans fichier temporaire sur
    disque) à partir d'une chaîne de caractères, et la retourne
    sous une forme utilisable directement par reportlab.
    """
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(contenu)
    qr.make(fit=True)
    image_qr = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    image_qr.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer


def generer_pdf_billet(reservation):
    """
    Construit le PDF du billet pour UNE SEULE réservation.
    Conservée pour les réservations individuelles (sans groupe) et
    pour la compatibilité avec les réservations créées avant
    l'introduction du regroupement.
    Retourne un buffer BytesIO prêt à être envoyé en réponse HTTP.
    """
    return _construire_pdf_billet([reservation])


def generer_pdf_billet_groupe(reservations):
    """
    Construit UN SEUL PDF listant plusieurs réservations faites dans
    la même commande (même groupe_reservation) : par exemple 3 sièges
    réservés en une fois sur le même trajet.

    `reservations` doit être une liste non vide de Reservation. On
    suppose qu'elles partagent le même trajet, le même passager, le
    même type_reservation et les mêmes points de ramassage/dépose
    (c'est garanti par le frontend, qui applique un seul choix pour
    toute la commande).
    """
    return _construire_pdf_billet(reservations)


def _construire_pdf_billet(reservations):
    """
    Fonction interne commune : construit le PDF à partir d'une liste
    d'une ou plusieurs réservations. S'il y en a plusieurs, elles
    sont listées ensemble sous un seul en-tête voyageur/trajet.
    """
    premiere = reservations[0]
    trajet = premiere.trajet
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A5,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    style_titre = ParagraphStyle(
        'TitreBillet', parent=styles['Title'], fontSize=18,
        textColor=HexColor('#1E3A8A'), spaceAfter=4,
    )
    style_soustitre = ParagraphStyle(
        'SousTitre', parent=styles['Normal'], fontSize=10,
        textColor=HexColor('#6B7280'), spaceAfter=12,
    )
    style_section = ParagraphStyle(
        'Section', parent=styles['Heading2'], fontSize=12,
        textColor=HexColor('#1E3A8A'), spaceBefore=10, spaceAfter=6,
    )

    elements = []

    # ── En-tête ──────────────────────────────────────────────────
    elements.append(Paragraph("MadaGo — Billet de trajet", style_titre))

    if len(reservations) > 1:
        reference = premiere.groupe_reservation or premiere.code_billet
        elements.append(Paragraph(
            f"Référence commande : {reference} · {len(reservations)} places",
            style_soustitre
        ))
    else:
        elements.append(Paragraph(
            f"Référence : {premiere.code_billet}", style_soustitre
        ))

    # ── Titulaire du billet vs réservateur ──────────────────────
    # Un seul choix "pour moi / pour un proche" s'applique à toute
    # la commande, donc cette section est affichée UNE SEULE FOIS,
    # même si plusieurs sièges sont listés plus bas.
    elements.append(Paragraph("Voyageur", style_section))

    lignes_identite = [
        ["Passager :", premiere.nom_titulaire()],
    ]
    if premiere.type_reservation == 'autre_personne':
        if premiere.beneficiaire_telephone:
            lignes_identite.append(
                ["Téléphone :", premiere.beneficiaire_telephone]
            )
        lignes_identite.append(
            ["Réservé par :", f"{premiere.passager.prenom} {premiere.passager.nom} "
                               f"({premiere.passager.email})"]
        )
    else:
        lignes_identite.append(
            ["Compte :", premiere.passager.email]
        )

    table_identite = Table(lignes_identite, colWidths=[35 * mm, 100 * mm])
    table_identite.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
    ]))
    elements.append(table_identite)

    # ── Détails du trajet (communs à toute la commande) ────────────
    elements.append(Paragraph("Trajet", style_section))

    lignes_trajet = [
        ["Itinéraire :", f"{trajet.ville_depart} → {trajet.ville_arrivee}"],
        ["Date :", str(trajet.date_depart)],
        ["Heure de départ :", str(trajet.heure_depart)[:5]],
        ["Distance :", f"{trajet.distance_km} km"],
        ["Point de ramassage :", premiere.point_ramassage.nom_lieu],
        ["Point de dépose :", premiere.point_depose.nom_lieu],
    ]
    table_trajet = Table(lignes_trajet, colWidths=[45 * mm, 90 * mm])
    table_trajet.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(table_trajet)

    # ── Liste des sièges (une ligne par réservation du groupe) ─────
    elements.append(Paragraph("Places réservées", style_section))

    entetes = ["Siège", "Code billet", "Prix"]
    lignes_sieges = [entetes]
    total = 0
    for r in reservations:
        lignes_sieges.append([
            f"N° {r.siege.numero_siege}",
            r.code_billet,
            f"{r.prix_total:,.0f} Ar",
        ])
        total += float(r.prix_total)

    lignes_sieges.append(["", "Total", f"{total:,.0f} Ar"])

    table_sieges = Table(lignes_sieges, colWidths=[30 * mm, 60 * mm, 45 * mm])
    table_sieges.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#EFF6FF')),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.grey),
        ('LINEABOVE', (0, -1), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(table_sieges)

    elements.append(Spacer(1, 12 * mm))

    # ── QR code ──────────────────────────────────────────────────
    # Encode la référence commune (groupe_reservation si plusieurs
    # réservations, sinon le code_billet unique).
    contenu_qr = (
        premiere.groupe_reservation
        if len(reservations) > 1 and premiere.groupe_reservation
        else premiere.code_billet
    )
    buffer_qr = _generer_image_qr(contenu_qr)
    elements.append(Image(buffer_qr, width=35 * mm, height=35 * mm))

    elements.append(Spacer(1, 6 * mm))
    elements.append(Paragraph(
        f"Statut : {premiere.get_statut_display()}",
        style_soustitre
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer