/* Tablenote MVP — local-first SOAP charting.
   Everything lives in localStorage on this device; nothing is sent anywhere. */
(function () {
  'use strict';

  var KEY = 'tablenote.v1';

  // Sales switch. While checkoutUrl is empty the free limit is not enforced (beta stays fully open).
  // storeId: set to the Lemon Squeezy store id so only our keys unlock the app.
  var SALES = { checkoutUrl: '', lifetimeUrl: '', storeId: null, freeClients: 3, priceLabel: '$59/year', lifetimeLabel: '$79 once' };
  var LICENSE_API = 'https://api.lemonsqueezy.com/v1/licenses/';
  var view = document.getElementById('view');
  var saveState = document.getElementById('save-state');

  // Stored values stay in English (they are data); labels shown on screen come from the dictionary.
  var MODALITIES = ['Swedish', 'Deep tissue', 'Sports', 'Myofascial release', 'Trigger point', 'Prenatal', 'Lymphatic drainage', 'Hot stone', 'Other'];
  var DURATIONS = [30, 45, 60, 75, 90, 120];
  var SOAP = [{ k: 's', letter: 'S' }, { k: 'o', letter: 'O' }, { k: 'a', letter: 'A' }, { k: 'p', letter: 'P' }];

  /* ---------- languages ---------- */
  var LANG_KEY = 'tablenote.lang';
  var LOCALE = { en: 'en-US', fr: 'fr-CA', es: 'es-US' };
  var HTML_LANG = { en: 'en', fr: 'fr-CA', es: 'es' };
  var I18N = {
    en: {
      saved: 'Saved on this device', notSaved: 'Not saved. This browser is blocking storage',
      'nav.export': 'Export', 'nav.signin': 'Sign in', 'nav.account': 'Account', 'nav.home': 'Tablenote, all clients', 'nav.lang': 'Language',
      'n.client': { one: '{n} client', other: '{n} clients' }, 'n.note': { one: '{n} note', other: '{n} notes' },
      'n.visit': { one: '{n} visit', other: '{n} visits' }, 'n.time': { one: '{n} time', other: '{n} times' },
      min: '{n} min', session: 'Session', example: 'Example', precautions: 'Precautions', precautionsColon: 'Precautions:',
      noVisits: 'No visits yet', notRecorded: 'Not recorded', cancel: 'Cancel', clients: 'Clients', never: 'never', unknownTime: 'unknown time',
      'price.perYear': '/year', 'price.once': ' once',
      mods: ['Swedish', 'Deep tissue', 'Sports', 'Myofascial release', 'Trigger point', 'Prenatal', 'Lymphatic drainage', 'Hot stone', 'Other'],
      pressures: ['Light', 'Light-med', 'Medium', 'Firm', 'Deep'],
      's.title': 'Subjective', 's.help': 'what the client reports',
      's.chips': ['Low back pain', 'Stiff neck on waking', 'Headaches', 'Desk work 8 h/day', 'Training for an event', 'Poor sleep', 'Requested firm pressure', 'Pain since last visit'],
      'o.title': 'Objective', 'o.help': 'what you observed or palpated',
      'o.chips': ['Hypertonicity', 'Trigger point', 'Tenderness on palpation', 'Limited ROM', 'Adhesions', 'Forward head posture', 'Elevated shoulder', 'Edema'],
      'a.title': 'Assessment', 'a.help': 'how the tissue responded',
      'a.chips': ['Tissue responded well', 'ROM improved', 'Pain decreased', 'Tolerated pressure well', 'Mild soreness expected', 'Little change this session'],
      'p.title': 'Plan', 'p.help': 'next visit and home care',
      'p.chips': ['Return in 1 week', 'Return in 2 weeks', 'Return in 4 weeks', 'Home stretch daily', 'Heat 15 min', 'Hydrate', 'Refer to PT/physician if no change'],
      // upgrade / license
      'up.founding': 'Founding member', 'up.lifetime': 'Lifetime member', 'up.yourPlan': 'Your plan',
      'up.unlimited': 'Unlimited clients on this device{until}. Thank you for supporting Tablenote.', 'up.until': ' until {d}',
      'up.remove': 'Remove license from this device',
      'up.free': 'The free plan covers {n} clients. A founding membership unlocks unlimited clients on your phone and laptop.',
      'up.buy': 'Become a founding member, {p}', 'up.once': 'Pay once, {p}', 'up.haveKey': 'Have a license key?',
      'up.keyPh': 'Paste the key from your receipt email', 'up.activate': 'Activate',
      'up.limit': 'You have {n} clients, the most the free plan holds. Your existing notes stay free to view, edit and export. To add more clients, become a founding member.',
      'lic.paste': 'Paste the license key from your receipt email.', 'lic.checking': 'Checking your key…',
      'lic.ok': 'Activated. Unlimited clients are unlocked on this device.',
      'lic.notFound': "That key wasn't found. Check it against your receipt email and try again.",
      'lic.limit': 'This key is already active on the maximum number of devices. Remove it from another device first.',
      'lic.wrongStore': 'This key is not for Tablenote.', 'lic.err': "Couldn't check the key. Check your connection and try again.",
      // banners
      'ios.banner': '<b>Keep your notes safe on iPhone.</b> Safari clears website data after 7 days without a visit. Add Tablenote to your Home Screen to keep notes: tap the Share button, then “Add to Home Screen”, and open it from there.',
      'bk.paused': '<b>Automatic backup is paused.</b> Your browser asks again after a restart.', 'bk.resume': 'Resume automatic backup',
      'bk.last': 'Last backup {d}.', 'bk.none': 'No backup yet.',
      'bk.everyFew': 'Notes are stored only on this device. Save a backup file to your cloud drive every few days.',
      'bk.weekly': 'Notes are stored only on this device. Save a backup file to your cloud drive once a week.',
      'bk.share': 'Save backup to iCloud or Drive', 'bk.download': 'Download backup', 'bk.shareTitle': 'Tablenote backup',
      // client list
      'list.example': '{name} is an <b>example client</b> so you can see how notes look. Remove it whenever you like.',
      'list.removeExample': 'Remove example', 'list.new': 'New client', 'list.find': 'Find a client', 'list.searchPh': 'Search by name',
      'list.last': 'last: {m}', 'list.noMatch': 'No client matches “{q}”.', 'list.emptyTitle': 'No clients yet',
      'list.emptyText': 'Add your first client, then start a SOAP note right after the session.', 'list.add': 'Add a client',
      // client form
      'cf.name': 'Name', 'cf.namePh': 'First and last name', 'cf.nameErr': "Add the client's name to save.", 'cf.phone': 'Phone', 'cf.email': 'Email',
      'cf.history': 'Health history', 'cf.historyPh': 'Occupation, activity, injuries, surgeries, medications',
      'cf.contra': 'Precautions &amp; contraindications', 'cf.contraPh': 'e.g. pregnancy, varicose veins, recent surgery, allergies to oils',
      'cf.contraHint': 'Shown at the top of every note for this client.', 'cf.save': 'Save details', 'cf.add': 'Add client', 'cf.delete': 'Delete client',
      'nc.title': 'New client',
      // client page
      'cl.last': 'last {d}', 'cl.newNote': 'New SOAP note', 'cl.edit': 'Edit details', 'cl.printAll': 'Print or save all visits', 'cl.visits': 'Visits',
      'cl.pain': 'pain {b}→{a}', 'cl.emptyText': 'Start a SOAP note after your first session with {first}.',
      // note
      'nt.title': 'SOAP note', 'nt.repeat': 'Same as last time? Start from the notes of {d} and change what is different.', 'nt.repeatBtn': 'Start from last visit',
      'nt.date': 'Date', 'nt.length': 'Length', 'nt.modality': 'Modality', 'nt.painBefore': 'Pain before', 'nt.painAfter': 'Pain after',
      'nt.painScale': '0 none · 10 worst', 'nt.pressure': 'Pressure', 'nt.pressureScale': '1 light · 5 deep', 'nt.pressureOf': '{p} pressure',
      'nt.chips': 'Quick phrases for {s}', 'nt.chart': 'Body chart', 'nt.markType': 'Mark type',
      'nt.chartHint': "Tap the figure to add a mark, tap a mark to remove it. On the anterior view, the client's left is on your right.",
      'nt.copyMarks': 'Copy marks from {d}', 'nt.earlier': 'Earlier versions ({n})', 'nt.done': 'Done', 'nt.print': 'Print or save PDF',
      'nt.delete': 'Delete note', 'nt.noMarks': 'No marks yet.', 'nt.removeMark': 'Remove {r}',
      'nt.written': 'Written {t}. Changes from now on are kept as an amendment; the current version is saved first.',
      'nt.amended': '<b>Amended {times}</b>, last on {t}. Every earlier version is kept below and on the printout.',
      'v.blank': 'blank', 'v.pain': 'pain', 'v.marks': 'marks', 'v.head': '<b>Version {i}</b> written {t}{by}; replaced {r}', 'v.by': ' by {who}',
      // paper / print
      'p.client': 'Client', 'p.date': 'Date', 'p.session': 'Session', 'p.pain': 'Pain before → after', 'p.outOf': '{b} → {a} out of 10',
      'p.addDetails': 'Add your name and license number under Export', 'p.noMarks': 'No marks recorded.', 'p.written': 'Written {t}',
      'p.amended': '. Amended {times}, last {t}. Earlier versions follow.', 'p.notAmended': '. Not amended.', 'p.history': 'Amendment history',
      'p.signature': 'Therapist signature', 'pr.print': 'Print or save as PDF', 'pr.backNote': 'Back to note',
      'pr.hint': 'In the print window, choose “Save as PDF” to keep a file. On iPhone, tap Share, then Print, then Share again to save the PDF.',
      'doc.allVisits': 'all-visits',
      // export page
      'd.title': 'Export &amp; backup', 'd.sub': 'Your records, in files you keep.', 'd.whereTitle': 'Where your notes are',
      'd.whereText': 'Saved in this browser on this device. Nothing is sent to a server. Clearing browser data or switching phones removes them, so keep a backup file.',
      'd.example': ' ({n} example)', 'd.lastBackup': 'last backup: {d}',
      'd.autoTitle': 'Automatic backup',
      'd.autoOn': 'On. A backup file is saved to <b>{f}</b> every time you change a note (one file per day). Pick a Google Drive, Dropbox, OneDrive or iCloud Drive folder and the copy leaves this computer too.',
      'd.changeFolder': 'Change folder', 'd.turnOff': 'Turn off', 'd.autoPaused': 'Paused for <b>{f}</b>. Your browser asks again after a restart.',
      'd.autoOff': 'Choose a folder once and Tablenote saves a backup file there every time you change a note, keeping the newest 30 days. Pick a Google Drive, Dropbox, OneDrive or iCloud Drive folder so the copy also leaves this computer.',
      'd.chooseFolder': 'Choose backup folder', 'd.autoSaved': 'Saved a backup to {f}.', 'd.autoErr': "Couldn't use that folder. Try another one.",
      'd.dlTitle': 'Download', 'd.full': 'Full backup (.json)', 'd.csv': 'All notes as spreadsheet (.csv)',
      'd.dlText': 'The backup file restores everything on another device. The spreadsheet opens in Excel, Numbers or Google Sheets. For a PDF of one visit, open the note and choose “{p}”.',
      'd.detailsTitle': 'Your details on printed notes', 'd.yourName': 'Your name', 'd.namePh': 'e.g. Sam Rivera',
      'd.credential': 'License or credential', 'd.credentialPh': 'e.g. LMT #MA12345', 'd.practice': 'Practice name', 'd.practicePh': 'e.g. Rivera Bodywork',
      'd.importTitle': 'Import clients',
      'd.importText': 'Bring in your client list from Square, your booking app or any spreadsheet saved as CSV. Names, phone numbers and emails come across; clients already here are skipped.',
      'd.chooseCsv': 'Choose CSV file', 'imp.add': 'Add <b>{c}</b>', 'imp.skipped': ' ({n} already here or without a name are skipped)',
      'imp.capped': '. The free plan holds {free} clients, so {n} more need a paid plan', 'imp.more': ' and more', 'imp.confirm': 'Add clients',
      'imp.added': 'Added {c}.', 'imp.none': 'No new clients found in that file.', 'imp.noneFull': 'No new clients found in that file. The free plan is full.',
      'imp.err': "Couldn't read client names from that file. Save it as CSV with a header row that has a name column (for example First Name and Last Name).",
      'd.restoreTitle': 'Restore from a backup', 'd.restoreText': 'Replaces the notes on this device with the ones in a Tablenote backup file.',
      'd.chooseBackup': 'Choose backup file', 'rs.confirm': 'Replace {c1} and {n1} on this device with {c2} and {n2} from the file?',
      'rs.replace': 'Replace data', 'rs.keep': 'Keep current data', 'rs.done': 'Restored {c} and {n}.',
      'rs.err': "That file isn't a Tablenote backup. Choose a file named tablenote-backup-….json.",
      'd.wipeTitle': 'Delete everything', 'd.wipeText': 'Removes all clients and notes from this device. Download a backup first if you might need them.',
      'd.wipeBtn': 'Delete all data', 'd.privacy': 'Privacy Policy', 'd.terms': 'Terms of Use',
      // confirm twice
      'ct.clientKeep': 'Records often must be kept for years. Tap again to delete client and visits', 'ct.client': 'Tap again to delete client and visits',
      'ct.noteKeep': 'Records often must be kept for years. Tap again to delete', 'ct.note': 'Tap again to delete',
      'ct.license': 'Tap again to remove the license', 'ct.wipe': 'Tap again to delete all data', 'ct.account': 'Tap again to delete your account',
      // account
      'ac.title': 'Account', 'ac.sub': 'Your plan and details on every device.', 'ac.closed': 'Accounts are not open yet.', 'ac.checking': 'Checking…',
      'ac.offline': 'You’re offline. Your notes still work; sign in when you’re back online.', 'ac.signedIn': 'Signed in', 'ac.plan': 'Plan: {p}',
      'ac.paid': 'Paid, renews or ends {d}', 'ac.lifetime': 'Lifetime', 'ac.free': 'Free',
      'ac.follows': 'Your plan and the name and license number on printed notes follow this account. Sign in on another phone or computer and they come with you.',
      'ac.never': 'Client notes are never uploaded. They stay on each device; move them with a backup file from Export.',
      'ac.signout': 'Sign out', 'ac.delete': 'Delete account', 'ac.create': 'Create your account', 'ac.signin': 'Sign in',
      'ac.intro': 'Keep your plan and details on every device. Client notes stay on your device and are never uploaded.',
      'ac.google': 'Continue with Google', 'ac.email': 'Email', 'ac.password': 'Password', 'ac.createBtn': 'Create account', 'ac.forgot': 'Forgot password?',
      'ac.haveAcct': 'Already have an account?', 'ac.newHere': 'New here?', 'ac.createLink': 'Create an account',
      'ac.resetNeedEmail': 'Type your email above, then tap Forgot password.', 'ac.resetSent': 'If that email has an account, a reset link is on its way.',
      'ac.deleted': 'Account deleted. Notes on this device are untouched.', 'ac.addEmail': 'Add your email.', 'ac.creating': 'Creating your account…', 'ac.signingIn': 'Signing in…',
      'ae.mismatch': 'That email and password don’t match. Try again or reset your password.', 'ae.inUse': 'That email already has an account. Sign in instead.',
      'ae.weak': 'Use at least 8 characters for your password.', 'ae.email': 'Check the email address.', 'ae.tooMany': 'Too many tries. Wait a few minutes and try again.',
      'ae.recent': 'For safety, sign out and sign in again, then delete the account.', 'ae.network': 'No connection. Notes still work; sign in when you’re back online.',
      'ae.generic': 'Something went wrong. Try again.',
      // example client (written in the language active when it was created)
      'ex.history': 'Desk job, about 8 hours a day. Runs 3 times a week. Prefers firm pressure on back and shoulders.',
      'ex.contra': 'Varicose veins behind L knee. Light pressure only on posterior L leg.',
      'ex.n1': ['Stiff neck on waking; worse after long days at the desk. Pain 6/10 at worst. Requested firm pressure.',
        'Hypertonicity in bilateral upper trapezius, R > L. Trigger point R rhomboids. Cervical rotation limited to the L.',
        'Tissue responded well. Cervical ROM improved. Pain 3/10 after session.',
        'Return in 2 weeks. Home stretch: upper trap, 3 × 30 s daily. Heat 15 min in the evening.'],
      'ex.n2': ['Low back tight after a long run. No numbness or tingling.',
        'Tenderness on palpation, L quadratus lumborum. Mild hypertonicity in gluteals.',
        'Tolerated pressure well. Mild soreness expected.',
        'Return in 2 weeks. Hydrate. Hip flexor stretch after runs.']
    },
    fr: {
      saved: 'Enregistré sur cet appareil', notSaved: 'Non enregistré. Ce navigateur bloque le stockage',
      'nav.export': 'Exporter', 'nav.signin': 'Connexion', 'nav.account': 'Compte', 'nav.home': 'Tablenote, toute la clientèle', 'nav.lang': 'Langue',
      'n.client': { one: '{n} client(e)', other: '{n} client(e)s' }, 'n.note': { one: '{n} note', other: '{n} notes' },
      'n.visit': { one: '{n} séance', other: '{n} séances' }, 'n.time': { one: '{n} fois', other: '{n} fois' },
      min: '{n} min', session: 'Séance', example: 'Exemple', precautions: 'Précautions', precautionsColon: 'Précautions :',
      noVisits: 'Aucune séance pour l’instant', notRecorded: 'Non indiqué', cancel: 'Annuler', clients: 'Clientèle', never: 'jamais', unknownTime: 'heure inconnue',
      'price.perYear': '/an', 'price.once': ' une seule fois',
      mods: ['Suédois', 'Tissus profonds', 'Sportif', 'Relâchement myofascial', 'Points gâchettes', 'Prénatal', 'Drainage lymphatique', 'Pierres chaudes', 'Autre'],
      pressures: ['Légère', 'Légère-moy.', 'Moyenne', 'Ferme', 'Profonde'],
      's.title': 'Subjectif', 's.help': 'ce que la personne rapporte',
      's.chips': ['Douleur lombaire', 'Raideur au cou au réveil', 'Maux de tête', 'Travail de bureau 8 h/jour', 'S’entraîne pour une compétition', 'Sommeil perturbé', 'Demande une pression ferme', 'Douleur depuis la dernière séance'],
      'o.title': 'Objectif', 'o.help': 'ce que vous avez observé ou palpé',
      'o.chips': ['Hypertonicité', 'Point gâchette', 'Sensibilité à la palpation', 'Amplitude articulaire limitée', 'Adhérences', 'Tête projetée vers l’avant', 'Épaule surélevée', 'Œdème'],
      'a.title': 'Analyse', 'a.help': 'la réponse des tissus',
      'a.chips': ['Bonne réponse des tissus', 'Amplitude améliorée', 'Douleur diminuée', 'Pression bien tolérée', 'Légères courbatures à prévoir', 'Peu de changement cette séance'],
      'p.title': 'Plan', 'p.help': 'prochaine séance et recommandations',
      'p.chips': ['Revoir dans 1 semaine', 'Revoir dans 2 semaines', 'Revoir dans 4 semaines', 'Étirements quotidiens à domicile', 'Chaleur 15 min', 'Bien s’hydrater', 'Référer en physio/au médecin si aucune amélioration'],
      'up.founding': 'Membre fondateur', 'up.lifetime': 'Membre à vie', 'up.yourPlan': 'Votre forfait',
      'up.unlimited': 'Dossiers illimités sur cet appareil{until}. Merci de soutenir Tablenote.', 'up.until': ' jusqu’au {d}',
      'up.remove': 'Retirer la licence de cet appareil',
      'up.free': 'Le forfait gratuit couvre {n} client(e)s. L’adhésion de membre fondateur débloque un nombre illimité de dossiers sur votre téléphone et votre portable.',
      'up.buy': 'Devenir membre fondateur, {p}', 'up.once': 'Payer une seule fois, {p}', 'up.haveKey': 'Vous avez une clé de licence?',
      'up.keyPh': 'Collez la clé reçue dans votre courriel de reçu', 'up.activate': 'Activer',
      'up.limit': 'Vous avez {n} client(e)s, le maximum du forfait gratuit. Vos notes existantes restent gratuites à consulter, modifier et exporter. Pour ajouter d’autres dossiers, devenez membre fondateur.',
      'lic.paste': 'Collez la clé de licence reçue dans votre courriel de reçu.', 'lic.checking': 'Vérification de la clé…',
      'lic.ok': 'Activée. Les dossiers illimités sont débloqués sur cet appareil.',
      'lic.notFound': 'Cette clé est introuvable. Comparez-la avec votre courriel de reçu et réessayez.',
      'lic.limit': 'Cette clé est déjà active sur le nombre maximal d’appareils. Retirez-la d’abord d’un autre appareil.',
      'lic.wrongStore': 'Cette clé n’est pas une clé Tablenote.', 'lic.err': 'Impossible de vérifier la clé. Vérifiez votre connexion et réessayez.',
      'ios.banner': '<b>Protégez vos notes sur iPhone.</b> Safari efface les données des sites Web après 7 jours sans visite. Ajoutez Tablenote à l’écran d’accueil pour conserver vos notes : touchez le bouton Partager, puis « Sur l’écran d’accueil », et ouvrez l’app à partir de là.',
      'bk.paused': '<b>La sauvegarde automatique est en pause.</b> Votre navigateur redemande l’autorisation après un redémarrage.', 'bk.resume': 'Reprendre la sauvegarde automatique',
      'bk.last': 'Dernière sauvegarde : {d}.', 'bk.none': 'Aucune sauvegarde pour l’instant.',
      'bk.everyFew': 'Les notes sont enregistrées uniquement sur cet appareil. Enregistrez un fichier de sauvegarde dans votre espace infonuagique tous les deux ou trois jours.',
      'bk.weekly': 'Les notes sont enregistrées uniquement sur cet appareil. Enregistrez un fichier de sauvegarde dans votre espace infonuagique une fois par semaine.',
      'bk.share': 'Sauvegarder dans iCloud ou Drive', 'bk.download': 'Télécharger la sauvegarde', 'bk.shareTitle': 'Sauvegarde Tablenote',
      'list.example': '{name} est un <b>dossier exemple</b> pour vous montrer à quoi ressemblent les notes. Supprimez-le quand vous voulez.',
      'list.removeExample': 'Supprimer l’exemple', 'list.new': 'Nouveau dossier', 'list.find': 'Trouver un dossier', 'list.searchPh': 'Rechercher par nom',
      'list.last': 'dernière : {m}', 'list.noMatch': 'Aucun dossier ne correspond à « {q} ».', 'list.emptyTitle': 'Aucun dossier pour l’instant',
      'list.emptyText': 'Ajoutez votre premier dossier client, puis rédigez une note SOAP juste après la séance.', 'list.add': 'Ajouter un(e) client(e)',
      'cf.name': 'Nom', 'cf.namePh': 'Prénom et nom', 'cf.nameErr': 'Inscrivez le nom du client ou de la cliente pour enregistrer.', 'cf.phone': 'Téléphone', 'cf.email': 'Courriel',
      'cf.history': 'Antécédents de santé', 'cf.historyPh': 'Profession, activités, blessures, chirurgies, médicaments',
      'cf.contra': 'Précautions et contre-indications', 'cf.contraPh': 'p. ex. grossesse, varices, chirurgie récente, allergie aux huiles',
      'cf.contraHint': 'Affiché en haut de chaque note de ce dossier.', 'cf.save': 'Enregistrer', 'cf.add': 'Créer le dossier', 'cf.delete': 'Supprimer le dossier',
      'nc.title': 'Nouveau dossier',
      'cl.last': 'dernière : {d}', 'cl.newNote': 'Nouvelle note SOAP', 'cl.edit': 'Modifier le dossier', 'cl.printAll': 'Imprimer ou enregistrer toutes les séances', 'cl.visits': 'Séances',
      'cl.pain': 'douleur {b}→{a}', 'cl.emptyText': 'Rédigez une note SOAP après votre première séance avec {first}.',
      'nt.title': 'Note SOAP', 'nt.repeat': 'Comme la dernière fois? Partez des notes du {d} et modifiez ce qui a changé.', 'nt.repeatBtn': 'Partir de la dernière séance',
      'nt.date': 'Date', 'nt.length': 'Durée', 'nt.modality': 'Technique', 'nt.painBefore': 'Douleur avant', 'nt.painAfter': 'Douleur après',
      'nt.painScale': '0 aucune · 10 pire', 'nt.pressure': 'Pression', 'nt.pressureScale': '1 légère · 5 profonde', 'nt.pressureOf': 'pression {p}',
      'nt.chips': 'Phrases rapides : {s}', 'nt.chart': 'Schéma corporel', 'nt.markType': 'Type de marque',
      'nt.chartHint': 'Touchez la silhouette pour ajouter une marque, touchez une marque pour l’enlever. En vue antérieure, la gauche de la personne est à votre droite.',
      'nt.copyMarks': 'Copier les marques du {d}', 'nt.earlier': 'Versions antérieures ({n})', 'nt.done': 'Terminé', 'nt.print': 'Imprimer ou enregistrer en PDF',
      'nt.delete': 'Supprimer la note', 'nt.noMarks': 'Aucune marque pour l’instant.', 'nt.removeMark': 'Enlever {r}',
      'nt.written': 'Rédigée le {t}. Les modifications faites à partir de maintenant sont consignées comme rectification; la version actuelle est d’abord conservée.',
      'nt.amended': '<b>Rectifiée {times}</b>, dernière fois le {t}. Chaque version antérieure est conservée ci-dessous et sur la version imprimée.',
      'v.blank': 'vide', 'v.pain': 'douleur', 'v.marks': 'marques', 'v.head': '<b>Version {i}</b> rédigée le {t}{by}; remplacée le {r}', 'v.by': ' par {who}',
      'p.client': 'Client(e)', 'p.date': 'Date', 'p.session': 'Séance', 'p.pain': 'Douleur avant → après', 'p.outOf': '{b} → {a} sur 10',
      'p.addDetails': 'Ajoutez votre nom et votre numéro de membre dans Exporter', 'p.noMarks': 'Aucune marque consignée.', 'p.written': 'Rédigée le {t}',
      'p.amended': '. Rectifiée {times}, dernière fois le {t}. Les versions antérieures suivent.', 'p.notAmended': '. Aucune rectification.', 'p.history': 'Historique des rectifications',
      'p.signature': 'Signature du ou de la massothérapeute', 'pr.print': 'Imprimer ou enregistrer en PDF', 'pr.backNote': 'Retour à la note',
      'pr.hint': 'Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF » pour garder un fichier. Sur iPhone, touchez Partager, puis Imprimer, puis Partager de nouveau pour enregistrer le PDF.',
      'doc.allVisits': 'toutes-les-seances',
      'd.title': 'Exportation et sauvegarde', 'd.sub': 'Vos dossiers, dans des fichiers que vous gardez.', 'd.whereTitle': 'Où sont vos notes',
      'd.whereText': 'Enregistrées dans ce navigateur, sur cet appareil. Rien n’est envoyé à un serveur. Effacer les données du navigateur ou changer de téléphone les supprime : gardez donc un fichier de sauvegarde.',
      'd.example': { one: ' ({n} exemple)', other: ' ({n} exemples)' }, 'd.lastBackup': 'dernière sauvegarde : {d}',
      'd.autoTitle': 'Sauvegarde automatique',
      'd.autoOn': 'Activée. Un fichier de sauvegarde est enregistré dans <b>{f}</b> chaque fois que vous modifiez une note (un fichier par jour). Choisissez un dossier Google Drive, Dropbox, OneDrive ou iCloud Drive pour que la copie quitte aussi cet ordinateur.',
      'd.changeFolder': 'Changer de dossier', 'd.turnOff': 'Désactiver', 'd.autoPaused': 'En pause pour <b>{f}</b>. Votre navigateur redemande l’autorisation après un redémarrage.',
      'd.autoOff': 'Choisissez un dossier une seule fois et Tablenote y enregistre une sauvegarde chaque fois que vous modifiez une note, en conservant les 30 derniers jours. Choisissez un dossier Google Drive, Dropbox, OneDrive ou iCloud Drive pour que la copie quitte aussi cet ordinateur.',
      'd.chooseFolder': 'Choisir le dossier de sauvegarde', 'd.autoSaved': 'Sauvegarde enregistrée dans {f}.', 'd.autoErr': 'Impossible d’utiliser ce dossier. Essayez-en un autre.',
      'd.dlTitle': 'Télécharger', 'd.full': 'Sauvegarde complète (.json)', 'd.csv': 'Toutes les notes en tableur (.csv)',
      'd.dlText': 'Le fichier de sauvegarde restaure tout sur un autre appareil. Le tableur s’ouvre dans Excel, Numbers ou Google Sheets. Pour le PDF d’une séance, ouvrez la note et choisissez « {p} ».',
      'd.detailsTitle': 'Vos coordonnées sur les notes imprimées', 'd.yourName': 'Votre nom', 'd.namePh': 'p. ex. Sam Rivera',
      'd.credential': 'Titre ou numéro de membre', 'd.credentialPh': 'p. ex. Massothérapeute agréé(e), n° 12345', 'd.practice': 'Nom de la clinique', 'd.practicePh': 'p. ex. Massothérapie Rivera',
      'd.importTitle': 'Importer des dossiers clients',
      'd.importText': 'Importez votre liste de clientèle depuis Square, votre logiciel de rendez-vous ou tout tableur enregistré en CSV. Les noms, numéros de téléphone et courriels sont repris; les dossiers déjà présents sont ignorés.',
      'd.chooseCsv': 'Choisir un fichier CSV', 'imp.add': 'Ajouter <b>{c}</b>', 'imp.skipped': ' ({n} déjà présent(s) ou sans nom, ignoré(s))',
      'imp.capped': '. Le forfait gratuit permet {free} client(e)s, donc {n} de plus nécessitent un forfait payant', 'imp.more': ' et d’autres', 'imp.confirm': 'Ajouter',
      'imp.added': 'Ajouté : {c}.', 'imp.none': 'Aucun nouveau dossier trouvé dans ce fichier.', 'imp.noneFull': 'Aucun nouveau dossier trouvé dans ce fichier. Le forfait gratuit est plein.',
      'imp.err': 'Impossible de lire les noms dans ce fichier. Enregistrez-le en CSV avec une ligne d’en-tête qui contient une colonne de nom (par exemple Prénom et Nom).',
      'd.restoreTitle': 'Restaurer une sauvegarde', 'd.restoreText': 'Remplace les notes de cet appareil par celles d’un fichier de sauvegarde Tablenote.',
      'd.chooseBackup': 'Choisir un fichier de sauvegarde', 'rs.confirm': 'Remplacer {c1} et {n1} de cet appareil par {c2} et {n2} du fichier?',
      'rs.replace': 'Remplacer les données', 'rs.keep': 'Garder les données actuelles', 'rs.done': 'Restauration terminée : {c} et {n}.',
      'rs.err': 'Ce fichier n’est pas une sauvegarde Tablenote. Choisissez un fichier nommé tablenote-backup-….json.',
      'd.wipeTitle': 'Tout supprimer', 'd.wipeText': 'Supprime tous les dossiers et toutes les notes de cet appareil. Téléchargez d’abord une sauvegarde si vous pourriez en avoir besoin.',
      'd.wipeBtn': 'Supprimer toutes les données', 'd.privacy': 'Politique de confidentialité', 'd.terms': 'Conditions d’utilisation',
      'ct.clientKeep': 'Les dossiers doivent souvent être conservés plusieurs années. Touchez de nouveau pour supprimer le dossier et ses séances', 'ct.client': 'Touchez de nouveau pour supprimer le dossier et ses séances',
      'ct.noteKeep': 'Les dossiers doivent souvent être conservés plusieurs années. Touchez de nouveau pour supprimer', 'ct.note': 'Touchez de nouveau pour supprimer',
      'ct.license': 'Touchez de nouveau pour retirer la licence', 'ct.wipe': 'Touchez de nouveau pour tout supprimer', 'ct.account': 'Touchez de nouveau pour supprimer votre compte',
      'ac.title': 'Compte', 'ac.sub': 'Votre forfait et vos coordonnées sur tous vos appareils.', 'ac.closed': 'Les comptes ne sont pas encore offerts.', 'ac.checking': 'Vérification…',
      'ac.offline': 'Vous êtes hors ligne. Vos notes fonctionnent toujours; connectez-vous quand vous serez de nouveau en ligne.', 'ac.signedIn': 'Connecté(e)', 'ac.plan': 'Forfait : {p}',
      'ac.paid': 'Payant, renouvellement ou fin le {d}', 'ac.lifetime': 'À vie', 'ac.free': 'Gratuit',
      'ac.follows': 'Votre forfait ainsi que le nom et le numéro de membre imprimés sur les notes suivent ce compte. Connectez-vous sur un autre téléphone ou ordinateur et ils vous suivent.',
      'ac.never': 'Les notes clients ne sont jamais téléversées. Elles restent sur chaque appareil; transférez-les avec un fichier de sauvegarde depuis Exporter.',
      'ac.signout': 'Se déconnecter', 'ac.delete': 'Supprimer le compte', 'ac.create': 'Créer votre compte', 'ac.signin': 'Connexion',
      'ac.intro': 'Gardez votre forfait et vos coordonnées sur tous vos appareils. Les notes clients restent sur votre appareil et ne sont jamais téléversées.',
      'ac.google': 'Continuer avec Google', 'ac.email': 'Courriel', 'ac.password': 'Mot de passe', 'ac.createBtn': 'Créer le compte', 'ac.forgot': 'Mot de passe oublié?',
      'ac.haveAcct': 'Vous avez déjà un compte?', 'ac.newHere': 'Première visite?', 'ac.createLink': 'Créer un compte',
      'ac.resetNeedEmail': 'Inscrivez votre courriel ci-dessus, puis touchez Mot de passe oublié.', 'ac.resetSent': 'Si ce courriel est associé à un compte, un lien de réinitialisation est en route.',
      'ac.deleted': 'Compte supprimé. Les notes de cet appareil sont intactes.', 'ac.addEmail': 'Inscrivez votre courriel.', 'ac.creating': 'Création du compte…', 'ac.signingIn': 'Connexion…',
      'ae.mismatch': 'Ce courriel et ce mot de passe ne correspondent pas. Réessayez ou réinitialisez votre mot de passe.', 'ae.inUse': 'Ce courriel a déjà un compte. Connectez-vous plutôt.',
      'ae.weak': 'Utilisez au moins 8 caractères pour votre mot de passe.', 'ae.email': 'Vérifiez l’adresse courriel.', 'ae.tooMany': 'Trop de tentatives. Attendez quelques minutes et réessayez.',
      'ae.recent': 'Par sécurité, déconnectez-vous et reconnectez-vous, puis supprimez le compte.', 'ae.network': 'Aucune connexion. Les notes fonctionnent toujours; connectez-vous quand vous serez de nouveau en ligne.',
      'ae.generic': 'Un problème est survenu. Réessayez.',
      'ex.history': 'Travail de bureau, environ 8 heures par jour. Court 3 fois par semaine. Préfère une pression ferme au dos et aux épaules.',
      'ex.contra': 'Varices derrière le genou G. Pression légère seulement sur la face postérieure de la jambe G.',
      'ex.n1': ['Raideur au cou au réveil; pire après de longues journées au bureau. Douleur 6/10 au pire. Demande une pression ferme.',
        'Hypertonicité des trapèzes supérieurs, bilatérale, D > G. Point gâchette aux rhomboïdes D. Rotation cervicale limitée vers la G.',
        'Bonne réponse des tissus. Amplitude cervicale améliorée. Douleur 3/10 après la séance.',
        'Revoir dans 2 semaines. Étirement à domicile : trapèze supérieur, 3 × 30 s par jour. Chaleur 15 min en soirée.'],
      'ex.n2': ['Bas du dos tendu après une longue course. Aucun engourdissement ni picotement.',
        'Sensibilité à la palpation, carré des lombes G. Légère hypertonicité des fessiers.',
        'Pression bien tolérée. Légères courbatures à prévoir.',
        'Revoir dans 2 semaines. Bien s’hydrater. Étirer les fléchisseurs de la hanche après la course.']
    },
    es: {
      saved: 'Guardado en este dispositivo', notSaved: 'No se guardó. Este navegador bloquea el almacenamiento',
      'nav.export': 'Exportar', 'nav.signin': 'Iniciar sesión', 'nav.account': 'Cuenta', 'nav.home': 'Tablenote, todos los clientes', 'nav.lang': 'Idioma',
      'n.client': { one: '{n} cliente', other: '{n} clientes' }, 'n.note': { one: '{n} nota', other: '{n} notas' },
      'n.visit': { one: '{n} sesión', other: '{n} sesiones' }, 'n.time': { one: '{n} vez', other: '{n} veces' },
      min: '{n} min', session: 'Sesión', example: 'Ejemplo', precautions: 'Precauciones', precautionsColon: 'Precauciones:',
      noVisits: 'Aún no hay sesiones', notRecorded: 'No registrado', cancel: 'Cancelar', clients: 'Clientes', never: 'nunca', unknownTime: 'hora desconocida',
      'price.perYear': '/año', 'price.once': ' pago único',
      mods: ['Sueco', 'Tejido profundo', 'Deportivo', 'Liberación miofascial', 'Puntos gatillo', 'Prenatal', 'Drenaje linfático', 'Piedras calientes', 'Otro'],
      pressures: ['Suave', 'Suave-media', 'Media', 'Firme', 'Profunda'],
      's.title': 'Subjetivo', 's.help': 'lo que reporta el cliente',
      's.chips': ['Dolor lumbar', 'Cuello rígido al despertar', 'Dolores de cabeza', 'Trabajo de escritorio 8 h/día', 'Entrena para una competencia', 'Duerme mal', 'Pide presión firme', 'Dolor desde la última sesión'],
      'o.title': 'Objetivo', 'o.help': 'lo que observaste o palpaste',
      'o.chips': ['Hipertonía', 'Punto gatillo', 'Sensibilidad a la palpación', 'Rango de movimiento limitado', 'Adherencias', 'Cabeza adelantada', 'Hombro elevado', 'Edema'],
      'a.title': 'Análisis', 'a.help': 'cómo respondió el tejido',
      'a.chips': ['Buena respuesta del tejido', 'Mejoró el rango de movimiento', 'Disminuyó el dolor', 'Toleró bien la presión', 'Posible dolor muscular leve', 'Poco cambio en esta sesión'],
      'p.title': 'Plan', 'p.help': 'próxima sesión y cuidados en casa',
      'p.chips': ['Volver en 1 semana', 'Volver en 2 semanas', 'Volver en 4 semanas', 'Estiramientos diarios en casa', 'Calor 15 min', 'Hidratarse', 'Derivar a fisioterapia/médico si no hay cambios'],
      'up.founding': 'Miembro fundador', 'up.lifetime': 'Miembro vitalicio', 'up.yourPlan': 'Tu plan',
      'up.unlimited': 'Clientes ilimitados en este dispositivo{until}. Gracias por apoyar Tablenote.', 'up.until': ' hasta el {d}',
      'up.remove': 'Quitar la licencia de este dispositivo',
      'up.free': 'El plan gratuito cubre {n} clientes. La membresía de fundador desbloquea clientes ilimitados en tu teléfono y tu computadora.',
      'up.buy': 'Hazte miembro fundador, {p}', 'up.once': 'Paga una sola vez, {p}', 'up.haveKey': '¿Tienes una clave de licencia?',
      'up.keyPh': 'Pega la clave de tu correo de recibo', 'up.activate': 'Activar',
      'up.limit': 'Tienes {n} clientes, el máximo del plan gratuito. Puedes seguir viendo, editando y exportando tus notas sin costo. Para agregar más clientes, hazte miembro fundador.',
      'lic.paste': 'Pega la clave de licencia de tu correo de recibo.', 'lic.checking': 'Verificando tu clave…',
      'lic.ok': 'Activada. Los clientes ilimitados están desbloqueados en este dispositivo.',
      'lic.notFound': 'No se encontró esa clave. Compárala con tu correo de recibo e inténtalo de nuevo.',
      'lic.limit': 'Esta clave ya está activa en el número máximo de dispositivos. Quítala primero de otro dispositivo.',
      'lic.wrongStore': 'Esta clave no es de Tablenote.', 'lic.err': 'No se pudo verificar la clave. Revisa tu conexión e inténtalo de nuevo.',
      'ios.banner': '<b>Protege tus notas en iPhone.</b> Safari borra los datos de los sitios web tras 7 días sin visitarlos. Agrega Tablenote a tu pantalla de inicio para conservar tus notas: toca el botón Compartir, luego “Agregar a inicio”, y ábrela desde ahí.',
      'bk.paused': '<b>La copia de seguridad automática está en pausa.</b> Tu navegador vuelve a pedir permiso después de reiniciar.', 'bk.resume': 'Reanudar la copia automática',
      'bk.last': 'Última copia de seguridad: {d}.', 'bk.none': 'Aún no hay copia de seguridad.',
      'bk.everyFew': 'Las notas se guardan solo en este dispositivo. Guarda una copia de seguridad en tu nube cada pocos días.',
      'bk.weekly': 'Las notas se guardan solo en este dispositivo. Guarda una copia de seguridad en tu nube una vez por semana.',
      'bk.share': 'Guardar copia en iCloud o Drive', 'bk.download': 'Descargar copia de seguridad', 'bk.shareTitle': 'Copia de seguridad de Tablenote',
      'list.example': '{name} es un <b>cliente de ejemplo</b> para que veas cómo se ven las notas. Elimínalo cuando quieras.',
      'list.removeExample': 'Eliminar ejemplo', 'list.new': 'Nuevo cliente', 'list.find': 'Buscar un cliente', 'list.searchPh': 'Buscar por nombre',
      'list.last': 'última: {m}', 'list.noMatch': 'Ningún cliente coincide con “{q}”.', 'list.emptyTitle': 'Aún no hay clientes',
      'list.emptyText': 'Agrega tu primer cliente y empieza una nota SOAP justo después de la sesión.', 'list.add': 'Agregar un cliente',
      'cf.name': 'Nombre', 'cf.namePh': 'Nombre y apellido', 'cf.nameErr': 'Escribe el nombre del cliente para guardar.', 'cf.phone': 'Teléfono', 'cf.email': 'Correo electrónico',
      'cf.history': 'Historial de salud', 'cf.historyPh': 'Ocupación, actividad física, lesiones, cirugías, medicamentos',
      'cf.contra': 'Precauciones y contraindicaciones', 'cf.contraPh': 'p. ej., embarazo, várices, cirugía reciente, alergia a aceites',
      'cf.contraHint': 'Se muestra al inicio de cada nota de este cliente.', 'cf.save': 'Guardar datos', 'cf.add': 'Agregar cliente', 'cf.delete': 'Eliminar cliente',
      'nc.title': 'Nuevo cliente',
      'cl.last': 'última: {d}', 'cl.newNote': 'Nueva nota SOAP', 'cl.edit': 'Editar datos', 'cl.printAll': 'Imprimir o guardar todas las sesiones', 'cl.visits': 'Sesiones',
      'cl.pain': 'dolor {b}→{a}', 'cl.emptyText': 'Empieza una nota SOAP después de tu primera sesión con {first}.',
      'nt.title': 'Nota SOAP', 'nt.repeat': '¿Igual que la última vez? Parte de las notas del {d} y cambia lo que sea diferente.', 'nt.repeatBtn': 'Partir de la última sesión',
      'nt.date': 'Fecha', 'nt.length': 'Duración', 'nt.modality': 'Modalidad', 'nt.painBefore': 'Dolor antes', 'nt.painAfter': 'Dolor después',
      'nt.painScale': '0 nada · 10 máximo', 'nt.pressure': 'Presión', 'nt.pressureScale': '1 suave · 5 profunda', 'nt.pressureOf': 'presión {p}',
      'nt.chips': 'Frases rápidas para {s}', 'nt.chart': 'Diagrama corporal', 'nt.markType': 'Tipo de marca',
      'nt.chartHint': 'Toca la figura para agregar una marca; toca una marca para quitarla. En la vista anterior, la izquierda del cliente queda a tu derecha.',
      'nt.copyMarks': 'Copiar marcas del {d}', 'nt.earlier': 'Versiones anteriores ({n})', 'nt.done': 'Listo', 'nt.print': 'Imprimir o guardar PDF',
      'nt.delete': 'Eliminar nota', 'nt.noMarks': 'Aún no hay marcas.', 'nt.removeMark': 'Quitar {r}',
      'nt.written': 'Escrita el {t}. Los cambios a partir de ahora se guardan como enmienda; primero se conserva la versión actual.',
      'nt.amended': '<b>Enmendada {times}</b>, la última el {t}. Todas las versiones anteriores se conservan abajo y en la impresión.',
      'v.blank': 'vacío', 'v.pain': 'dolor', 'v.marks': 'marcas', 'v.head': '<b>Versión {i}</b> escrita el {t}{by}; reemplazada el {r}', 'v.by': ' por {who}',
      'p.client': 'Cliente', 'p.date': 'Fecha', 'p.session': 'Sesión', 'p.pain': 'Dolor antes → después', 'p.outOf': '{b} → {a} de 10',
      'p.addDetails': 'Agrega tu nombre y número de licencia en Exportar', 'p.noMarks': 'No se registraron marcas.', 'p.written': 'Escrita el {t}',
      'p.amended': '. Enmendada {times}, la última el {t}. Las versiones anteriores siguen.', 'p.notAmended': '. Sin enmiendas.', 'p.history': 'Historial de enmiendas',
      'p.signature': 'Firma del terapeuta', 'pr.print': 'Imprimir o guardar como PDF', 'pr.backNote': 'Volver a la nota',
      'pr.hint': 'En la ventana de impresión, elige “Guardar como PDF” para conservar un archivo. En iPhone, toca Compartir, luego Imprimir y otra vez Compartir para guardar el PDF.',
      'doc.allVisits': 'todas-las-sesiones',
      'd.title': 'Exportar y respaldar', 'd.sub': 'Tus registros, en archivos que tú guardas.', 'd.whereTitle': 'Dónde están tus notas',
      'd.whereText': 'Guardadas en este navegador, en este dispositivo. No se envía nada a ningún servidor. Si borras los datos del navegador o cambias de teléfono, se pierden; por eso guarda una copia de seguridad.',
      'd.example': ' ({n} de ejemplo)', 'd.lastBackup': 'última copia: {d}',
      'd.autoTitle': 'Copia de seguridad automática',
      'd.autoOn': 'Activada. Se guarda una copia en <b>{f}</b> cada vez que cambias una nota (un archivo por día). Elige una carpeta de Google Drive, Dropbox, OneDrive o iCloud Drive para que la copia también salga de esta computadora.',
      'd.changeFolder': 'Cambiar carpeta', 'd.turnOff': 'Desactivar', 'd.autoPaused': 'En pausa para <b>{f}</b>. Tu navegador vuelve a pedir permiso después de reiniciar.',
      'd.autoOff': 'Elige una carpeta una vez y Tablenote guardará ahí una copia cada vez que cambies una nota, conservando los últimos 30 días. Elige una carpeta de Google Drive, Dropbox, OneDrive o iCloud Drive para que la copia también salga de esta computadora.',
      'd.chooseFolder': 'Elegir carpeta de respaldo', 'd.autoSaved': 'Copia guardada en {f}.', 'd.autoErr': 'No se pudo usar esa carpeta. Prueba con otra.',
      'd.dlTitle': 'Descargar', 'd.full': 'Copia completa (.json)', 'd.csv': 'Todas las notas en hoja de cálculo (.csv)',
      'd.dlText': 'La copia de seguridad restaura todo en otro dispositivo. La hoja de cálculo se abre en Excel, Numbers o Google Sheets. Para un PDF de una sesión, abre la nota y elige “{p}”.',
      'd.detailsTitle': 'Tus datos en las notas impresas', 'd.yourName': 'Tu nombre', 'd.namePh': 'p. ej., Sam Rivera',
      'd.credential': 'Licencia o credencial', 'd.credentialPh': 'p. ej., LMT #MA12345', 'd.practice': 'Nombre del consultorio', 'd.practicePh': 'p. ej., Masajes Rivera',
      'd.importTitle': 'Importar clientes',
      'd.importText': 'Trae tu lista de clientes desde Square, tu app de reservas o cualquier hoja de cálculo guardada como CSV. Se importan nombres, teléfonos y correos; los clientes que ya están aquí se omiten.',
      'd.chooseCsv': 'Elegir archivo CSV', 'imp.add': 'Agregar <b>{c}</b>', 'imp.skipped': ' (se omiten {n} que ya están aquí o no tienen nombre)',
      'imp.capped': '. El plan gratuito permite {free} clientes, así que {n} más requieren un plan de pago', 'imp.more': ' y más', 'imp.confirm': 'Agregar clientes',
      'imp.added': 'Se agregaron {c}.', 'imp.none': 'No se encontraron clientes nuevos en ese archivo.', 'imp.noneFull': 'No se encontraron clientes nuevos en ese archivo. El plan gratuito está lleno.',
      'imp.err': 'No se pudieron leer nombres de clientes en ese archivo. Guárdalo como CSV con una fila de encabezado que tenga una columna de nombre (por ejemplo Nombre y Apellido).',
      'd.restoreTitle': 'Restaurar una copia de seguridad', 'd.restoreText': 'Reemplaza las notas de este dispositivo por las de un archivo de respaldo de Tablenote.',
      'd.chooseBackup': 'Elegir archivo de respaldo', 'rs.confirm': '¿Reemplazar {c1} y {n1} de este dispositivo por {c2} y {n2} del archivo?',
      'rs.replace': 'Reemplazar datos', 'rs.keep': 'Conservar datos actuales', 'rs.done': 'Se restauraron {c} y {n}.',
      'rs.err': 'Ese archivo no es una copia de seguridad de Tablenote. Elige un archivo llamado tablenote-backup-….json.',
      'd.wipeTitle': 'Eliminar todo', 'd.wipeText': 'Elimina todos los clientes y notas de este dispositivo. Descarga primero una copia de seguridad si podrías necesitarlos.',
      'd.wipeBtn': 'Eliminar todos los datos', 'd.privacy': 'Política de privacidad', 'd.terms': 'Términos de uso',
      'ct.clientKeep': 'Los registros a menudo deben conservarse por años. Toca de nuevo para eliminar el cliente y sus sesiones', 'ct.client': 'Toca de nuevo para eliminar el cliente y sus sesiones',
      'ct.noteKeep': 'Los registros a menudo deben conservarse por años. Toca de nuevo para eliminar', 'ct.note': 'Toca de nuevo para eliminar',
      'ct.license': 'Toca de nuevo para quitar la licencia', 'ct.wipe': 'Toca de nuevo para eliminar todos los datos', 'ct.account': 'Toca de nuevo para eliminar tu cuenta',
      'ac.title': 'Cuenta', 'ac.sub': 'Tu plan y tus datos en todos tus dispositivos.', 'ac.closed': 'Las cuentas aún no están disponibles.', 'ac.checking': 'Verificando…',
      'ac.offline': 'Estás sin conexión. Tus notas siguen funcionando; inicia sesión cuando vuelvas a estar en línea.', 'ac.signedIn': 'Sesión iniciada', 'ac.plan': 'Plan: {p}',
      'ac.paid': 'De pago, se renueva o termina el {d}', 'ac.lifetime': 'Vitalicio', 'ac.free': 'Gratuito',
      'ac.follows': 'Tu plan y el nombre y número de licencia de las notas impresas van con esta cuenta. Inicia sesión en otro teléfono o computadora y te acompañan.',
      'ac.never': 'Las notas de clientes nunca se suben. Se quedan en cada dispositivo; muévelas con un archivo de respaldo desde Exportar.',
      'ac.signout': 'Cerrar sesión', 'ac.delete': 'Eliminar cuenta', 'ac.create': 'Crea tu cuenta', 'ac.signin': 'Iniciar sesión',
      'ac.intro': 'Conserva tu plan y tus datos en todos tus dispositivos. Las notas de clientes se quedan en tu dispositivo y nunca se suben.',
      'ac.google': 'Continuar con Google', 'ac.email': 'Correo electrónico', 'ac.password': 'Contraseña', 'ac.createBtn': 'Crear cuenta', 'ac.forgot': '¿Olvidaste tu contraseña?',
      'ac.haveAcct': '¿Ya tienes cuenta?', 'ac.newHere': '¿Primera vez aquí?', 'ac.createLink': 'Crear una cuenta',
      'ac.resetNeedEmail': 'Escribe tu correo arriba y luego toca ¿Olvidaste tu contraseña?', 'ac.resetSent': 'Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña.',
      'ac.deleted': 'Cuenta eliminada. Las notas de este dispositivo no se tocaron.', 'ac.addEmail': 'Escribe tu correo.', 'ac.creating': 'Creando tu cuenta…', 'ac.signingIn': 'Iniciando sesión…',
      'ae.mismatch': 'El correo y la contraseña no coinciden. Inténtalo de nuevo o restablece tu contraseña.', 'ae.inUse': 'Ese correo ya tiene una cuenta. Inicia sesión.',
      'ae.weak': 'Usa al menos 8 caracteres en tu contraseña.', 'ae.email': 'Revisa la dirección de correo.', 'ae.tooMany': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      'ae.recent': 'Por seguridad, cierra sesión, vuelve a iniciarla y luego elimina la cuenta.', 'ae.network': 'Sin conexión. Las notas siguen funcionando; inicia sesión cuando vuelvas a estar en línea.',
      'ae.generic': 'Algo salió mal. Inténtalo de nuevo.',
      'ex.history': 'Trabajo de escritorio, unas 8 horas al día. Corre 3 veces por semana. Prefiere presión firme en espalda y hombros.',
      'ex.contra': 'Várices detrás de la rodilla I. Solo presión suave en la cara posterior de la pierna I.',
      'ex.n1': ['Cuello rígido al despertar; empeora tras largas jornadas de escritorio. Dolor 6/10 en el peor momento. Pide presión firme.',
        'Hipertonía en trapecio superior bilateral, D > I. Punto gatillo en romboides D. Rotación cervical limitada hacia la I.',
        'Buena respuesta del tejido. Mejoró el rango de movimiento cervical. Dolor 3/10 después de la sesión.',
        'Volver en 2 semanas. Estiramiento en casa: trapecio superior, 3 × 30 s al día. Calor 15 min por la noche.'],
      'ex.n2': ['Zona lumbar tensa después de una carrera larga. Sin entumecimiento ni hormigueo.',
        'Sensibilidad a la palpación en cuadrado lumbar I. Hipertonía leve en glúteos.',
        'Toleró bien la presión. Posible dolor muscular leve.',
        'Volver en 2 semanas. Hidratarse. Estirar flexores de cadera después de correr.']
    }
  };
  function detectLang() {
    try { var s = localStorage.getItem(LANG_KEY); if (I18N[s]) return s; } catch (e) {}
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var p = String(list[i] || '').slice(0, 2).toLowerCase();
      if (p === 'fr' || p === 'es' || p === 'en') return p;
    }
    return 'en';
  }
  var lang = detectLang();
  document.documentElement.lang = HTML_LANG[lang];
  function pluralCat(n) { return lang === 'fr' ? (n < 2 ? 'one' : 'other') : (n === 1 ? 'one' : 'other'); }
  // t('key', {n: 2, x: 'y'}): falls back to English, and never shows a raw key.
  function t(key, vars) {
    var v = (I18N[lang] || I18N.en)[key];
    if (v == null) v = I18N.en[key];
    if (v == null) return '';
    if (typeof v === 'object' && !Array.isArray(v)) v = v[pluralCat(vars && vars.n)] || v.other;
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return v;
  }
  function modName(m) { var i = MODALITIES.indexOf(m); return i > -1 ? (t('mods')[i] || m) : m; }
  function pressureName(p) { return t('pressures')[p - 1] || ''; }
  function priceText(s) { return String(s).replace('/year', t('price.perYear')).replace(' once', t('price.once')); }
  function markLabel(type) { return BodyChart.label(type, lang); }
  function markRegion(m) { return BodyChart.regionOf(m, lang); }

  /* ---------- storage ---------- */
  function blank() { return { clients: [], notes: [], settings: { therapist: '', credential: '', business: '', lastBackupAt: null }, seeded: false }; }
  var storageOK = true;
  var db = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        var b = blank();
        b.clients = d.clients || []; b.notes = d.notes || [];
        b.settings = Object.assign(b.settings, d.settings || {}); b.seeded = !!d.seeded;
        return b;
      }
    } catch (e) { storageOK = false; }
    var fresh = blank();
    seed(fresh);
    return fresh;
  }

  var saveTimer = null, dirty = false;
  function save() {
    clearTimeout(saveTimer); dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify(db)); storageOK = true; }
    catch (e) { storageOK = false; }
    if (typeof askPersist === 'function' && db.clients.some(function (c) { return !c.example; })) askPersist();
    if (typeof autoSoon === 'function') autoSoon();
    showSave();
  }
  function saveSoon() { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(save, 350); }
  function showSave() {
    saveState.classList.toggle('bad', !storageOK);
    saveState.firstChild.textContent = storageOK ? t('saved') : t('notSaved');
    saveState.classList.add('flash');
    setTimeout(function () { saveState.classList.remove('flash'); }, 500);
  }

  /* ---------- helpers ---------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDay(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return isoDay(new Date()); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return isoDay(d); }
  function fmtDate(iso, short) {
    if (!iso) return '';
    var p = iso.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString(LOCALE[lang], short ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function slug(s) { return String(s || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'; }
  function client(id) { return db.clients.find(function (c) { return c.id === id; }); }
  function note(id) { return db.notes.find(function (n) { return n.id === id; }); }
  function notesFor(cid) { return db.notes.filter(function (n) { return n.clientId === cid; }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || 0) - (a.createdAt || 0); }); }
  function isBlank(n) { return !n.s && !n.o && !n.a && !n.p && !(n.marks && n.marks.length) && n.painBefore == null && n.painAfter == null; }
  function realNotes() { return db.notes.filter(function (n) { return !n.example; }); }
  function plural(n, w) { return t('n.' + w, { n: n }); }

  /* ---------- license (Lemon Squeezy, checked from the browser) ---------- */
  function license() { return db.settings.license || null; }
  function isPro() {
    var l = license();
    return !!(l && l.status === 'active' && (!l.expiresAt || new Date(l.expiresAt) > new Date()));
  }
  function realClients() { return db.clients.filter(function (c) { return !c.example; }).length; }
  function canAddClient() { return !SALES.checkoutUrl || isPro() || realClients() < SALES.freeClients; }
  function licenseCall(action, params) {
    return fetch(LICENSE_API + action, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString()
    }).then(function (r) { return r.json(); });
  }
  function activateLicense(key) {
    var name = 'Tablenote · ' + (/iPhone|iPad/.test(navigator.userAgent) ? 'iPhone/iPad' : /Android/.test(navigator.userAgent) ? 'Android' : /Mac/.test(navigator.userAgent) ? 'Mac' : 'Browser');
    return licenseCall('activate', { license_key: key, instance_name: name }).then(function (j) {
      if (!j.activated) throw new Error(j.error || 'not activated');
      if (SALES.storeId && j.meta && j.meta.store_id !== SALES.storeId) throw new Error('wrong store');
      db.settings.license = { key: key, instanceId: j.instance && j.instance.id, status: (j.license_key && j.license_key.status) || 'active',
        expiresAt: j.license_key && j.license_key.expires_at, email: j.meta && j.meta.customer_email, validatedAt: Date.now() };
      save();
    });
  }
  function revalidateLicense() {
    var l = license();
    if (!l || !navigator.onLine || (Date.now() - (l.validatedAt || 0)) < 7 * 864e5) return;
    licenseCall('validate', { license_key: l.key, instance_id: l.instanceId || '' }).then(function (j) {
      if (j.license_key) { l.status = j.valid ? 'active' : j.license_key.status; l.expiresAt = j.license_key.expires_at; }
      else if (j.valid === false) { l.status = 'invalid'; }
      l.validatedAt = Date.now(); save();
    }).catch(function () { /* offline or API down: keep the current status */ });
  }
  function deactivateLicense() {
    var l = license();
    var done = function () { delete db.settings.license; save(); };
    if (!l) return Promise.resolve();
    return licenseCall('deactivate', { license_key: l.key, instance_id: l.instanceId || '' }).then(done, done);
  }
  function upgradePanel(reason) {
    var buy = (SALES.checkoutUrl ? '<a class="btn" href="' + esc(checkoutLink(SALES.checkoutUrl)) + '" target="_blank" rel="noopener">' + esc(t('up.buy', { p: priceText(SALES.priceLabel) })) + '</a>' : '') +
      (SALES.lifetimeUrl ? '<a class="btn quiet" href="' + esc(checkoutLink(SALES.lifetimeUrl)) + '" target="_blank" rel="noopener">' + esc(t('up.once', { p: priceText(SALES.lifetimeLabel) })) + '</a>' : '');
    return '<section class="panel" id="plan-panel"><h2>' + (isPro() ? (license().expiresAt ? t('up.founding') : t('up.lifetime')) : t('up.yourPlan')) + '</h2>' +
      (isPro()
        ? '<p>' + t('up.unlimited', { until: license().expiresAt ? t('up.until', { d: fmtDate(isoDay(new Date(license().expiresAt))) }) : '' }) + '</p>' +
          '<div class="row"><button class="btn small quiet" data-action="deactivate-license">' + t('up.remove') + '</button></div>'
        : '<p>' + (reason || t('up.free', { n: SALES.freeClients })) + '</p>' +
          (buy ? '<div class="row">' + buy + '</div>' : '') +
          '<label class="field"><span>' + t('up.haveKey') + '</span><input type="text" id="license-key" autocomplete="off" spellcheck="false" placeholder="' + esc(t('up.keyPh')) + '"></label>' +
          '<div class="row"><button class="btn small" data-action="activate-license">' + t('up.activate') + '</button></div>') +
      '<p class="hint" id="license-msg" role="status"></p></section>';
  }

  function seed(d) {
    var cid = 'ex-jordan';
    var n1 = t('ex.n1'), n2 = t('ex.n2');
    d.clients.push({ id: cid, name: 'Jordan Lee', phone: '(555) 014-2290', email: 'jordan@example.com',
      history: t('ex.history'), contra: t('ex.contra'), example: true, createdAt: Date.now() });
    function mk(view, x, y, type) { return { id: uid(), view: view, x: x, y: y, type: type, region: BodyChart.region(view, x, y, 'en') }; }
    d.notes.push({ id: uid(), clientId: cid, example: true, date: daysAgo(5), duration: 60, modality: 'Deep tissue', pressure: 4, painBefore: 6, painAfter: 3,
      s: n1[0], o: n1[1], a: n1[2], p: n1[3],
      marks: [mk('back', 122, 98, 'pain'), mk('back', 78, 98, 'pain'), mk('back', 115, 124, 'tension'), mk('back', 82, 324, 'avoid')], createdAt: Date.now() - 2 });
    d.notes.push({ id: uid(), clientId: cid, example: true, date: daysAgo(19), duration: 90, modality: 'Swedish', pressure: 3, painBefore: 4, painAfter: 2,
      s: n2[0], o: n2[1], a: n2[2], p: n2[3],
      marks: [mk('back', 72, 190, 'pain'), mk('back', 116, 222, 'tension'), mk('back', 82, 324, 'avoid')], createdAt: Date.now() - 1 });
    d.seeded = true;
  }
  // The example client is app-written demo text: when the language changes, rewrite only the
  // fields that still hold the untouched example text of some language. Anything the user typed stays.
  function relocalizeExamples() {
    var langs = Object.keys(I18N), changed = false;
    function swap(obj, field, key, idx) {
      var cur = obj[field];
      var known = langs.some(function (l) { var v = I18N[l][key]; return (idx == null ? v : v && v[idx]) === cur; });
      var next = idx == null ? t(key) : t(key)[idx];
      if (known && next && cur !== next) { obj[field] = next; changed = true; }
    }
    db.clients.filter(function (c) { return c.example; }).forEach(function (c) {
      swap(c, 'history', 'ex.history'); swap(c, 'contra', 'ex.contra');
      notesFor(c.id).filter(function (n) { return n.example; }).forEach(function (n) {
        ['ex.n1', 'ex.n2'].forEach(function (key) {
          var hit = langs.some(function (l) { return I18N[l][key][0] === n.s; });
          if (hit) ['s', 'o', 'a', 'p'].forEach(function (f, i) { swap(n, f, key, i); });
        });
      });
    });
    if (changed) save();
  }

  /* ---------- routing ---------- */
  var openNoteId = null;
  var ui = { editingClient: false, search: '', pendingRestore: null, pendingImport: null };

  function parse() { return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); }

  function route() {
    var parts = parse();
    // Leaving an untouched new note removes it, so empty visits don't pile up
    if (openNoteId && !(parts[0] === 'note' && parts[1] === openNoteId)) {
      var n = note(openNoteId);
      if (n && isBlank(n)) { db.notes = db.notes.filter(function (x) { return x !== n; }); save(); }
      openNoteId = null;
    }
    if (!(parts[0] === 'note' && parts[1] === edit.id && !parts[2])) edit = { id: null, base: null, saved: false };
    document.title = 'Tablenote';
    if (parts[0] === 'client' && parts[1] === 'new') renderNewClient();
    else if (parts[0] === 'client' && client(parts[1])) parts[2] === 'print' ? renderPrintClient(parts[1]) : renderClient(parts[1]);
    else if (parts[0] === 'note' && note(parts[1])) parts[2] === 'print' ? renderPrintNote(parts[1]) : renderNote(parts[1]);
    else if (parts[0] === 'data') renderData();
    else if (parts[0] === 'account') renderAccount();
    else renderList();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { ui.editingClient = false; ui.pendingRestore = null; ui.pendingImport = null; route(); });

  /* ---------- views ---------- */
  // iPhone/iPad Safari deletes a website's stored data after 7 days without a visit.
  // Apps added to the Home Screen are exempt, so iOS browser users get pushed there.
  var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var STANDALONE = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var persistAsked = false;
  function askPersist() {
    if (persistAsked || !navigator.storage || !navigator.storage.persist) return;
    persistAsked = true;
    navigator.storage.persisted().then(function (p) { if (!p) navigator.storage.persist(); }).catch(function () {});
  }
  function homeScreenBanner() {
    if (!IOS || STANDALONE || !db.clients.some(function (c) { return !c.example; })) return '';
    return '<div class="notice warn"><p>' + t('ios.banner') + '</p></div>';
  }
  function backupBanner() {
    var real = realNotes().length;
    if (!real) return '';
    var last = db.settings.lastBackupAt;
    var limit = (IOS && !STANDALONE ? 3 : 7) * 864e5;
    var stale = !last || (Date.now() - last) > limit;
    if (auto.state === 'prompt') return '<div class="notice warn"><p>' + t('bk.paused') + '</p><button class="btn small" data-action="auto-resume">' + t('bk.resume') + '</button></div>';
    if (!stale) return '';
    return '<div class="notice warn"><p><b>' + (last ? t('bk.last', { d: fmtDate(isoDay(new Date(last))) }) : t('bk.none')) + '</b> ' + (IOS && !STANDALONE ? t('bk.everyFew') : t('bk.weekly')) + '</p><button class="btn small" data-action="backup">' + (CAN_SHARE ? t('bk.share') : t('bk.download')) + '</button></div>';
  }

  function renderList() {
    var hasExample = db.clients.some(function (c) { return c.example; });
    var q = ui.search.trim().toLowerCase();
    var rows = db.clients.map(function (c) { var ns = notesFor(c.id); return { c: c, ns: ns, last: ns[0] ? ns[0].date : '' }; })
      .filter(function (r) { return !q || r.c.name.toLowerCase().indexOf(q) > -1; })
      .sort(function (a, b) { return a.last < b.last ? 1 : a.last > b.last ? -1 : a.c.name.localeCompare(b.c.name); });
    var h = '';
    var exName = (db.clients.filter(function (c) { return c.example; })[0] || {}).name;
    if (hasExample) h += '<div class="notice"><p>' + t('list.example', { name: esc(exName) }) + '</p><button class="btn small quiet" data-action="remove-examples">' + t('list.removeExample') + '</button></div>';
    h += homeScreenBanner();
    h += backupBanner();
    h += '<div class="page-head"><div><h1>' + t('clients') + '</h1><p class="sub">' + plural(db.clients.length, 'client') + ' · ' + plural(db.notes.length, 'note') + '</p></div><a class="btn" href="#/client/new">' + t('list.new') + '</a></div>';
    if (db.clients.length) {
      h += '<label class="field"><span class="label">' + t('list.find') + '</span><input type="search" id="search" placeholder="' + esc(t('list.searchPh')) + '" value="' + esc(ui.search) + '" autocomplete="off"></label>';
      if (rows.length) {
        h += '<ul class="clients">' + rows.map(function (r) {
          return '<li><a href="#/client/' + r.c.id + '"><span class="name">' + esc(r.c.name) + (r.c.example ? ' <span class="tag">' + t('example') + '</span>' : '') + (r.c.contra ? '<span class="flag">' + t('precautions') + '</span>' : '') + '</span>' +
            '<span class="meta">' + (r.ns.length ? plural(r.ns.length, 'visit') + (r.ns[0].modality ? ' · ' + t('list.last', { m: esc(modName(r.ns[0].modality)) }) : '') : t('noVisits')) + '</span>' +
            '<span class="when">' + (r.last ? fmtDate(r.last, true) : '—') + '</span></a></li>';
        }).join('') + '</ul>';
      } else {
        h += '<p class="hint">' + t('list.noMatch', { q: esc(ui.search) }) + '</p>';
      }
    } else {
      h += '<div class="empty"><h2>' + t('list.emptyTitle') + '</h2><p>' + t('list.emptyText') + '</p><a class="btn" href="#/client/new">' + t('list.add') + '</a></div>';
    }
    view.innerHTML = h;
  }

  function clientForm(c) {
    c = c || {};
    return '<form class="form" id="client-form" novalidate>' +
      '<label class="field"><span>' + t('cf.name') + '</span><input type="text" id="cf-name" name="name" required autocomplete="off" value="' + esc(c.name) + '" placeholder="' + esc(t('cf.namePh')) + '"></label>' +
      '<p class="hint" id="cf-error" hidden style="color:var(--pain)">' + t('cf.nameErr') + '</p>' +
      '<div class="grid2"><label class="field"><span>' + t('cf.phone') + '</span><input type="tel" id="cf-phone" name="phone" value="' + esc(c.phone) + '"></label>' +
      '<label class="field"><span>' + t('cf.email') + '</span><input type="email" id="cf-email" name="email" value="' + esc(c.email) + '"></label></div>' +
      '<label class="field"><span>' + t('cf.history') + '</span><textarea id="cf-history" name="history" placeholder="' + esc(t('cf.historyPh')) + '">' + esc(c.history) + '</textarea></label>' +
      '<label class="field"><span>' + t('cf.contra') + '</span><textarea id="cf-contra" name="contra" placeholder="' + esc(t('cf.contraPh')) + '">' + esc(c.contra) + '</textarea><small>' + t('cf.contraHint') + '</small></label>' +
      '<div class="actions"><button class="btn" type="submit">' + (c.id ? t('cf.save') : t('cf.add')) + '</button>' +
      (c.id ? '<button class="btn small danger" type="button" data-action="delete-client" data-id="' + c.id + '">' + t('cf.delete') + '</button>' : '') + '</div></form>';
  }
  function backToClients() { return '<a class="back" href="#/">← ' + t('clients') + '</a>'; }

  function renderNewClient() {
    if (!canAddClient()) {
      view.innerHTML = backToClients() + '<div class="page-head"><h1>' + t('nc.title') + '</h1></div>' +
        upgradePanel(t('up.limit', { n: realClients() }));
      return;
    }
    view.innerHTML = backToClients() + '<div class="page-head"><h1>' + t('nc.title') + '</h1></div>' + clientForm();
    document.getElementById('cf-name').focus();
  }

  function renderClient(id) {
    var c = client(id), ns = notesFor(id);
    var h = backToClients();
    h += '<div class="page-head"><div><h1>' + esc(c.name) + (c.example ? ' <span class="tag">' + t('example') + '</span>' : '') + '</h1><p class="sub">' + (ns.length ? plural(ns.length, 'visit') + ' · ' + t('cl.last', { d: fmtDate(ns[0].date) }) : t('noVisits')) + '</p></div>' +
      '<button class="btn" data-action="new-note" data-id="' + id + '">' + t('cl.newNote') + '</button></div>';
    if (c.contra && !ui.editingClient) h += '<div class="caution"><span class="label">' + t('precautions') + '</span>' + esc(c.contra) + '</div>';
    if (ui.editingClient) {
      h += clientForm(c);
    } else {
      h += '<dl class="facts">' +
        (c.phone ? '<div><dt class="label">' + t('cf.phone') + '</dt><dd><a href="tel:' + esc(c.phone.replace(/[^0-9+]/g, '')) + '">' + esc(c.phone) + '</a></dd></div>' : '') +
        (c.email ? '<div><dt class="label">' + t('cf.email') + '</dt><dd><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></dd></div>' : '') +
        '<div><dt class="label">' + t('cf.history') + '</dt><dd>' + (c.history ? esc(c.history) : '<span style="color:var(--ink-2)">' + t('notRecorded') + '</span>') + '</dd></div></dl>' +
        '<div class="row"><button class="btn small quiet" data-action="edit-client">' + t('cl.edit') + '</button>' + (ns.length ? '<a class="btn small quiet" href="#/client/' + id + '/print">' + t('cl.printAll') + '</a>' : '') + '</div>';
    }
    h += '<h2 class="sec">' + t('cl.visits') + '</h2>';
    if (ns.length) {
      h += '<ul class="visits">' + ns.map(function (n) {
        var pain = (n.painBefore != null || n.painAfter != null) ? t('cl.pain', { b: n.painBefore != null ? n.painBefore : '–', a: n.painAfter != null ? n.painAfter : '–' }) : '';
        var first = (n.s || n.o || n.a || n.p || '').split(/[.;\n]/)[0];
        return '<li><a href="#/note/' + n.id + '"><span class="d">' + fmtDate(n.date) + '</span><span class="t"><b>' + esc(n.modality ? modName(n.modality) : t('session')) + ', ' + t('min', { n: n.duration }) + '</b> ' + esc(first) + '</span><span class="p">' + pain + '</span></a></li>';
      }).join('') + '</ul>';
    } else {
      h += '<div class="empty"><h2>' + t('noVisits') + '</h2><p>' + t('cl.emptyText', { first: esc(c.name.split(' ')[0]) }) + '</p><button class="btn" data-action="new-note" data-id="' + id + '">' + t('cl.newNote') + '</button></div>';
    }
    view.innerHTML = h;
  }

  function seg(field, values, current, labels, cls) {
    return '<div class="seg' + (cls ? ' ' + cls : '') + '" role="group" data-seg="' + field + '">' + values.map(function (v, i) {
      return '<button type="button" data-value="' + v + '" aria-pressed="' + (current === v) + '">' + esc(labels ? labels[i] : v) + '</button>';
    }).join('') + '</div>';
  }

  var chart = null;
  function renderNote(id) {
    var n = note(id), c = client(n.clientId);
    openNoteId = id;
    if (edit.id !== id) startEdit(n);
    var prev = notesFor(c.id).filter(function (x) { return x.id !== id && x.date <= n.date && x.marks && x.marks.length; })[0];
    var zeroTen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var h = '<a class="back" href="#/client/' + c.id + '">← ' + esc(c.name) + '</a>';
    h += '<div class="page-head"><div><h1>' + t('nt.title') + '</h1><p class="sub">' + esc(c.name) + (n.example ? ' · <span class="tag">' + t('example') + '</span>' : '') + '</p></div></div>';
    if (c.contra) h += '<div class="caution"><span class="label">' + t('precautions') + '</span>' + esc(c.contra) + '</div>';
    h += '<p class="hint amend" id="amend-state" role="status">' + amendLine(n) + '</p>';
    var lastText = notesFor(c.id).filter(function (x) { return x.id !== id && x.date <= n.date && (x.s || x.o || x.a || x.p); })[0];
    if (lastText && isBlank(n)) h += '<div class="notice" id="repeat-box"><p>' + t('nt.repeat', { d: fmtDate(lastText.date) }) + '</p><button class="btn small" data-action="repeat-last" data-from="' + lastText.id + '">' + t('nt.repeatBtn') + '</button></div>';
    h += '<div class="sheet">';
    h += '<div class="sheet-head">' +
      '<label class="field wide"><span class="label">' + t('nt.date') + '</span><input type="date" data-field="date" id="nf-date" value="' + esc(n.date) + '"></label>' +
      '<label class="field"><span class="label">' + t('nt.length') + '</span><select data-field="duration" id="nf-duration">' + DURATIONS.map(function (d) { return '<option value="' + d + '"' + (n.duration === d ? ' selected' : '') + '>' + t('min', { n: d }) + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span class="label">' + t('nt.modality') + '</span><select data-field="modality" id="nf-modality">' + MODALITIES.map(function (m) { return '<option value="' + esc(m) + '"' + (n.modality === m ? ' selected' : '') + '>' + esc(modName(m)) + '</option>'; }).join('') + '</select></label></div>';
    h += '<div class="scales">' +
      '<div class="scale"><div class="scale-top"><b>' + t('nt.painBefore') + '</b><span>' + t('nt.painScale') + '</span></div>' + seg('painBefore', zeroTen, n.painBefore) + '</div>' +
      '<div class="scale"><div class="scale-top"><b>' + t('nt.painAfter') + '</b><span>' + t('nt.painScale') + '</span></div>' + seg('painAfter', zeroTen, n.painAfter) + '</div>' +
      '<div class="scale"><div class="scale-top"><b>' + t('nt.pressure') + '</b><span>' + t('nt.pressureScale') + '</span></div>' + seg('pressure', [1, 2, 3, 4, 5], n.pressure, t('pressures'), 'words') + '</div></div>';
    h += '<div class="soap">' + SOAP.map(function (s) {
      var title = t(s.k + '.title');
      return '<div class="soap-sec"><span class="k" aria-hidden="true">' + s.letter + '</span><div class="body"><span>' + title + '<small>' + t(s.k + '.help') + '</small></span>' +
        '<textarea id="nf-' + s.k + '" data-field="' + s.k + '" aria-label="' + esc(title) + '" rows="3">' + esc(n[s.k]) + '</textarea>' +
        '<div class="chips" aria-label="' + esc(t('nt.chips', { s: title })) + '">' + t(s.k + '.chips').map(function (x) { return '<button type="button" data-chip="' + s.k + '">' + esc(x) + '</button>'; }).join('') + '</div></div></div>';
    }).join('') + '</div>';
    h += '<div class="chart-sec"><div class="chart-tools"><b>' + t('nt.chart') + '</b><div class="legend" role="group" aria-label="' + esc(t('nt.markType')) + '" id="legend"></div></div>' +
      '<div id="chart"></div><p class="hint">' + t('nt.chartHint') + '</p>' +
      '<ul class="marks" id="marks"></ul>' +
      (prev && !(n.marks && n.marks.length) ? '<div><button class="btn small quiet" data-action="copy-marks" data-from="' + prev.id + '">' + t('nt.copyMarks', { d: fmtDate(prev.date, true) }) + '</button></div>' : '') +
      '</div></div>';
    if ((n.history || []).length) h += '<details class="history"><summary>' + t('nt.earlier', { n: n.history.length }) + '</summary>' + n.history.map(versionHTML).join('') + '</details>';
    h += '<div class="actions"><div class="row"><a class="btn" href="#/client/' + c.id + '">' + t('nt.done') + '</a><a class="btn quiet" href="#/note/' + id + '/print">' + t('nt.print') + '</a></div>' +
      '<button class="btn small danger" data-action="delete-note" data-id="' + id + '">' + t('nt.delete') + '</button></div>';
    view.innerHTML = h;

    chart = BodyChart.create(document.getElementById('chart'), { marks: n.marks || [], type: 'pain', onChange: function (marks) { n.marks = marks; touch(n); renderMarks(n); } });
    var legend = document.getElementById('legend');
    Object.keys(BodyChart.TYPES).forEach(function (ty, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.innerHTML = BodyChart.glyphSVG(ty) + esc(markLabel(ty));
      b.addEventListener('click', function () {
        legend.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); chart.setType(ty);
      });
      legend.appendChild(b);
    });
    renderMarks(n);
    view.querySelectorAll('textarea').forEach(autosize);
  }

  function renderMarks(n) {
    var ul = document.getElementById('marks');
    if (!ul) return;
    var marks = n.marks || [];
    ul.innerHTML = marks.length ? marks.map(function (m) {
      var r = markRegion(m);
      return '<li>' + BodyChart.glyphSVG(m.type) + '<span>' + esc(markLabel(m.type)) + (lang === 'fr' ? ' : ' : ': ') + esc(r) + '</span><button type="button" data-action="remove-mark" data-id="' + m.id + '" aria-label="' + esc(t('nt.removeMark', { r: r })) + '">×</button></li>';
    }).join('') : '<li style="color:var(--ink-2)">' + t('nt.noMarks') + '</li>';
  }

  // Amendment history: edits made after the grace period never overwrite the record silently.
  // The first change in each later editing session saves the earlier version, with time and author.
  var AMEND_GRACE = 24 * 3600e3;
  var NOTE_FIELDS = ['date', 'duration', 'modality', 'pressure', 'painBefore', 'painAfter', 's', 'o', 'a', 'p', 'marks'];
  var edit = { id: null, base: null, saved: false };
  function snapshotOf(n) { var o = {}; NOTE_FIELDS.forEach(function (k) { o[k] = k === 'marks' ? (n.marks || []).map(function (m) { return Object.assign({}, m); }) : n[k]; }); return o; }
  function startEdit(n) { edit = { id: n.id, base: snapshotOf(n), baseAt: n.updatedAt || n.createdAt || null, saved: false }; }
  function amendable(n) { return !n.example && n.createdAt && (Date.now() - n.createdAt) > AMEND_GRACE; }
  function touch(n) {
    if (edit.id === n.id && !edit.saved && amendable(n)) {
      n.history = n.history || [];
      n.history.push({ savedAt: Date.now(), writtenAt: edit.baseAt, by: [db.settings.therapist, db.settings.credential].filter(Boolean).join(', '), note: edit.base });
      n.amendedAt = Date.now();
      edit.saved = true;
      var tag = document.getElementById('amend-state');
      if (tag) tag.innerHTML = amendLine(n);
    }
    n.updatedAt = Date.now(); saveSoon();
  }
  function fmtTime(ms) { return ms ? new Date(ms).toLocaleString(LOCALE[lang], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : t('unknownTime'); }
  function amendLine(n) {
    var k = (n.history || []).length;
    if (!k) return amendable(n) ? esc(t('nt.written', { t: fmtTime(n.createdAt) }).replace('..', '.')) : '';
    return t('nt.amended', { times: plural(k, 'time'), t: esc(fmtTime(n.amendedAt)) }).replace('..', '.');
  }
  function versionHTML(v, i) {
    var x = v.note, rows = SOAP.map(function (s) { return '<div><b>' + s.letter + '</b><p>' + (esc(x[s.k]) || '<i>' + t('v.blank') + '</i>') + '</p></div>'; }).join('');
    var meta = fmtDate(x.date) + ' · ' + t('min', { n: x.duration }) + ' · ' + esc(modName(x.modality || '')) + ' · ' + t('v.pain') + ' ' + (x.painBefore != null ? x.painBefore : '?') + ' → ' + (x.painAfter != null ? x.painAfter : '?') +
      ((x.marks || []).length ? ' · ' + t('v.marks') + (lang === 'fr' ? ' : ' : ': ') + esc(BodyChart.describe(x.marks, lang)) : '');
    return '<div class="version"><div class="vh">' + t('v.head', { i: i + 1, t: esc(fmtTime(v.writtenAt)), by: v.by ? t('v.by', { who: esc(v.by) }) : '', r: esc(fmtTime(v.savedAt)) }) + '</div><div class="vmeta">' + meta + '</div><div class="psoap">' + rows + '</div></div>';
  }

  function autosize(el) { el.style.height = 'auto'; el.style.height = Math.max(84, el.scrollHeight + 2) + 'px'; }

  /* ---------- printable chart ---------- */
  function paper(n) {
    var c = client(n.clientId), st = db.settings;
    var who = [st.business, [st.therapist, st.credential].filter(Boolean).join(', ')].filter(Boolean);
    var painText = (n.painBefore == null && n.painAfter == null) ? t('notRecorded')
      : t('p.outOf', { b: n.painBefore != null ? n.painBefore : '?', a: n.painAfter != null ? n.painAfter : '?' });
    var meta = [[t('p.client'), c.name], [t('p.date'), fmtDate(n.date)], [t('p.session'), t('min', { n: n.duration }) + ' · ' + modName(n.modality || '') + (n.pressure ? ' · ' + t('nt.pressureOf', { p: pressureName(n.pressure).toLowerCase() }) : '')],
      [t('p.pain'), painText]];
    var h = '<article class="paper"><div class="ph"><div><span class="label" style="color:#555">' + t('nt.title') + '</span><h2>' + esc(c.name) + '</h2></div><div class="who">' + (who.length ? who.map(esc).join('<br>') : '<span class="no-print">' + t('p.addDetails') + '</span>') + '</div></div>';
    h += '<div class="meta">' + meta.map(function (m) { return '<div><span class="label">' + m[0] + '</span><b>' + esc(m[1]) + '</b></div>'; }).join('') + '</div>';
    if (c.contra) h += '<div class="pcaution"><b>' + t('precautionsColon') + '</b> ' + esc(c.contra) + '</div>';
    h += '<div class="psoap">' + SOAP.map(function (s) { return '<div><b>' + s.letter + '</b><p>' + esc(n[s.k]) + '</p></div>'; }).join('') + '</div>';
    h += '<div class="pchart"><div class="pc" data-note="' + n.id + '"></div><ul class="pmarks">' + ((n.marks || []).length ? n.marks.map(function (m) { return '<li>' + BodyChart.glyphSVG(m.type) + esc(markLabel(m.type)) + (lang === 'fr' ? ' : ' : ': ') + esc(markRegion(m)) + '</li>'; }).join('') : '<li>' + t('p.noMarks') + '</li>') + '</ul></div>';
    h += '<div class="precord">' + esc((t('p.written', { t: fmtTime(n.createdAt) }) + ((n.history || []).length ? t('p.amended', { times: plural(n.history.length, 'time'), t: fmtTime(n.amendedAt) }) : t('p.notAmended'))).replace(/\.\./g, '.')) + '</div>';
    if ((n.history || []).length) h += '<div class="phistory"><span class="label" style="color:#555">' + t('p.history') + '</span>' + n.history.map(versionHTML).join('') + '</div>';
    h += '<div class="sign"><div>' + t('p.signature') + '</div><div>' + t('p.date') + '</div></div></article>';
    return h;
  }
  function mountPaperCharts() {
    view.querySelectorAll('.pc').forEach(function (el) {
      var n = note(el.getAttribute('data-note'));
      BodyChart.create(el, { marks: n.marks || [], readOnly: true, small: true });
    });
  }
  function printTools(back, label) {
    return '<div class="print-tools"><a class="back" href="' + back + '">← ' + esc(label) + '</a><button class="btn" data-action="print">' + t('pr.print') + '</button></div>' +
      '<p class="hint no-print">' + t('pr.hint') + '</p>';
  }
  function renderPrintNote(id) {
    var n = note(id), c = client(n.clientId);
    document.title = slug(c.name) + '-' + n.date;
    view.innerHTML = printTools('#/note/' + id, t('pr.backNote')) + paper(n);
    mountPaperCharts();
  }
  function renderPrintClient(id) {
    var c = client(id), ns = notesFor(id);
    document.title = slug(c.name) + '-' + t('doc.allVisits');
    view.innerHTML = printTools('#/client/' + id, c.name) + ns.map(paper).join('');
    mountPaperCharts();
  }

  /* ---------- data & export ---------- */
  function renderData() {
    var st = db.settings, real = realNotes().length, pi = ui.pendingImport, pr = ui.pendingRestore;
    var h = backToClients() + '<div class="page-head"><div><h1>' + t('d.title') + '</h1><p class="sub">' + t('d.sub') + '</p></div></div>';
    if (SALES.checkoutUrl || license()) h += upgradePanel();
    h += '<section class="panel"><h2>' + t('d.whereTitle') + '</h2><p>' + t('d.whereText') + '</p>' +
      '<div class="stat">' + plural(db.clients.length, 'client') + ' · ' + plural(db.notes.length, 'note') + (real !== db.notes.length ? t('d.example', { n: db.notes.length - real }) : '') + ' · ' + t('d.lastBackup', { d: st.lastBackupAt ? fmtDate(isoDay(new Date(st.lastBackupAt))) : t('never') }) + '</div></section>';
    if (FOLDER_OK) h += '<section class="panel"><h2>' + t('d.autoTitle') + '</h2>' + (auto.state === 'on'
        ? '<p>' + t('d.autoOn', { f: esc(auto.name) }) + '</p><div class="row"><button class="btn small quiet" data-action="auto-pick">' + t('d.changeFolder') + '</button><button class="btn small quiet" data-action="auto-off">' + t('d.turnOff') + '</button></div>'
        : auto.state === 'prompt'
        ? '<p>' + t('d.autoPaused', { f: esc(auto.name) }) + '</p><div class="row"><button class="btn small" data-action="auto-resume">' + t('bk.resume') + '</button><button class="btn small quiet" data-action="auto-off">' + t('d.turnOff') + '</button></div>'
        : '<p>' + t('d.autoOff') + '</p><div class="row"><button class="btn small" data-action="auto-pick">' + t('d.chooseFolder') + '</button></div>') +
      '<p class="hint" id="auto-msg" role="status"></p></section>';
    h += '<section class="panel"><h2>' + t('d.dlTitle') + '</h2>' +
      '<div class="row"><button class="btn" data-action="backup">' + (CAN_SHARE ? t('bk.share') : t('d.full')) + '</button><button class="btn quiet" data-action="csv">' + t('d.csv') + '</button></div>' +
      '<p>' + t('d.dlText', { p: t('nt.print') }) + '</p></section>';
    h += '<section class="panel"><h2>' + t('d.detailsTitle') + '</h2><div class="form" style="padding:0;border:0">' +
      '<label class="field"><span>' + t('d.yourName') + '</span><input type="text" id="st-therapist" data-setting="therapist" value="' + esc(st.therapist) + '" placeholder="' + esc(t('d.namePh')) + '"></label>' +
      '<div class="grid2"><label class="field"><span>' + t('d.credential') + '</span><input type="text" id="st-credential" data-setting="credential" value="' + esc(st.credential) + '" placeholder="' + esc(t('d.credentialPh')) + '"></label>' +
      '<label class="field"><span>' + t('d.practice') + '</span><input type="text" id="st-business" data-setting="business" value="' + esc(st.business) + '" placeholder="' + esc(t('d.practicePh')) + '"></label></div></div></section>';
    h += '<section class="panel"><h2>' + t('d.importTitle') + '</h2><p>' + t('d.importText') + '</p>' +
      '<div class="row"><span class="btn quiet file-btn">' + t('d.chooseCsv') + '<input type="file" id="import-file" accept=".csv,text/csv"></span></div>' +
      (pi ? '<div class="notice"><p>' + t('imp.add', { c: plural(pi.add.length, 'client') }) + (pi.skipped ? t('imp.skipped', { n: pi.skipped }) : '') + (pi.capped ? t('imp.capped', { free: SALES.freeClients, n: pi.capped }) : '') + (lang === 'fr' ? ' : ' : ': ') + esc(pi.add.slice(0, 5).map(function (c) { return c.name; }).join(', ')) + (pi.add.length > 5 ? t('imp.more') : '') + '.</p><div class="row"><button class="btn small" data-action="import-confirm">' + t('imp.confirm') + '</button><button class="btn small quiet" data-action="import-cancel">' + t('cancel') + '</button></div></div>' : '') +
      '<p class="hint" id="import-msg" role="status"></p></section>';
    h += '<section class="panel"><h2>' + t('d.restoreTitle') + '</h2><p>' + t('d.restoreText') + '</p>' +
      '<div class="row"><span class="btn quiet file-btn">' + t('d.chooseBackup') + '<input type="file" id="restore-file" accept=".json,application/json"></span></div>' +
      (pr ? '<div class="notice warn"><p>' + t('rs.confirm', { c1: plural(db.clients.length, 'client'), n1: plural(db.notes.length, 'note'), c2: plural(pr.clients.length, 'client'), n2: plural(pr.notes.length, 'note') }) + '</p><div class="row"><button class="btn small" data-action="restore-confirm">' + t('rs.replace') + '</button><button class="btn small quiet" data-action="restore-cancel">' + t('rs.keep') + '</button></div></div>' : '') +
      '<p class="hint" id="restore-msg" role="status"></p></section>';
    h += '<section class="panel"><h2>' + t('d.wipeTitle') + '</h2><p>' + t('d.wipeText') + '</p><div><button class="btn small danger" data-action="wipe">' + t('d.wipeBtn') + '</button></div></section>';
    h += '<p class="hint"><a href="../privacy.html">' + t('d.privacy') + '</a> · <a href="../terms.html">' + t('d.terms') + '</a></p>';
    view.innerHTML = h;
  }

  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ---------- account: Firebase sign-in + one small record per therapist ----------
     The account holds the plan (license key) and the details printed on notes, so they follow
     the therapist to every device. Client records never leave the device. */
  var FIREBASE = { apiKey: '', authDomain: '', projectId: '', appId: '' };
  var FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var acct = { ready: false, user: null, mode: 'signin' };
  var fbP = null, pushTimer = null;
  function accountOn() { return !!FIREBASE.apiKey; }
  function fbLoad() {
    if (!fbP) fbP = Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')]).then(function (m) {
      var app = m[0].initializeApp(FIREBASE);
      return { A: m[1], F: m[2], auth: m[1].getAuth(app), store: m[2].getFirestore(app) };
    });
    return fbP;
  }
  function paintAccountBtn() {
    var b = document.getElementById('acct-btn');
    if (!b) return;
    b.hidden = !accountOn();
    b.textContent = acct.user ? t('nav.account') : t('nav.signin');
  }
  function acctInit() {
    paintAccountBtn();
    if (!accountOn()) return;
    fbLoad().then(function (x) {
      x.A.getRedirectResult(x.auth).catch(function () {});
      x.A.onAuthStateChanged(x.auth, function (u) {
        acct.user = u ? { uid: u.uid, email: u.email || '', name: u.displayName || '' } : null;
        acct.ready = true; paintAccountBtn();
        if (u) acctPull();
        if (parse()[0] === 'account') renderAccount();
      });
    }).catch(function () { acct.ready = true; acct.offline = true; if (parse()[0] === 'account') renderAccount(); });
  }
  function userDoc(x) { return x.F.doc(x.store, 'users', acct.user.uid); }
  function acctPull() {
    fbLoad().then(function (x) {
      return x.F.getDoc(userDoc(x)).then(function (snap) {
        var d = snap.exists() ? snap.data() : {}, st = db.settings, changed = false;
        ['therapist', 'credential', 'business'].forEach(function (k) { if (d[k] && !st[k]) { st[k] = d[k]; changed = true; } });
        if (changed) save();
        var l = license();
        if (d.licenseKey && !(l && l.key === d.licenseKey) && navigator.onLine) {
          activateLicense(d.licenseKey).then(function () { route(); }).catch(function () {});
        }
        acctPush();
      });
    }).catch(function () {});
  }
  function acctPush() {
    if (!acct.user) return;
    fbLoad().then(function (x) {
      var st = db.settings, l = license();
      var data = { email: acct.user.email, therapist: st.therapist || '', credential: st.credential || '', business: st.business || '', updatedAt: x.F.serverTimestamp() };
      if (l && l.key) data.licenseKey = l.key;
      return x.F.setDoc(userDoc(x), data, { merge: true });
    }).catch(function () {});
  }
  function acctPushSoon() { if (!acct.user) return; clearTimeout(pushTimer); pushTimer = setTimeout(acctPush, 1500); }
  function checkoutLink(url) {
    if (!url || !acct.user) return url;
    return url + (url.indexOf('?') > -1 ? '&' : '?') + 'checkout[email]=' + encodeURIComponent(acct.user.email) + '&checkout[custom][uid]=' + encodeURIComponent(acct.user.uid);
  }
  function authError(e) {
    var c = (e && e.code) || '';
    return /invalid-credential|wrong-password|user-not-found|invalid-login/.test(c) ? t('ae.mismatch')
      : /email-already-in-use/.test(c) ? t('ae.inUse')
      : /weak-password/.test(c) ? t('ae.weak')
      : /invalid-email/.test(c) ? t('ae.email')
      : /too-many-requests/.test(c) ? t('ae.tooMany')
      : /requires-recent-login/.test(c) ? t('ae.recent')
      : /network/.test(c) ? t('ae.network')
      : /popup-closed|cancelled-popup/.test(c) ? ''
      : t('ae.generic');
  }
  function acctMsg(x) { var m = document.getElementById('acct-msg'); if (m) m.textContent = x; }

  function renderAccount() {
    var h = backToClients() + '<div class="page-head"><div><h1>' + t('ac.title') + '</h1><p class="sub">' + t('ac.sub') + '</p></div></div>';
    if (!accountOn()) { view.innerHTML = h + '<section class="panel"><p>' + t('ac.closed') + '</p></section>'; return; }
    if (!acct.ready) { view.innerHTML = h + '<section class="panel"><p>' + t('ac.checking') + '</p></section>'; return; }
    if (acct.offline && !acct.user) { view.innerHTML = h + '<section class="panel"><p>' + t('ac.offline') + '</p></section>'; return; }
    if (acct.user) {
      var l = license();
      h += '<section class="panel"><h2>' + t('ac.signedIn') + '</h2><p><b>' + esc(acct.user.email) + '</b></p>' +
        '<div class="stat">' + t('ac.plan', { p: isPro() ? (l.expiresAt ? t('ac.paid', { d: fmtDate(isoDay(new Date(l.expiresAt))) }) : t('ac.lifetime')) : t('ac.free') }) + '</div>' +
        '<p>' + t('ac.follows') + '</p>' +
        '<p class="hint">' + t('ac.never') + '</p>' +
        '<div class="row"><button class="btn small quiet" data-action="acct-signout">' + t('ac.signout') + '</button><button class="btn small danger" data-action="acct-delete">' + t('ac.delete') + '</button></div>' +
        '<p class="hint" id="acct-msg" role="status"></p></section>';
      if (!isPro() && (SALES.checkoutUrl || SALES.lifetimeUrl)) h += upgradePanel();
      view.innerHTML = h; return;
    }
    var up = acct.mode === 'signup';
    h += '<section class="panel"><h2>' + (up ? t('ac.create') : t('ac.signin')) + '</h2>' +
      '<p>' + t('ac.intro') + '</p>' +
      '<div class="row"><button class="btn quiet" data-action="acct-google">' + t('ac.google') + '</button></div>' +
      '<form class="form" id="acct-form" novalidate style="padding:0;border:0">' +
      '<label class="field"><span>' + t('ac.email') + '</span><input type="email" name="email" autocomplete="email" required></label>' +
      '<label class="field"><span>' + t('ac.password') + '</span><input type="password" name="password" autocomplete="' + (up ? 'new-password' : 'current-password') + '" minlength="8" required></label>' +
      '<div class="row"><button class="btn" type="submit">' + (up ? t('ac.createBtn') : t('ac.signin')) + '</button>' +
      (up ? '' : '<button class="btn small quiet" type="button" data-action="acct-reset">' + t('ac.forgot') + '</button>') + '</div></form>' +
      '<p class="hint" id="acct-msg" role="status"></p>' +
      '<p class="hint">' + (up ? t('ac.haveAcct') + ' <button class="linkish" data-action="acct-mode">' + t('ac.signin') + '</button>' : t('ac.newHere') + ' <button class="linkish" data-action="acct-mode">' + t('ac.createLink') + '</button>') + '</p></section>';
    view.innerHTML = h;
  }
  function acctAction(act, a) {
    fbLoad().then(function (x) {
      if (act === 'acct-google') {
        var p = new x.A.GoogleAuthProvider();
        return x.A.signInWithPopup(x.auth, p).catch(function (e) {
          if (/popup-blocked|operation-not-supported/.test(e.code || '')) return x.A.signInWithRedirect(x.auth, p);
          throw e;
        });
      }
      if (act === 'acct-signout') return x.A.signOut(x.auth).then(function () { acct.user = null; renderAccount(); });
      if (act === 'acct-reset') {
        var em = document.querySelector('#acct-form [name=email]').value.trim();
        if (!em) { acctMsg(t('ac.resetNeedEmail')); return; }
        return x.A.sendPasswordResetEmail(x.auth, em).then(function () { acctMsg(t('ac.resetSent')); });
      }
      if (act === 'acct-delete') {
        if (!confirmTwice(a, 'da', t('ct.account'))) return;
        return x.F.deleteDoc(userDoc(x)).then(function () { return x.auth.currentUser.delete(); }).then(function () { acct.user = null; renderAccount(); acctMsg(t('ac.deleted')); });
      }
    }).catch(function (e) { acctMsg(authError(e)); });
  }
  function acctSubmit(form) {
    var em = form.elements.email.value.trim(), pw = form.elements.password.value;
    if (!em || pw.length < 8) { acctMsg(!em ? t('ac.addEmail') : t('ae.weak')); return; }
    acctMsg(acct.mode === 'signup' ? t('ac.creating') : t('ac.signingIn'));
    fbLoad().then(function (x) {
      return acct.mode === 'signup' ? x.A.createUserWithEmailAndPassword(x.auth, em, pw) : x.A.signInWithEmailAndPassword(x.auth, em, pw);
    }).catch(function (e) { acctMsg(authError(e)); });
  }

  /* ---------- import clients from CSV ---------- */
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',' || ch === ';' || ch === '\t') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim(); }); });
  }
  function clientsFromCSV(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) throw new Error('empty');
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var col = function (re, not) { for (var i = 0; i < head.length; i++) if (re.test(head[i]) && !(not && not.test(head[i]))) return i; return -1; };
    var first = col(/first|given|pr[ée]nom/), last = col(/last|surname|family|apellido|nom de famille|^nom$/);
    var full = col(/^(full ?name|name|client( name)?|customer( name)?|display name|nom complet|nom du client|nombre( completo)?|nombre del cliente|cliente)$/);
    // "Nombre" next to "Apellido" is a first name, not a full name.
    if (first < 0 && last > -1 && full > -1 && /^(nombre|name)$/.test(head[full])) { first = full; full = -1; }
    var email = col(/e-?mail|courriel|correo/), phone = col(/phone|mobile|cell|tel[ée]fono|m[óo]vil/), memo = col(/note|memo|nota|remarque/);
    if (first < 0 && full < 0) throw new Error('no name column');
    var have = {};
    db.clients.forEach(function (c) { have[c.name.trim().toLowerCase() + '|' + (c.email || '').toLowerCase()] = 1; });
    var add = [], skipped = 0;
    rows.slice(1).forEach(function (r) {
      var g = function (i) { return i < 0 ? '' : String(r[i] || '').trim(); };
      var name = full > -1 && g(full) ? g(full) : [g(first), g(last)].filter(Boolean).join(' ');
      var key = name.toLowerCase() + '|' + g(email).toLowerCase();
      if (!name || have[key]) { skipped++; return; }
      have[key] = 1;
      add.push({ id: uid(), name: name, phone: g(phone), email: g(email), history: g(memo), contra: '', createdAt: Date.now(), imported: true });
    });
    var capped = 0;
    if (SALES.checkoutUrl && !isPro()) {
      var room = Math.max(0, SALES.freeClients - realClients());
      capped = Math.max(0, add.length - room); add = add.slice(0, room);
    }
    return { add: add, skipped: skipped, capped: capped };
  }

  function backupText() {
    var settings = Object.assign({}, db.settings); delete settings.license;
    return JSON.stringify({ app: 'tablenote', version: 1, exportedAt: new Date().toISOString(), clients: db.clients, notes: db.notes, settings: settings }, null, 2);
  }
  function markBackedUp() { db.settings.lastBackupAt = Date.now(); save(); if (parse()[0] === 'data') renderData(); else if (!parse()[0]) renderList(); }
  function backup() {
    var name = 'tablenote-backup-' + today() + '.json', text = backupText();
    if (CAN_SHARE) {
      var file = new File([text], name, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: t('bk.shareTitle') }).then(markBackedUp).catch(function (e) {
          if (e && e.name !== 'AbortError') { download(name, 'application/json', text); markBackedUp(); }
        });
        return;
      }
    }
    download(name, 'application/json', text); markBackedUp();
  }

  /* ---------- automatic backup to a folder (Chrome and Edge on computers) ---------- */
  var FOLDER_OK = typeof window.showDirectoryPicker === 'function';
  var CAN_SHARE = (IOS || /Android/.test(navigator.userAgent)) && !!(navigator.canShare && navigator.share && window.File);
  var auto = { state: 'off', handle: null, name: '', timer: null };
  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('tablenote-backup', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onerror = function () { rej(r.error); };
      r.onsuccess = function () { var tx = r.result.transaction('kv', mode), q = fn(tx.objectStore('kv')); tx.oncomplete = function () { res(q && q.result); }; tx.onerror = function () { rej(tx.error); }; };
    });
  }
  function autoInit() {
    if (!FOLDER_OK || !window.indexedDB) return;
    idb('readonly', function (s) { return s.get('folder'); }).then(function (h) {
      if (!h) return;
      auto.handle = h; auto.name = h.name;
      return h.queryPermission({ mode: 'readwrite' }).then(function (p) { auto.state = p === 'granted' ? 'on' : 'prompt'; route(); });
    }).catch(function () {});
  }
  function autoWrite() {
    if (auto.state !== 'on' || !realNotes().length) return Promise.resolve();
    return auto.handle.getFileHandle('tablenote-backup-' + today() + '.json', { create: true })
      .then(function (fh) { return fh.createWritable(); })
      .then(function (w) { return w.write(backupText()).then(function () { return w.close(); }); })
      .then(function () { db.settings.lastBackupAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(db)); return autoPrune(); })
      .catch(function () { auto.state = 'prompt'; });
  }
  // Each file is a full copy, so only the newest 30 daily files are kept.
  function autoPrune() {
    if (!auto.handle.values) return;
    var names = [], it = auto.handle.values();
    function next() {
      return it.next().then(function (r) {
        if (r.done) return;
        if (r.value.kind === 'file' && /^tablenote-backup-\d{4}-\d{2}-\d{2}\.json$/.test(r.value.name)) names.push(r.value.name);
        return next();
      });
    }
    return next().then(function () {
      names.sort().reverse().slice(30).forEach(function (n) { auto.handle.removeEntry(n).catch(function () {}); });
    }).catch(function () {});
  }
  function autoSoon() { if (auto.state !== 'on') return; clearTimeout(auto.timer); auto.timer = setTimeout(autoWrite, 4000); }
  function autoPick() {
    var msg = function (x) { var m = document.getElementById('auto-msg'); if (m) m.textContent = x; };
    window.showDirectoryPicker({ id: 'tablenote-backup', mode: 'readwrite' }).then(function (h) {
      return idb('readwrite', function (s) { return s.put(h, 'folder'); }).then(function () {
        auto.handle = h; auto.name = h.name; auto.state = 'on';
        return autoWrite();
      });
    }).then(function () { renderData(); msg(t('d.autoSaved', { f: auto.name })); })
      .catch(function (e) { if (e && e.name !== 'AbortError') msg(t('d.autoErr')); });
  }
  function autoResume() {
    auto.handle.requestPermission({ mode: 'readwrite' }).then(function (p) {
      auto.state = p === 'granted' ? 'on' : 'prompt'; return autoWrite();
    }).then(route).catch(function () {});
  }
  function autoOff() {
    idb('readwrite', function (s) { return s.delete('folder'); }).catch(function () {});
    auto = { state: 'off', handle: null, name: '', timer: null }; renderData();
  }
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCSV() {
    var head = ['client', 'date', 'duration_min', 'modality', 'pressure_1to5', 'pain_before', 'pain_after', 'subjective', 'objective', 'assessment', 'plan', 'body_marks', 'precautions', 'written_at', 'amended_count', 'last_amended_at'];
    var rows = db.notes.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (n) {
      var c = client(n.clientId) || {};
      return [c.name, n.date, n.duration, n.modality, n.pressure, n.painBefore, n.painAfter, n.s, n.o, n.a, n.p, BodyChart.describe(n.marks, 'en'), c.contra,
        n.createdAt ? new Date(n.createdAt).toISOString() : '', (n.history || []).length, n.amendedAt ? new Date(n.amendedAt).toISOString() : ''];
    });
    var text = '﻿' + [head].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    download('tablenote-notes-' + today() + '.csv', 'text/csv;charset=utf-8', text);
  }

  /* ---------- events ---------- */
  var armed = {};
  function confirmTwice(btn, key, label) {
    if (armed[key]) { clearTimeout(armed[key]); armed[key] = null; return true; }
    var original = btn.textContent;
    btn.textContent = label;
    armed[key] = setTimeout(function () { armed[key] = null; if (btn.isConnected) btn.textContent = original; }, 4000);
    return false;
  }

  view.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip]');
    if (chip) {
      var ta = document.getElementById('nf-' + chip.getAttribute('data-chip'));
      var v = ta.value.replace(/\s+$/, '');
      ta.value = v ? v + (/[.;:!?]$/.test(v) ? ' ' : '; ') + chip.textContent : chip.textContent;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    var sb = e.target.closest('[data-seg] button');
    if (sb) {
      var group = sb.parentNode, field = group.getAttribute('data-seg'), n = note(openNoteId);
      var val = +sb.getAttribute('data-value');
      n[field] = n[field] === val ? null : val;
      group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-value') === n[field])); });
      touch(n);
      return;
    }
    var a = e.target.closest('[data-action]');
    if (!a) return;
    var act = a.getAttribute('data-action'), id = a.getAttribute('data-id');
    if (act === 'remove-examples') {
      var ex = db.clients.filter(function (c) { return c.example; }).map(function (c) { return c.id; });
      db.clients = db.clients.filter(function (c) { return !c.example; });
      db.notes = db.notes.filter(function (n) { return ex.indexOf(n.clientId) < 0; });
      save(); renderList();
    } else if (act === 'new-note') {
      var last = notesFor(id)[0];
      var nn = { id: uid(), clientId: id, date: today(), duration: last ? last.duration : 60, modality: last ? last.modality : 'Swedish', pressure: last ? last.pressure : null,
        painBefore: null, painAfter: null, s: '', o: '', a: '', p: '', marks: [], createdAt: Date.now(), updatedAt: Date.now() };
      db.notes.push(nn); save();
      location.hash = '#/note/' + nn.id;
    } else if (act === 'edit-client') {
      ui.editingClient = true; renderClient(parse()[1]);
    } else if (act === 'delete-client') {
      if (!confirmTwice(a, 'dc', notesFor(id).some(amendable) ? t('ct.clientKeep') : t('ct.client'))) return;
      db.clients = db.clients.filter(function (c) { return c.id !== id; });
      db.notes = db.notes.filter(function (n) { return n.clientId !== id; });
      save(); location.hash = '#/';
    } else if (act === 'delete-note') {
      if (!confirmTwice(a, 'dn', amendable(note(id)) ? t('ct.noteKeep') : t('ct.note'))) return;
      var dn = note(id); db.notes = db.notes.filter(function (n) { return n.id !== id; });
      openNoteId = null; save(); location.hash = '#/client/' + dn.clientId;
    } else if (act === 'remove-mark') {
      var n2 = note(openNoteId);
      n2.marks = n2.marks.filter(function (m) { return m.id !== id; });
      chart.setMarks(n2.marks); renderMarks(n2); touch(n2);
    } else if (act === 'copy-marks') {
      var from = note(a.getAttribute('data-from')), n3 = note(openNoteId);
      n3.marks = from.marks.map(function (m) { return Object.assign({}, m, { id: uid() }); });
      chart.setMarks(n3.marks); renderMarks(n3); touch(n3); a.parentNode.remove();
    } else if (act === 'repeat-last') {
      var src = note(a.getAttribute('data-from')), dst = note(openNoteId);
      ['s', 'o', 'a', 'p'].forEach(function (k) { dst[k] = src[k] || ''; });
      ['modality', 'duration', 'pressure'].forEach(function (k) { if (src[k] != null) dst[k] = src[k]; });
      if (!(dst.marks && dst.marks.length) && src.marks) dst.marks = src.marks.map(function (m) { return Object.assign({}, m, { id: uid() }); });
      touch(dst); save(); renderNote(dst.id);
    } else if (act === 'print') {
      window.print();
    } else if (act === 'backup') {
      backup(); if (parse()[0] === 'data') renderData(); else renderList();
    } else if (/^acct-(google|signout|reset|delete)$/.test(act)) {
      acctAction(act, a);
    } else if (act === 'acct-mode') {
      acct.mode = acct.mode === 'signup' ? 'signin' : 'signup'; renderAccount();
    } else if (act === 'auto-pick') {
      autoPick();
    } else if (act === 'auto-resume') {
      autoResume();
    } else if (act === 'auto-off') {
      autoOff();
    } else if (act === 'csv') {
      exportCSV();
    } else if (act === 'activate-license') {
      var input = document.getElementById('license-key'), msg = document.getElementById('license-msg');
      var key = input.value.trim();
      if (!key) { msg.textContent = t('lic.paste'); input.focus(); return; }
      a.disabled = true; msg.textContent = t('lic.checking');
      activateLicense(key).then(function () {
        acctPush();
        var back = parse()[0] === 'client' ? '#/client/new' : null;
        if (back) renderNewClient(); else renderData();
        var m = document.getElementById('license-msg'); if (m) m.textContent = t('lic.ok');
      }).catch(function (err) {
        a.disabled = false;
        msg.textContent = /wrong store/.test(err.message) ? t('lic.wrongStore')
          : /not found|invalid/i.test(err.message) ? t('lic.notFound')
          : /limit/i.test(err.message) ? t('lic.limit')
          : t('lic.err');
      });
    } else if (act === 'deactivate-license') {
      if (!confirmTwice(a, 'dl', t('ct.license'))) return;
      deactivateLicense().then(renderData);
    } else if (act === 'restore-confirm') {
      var r = ui.pendingRestore;
      var lic = db.settings.license;
      db.clients = r.clients; db.notes = r.notes; db.settings = Object.assign(blank().settings, r.settings || {}); db.seeded = true;
      if (lic) db.settings.license = lic;
      ui.pendingRestore = null; save(); renderData();
      document.getElementById('restore-msg').textContent = t('rs.done', { c: plural(db.clients.length, 'client'), n: plural(db.notes.length, 'note') });
    } else if (act === 'import-confirm') {
      var imp = ui.pendingImport; ui.pendingImport = null;
      db.clients = db.clients.concat(imp.add); save(); renderData();
      document.getElementById('import-msg').textContent = t('imp.added', { c: plural(imp.add.length, 'client') });
    } else if (act === 'import-cancel') {
      ui.pendingImport = null; renderData();
    } else if (act === 'restore-cancel') {
      ui.pendingRestore = null; renderData();
    } else if (act === 'wipe') {
      if (!confirmTwice(a, 'wipe', t('ct.wipe'))) return;
      var keep = db.settings; db = blank(); db.seeded = true; db.settings.therapist = keep.therapist; db.settings.credential = keep.credential; db.settings.business = keep.business;
      if (keep.license) db.settings.license = keep.license;
      save(); location.hash = '#/';
    }
  });

  view.addEventListener('input', function (e) {
    var tg = e.target;
    if (tg.id === 'search') { ui.search = tg.value; var pos = tg.selectionStart; renderList(); var s = document.getElementById('search'); s.focus(); s.setSelectionRange(pos, pos); return; }
    var f = tg.getAttribute('data-field');
    if (f && openNoteId) {
      var n = note(openNoteId);
      n[f] = f === 'duration' ? +tg.value : tg.value;
      if (tg.tagName === 'TEXTAREA') autosize(tg);
      touch(n);
      return;
    }
    var st = tg.getAttribute('data-setting');
    if (st) { db.settings[st] = tg.value; saveSoon(); acctPushSoon(); }
  });

  view.addEventListener('change', function (e) {
    var tg = e.target;
    if (tg.id === 'import-file' && tg.files[0]) {
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var res = clientsFromCSV(rd.result);
          if (!res.add.length) { document.getElementById('import-msg').textContent = res.capped ? t('imp.noneFull') : t('imp.none'); return; }
          ui.pendingImport = res; renderData();
        } catch (err) {
          document.getElementById('import-msg').textContent = t('imp.err');
        }
      };
      rd.readAsText(tg.files[0]);
      return;
    }
    if (tg.id !== 'restore-file' || !tg.files[0]) return;
    var reader = new FileReader();
    reader.onload = function () {
      var msg = document.getElementById('restore-msg');
      try {
        var d = JSON.parse(reader.result);
        if (d.app !== 'tablenote' || !Array.isArray(d.clients) || !Array.isArray(d.notes)) throw new Error('format');
        ui.pendingRestore = d; renderData();
      } catch (err) {
        msg.textContent = t('rs.err');
      }
    };
    reader.readAsText(tg.files[0]);
  });

  view.addEventListener('submit', function (e) {
    if (e.target.id === 'acct-form') { e.preventDefault(); acctSubmit(e.target); return; }
    if (e.target.id !== 'client-form') return;
    e.preventDefault();
    var el = e.target.elements;
    var name = el.namedItem('name').value.trim();
    if (!name) { document.getElementById('cf-error').hidden = false; el.namedItem('name').focus(); return; }
    var val = function (k) { return el.namedItem(k).value.trim(); };
    var data = { name: name, phone: val('phone'), email: val('email'), history: val('history'), contra: val('contra') };
    var parts = parse();
    if (parts[1] === 'new') {
      var c = Object.assign({ id: uid(), createdAt: Date.now() }, data);
      db.clients.push(c); save(); location.hash = '#/client/' + c.id;
    } else {
      Object.assign(client(parts[1]), data); ui.editingClient = false; save(); renderClient(parts[1]);
    }
  });

  // Only flush edits that are still waiting; never write a stale copy over what another tab saved.
  window.addEventListener('pagehide', function () { if (dirty) save(); });
  // Another tab changed the notes: reload them here, unless this tab is mid-edit.
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY || dirty) return;
    db = load();
    var parts = parse();
    if (!(parts[0] === 'note' && document.activeElement && /TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName))) route();
  });

  /* ---------- header text and language switch ---------- */
  function paintChrome() {
    document.documentElement.lang = HTML_LANG[lang];
    saveState.firstChild.textContent = storageOK ? t('saved') : t('notSaved');
    var exp = document.getElementById('export-btn'); if (exp) exp.textContent = t('nav.export');
    var wm = document.querySelector('.wordmark'); if (wm) wm.setAttribute('aria-label', t('nav.home'));
    var sel = document.getElementById('lang-sel');
    if (sel) { sel.value = lang; sel.setAttribute('aria-label', t('nav.lang')); sel.title = t('nav.lang'); }
    paintAccountBtn();
    if (window.TablenoteTheme) window.TablenoteTheme.refresh();
  }
  function setLang(l) {
    if (!I18N[l] || l === lang) return;
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    if (dirty) save();
    relocalizeExamples();
    paintChrome();
    var y = window.scrollY;
    route();
    window.scrollTo(0, y);
  }
  var langSel = document.getElementById('lang-sel');
  if (langSel) langSel.addEventListener('change', function () { setLang(langSel.value); });

  paintChrome();
  if (!storageOK) showSave();
  route();
  autoInit();
  acctInit();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(function () {});
  revalidateLicense();
})();
