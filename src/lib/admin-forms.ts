import type { Field } from "./settings-schema";
import { THEME_ICON_KEYS } from "@/components/ui/icons-keys";

export const themeFields: Field[] = [
  { name: "title", label: "Titre", type: "l10n" },
  { name: "slug", label: "Identifiant d'URL (laisser vide pour le générer)", type: "text" },
  { name: "icon", label: "Icône", type: "select", options: THEME_ICON_KEYS.map((k) => ({ value: k, label: k })) },
  { name: "order", label: "Ordre d'affichage", type: "number", min: 0, max: 999 },
  { name: "summary", label: "Résumé", type: "l10nText" },
  { name: "body", label: "Présentation détaillée", type: "l10nMarkdown" },
  { name: "measures", label: "Mesures clés", type: "l10nLines" },
  { name: "image", label: "Image (facultative)", type: "image" },
  { name: "published", label: "Publié", type: "boolean" },
];

export function articleFields(categories: { id: string; name: string }[]): Field[] {
  return [
    { name: "title", label: "Titre", type: "l10n" },
    { name: "slug", label: "Identifiant d'URL (laisser vide pour le générer)", type: "text" },
    { name: "excerpt", label: "Chapô / résumé", type: "l10nText" },
    { name: "body", label: "Contenu", type: "l10nMarkdown" },
    { name: "categoryId", label: "Catégorie", type: "select", options: [{ value: "", label: "— Aucune —" }, ...categories.map((c) => ({ value: c.id, label: c.name }))] },
    { name: "coverImage", label: "Image principale", type: "image" },
    { name: "coverAlt", label: "Texte alternatif de l'image (accessibilité)", type: "text" },
    { name: "videoUrl", label: "Vidéo (URL YouTube ou Vimeo)", type: "url" },
    {
      name: "status",
      label: "Statut",
      type: "select",
      options: [
        { value: "DRAFT", label: "Brouillon" },
        { value: "PUBLISHED", label: "Publié / programmé" },
        { value: "ARCHIVED", label: "Archivé" },
      ],
    },
    { name: "publishedAt", label: "Date de publication (date future = publication programmée)", type: "datetime" },
    { name: "featured", label: "Mettre en avant", type: "boolean" },
    { name: "seoTitle", label: "Titre SEO (facultatif)", type: "text" },
    { name: "seoDescription", label: "Description SEO (facultative)", type: "textarea" },
  ];
}

export const categoryFields: Field[] = [
  { name: "name", label: "Nom", type: "l10n" },
  { name: "slug", label: "Identifiant d'URL", type: "text" },
  { name: "order", label: "Ordre", type: "number", min: 0, max: 999 },
];

export const eventFields: Field[] = [
  { name: "title", label: "Titre", type: "l10n" },
  { name: "slug", label: "Identifiant d'URL (laisser vide pour le générer)", type: "text" },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "MEETING", label: "Meeting" },
      { value: "CONFERENCE", label: "Conférence" },
      { value: "TRAVEL", label: "Déplacement" },
      { value: "RALLY", label: "Rassemblement" },
      { value: "OTHER", label: "Autre" },
    ],
  },
  { name: "startsAt", label: "Début", type: "datetime" },
  { name: "endsAt", label: "Fin (facultatif)", type: "datetime" },
  { name: "venue", label: "Lieu", type: "text", required: true },
  { name: "address", label: "Adresse", type: "text" },
  { name: "city", label: "Commune / ville", type: "text", required: true },
  { name: "description", label: "Description", type: "l10nMarkdown" },
  { name: "image", label: "Image", type: "image" },
  { name: "registrationEnabled", label: "Inscriptions ouvertes", type: "boolean" },
  { name: "capacity", label: "Capacité (0 = illimitée)", type: "number", min: 0, max: 1000000 },
  { name: "published", label: "Publié", type: "boolean" },
];

export const mediaFields: Field[] = [
  { name: "title", label: "Légende", type: "l10n" },
  { name: "type", label: "Type", type: "select", options: [{ value: "PHOTO", label: "Photo" }, { value: "VIDEO", label: "Vidéo" }] },
  {
    name: "category",
    label: "Catégorie",
    type: "select",
    options: [
      { value: "MEETING", label: "Meetings" },
      { value: "VISIT", label: "Visites" },
      { value: "INTERVIEW", label: "Interviews" },
      { value: "CONFERENCE", label: "Conférences" },
      { value: "OTHER", label: "Divers" },
    ],
  },
  { name: "imageUrl", label: "Photo (ou miniature pour une vidéo)", type: "image" },
  { name: "videoUrl", label: "URL de la vidéo (YouTube / Vimeo)", type: "url" },
  { name: "takenAt", label: "Date", type: "datetime" },
  { name: "order", label: "Ordre", type: "number", min: 0, max: 9999 },
  { name: "published", label: "Publié", type: "boolean" },
];

export const reportFields: Field[] = [
  { name: "title", label: "Titre", type: "l10n" },
  { name: "period", label: "Période couverte", type: "text", required: true },
  { name: "description", label: "Description", type: "l10nText" },
  { name: "fileUrl", label: "Fichier PDF", type: "file", required: true, help: "Téléversez le rapport au format PDF." },
  { name: "published", label: "Publié sur le site", type: "boolean" },
];
