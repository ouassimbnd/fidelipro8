/** Contenu commercial Fideli. Les prix et hypothèses restent centralisés ici. */
export const landingConfig = {
  brand: "Fideli",
  currency: "EUR",
  currencySymbol: "€",
  roi: {
    customersPerDay: { initial: 35, min: 5, max: 250, step: 1 },
    averageBasket: { initial: 25, min: 5, max: 250, step: 1 },
    openDays: { initial: 24, min: 5, max: 31, step: 1 },
    hypotheticalGrowth: { initial: 5, min: 0, max: 20, step: 1 },
  },
  pricing: {
    trialDays: 30,
    annualDiscountLabel: "2 mois offerts",
    taxLabel: "HT",
    availability: "Tarifs de lancement configurables avant commercialisation. Aucun paiement n’est intégré à cette démo.",
    plans: [
      { id: "essentiel", name: "Essentiel", monthly: 9, annualPerMonth: 7, highlight: false, tagline: "Pour lancer son premier programme", features: ["1 établissement", "QR code d’adhésion", "Points et récompenses", "Tableau de bord essentiel"] },
      { id: "pro", name: "Pro", monthly: 19, annualPerMonth: 15, highlight: true, tagline: "Pour piloter la fidélité au quotidien", features: ["Tout Essentiel", "Segmentation clients", "Parrainage", "Statistiques détaillées", "Accès équipe"] },
      { id: "multi", name: "Multi-sites", monthly: 39, annualPerMonth: 31, highlight: false, tagline: "Pour les PME avec plusieurs établissements", features: ["Tout Pro", "Jusqu’à 5 établissements", "Équipe étendue", "Vue consolidée", "Support prioritaire"] },
    ],
  },
  trust: [
    { icon: "🔒", title: "Accès cloisonnés", description: "Chaque professionnel retrouve son établissement et ses données dans son propre espace." },
    { icon: "✓", title: "Consentement clair", description: "Le parcours client prévoit les informations et consentements nécessaires à l’adhésion au programme." },
    { icon: "↗", title: "Pensé pour le terrain", description: "Une interface courte à utiliser au comptoir, sur ordinateur, tablette ou téléphone." },
  ],
  differentiators: [
    "Un support physique Fideli avec NFC + QR code pour déclencher l’adhésion",
    "Une page client aux couleurs du commerce, sans application à installer",
    "Un espace professionnel pour points, récompenses, clients et activité",
    "Une architecture multi-commerce : chaque PME garde son propre programme",
  ],
  programExample: { pointsPerVisit: 10, rewardPoints: 80 },
  mockupExample: { cardPoints: 50, visitsThisMonth: 24 },
} as const;

export const landingFeatures = [
  { icon: "⌁", title: "NFC + QR à l’accueil", description: "Posez votre support Fideli au comptoir : le client approche son téléphone ou scanne pour rejoindre le programme." },
  { icon: "✳", title: "Espace client mobile", description: "Le client consulte son solde, ses avantages et les récompenses disponibles depuis une page simple." },
  { icon: "+", title: "Points et récompenses", description: "Choisissez votre mécanique et définissez les avantages qui correspondent réellement à votre activité." },
  { icon: "▦", title: "Pilotage professionnel", description: "Suivez les adhésions, passages, montants saisis et récompenses depuis un tableau de bord dédié." },
  { icon: "◎", title: "Connaissance client", description: "Repérez les habitudes utiles à votre fidélisation sans mélanger les données entre établissements." },
  { icon: "↗", title: "Équipe et points de vente", description: "Préparez des accès adaptés à vos collaborateurs et faites évoluer Fideli avec votre PME." },
] as const;

export const landingStats = [
  { value: "01", text: "support NFC + QR pour inviter le client à rejoindre le programme" },
  { value: "0", text: "application à télécharger pour accéder à son espace fidélité" },
  { value: "03", text: "gestes clés : rejoindre, cumuler, profiter de ses avantages" },
  { value: "24/7", text: "accès au tableau de bord et au profil client depuis le web" },
] as const;
export const statsNote = "Ces éléments décrivent le fonctionnement de la solution et de la démo Fideli ; ils ne constituent pas une promesse de performance commerciale.";
