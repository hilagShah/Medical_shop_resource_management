const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MedicineMaster = require('../models/MedicineMaster');

// Indian Allopathy Medicine Catalog Generator
const generateMedicineNames = (targetCount = 65000) => {
  const brandRoots = [
    // --- 1. NSAIDs, Pain Relief, Muscle Relaxants & Anti-inflammatory ---
    'Akilos', 'Akilos-P', 'Akilos-SP', 'Akilos-MR', 'Akilos-TH', 'Akilos-D',
    'Aceclo', 'Aceclo-P', 'Aceclo-SP', 'Aceclo-MR', 'Aceclo-SR', 'Acecloren',
    'Hifenac', 'Hifenac-P', 'Hifenac-SP', 'Hifenac-TH', 'Hifenac-D', 'Hifenac-SR', 'Hifenac-MR',
    'Zerodol', 'Zerodol-P', 'Zerodol-SP', 'Zerodol-TH', 'Zerodol-MR', 'Zerodol-PT', 'Zerodol-PG', 'Zerodol-CR',
    'Dolokind', 'Dolokind-P', 'Dolokind-Plus', 'Dolokind-SP', 'Dolokind-MR', 'Dolokind-AA',
    'Dolopar', 'Dolopar-650', 'Dolopar-M', 'Dolopar-Plus', 'Dolopar-Drops',
    'Aldigesic', 'Aldigesic-P', 'Aldigesic-SP', 'Aldigesic-MR', 'Aldigesic-TH',
    'Dolo', 'Dolo-650', 'Dolo-500', 'Dolo-250', 'Dolo-120', 'Dolo-Cold', 'Dolo-Drops',
    'Crocin', 'Crocin-650', 'Crocin-Advance', 'Crocin-Pain-Relief', 'Crocin-Cold-Flu', 'Crocin-Drops',
    'Calpol', 'Calpol-650', 'Calpol-500', 'Calpol-250', 'Calpol-120', 'Calpol-T', 'Calpol-Paediatric',
    'Combiflam', 'Combiflam-Plus', 'Combiflam-ICap', 'Combiflam-Suspension', 'Combiflam-Gel',
    'Meftal', 'Meftal-Spas', 'Meftal-P', 'Meftal-Forte', 'Meftal-500', 'Meftal-Drops',
    'Flexon', 'Flexon-MR', 'Flexon-Plus', 'Flexon-Suspension',
    'Ultracet', 'Ultracet-Semi', 'Tramazac', 'Tramazac-P', 'Tramazac-Plus', 'Contramal',
    'Voveran', 'Voveran-50', 'Voveran-SR-100', 'Voveran-SR-75', 'Voveran-TP', 'Voveran-Emulgel', 'Voveran-Plus',
    'Dynapar', 'Dynapar-AQ', 'Dynapar-LD', 'Dynapar-QPS', 'Dynapar-EC', 'Dynapar-MR',
    'Brufen', 'Brufen-400', 'Brufen-600', 'Brufen-Plus', 'Brufen-Junior',
    'Ibugesic', 'Ibugesic-Plus', 'Ibugesic-ASP', 'Ibugesic-Junior', 'Ibugesic-300',
    'Paracip', 'Paracip-650', 'Paracip-500', 'Paracip-250', 'Paracip-Infusion',
    'P-650', 'P-500', 'P-250', 'P-125', 'Pacimol', 'Pacimol-650', 'Pacimol-500', 'Pacimol-MF',
    'Sumo', 'Sumo-L', 'Sumo-Cold', 'Sumo-Plus', 'Sumo-Gel',
    'Nimsaid', 'Nimsaid-P', 'Nimsaid-SP', 'Nimsaid-MR', 'Nise', 'Nise-D', 'Nise-Gel',
    'Ketanov', 'Ketoflam', 'Ketorol', 'Ketorol-DT', 'Ketorol-Gel', 'Ketorolac',
    'Dolonex', 'Dolonex-DT', 'Dolonex-20', 'Dolonex-Gel', 'Pirox',
    'Chymoral', 'Chymoral-Forte', 'Chymoral-Plus', 'Trybr-BR', 'Enzomac', 'Enzomac-Plus',
    'Signoflam', 'Signoflam-PS', 'Signoflam-TH', 'Zerolac', 'Zydol', 'Mobizox', 'Mobiswift-D',
    'Enzoflam', 'Enzoflam-SV', 'Enzoflam-Gel', 'Movxx', 'Movxx-SP', 'Lornoxi', 'Lofec-P',
    'Defcort', 'Defcort-6', 'Defcort-12', 'Defcort-30', 'Defcort-TM',
    'Omnacortil', 'Omnacortil-5', 'Omnacortil-10', 'Omnacortil-20', 'Omnacortil-40', 'Omnacortil-Drops',
    'Wysolone', 'Wysolone-5', 'Wysolone-10', 'Wysolone-20', 'Wysolone-DT',
    'Kenacort', 'Kenacort-40', 'Kenacort-10', 'Kenacort-Oral-Paste',
    'Medrol', 'Medrol-4', 'Medrol-8', 'Medrol-16', 'Solu-Medrol',
    'Betnesol', 'Betnesol-Forte', 'Betnesol-Injection', 'Betnesol-Oral-Drops',
    'Decdan', 'Decdan-0.5', 'Decdan-4', 'Decdan-8', 'Dexamethasone',
    'Myoril', 'Myoril-4', 'Myoril-8', 'Thiochek', 'Thiospas', 'Thioquest',
    'Baclof', 'Baclof-10', 'Baclof-25', 'Lioresal', 'Liofen-10', 'Liofen-25',
    'Tizan', 'Sirdalud', 'Tolpidol', 'Tolifast', 'Synaptol',

    // --- 2. Gastrointestinal, PPI, Antacids, Antiemetics & Laxatives ---
    'Pan', 'Pan-40', 'Pan-20', 'Pan-D', 'Pan-DSR', 'Pan-L', 'Pan-MPS', 'Pan-IT',
    'Pantocid', 'Pantocid-40', 'Pantocid-20', 'Pantocid-D', 'Pantocid-DSR', 'Pantocid-L', 'Pantocid-HP',
    'Pantodac', 'Pantodac-40', 'Pantodac-20', 'Pantodac-DSR', 'Pantodac-IT', 'Pantodac-L',
    'Pantakind', 'Pantakind-40', 'Pantakind-20', 'Pantakind-DSR', 'Pantakind-L',
    'Pantosec', 'Pantosec-40', 'Pantosec-DSR', 'Pantosec-L', 'Pantor', 'Pantor-DSR',
    'Omez', 'Omez-20', 'Omez-40', 'Omez-D', 'Omez-DSR', 'Omez-FF', 'Omez-Insta',
    'Omee', 'Omee-D', 'Omee-Capsule', 'Ocid', 'Ocid-20', 'Ocid-DSR', 'Ocid-QRS',
    'Razo', 'Razo-20', 'Razo-10', 'Razo-D', 'Razo-DSR', 'Razo-L', 'Razo-Easy',
    'Rablet', 'Rablet-20', 'Rablet-10', 'Rablet-D', 'Rablet-DSR', 'Rablet-L', 'Rablet-IT',
    'Rabekind', 'Rabekind-20', 'Rabekind-DSR', 'Rabekind-Plus', 'Rabekind-L',
    'Rabium', 'Rabium-20', 'Rabium-DSR', 'Rabium-Plus', 'Rabicip', 'Rabicip-D',
    'Veloz', 'Veloz-20', 'Veloz-D', 'Veloz-L', 'Happi', 'Happi-D', 'Happi-L',
    'Nexpro', 'Nexpro-40', 'Nexpro-20', 'Nexpro-RD', 'Nexpro-Fast', 'Nexpro-Junior',
    'Esomac', 'Esomac-40', 'Esomac-20', 'Esomac-DSR', 'Esomac-L',
    'Sompraz', 'Sompraz-40', 'Sompraz-20', 'Sompraz-D', 'Sompraz-DSR', 'Sompraz-HP',
    'Aciloc', 'Aciloc-150', 'Aciloc-300', 'Aciloc-RD', 'Aciloc-Only',
    'Rantac', 'Rantac-150', 'Rantac-300', 'Rantac-Dom', 'Rantac-MPS', 'Rantac-Syrup',
    'Zinetac', 'Zinetac-150', 'Zinetac-300', 'Famocid', 'Famocid-20', 'Famocid-40',
    'Digene', 'Digene-Gel', 'Digene-Tablet', 'Digene-Fizz', 'Gelusil', 'Gelusil-MPS',
    'Mucaine', 'Mucaine-Gel', 'Polycrol', 'Polycrol-Xpress', 'Sucrafil', 'Sucrafil-O', 'Sucrafil-Suspension',
    'Sucramal', 'Sucramal-O', 'Ulgel', 'Ulgel-A', 'Ulgel-Sa', 'Eno', 'Eno-Lemon', 'Gas-O-Fast',
    'Cremaffin', 'Cremaffin-Plus', 'Cremaffin-Fresh', 'Duphalac', 'Duphalac-Bulk', 'Looz', 'Looz-Enema',
    'Dulcolax', 'Dulcolax-5', 'Dulcolax-Suppository', 'Peg-Move', 'Peglec', 'Ezivac',
    'Gopran', 'Ganaton', 'Ganaton-Total', 'Itoprid', 'Itoz-OD', 'Cintapro', 'Cinitapride',
    'Ondem', 'Ondem-4', 'Ondem-8', 'Ondem-MD-4', 'Ondem-MD-8', 'Ondem-Syrup', 'Ondem-Injection',
    'Emeset', 'Emeset-4', 'Emeset-8', 'Emeset-MD-4', 'Emeset-MD-8', 'Emeset-Injection',
    'Vomikind', 'Vomikind-4', 'Vomikind-MD', 'Vomikind-Syrup', 'Vomistop', 'Vomistop-DT',
    'Zofer', 'Zofer-4', 'Zofer-8', 'Zofer-MD', 'Emigo', 'Graniset',
    'Domstal', 'Domstal-10', 'Domstal-DT', 'Domstal-Baby', 'Domstal-Suspension',
    'Perinorm', 'Perinorm-CD', 'Perinorm-Injection', 'Perinorm-Drops', 'Reglan',
    'Stemetil', 'Stemetil-5', 'Stemetil-MD', 'Normaxin', 'Librax', 'Colimex', 'Colimex-DF',
    'Cyclopam', 'Cyclopam-Plus', 'Cyclopam-Drops', 'Cyclopam-Suspension',
    'Spasmo-Proxyvon', 'Spasmo-Proxyvon-Plus', 'Spasmonil', 'Spasmonil-Plus',
    'Buscopan', 'Buscopan-Plus', 'Baralgan', 'Baralgan-M', 'Anafortan', 'Anafortan-Plus',
    'Drotin', 'Drotin-Plus', 'Drotin-M', 'Drotin-A', 'Drotikind', 'Drotikind-M',
    'Mesacol', 'Mesacol-OD', 'Mesacol-Suppository', 'Saaz', 'Saaz-500', 'Saaz-DS',
    'Econorm', 'Econorm-Sachet', 'Econorm-Capsule', 'Darolac', 'Darolac-Aqua', 'Darolac-Plus',
    'Sporlac', 'Sporlac-DS', 'Sporlac-Plus', 'Enterogermina', 'Enterogermina-Respules',
    'Bifilac', 'Bifilac-HP', 'Gutclear', 'Vizylac', 'Vizylac-Rich',
    'Enuff', 'Enuff-10', 'Enuff-30', 'Enuff-Extra', 'Race-F', 'Redotil', 'Redotil-100',
    'Lopamide', 'Imodium', 'Naturogest',

    // --- 3. Antibiotics, Anti-infectives, Antivirals & Antifungals ---
    'Augmentin', 'Augmentin-625-Duo', 'Augmentin-375', 'Augmentin-1000', 'Augmentin-DDS', 'Augmentin-Dry-Syrup',
    'Moxikind', 'Moxikind-CV-625', 'Moxikind-CV-375', 'Moxikind-CV-Forte', 'Moxikind-CV-Dry-Syrup',
    'Clavam', 'Clavam-625', 'Clavam-375', 'Clavam-1g', 'Clavam-Forte', 'Clavam-BID', 'Clavam-Dry-Syrup',
    'Amoxyclav', 'Amoxyclav-625', 'Amoxyclav-375', 'Moxclav', 'Moxclav-625', 'Advent', 'Advent-625',
    'Sensiclav', 'Megaclav', 'Polyclav', 'Novamox', 'Novamox-500', 'Novamox-250', 'Novamox-CV', 'Novamox-Dry-Syrup',
    'Mox', 'Mox-500', 'Mox-250', 'Mox-CV', 'Almox', 'Almox-500', 'Almox-250', 'Almox-CV',
    'Ampoxin', 'Ampoxin-500', 'Ampoxin-250', 'Ampoxin-Dry-Syrup', 'Roscillin', 'Penidure',
    'Azithral', 'Azithral-500', 'Azithral-250', 'Azithral-XL-200', 'Azithral-XL-100', 'Azithral-Stat', 'Azithral-Junior',
    'Azee', 'Azee-500', 'Azee-250', 'Azee-100', 'Azee-XL-200', 'Azee-XL-100', 'Azee-DT',
    'Zithrox', 'Zithrox-500', 'Zithrox-250', 'Zady', 'Zady-500', 'Zady-250', 'Azibact', 'Azibact-500', 'Azimax',
    'Cifran', 'Cifran-500', 'Cifran-250', 'Cifran-CT', 'Cifran-TZ', 'Ciprobid', 'Ciprobid-500',
    'Ciplox', 'Ciplox-500', 'Ciplox-250', 'Ciplox-TZ', 'Alcipro', 'Quintor', 'Floxip',
    'Oflox', 'Oflox-200', 'Oflox-400', 'Oflox-OZ', 'Zenflox', 'Zenflox-200', 'Zenflox-400', 'Zenflox-OZ',
    'Zanocin', 'Zanocin-200', 'Zanocin-400', 'O2', 'O2-Tablet', 'O2-Suspension', 'O2-H',
    'Oflomac', 'Oflomac-200', 'Oflomac-400', 'Oflomac-OZ', 'Oflomac-M', 'Tarivid',
    'Norflox', 'Norflox-400', 'Norflox-200', 'Norflox-TZ', 'Norflox-TZ-RF', 'Norbactin', 'Bacigyl', 'Norilet',
    'Mahacef', 'Mahacef-200', 'Mahacef-100', 'Mahacef-Plus', 'Mahacef-CV', 'Mahacef-Dry-Syrup',
    'Taxim-O', 'Taxim-O-200', 'Taxim-O-100', 'Taxim-O-CV', 'Taxim-O-Forte', 'Taxim-O-Dry-Syrup',
    'Cefix', 'Cefix-200', 'Cefix-100', 'Cefolac', 'Cefolac-200', 'Cefolac-100', 'Cefolac-O', 'Cefolac-CV',
    'Zifi', 'Zifi-200', 'Zifi-100', 'Zifi-CV', 'Zifi-O', 'Zifi-Turbo', 'Omnicef', 'Topcef',
    'Monocef', 'Monocef-1g', 'Monocef-500', 'Monocef-250', 'Monocef-SB', 'Monocef-O', 'Monocef-O-200', 'Monocef-O-100', 'Monocef-O-CV',
    'Ceftum', 'Ceftum-500', 'Ceftum-250', 'Cetil', 'Cetil-500', 'Cetil-250', 'Cetil-CV',
    'Supacef', 'Supacef-750', 'Pulmocef', 'Ceff', 'Ceff-500', 'Sporidex', 'Sporidex-500', 'Sporidex-250',
    'Kefpod', 'Kefpod-200', 'Kefpod-100', 'Kefpod-CV', 'Gudcef', 'Gudcef-200', 'Gudcef-100', 'Gudcef-CV', 'Gudcef-Dry-Syrup',
    'Macpod', 'Macpod-200', 'Macpod-100', 'Macpod-CV', 'Doxicip', 'Doxicip-100', 'Doxy-1', 'Doxy-1-L-DR',
    'Microdox-LBX', 'Minoz', 'Minoz-50', 'Minoz-100', 'Minoz-ER', 'Minocy', 'Minolin', 'Tetcyclin',
    'Bactrim', 'Bactrim-DS', 'Septran', 'Septran-DS', 'Ciplin', 'Ciplin-DS',
    'Metrogyl', 'Metrogyl-400', 'Metrogyl-200', 'Metrogyl-ER', 'Metrogyl-P', 'Flagyl', 'Flagyl-400', 'Flagyl-200',
    'Tiniba', 'Tiniba-500', 'Tiniba-300', 'Ornidaz', 'Ornida', 'Gramocef', 'Gramocef-1g',
    'Mikacin', 'Mikacin-500', 'Mikacin-250', 'Mikacin-100', 'Amikamac', 'Genticyn', 'Genticyn-80', 'Garamycin',
    'Targocid', 'Targocid-400', 'Vanlid', 'Vancocin', 'Tygacil', 'Tygacil-50',
    'Meronem', 'Meronem-1g', 'Meronem-500', 'Meromac', 'Meromac-1g', 'Merosure',
    'Magnex', 'Magnex-1.5g', 'Magnex-Forte-3g', 'Pipzo', 'Pipzo-4.5g', 'Tazact', 'Tazact-4.5g', 'Zosyn',
    'Faropen', 'Faropen-200', 'Faropen-300', 'Faromac', 'Faromac-200', 'Faronem', 'Faronem-200',
    'Linid', 'Linid-600', 'Lizomac', 'Lizomac-600', 'LNZ', 'LNZ-600',
    'Claribid', 'Claribid-500', 'Claribid-250', 'Maclar', 'Maclar-500', 'Synclar',
    'Rifagut', 'Rifagut-400', 'Rifagut-550', 'Rcifax', 'Rcifax-400', 'Rcifax-550', 'Torfix', 'Torfix-400', 'Torfix-550',
    'Negabact', 'Dalacin-C', 'Dalacin-C-300', 'Clindac-A', 'Cleocin', 'Erythrocin', 'Althrocin', 'Rulide', 'Roxid',
    'Zocon', 'Zocon-150', 'Zocon-200', 'Zocon-50', 'Forcan', 'Forcan-150', 'Forcan-200', 'Forcan-50',
    'Canditral', 'Canditral-100', 'Canditral-200', 'Candiforce', 'Candiforce-100', 'Candiforce-200', 'Itaspor', 'Itaspor-100', 'Itaspor-200',
    'Terbinaforce', 'Terbinaforce-250', 'Terbinaforce-500', 'Terbicip', 'Exifine', 'Sebifin',
    'Valcivir', 'Valcivir-500', 'Valcivir-1000', 'Famvir', 'Zovirax', 'Acivir', 'Acivir-DT',
    'Bandy', 'Bandy-Plus', 'Zentel', 'Noworm', 'Noworm-Plus', 'Ivecop', 'Ivecop-6', 'Ivecop-12', 'Vermact', 'Mebex', 'Hetrazan',

    // --- 4. Respiratory, Allergy, Cough, Cold & Inhalers ---
    'Montair', 'Montair-10', 'Montair-4', 'Montair-LC', 'Montair-LC-Kid', 'Montair-FX', 'Montair-Plus',
    'Monticope', 'Monticope-A', 'Monticope-Suspension', 'Montek', 'Montek-LC', 'Montek-Plus', 'Montek-AB',
    'Romilast', 'Romilast-10', 'Romilast-L', 'Romilast-B', 'Odimont-LC', 'Telekast-L', 'Telekast-F', 'Lasma-LC',
    'Allegra', 'Allegra-120', 'Allegra-180', 'Allegra-M', 'Allegra-FX', 'Allegra-Suspension',
    'Fexova', 'Fexy', 'Fexy-120', 'Fexy-180', 'Fexy-M',
    'Levocet', 'Levocet-5', 'Levocet-M', 'Levocet-L', '1-AL', '1-AL-M', '1-AL-Total',
    'Teczine', 'Teczine-5', 'Teczine-10', 'Teczine-M', 'Xyzal', 'Xyzal-5', 'Xyzal-M',
    'Cetzine', 'Cetzine-10', 'Alerid', 'Alerid-D', 'Okacet', 'Okacet-L', 'Okacet-Cold', 'Zyrtec',
    'Avil', 'Avil-25', 'Avil-50', 'Avil-Injection', 'Phenergan', 'Phenergan-25', 'Phenergan-10', 'Atarax', 'Atarax-10', 'Atarax-25',
    'Ascoril', 'Ascoril-LS', 'Ascoril-LS-Junior', 'Ascoril-D-Plus', 'Ascoril-Plus', 'Ascoril-Flu',
    'Alex', 'Alex-D', 'Alex-P', 'Alex-Junior', 'Alex-SugarFree',
    'Chericof', 'Chericof-LS', 'Chericof-D', 'Chericof-Syrup', 'Grilinctus', 'Grilinctus-BM', 'Grilinctus-L', 'Grilinctus-DX',
    'Benadryl', 'Benadryl-DR', 'Benadryl-Cough', 'TusQ', 'TusQ-D', 'TusQ-DX', 'TusQ-LS',
    'Koflet', 'Koflet-SF', 'Cofsil', 'Honitus', 'Zedex', 'Zedex-Plus', 'Phensedyl', 'Corex-DX',
    'Macbery', 'Macbery-LS', 'Macbery-DX', 'Solvin', 'Solvin-Cold', 'Solvin-LS',
    'Cheston-Cold', 'Cheston-LS', 'Sinarest', 'Sinarest-LP', 'Sinarest-New', 'Sinarest-Syrup',
    'Maxtra', 'Maxtra-Syrup', 'Maxtra-Drops', 'Wikoryl', 'Febrex-Plus', 'Sumo-Cold', 'Cozy-Cold', 'Flucold',
    'Nasivion', 'Nasivion-Adult', 'Nasivion-Mini', 'Nasivion-S', 'Otrivin', 'Otrivin-Oxy', 'Otrivin-Baby', 'Xylomist', 'Xylomist-0.1%', 'Xylomist-P',
    'Rhinocort', 'Flomist', 'Budespray', 'Duoresp',
    'Asthalin', 'Asthalin-Inhaler', 'Asthalin-Respules', 'Asthalin-Plus', 'Asthalin-Syrup',
    'Levolin', 'Levolin-Inhaler', 'Levolin-Respules', 'Levolin-0.63', 'Levolin-1.25',
    'Budecort', 'Budecort-200', 'Budecort-400', 'Budecort-100', 'Budecort-Respules', 'Budecort-Inhaler',
    'Foracort', 'Foracort-200', 'Foracort-400', 'Foracort-100', 'Foracort-Autohaler', 'Foracort-Rotacaps',
    'Seroflo', 'Seroflo-250', 'Seroflo-125', 'Seroflo-50', 'Seroflo-Rotacaps', 'Seretide', 'Aerocort',
    'Tiova', 'Tiova-Rotacaps', 'Tiova-Inhaler', 'Spiriva', 'Spiriva-Respimat', 'Duolin', 'Duolin-Respules', 'Duolin-Inhaler',
    'Deriphyllin', 'Deriphyllin-Retard-150', 'Deriphyllin-Retard-300', 'Deriphyllin-Injection', 'Theo-Asthalin',
    'Doxolin', 'Doxolin-400', 'Doxovent', 'Doxoril', 'Phyllocontin', 'Spirodin', 'Pulmoclear', 'Mucolite', 'Ambrodil', 'Ambrodil-Plus', 'Bro-Zedex',

    // --- 5. Cardiovascular, Blood Pressure & Anticoagulants ---
    'Telma', 'Telma-40', 'Telma-80', 'Telma-20', 'Telma-H', 'Telma-AM', 'Telma-ACT', 'Telma-CT',
    'Telpres', 'Telpres-40', 'Telpres-80', 'Telpres-H', 'Telpres-AM', 'Telpres-CT',
    'Telmikind', 'Telmikind-40', 'Telmikind-80', 'Telmikind-20', 'Telmikind-H', 'Telmikind-AM', 'Telmikind-CT', 'Telmikind-Beta',
    'Tazloc', 'Tazloc-40', 'Tazloc-80', 'Tazloc-H', 'Tazloc-AM', 'Tazloc-CT', 'Tazloc-Beta',
    'Telvas', 'Telvas-40', 'Telvas-80', 'Telvas-H', 'Telvas-AM', 'Telvas-3D', 'Telvas-Beta',
    'Cresar', 'Cresar-40', 'Cresar-80', 'Cresar-H', 'Cresar-AM', 'Cresar-CT',
    'Arbitel', 'Arbitel-H', 'Arbitel-AM', 'Telsartan', 'Telsar-H', 'Sartel', 'Sartel-H', 'Sartel-AM',
    'Starpress-AM', 'Starpress-XL-25', 'Starpress-XL-50', 'Starpress-XL-100', 'Betaloc', 'Betaloc-25', 'Betaloc-50', 'Betaloc-XL-25', 'Betaloc-XL-50',
    'Metolar', 'Metolar-25', 'Metolar-50', 'Metolar-100', 'Metolar-XR-25', 'Metolar-XR-50', 'Metolar-XR-100',
    'Metpure-XL', 'Metpure-XL-25', 'Metpure-XL-50', 'Seloken-XL',
    'Cardivas', 'Cardivas-3.125', 'Cardivas-6.25', 'Cardivas-12.5', 'Cardivas-25', 'Carvil', 'Carca', 'Carca-3.125', 'Carca-6.25', 'Carca-12.5',
    'Nebicard', 'Nebicard-2.5', 'Nebicard-5', 'Nebicard-10', 'Nebicard-H', 'Nebistar', 'Nebistar-2.5', 'Nebistar-5', 'Nebicip', 'Nebilong',
    'Amlong', 'Amlong-2.5', 'Amlong-5', 'Amlong-10', 'Amlong-H', 'Amlong-A', 'Amlong-MT',
    'Stamlo', 'Stamlo-2.5', 'Stamlo-5', 'Stamlo-10', 'Stamlo-T', 'Stamlo-Beta', 'Amlovas', 'Amlovas-5', 'Amlovas-10', 'Amlovas-M', 'Amtas', 'Amtas-5', 'Amtas-10',
    'Cilacar', 'Cilacar-5', 'Cilacar-10', 'Cilacar-20', 'Cilacar-T', 'Cilacar-M', 'Cilacar-C',
    'Envas', 'Envas-2.5', 'Envas-5', 'Envas-10', 'Cardace', 'Cardace-2.5', 'Cardace-5', 'Cardace-10', 'Cardace-H',
    'Ramihart', 'Ramihart-2.5', 'Ramihart-5', 'Ramipres', 'Hopace',
    'Losar', 'Losar-25', 'Losar-50', 'Losar-H', 'Losar-A', 'Repace', 'Repace-25', 'Repace-50', 'Repace-H', 'Covance', 'Zaart', 'Losakind',
    'Angizam', 'Diltigesic', 'Dilzem', 'Dilzem-30', 'Dilzem-60', 'Dilzem-SR', 'Arkamin', 'Arkamin-H',
    'Minipress-XL', 'Minipress-XL-2.5', 'Minipress-XL-5', 'Prazopress', 'Prazopress-XL-2.5', 'Prazopress-XL-5', 'Doxacard', 'Cardura',
    'Aldactone', 'Aldactone-25', 'Aldactone-50', 'Aldactone-100', 'Dytor', 'Dytor-5', 'Dytor-10', 'Dytor-20', 'Dytor-Plus-10', 'Dytor-Plus-20',
    'Lasix', 'Lasix-40', 'Lasipen', 'Tide', 'Tide-5', 'Tide-10', 'Tide-20', 'Tide-Plus', 'Torget', 'Torget-Plus',
    'Flavedon', 'Flavedon-20', 'Flavedon-MR-35', 'Angispan-TR', 'Sorbitrate', 'Sorbitrate-5', 'Sorbitrate-10', 'Ismo', 'Monotrate', 'Monotrate-OD', 'Imdur',
    'Nikoran', 'Nikoran-5', 'Nikoran-10', 'Ivabrad', 'Ivabrad-5', 'Ivabrad-7.5', 'Coralan', 'Inspra', 'Planep',
    'Atorva', 'Atorva-10', 'Atorva-20', 'Atorva-40', 'Atorva-80', 'Atorva-F', 'Atorlip', 'Atorlip-10', 'Atorlip-20', 'Atorlip-F',
    'Lipicure', 'Lipicure-10', 'Lipicure-20', 'Lipicure-40', 'Lipicure-F', 'Storvas', 'Storvas-10', 'Storvas-20', 'Storvas-F',
    'Tonact', 'Tonact-10', 'Tonact-20', 'Tonact-40', 'Tonact-TG',
    'Rosuvas', 'Rosuvas-5', 'Rosuvas-10', 'Rosuvas-20', 'Rosuvas-40', 'Rosuvas-F',
    'Rosave', 'Rosave-5', 'Rosave-10', 'Rosave-20', 'Rosave-F', 'Rozavel', 'Rozavel-10', 'Rozavel-20', 'Rozavel-F',
    'Roseday', 'Roseday-10', 'Roseday-20', 'Roseday-F', 'Novastat', 'Novastat-10', 'Novastat-20', 'Novastat-CV', 'Razel', 'Razel-F',
    'Lipaglyn', 'Fenolip', 'Triexer', 'Brilinta', 'Clopilet', 'Clopilet-75', 'Clopilet-A', 'Deplatt', 'Deplatt-75', 'Deplatt-A',
    'Plavix', 'Ceruvin', 'Clavix', 'Ecosprin', 'Ecosprin-75', 'Ecosprin-150', 'Ecosprin-AV-75', 'Ecosprin-AV-150', 'Disprin', 'Loprin',

    // --- 6. Diabetes, Thyroid & Hormonal ---
    'Glycomet', 'Glycomet-500', 'Glycomet-850', 'Glycomet-1g', 'Glycomet-SR-500', 'Glycomet-SR-850', 'Glycomet-SR-1g',
    'Glycomet-GP-1', 'Glycomet-GP-2', 'Glycomet-GP-1-Forte', 'Glycomet-GP-2-Forte', 'Glycomet-Trio-1', 'Glycomet-Trio-2',
    'Glucophage', 'Glucophage-500', 'Glucophage-850', 'Glucophage-1g', 'Cetapin-XR', 'Obimet', 'Obimet-500', 'Obimet-SR',
    'Amaryl', 'Amaryl-1', 'Amaryl-2', 'Amaryl-3', 'Amaryl-M-1', 'Amaryl-M-2', 'Amaryl-M-1-Forte', 'Amaryl-M-2-Forte',
    'Glimestar', 'Glimestar-1', 'Glimestar-2', 'Glimestar-3', 'Glimestar-M-1', 'Glimestar-M-2', 'Glimestar-M-1-Forte', 'Glimestar-M-2-Forte', 'Glimestar-PM-1', 'Glimestar-PM-2',
    'Glimisave', 'Glimisave-1', 'Glimisave-2', 'Glimisave-M-1', 'Glimisave-M-2', 'Glimisave-MV-1', 'Glimisave-MV-2',
    'Zoryl', 'Zoryl-1', 'Zoryl-2', 'Zoryl-M-1', 'Zoryl-M-2', 'GP-1', 'GP-2', 'Glucored-Forte', 'Daonil', 'Semi-Daonil', 'Euglucon',
    'Januvia', 'Januvia-50', 'Januvia-100', 'Janumet', 'Janumet-50/500', 'Janumet-50/1000', 'Janumet-XR-50/500', 'Janumet-XR-50/1000', 'Janumet-XR-100/1000',
    'Galvus', 'Galvus-50', 'Galvus-Met', 'Galvus-Met-50/500', 'Galvus-Met-50/850', 'Galvus-Met-50/1000',
    'Zomelis', 'Zomelis-50', 'Zomelis-Met', 'Jalra', 'Jalra-50', 'Jalra-M', 'Trajenta', 'Trajenta-5', 'Trajenta-Duo',
    'Onglyza', 'Kombiglyze-XR', 'Tenepure', 'Tenepure-M', 'Tenali', 'Tenali-M', 'Ziten', 'Ziten-M', 'Dynaglipt-M', 'Tendia', 'Tendia-M',
    'Forxiga', 'Forxiga-5', 'Forxiga-10', 'Xigduo-XR', 'Xigduo-XR-5/500', 'Xigduo-XR-10/500', 'Xigduo-XR-10/1000',
    'Jardiance', 'Jardiance-10', 'Jardiance-25', 'Jardiance-Met', 'Invokana',
    'Voglistar', 'Voglistar-0.2', 'Voglistar-0.3', 'Voglistar-GM-1', 'Voglistar-GM-2', 'Volibo', 'Volibo-0.2', 'Volibo-0.3', 'Volibo-M', 'Vobit', 'Vobit-M',
    'Gluconorm', 'Gluconorm-G-1', 'Gluconorm-G-2', 'Gluconorm-G-1-Forte', 'Gluconorm-G-2-Forte', 'Gluconorm-VG-1', 'Gluconorm-VG-2',
    'Pioglit', 'Pioz', 'Pioz-15', 'Pioz-30', 'Pioz-MF', 'Rybelsus', 'Rybelsus-3', 'Rybelsus-7', 'Rybelsus-14', 'Ozempic', 'Victoza', 'Trulicity',
    'Lantus', 'Lantus-Solostar', 'Human-Actrapid', 'Human-Mixtard', 'Humalog', 'Novorapid', 'Ryzodeg', 'Tresiba', 'Mixtard', 'Toujeo',
    'Eltroxin', 'Eltroxin-25', 'Eltroxin-50', 'Eltroxin-75', 'Eltroxin-88', 'Eltroxin-100', 'Eltroxin-112', 'Eltroxin-125', 'Eltroxin-150',
    'Thyronorm', 'Thyronorm-25', 'Thyronorm-50', 'Thyronorm-75', 'Thyronorm-88', 'Thyronorm-100', 'Thyronorm-112', 'Thyronorm-125', 'Thyronorm-150',
    'Thyrox', 'Thyrox-25', 'Thyrox-50', 'Thyrox-75', 'Thyrox-100', 'Thyrox-125', 'Thyrox-150',
    'Neo-Mercazole', 'Neo-Mercazole-5', 'Neo-Mercazole-10', 'Cabgolin', 'Cabgolin-0.5',
    'Susten', 'Susten-100', 'Susten-200', 'Susten-300', 'Susten-400', 'Susten-SR', 'Duphaston', 'Deviry', 'Regestrone', 'Primolut-N',
    'Novelon', 'Femilon', 'Ovral-L', 'Mala-D', 'Saheli', 'Unwanted-72', 'i-Pill', 'Unwanted-Kit', 'Mifegest-Kit',

    // --- 7. Vitamins, Minerals & Supplements ---
    'Shelcal', 'Shelcal-500', 'Shelcal-250', 'Shelcal-HD', 'Shelcal-M', 'Shelcal-XT', 'Shelcal-CT', 'Shelcal-K2', 'Shelcal-OS',
    'Cipcal', 'Cipcal-500', 'Cipcal-250', 'Cipcal-HD', 'Cipcal-D3', 'Gemcal', 'Gemcal-Plus', 'Gemcal-D3', 'Gemcal-HD',
    'Supracal', 'Supracal-HD', 'Supracal-Pro', 'Calcimax', 'Calcimax-500', 'Calcimax-Forte', 'Calcimax-Plus', 'Ostocalcium',
    'Becosules', 'Becosules-Z', 'Becosules-Syrup', 'Surbex-T', 'Cobadex-CZS', 'Cobadex-Forte',
    'Neurobion-Forte', 'Neurobion-Plus', 'Optineuron', 'Nurokind-Gold', 'Nurokind-Plus', 'Nurokind-LC', 'Nurokind-Forte', 'Nurokind-OD', 'Nurokind-Next',
    'Rejunuron', 'Rejunuron-Plus', 'Meganeuron-OD', 'Gabaneuron', 'Pregeb-OD', 'Pregabalin-M',
    'Zincovit', 'Zincovit-Tablet', 'Zincovit-Syrup', 'Zincovit-Drops', 'Supradyn', 'Supradyn-Daily', 'A-to-Z-NS', 'Revital-H', 'Revital-H-Woman',
    'Limcee', 'Limcee-500', 'Celin', 'Celin-500', 'Chewzee', 'Bio-D3-Plus', 'Bio-D3-Fem', 'Bio-D3-Strong',
    'D-Rise', 'D-Rise-60K', 'Uprise-D3', 'Uprise-D3-60K', 'Calcirol', 'Taystr-D3', 'Arachitol', 'Depura',
    'Dexorange', 'Dexorange-Syrup', 'Dexorange-Capsule', 'Autrin', 'Orofer-XT', 'Orofer-XT-Syrup', 'Orofer-FCM',
    'Fefol-Z', 'Hb-Set', 'Icar-Plus', 'Livogen', 'Livogen-Z', 'Folvite', 'Folinal', 'Evion', 'Evion-200', 'Evion-400', 'Evion-600', 'Evion-LC',
    'CoQ-30', 'CoQ-100', 'Maxirich', 'Macvestin', 'Cartigen', 'Jointace-DN', 'Tendocare',

    // --- 8. Dermatology, Eye, ENT & CNS ---
    'Betnovate', 'Betnovate-C', 'Betnovate-N', 'Betnovate-GM', 'Panderm', 'Panderm-Plus', 'Quadriderm', 'Fourderm',
    'Candid', 'Candid-B', 'Candid-V', 'Canesten', 'Clocip', 'Surfaz', 'Surfaz-SN', 'Fucidin', 'Bactroban', 'T-Bact',
    'Supirocin', 'Meganeuron', 'Deriva-CMS', 'Clindac-A', 'Erytop', 'Persol-AC', 'Acrofy', 'Biluma', 'Kojivit', 'Kojivit-Plus',
    'SkinLite', 'Melalite', 'Melaglow', 'Cosmelite', 'Lobate', 'Tenovate', 'Tenovate-GN', 'Elocon', 'Momate', 'Momate-F',
    'Flutivate', 'Tacroz', 'Ketocip', 'Scalpe-Plus', 'Nizral', '8X', 'Sebifin', 'Exifine', 'Lulifin', 'Lulican', 'Luliz', 'Ebernet',
    'Ciplox-Eye', 'Ciplox-D', 'Genticyn-Eye', 'Tobacin', 'Toba', 'Toba-DM', 'Moxicip', 'Moxicip-D', 'Vigamox', 'Milflox',
    'Refresh-Tears', 'Refresh-Liquigel', 'Systane', 'Systane-Ultra', 'Tears-Naturale', 'EcoTears', 'Lubrex', 'Softdrops',
    'Nepastar', 'Nevanac', 'Pred-Forte', 'Brimocom', 'Travatan', 'Lumigan', 'Xalatan', 'Timolol', 'Otocin', 'Clearwax', 'Waxolve',
    'Nexito', 'Nexito-Plus', 'Nexito-Forte', 'Cipralex', 'Stalopam', 'Szetalo', 'Zosert', 'Daxid', 'Flunil', 'Prodep', 'Pari-CR', 'Depran',
    'Clonafit', 'Lonazep', 'Rivotril', 'Restyl', 'Alprax', 'Trika', 'Ativan', 'Valium', 'Calmpose', 'Frisium', 'Librium', 'Epsolin',
    'Encorate', 'Encorate-Chrono', 'Valparin', 'Tegrital', 'Levipil', 'Epilive', 'Gabapin', 'Gabapin-NT', 'Pregalin', 'Pregabid', 'Syndopa',
    'Silodal', 'Silofast', 'Urimax', 'Urimax-D', 'Urimax-0.4', 'Veltam', 'Flodart', 'Alfoo', 'Dutas', 'Finast', 'Urispas', 'Manforce', 'Vigore', 'Caverta'
  ];

  const strengthModifiers = [
    '50mg', '100mg', '150mg', '200mg', '250mg', '300mg', '400mg', '500mg', '600mg', '625mg', '650mg',
    '750mg', '800mg', '850mg', '1000mg', '1g', '2g', '2.5mg', '5mg', '7.5mg', '10mg', '15mg', '20mg',
    '25mg', '30mg', '40mg', '60mg', '75mg', '80mg', '120mg', '160mg', '0.25mg', '0.5mg',
    '1mg', '2mg', '3mg', '4mg', '6mg', '8mg', '12mg', '16mg', '24mg', '0.1%', '0.05%', '1%',
    '2%', '5%', '10%', '60000IU', '60K', '100mcg', '150mcg', '10/500mg', '20/500mg', '5/500mg', '50/500mg'
  ];

  const dosageForms = [
    'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Oral Drops', 'Injection', 'Gel',
    'Ointment', 'Cream', 'Eye Drops', 'Ear Drops', 'Nasal Spray', 'Inhaler', 'Rotacaps',
    'Respules', 'Chewable Tablet', 'Dispersible Tablet', 'Mouth Dissolving Tablet', 'Sachet',
    'Powder', 'Solution', 'Softgel Capsule', 'SR Tablet', 'CR Tablet', 'ER Tablet', 'MR Tablet',
    'DSR Capsule', 'Dry Syrup'
  ];

  const suffixes = [
    '', 'Gold', 'Max', 'Plus', 'Forte', 'Ultra', 'Advance', 'Pro', 'Neo', 'Active', 'Duo',
    'Trio', 'Fast', 'Easy', 'Quick', 'Care', 'Safe', 'Sure', 'Relief', 'Action', 'Daily'
  ];

  const medicineSet = new Set();

  // 1. First, insert exact brand names (both with hyphens and natural spaces)
  for (const brand of brandRoots) {
    medicineSet.add(brand);
    if (brand.includes('-')) {
      medicineSet.add(brand.replace(/-/g, ' '));
    }
  }

  // 2. Direct Common Formulations (Brand + Form, Brand with space + Form)
  for (const form of dosageForms) {
    for (const brand of brandRoots) {
      medicineSet.add(`${brand} ${form}`);
      if (brand.includes('-')) {
        medicineSet.add(`${brand.replace(/-/g, ' ')} ${form}`);
      }
      if (medicineSet.size >= targetCount) break;
    }
    if (medicineSet.size >= targetCount) break;
  }

  // 3. Balanced permutations across ALL brands: Brand + Strength + Dosage Form
  for (const form of dosageForms) {
    for (const str of strengthModifiers) {
      for (const brand of brandRoots) {
        medicineSet.add(`${brand} ${str} ${form}`);
        if (brand.includes('-')) {
          medicineSet.add(`${brand.replace(/-/g, ' ')} ${str} ${form}`);
        }
        if (medicineSet.size >= targetCount) break;
      }
      if (medicineSet.size >= targetCount) break;
    }
    if (medicineSet.size >= targetCount) break;
  }

  // 4. Secondary layer with Suffixes
  if (medicineSet.size < targetCount) {
    for (const suf of suffixes) {
      if (!suf) continue;
      for (const form of dosageForms) {
        for (const str of strengthModifiers) {
          for (const brand of brandRoots) {
            medicineSet.add(`${brand} ${suf} ${str} ${form}`);
            if (medicineSet.size >= targetCount) break;
          }
          if (medicineSet.size >= targetCount) break;
        }
        if (medicineSet.size >= targetCount) break;
      }
      if (medicineSet.size >= targetCount) break;
    }
  }

  return Array.from(medicineSet).slice(0, targetCount).map((name) => ({ name }));
};

const seedMasterMedicines = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not set in environment.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    const targetCount = 65000;
    console.log(`Generating up to ${targetCount} comprehensive Indian allopathy medicine records (only names)...`);
    const medicinesData = generateMedicineNames(targetCount);
    console.log(`Generated ${medicinesData.length} unique medicine names.`);

    console.log('Clearing existing MasterMedicine records to ensure clean index...');
    await MedicineMaster.deleteMany({});

    console.log('Inserting in chunks of 5,000...');
    const chunkSize = 5000;
    let inserted = 0;

    for (let i = 0; i < medicinesData.length; i += chunkSize) {
      const chunk = medicinesData.slice(i, i + chunkSize);
      await MedicineMaster.insertMany(chunk, { ordered: false });
      inserted += chunk.length;
      console.log(`Progress: ${inserted} / ${medicinesData.length} medicines stored (${Math.round((inserted / medicinesData.length) * 100)}%)`);
    }

    const totalInDb = await MedicineMaster.countDocuments();
    console.log(`\nMaster Catalog seeding complete! Total medicines in database: ${totalInDb}`);

    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedMasterMedicines();
}

module.exports = { generateMedicineNames };
