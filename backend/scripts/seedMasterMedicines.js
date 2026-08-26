const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MedicineMaster = require('../models/MedicineMaster');

// Indian Medicine Brands & Formulations Catalog Generator
const generateMedicineNames = (targetCount = 50000) => {
  const brandRoots = [
    // Analgesics & Antipyretics
    'Dolo', 'Crocin', 'Calpol', 'Combiflam', 'Zerodol', 'Zerodol-P', 'Zerodol-SP', 'Meftal', 'Meftal-Spas',
    'Meftal-P', 'Flexon', 'Flexon-MR', 'Ultracet', 'Voveran', 'Voveran-SR', 'Voveran-TP', 'Brufen', 'Ibugesic',
    'Ibugesic-Plus', 'Paracip', 'P-650', 'Pacimol', 'Sumo', 'Sumo-L', 'Nimsaid', 'Nise', 'Ketorol', 'Ketorol-DT',
    'Dolonex', 'Dolonex-DT', 'Tramazac', 'Dynapar', 'Dynapar-AQ', 'Zandu', 'Volini', 'Moov', 'Omnigel', 'Fastum',
    'Chymoral', 'Chymoral-Forte', 'Trybr-BR', 'Enzomac', 'Enzomac-Plus', 'Signoflam', 'Zerolac', 'Zydol', 'Mobizox',

    // Gastrointestinal & Antacids
    'Pan', 'Pan-D', 'Pan-DSR', 'Pan-40', 'Pan-L', 'Pantocid', 'Pantocid-DSR', 'Pantocid-L', 'Pantodac', 'Pantodac-DSR',
    'Omez', 'Omez-D', 'Omez-DSR', 'Omez-FF', 'Omee', 'Omee-D', 'Razo', 'Razo-D', 'Razo-L', 'Razo-Easy', 'Rablet',
    'Rablet-D', 'Rablet-L', 'Rabekind', 'Rabekind-DSR', 'Rabium', 'Rabium-DSR', 'Aciloc', 'Aciloc-RD', 'Rantac',
    'Rantac-Dom', 'Zinetac', 'Famocid', 'Digene', 'Gelusil', 'Mucaine', 'Polycrol', 'Sucrafil', 'Sucrafil-O',
    'Ulgel', 'Ulgel-Sa', 'Eno', 'Gas-O-Fast', 'Cremaffin', 'Cremaffin-Plus', 'Duphalac', 'Looz', 'Dulcolax',
    'Peg-Move', 'Gopran', 'Ganaton', 'Itoprid', 'Cintapro', 'Ondem', 'Ondem-MD', 'Emeset', 'Emeset-MD', 'Vomikind',
    'Vomikind-MD', 'Domstal', 'Domstal-DT', 'Stemetil', 'Perinorm', 'Normaxin', 'Librax', 'Colimex', 'Cyclopam',
    'Spasmo-Proxyvon', 'Mesacol', 'Saaz', 'Econorm', 'Darolac', 'Sporlac', 'Enterogermina', 'Bifilac', 'Gutclear',

    // Antibiotics & Anti-infectives
    'Augmentin', 'Augmentin-Duo', 'Moxikind', 'Moxikind-CV', 'Clavam', 'Clavam-Forte', 'Clavam-BID', 'Amoxyclav',
    'Novamox', 'Novamox-CV', 'Mox', 'Mox-CV', 'Almox', 'Azithral', 'Azithral-Stat', 'Azee', 'Azee-XL', 'Zithrox',
    'Zady', 'Azibact', 'Cifran', 'Cifran-CT', 'Cifran-TZ', 'Ciplox', 'Ciplox-TZ', 'Floxip', 'Oflox', 'Oflox-OZ',
    'Zenflox', 'Zenflox-OZ', 'O2', 'Oflomac', 'Oflomac-OZ', 'Norflox', 'Norflox-TZ', 'Norilet', 'Mahacef',
    'Mahacef-Plus', 'Mahacef-CV', 'Taxim-O', 'Taxim-O-CV', 'Taxim-O-Forte', 'Cefix', 'Cefolac', 'Cefolac-O',
    'Zifi', 'Zifi-CV', 'Zifi-O', 'Monocef', 'Monocef-O', 'Ceftum', 'Cetil', 'Supacef', 'Kefpod', 'Gudcef',
    'Gudcef-CV', 'Macpod', 'Macpod-CV', 'Doxicip', 'Doxy-1', 'Minoz', 'Tetcyclin', 'Bactrim', 'Bactrim-DS',
    'Septran', 'Septran-DS', 'Metrogyl', 'Metrogyl-ER', 'Flagyl', 'Tiniba', 'Ornidaz', 'Gramocef', 'Mikacin',
    'Amikamac', 'Genticyn', 'Targocid', 'Tygacil', 'Meronem', 'Meromac', 'Magnex', 'Magnex-Forte', 'Pipzo',
    'Tazact', 'Zosyn', 'Faropen', 'Faromac', 'Faronem', 'Linid', 'Lizomac', 'LNZ', 'Claribid', 'Maclar',
    'Rifagut', 'Rcifax', 'Torfix', 'Negabact', 'Dalacin-C', 'Clindac-A', 'Cleocin',

    // Respiratory, Cough & Antihistamines
    'Montair', 'Montair-LC', 'Montair-FX', 'Monticope', 'Monticope-A', 'Montek', 'Montek-LC', 'Romilast', 'Romilast-L',
    'Allegra', 'Allegra-M', 'Allegra-FX', 'Levocet', 'Levocet-M', '1-AL', '1-AL-M', 'Teczine', 'Teczine-M', 'Xyzal',
    'Xyzal-M', 'Cetzine', 'Alerid', 'Okacet', 'Okacet-L', 'Zyrtec', 'Avil', 'Phenergan', 'Atarax', 'Ascoril',
    'Ascoril-LS', 'Ascoril-D', 'Ascoril-Plus', 'Alex', 'Alex-D', 'Alex-P', 'Chericof', 'Chericof-LS', 'Grilinctus',
    'Grilinctus-BM', 'Grilinctus-L', 'Benadryl', 'Benadryl-DR', 'TusQ', 'TusQ-D', 'TusQ-DX', 'Koflet', 'Cofsil',
    'Honitus', 'Asthalin', 'Asthalin-Plus', 'Deriphyllin', 'Deriphyllin-Retard', 'Duolin', 'Budecort', 'Foracort',
    'Seroflo', 'Aerocort', 'Tiova', 'Spiriva', 'Levolin', 'Bambudil', 'Macbery', 'Macbery-DX', 'Solvin', 'Solvin-Cold',
    'Cheston-Cold', 'Sinarest', 'Sinarest-LP', 'Maxtra', 'Nasivion', 'Otrivin', 'Xylomist', 'Rhinocort', 'Flomist',

    // Cardiovascular & Antihypertensive
    'Telma', 'Telma-H', 'Telma-AM', 'Telma-ACT', 'Telpres', 'Telpres-H', 'Telpres-AM', 'Telmikind', 'Telmikind-H',
    'Telmikind-AM', 'Tazloc', 'Tazloc-H', 'Tazloc-AM', 'Telvas', 'Telvas-H', 'Telvas-AM', 'Cresar', 'Cresar-H',
    'Cresar-AM', 'Starpress-AM', 'Starpress-XL', 'Betaloc', 'Betaloc-XL', 'Metolar', 'Metolar-XR', 'Metpure-XL',
    'Cardivas', 'Carvil', 'Nebicard', 'Nebicard-H', 'Nebistar', 'Nebicip', 'Amlong', 'Amlong-H', 'Amlong-A',
    'Stamlo', 'Stamlo-T', 'Stamlo-Beta', 'Amlovas', 'Amlovas-M', 'Cilacar', 'Cilacar-T', 'Cilacar-M', 'Nexpro',
    'Envas', 'Cardace', 'Cardace-H', 'Ramihart', 'Losar', 'Losar-H', 'Losar-A', 'Repace', 'Repace-H', 'Angizam',
    'Diltigesic', 'Arkamin', 'Minipress-XL', 'Prazopress', 'Doxacard', 'Aldactone', 'Dytor', 'Dytor-Plus', 'Lasix',
    'Lasipen', 'Tide', 'Tide-Plus', 'Flavedon', 'Flavedon-MR', 'Angispan-TR', 'Sorbitrate', 'Ismo', 'Monotrate',
    'Nikoran', 'Ivabrad', 'Coralan', 'Inspra', 'Dilzem',

    // Lipid Lowering & Statins
    'Atorva', 'Atorva-F', 'Atorlip', 'Atorlip-F', 'Lipicure', 'Lipicure-F', 'Storvas', 'Storvas-F', 'Tonact',
    'Tonact-TG', 'Rosuvas', 'Rosuvas-F', 'Rosave', 'Rosave-F', 'Rozavel', 'Rozavel-F', 'Roseday', 'Roseday-F',
    'Novastat', 'Novastat-CV', 'Razel', 'Razel-F', 'Lipaglyn', 'Fenolip', 'Triexer', 'Eptoin', 'Brilinta', 'Clopilet',
    'Clopilet-A', 'Deplatt', 'Deplatt-A', 'Plavix', 'Ecosprin', 'Ecosprin-AV', 'Disprin', 'Loprin',

    // Diabetes Management
    'Glycomet', 'Glycomet-GP', 'Glycomet-Trio', 'Glycomet-SR', 'Glucophage', 'Cetapin-XR', 'Obimet', 'Obimet-SR',
    'Amaryl', 'Amaryl-M', 'Glimestar', 'Glimestar-M', 'Glimestar-PM', 'Glimisave', 'Glimisave-M', 'Glimisave-MV',
    'Zoryl', 'Zoryl-M', 'GP', 'GP-1', 'GP-2', 'Glucored-Forte', 'Daonil', 'Semi-Daonil', 'Euglucon', 'Januvia',
    'Janumet', 'Janumet-XR', 'Galvus', 'Galvus-Met', 'Zomelis', 'Zomelis-Met', 'Jalra', 'Jalra-M', 'Trajenta',
    'Trajenta-Duo', 'Onglyza', 'Kombiglyze-XR', 'Tenepure', 'Tenepure-M', 'Tenali', 'Tenali-M', 'Ziten', 'Ziten-M',
    'Dynaglipt-M', 'Tendia', 'Tendia-M', 'Forxiga', 'Xigduo-XR', 'Jardiance', 'Jardiance-Met', 'Invokana', 'Voglistar',
    'Voglistar-GM', 'Volibo', 'Volibo-M', 'Vobit', 'Vobit-M', 'Gluconorm', 'Gluconorm-G', 'Lantus', 'Human-Actrapid',
    'Humalog', 'Novorapid', 'Ryzodeg', 'Tresiba', 'Mixtard', 'Toujeo',

    // Dermatology & Skin
    'Betnovate', 'Betnovate-C', 'Betnovate-N', 'Betnovate-GM', 'Panderm', 'Panderm-Plus', 'Quadriderm', 'Fourderm',
    'Candid', 'Candid-B', 'Candid-V', 'Canesten', 'Clocip', 'Surfaz', 'Surfaz-SN', 'Fucidin', 'Bactroban', 'T-Bact',
    'Supirocin', 'Meganeuron', 'Deriva-CMS', 'Clindac-A', 'Erytop', 'Persol-AC', 'Acrofy', 'Biluma', 'Kojivit',
    'Kojivit-Plus', 'SkinLite', 'Melalite', 'Melaglow', 'Cosmelite', 'Kenacort', 'Lobate', 'Tenovate', 'Tenovate-GN',
    'Elocon', 'Momate', 'Momate-F', 'Flutivate', 'Tacroz', 'Tacrolimus', 'Protopic', 'Ketocip', 'Scalpe-Plus',
    'Nizral', '8X', 'Sebifin', 'Exifine', 'Terbinaforce', 'Itracoe', 'Canditral', 'Itaspor', 'Itracip', 'Lulifin',
    'Lulican', 'Luliz', 'Ebernet', 'Zocon', 'Forcan',

    // Vitamins, Minerals, Supplements & Hematology
    'Shelcal', 'Shelcal-HD', 'Shelcal-M', 'Shelcal-500', 'Shelcal-XT', 'Cipcal', 'Cipcal-HD', 'Cipcal-D3', 'Gemcal',
    'Gemcal-Plus', 'Supracal', 'Calcimax', 'Calcimax-Forte', 'Becosules', 'Becosules-Z', 'Surbex-T', 'Cobadex-CZS',
    'Autrin', 'Neurobion-Forte', 'Optineuron', 'Nurokind-Gold', 'Nurokind-Plus', 'Nurokind-LC', 'Nurokind-Forte',
    'Nurokind-OD', 'Rejunuron', 'Rejunuron-Plus', 'Meganeuron-OD', 'Gabaneuron', 'Pregeb-OD', 'Pregabalin-M',
    'Zincovit', 'Supradyn', 'A-to-Z-NS', 'Revital-H', 'Limcee', 'Celin', 'Chewzee', 'Bio-D3-Plus', 'D-Rise',
    'Uprise-D3', 'Calcirol', 'Taystr-D3', 'Arachitol', 'Depura', 'Dexorange', 'Autrin', 'Orofer-XT', 'Orofer-FCM',
    'Fefol-Z', 'Hb-Set', 'Icar-Plus', 'Livogen', 'Livogen-Z', 'Folvite', 'Folinal', 'Evion', 'Evion-LC', 'CoQ-30',
    'Maxirich', 'Macvestin', 'Cartigen', 'Jointace-DN', 'Tendocare',

    // CNS, Neuro & Psychiatry
    'Nexito', 'Nexito-Plus', 'Nexito-Forte', 'Cipralex', 'Stalopam', 'Stalopam-Plus', 'Szetalo', 'Szetalo-Plus',
    'Zosert', 'Daxid', 'Sertima', 'Flunil', 'Prodep', 'Parotin', 'Pari-CR', 'Depran', 'Depran-L', 'Clonafit',
    'Clonafit-Plus', 'Lonazep', 'Lonazep-MD', 'Rivotril', 'Restyl', 'Alprax', 'Alprazolam', 'Trika', 'Ativan',
    'Larpose', 'Valium', 'Calmpose', 'Frisium', 'Librium', 'Epsolin', 'Gardenal', 'Encorate', 'Encorate-Chrono',
    'Valparin', 'Valparin-Chrono', 'Tegrital', 'Tegrital-CR', 'Mazetol', 'Levipil', 'Levroxa', 'Epilive',
    'Gabapin', 'Gabapin-NT', 'Pregalin', 'Pregalin-M', 'Pregabid', 'Pregabid-NT', 'Pacitane', 'Syndopa',
    'Syndopa-Plus', 'Sizodon', 'Sizodon-Plus', 'Respidon', 'Oleanz', 'Oleanz-Plus', 'Olanex', 'Qutipin', 'Serenace',

    // Urology, Nephrology & Mens Health
    'Silodal', 'Silofast', 'Urimax', 'Urimax-D', 'Urimax-0.4', 'Veltam', 'Veltam-Plus', 'Flodart', 'Alfoo',
    'Alfusin', 'Dutas', 'Duta-T', 'Finast', 'Proscar', 'Urispas', 'Roliten', 'Flavocip', 'Cystone', 'Neeri',
    'Neeri-KFT', 'Potrate-MB6', 'Alkaptr-MB6', 'K-Cit', 'Manforce', 'Vigore', 'Caverta', 'Megalis', 'Assurans',

    // Ophthalmology & ENT
    'Ciplox-Eye', 'Ciplox-D', 'Genticyn-Eye', 'Tobacin', 'Toba', 'Toba-DM', 'Moxicip', 'Moxicip-D', 'Vigamox',
    'Milflox', 'Milflox-Plus', 'Refresh-Tears', 'Refresh-Liquigel', 'Systane', 'Systane-Ultra', 'Tears-Naturale',
    'EcoTears', 'Lubrex', 'Softdrops', 'Nepastar', 'Nevanac', 'Ketlur', 'Flur', 'Pred-Forte', 'Brimocom',
    'Travatan', 'Lumigan', 'Xalatan', 'Timolol', 'Otocin', 'Otek-AC', 'Otogesic', 'Waxolve', 'Clearwax',

    // Ayurvedic, Herbal & OTC Consumer Care
    'Liv-52', 'Liv-52-DS', 'Cystone-Forte', 'Septilin', 'Abana', 'Geriforte', 'Tentex-Forte', 'Confido',
    'Eop-Mentat', 'Gasex', 'Rumalaya-Forte', 'Chyawanprash', 'Triphala-Churna', 'Ashwagandha-Capsule',
    'Brahmi-Vati', 'Shankhpushpi-Syrup', 'Safed-Musli', 'Kabasura-Kudineer', 'Isabgol', 'Hajmola', 'Pudin-Hara',
    'Dabur-Honey', 'Dabur-Red-Paste', 'Vicco-Turmeric', 'Boroline', 'BoroPlus', 'Burnol', 'Itch-Guard', 'Ring-Guard',
    'Krack-Cream', 'Kailas-Jeevan', 'Strepsils', 'Vicks-Vaporub', 'Vicks-Inhaler', 'Amrutanjan', 'Zandu-Balm',
    'Tiger-Balm', 'Moov-Spray', 'Volini-Spray', 'Relispray', 'Soframycin', 'Betadine', 'Betadine-Gargle',
    'Dettol-Antiseptic', 'Savlon-Liquid', 'Electral-ORS', 'Enerzal', 'Protinules', 'Ensure', 'Pediasure',
  ];

  const strengthModifiers = [
    '50mg', '100mg', '150mg', '200mg', '250mg', '300mg', '400mg', '500mg', '600mg', '625mg', '650mg',
    '750mg', '800mg', '850mg', '1000mg', '1g', '2g', '2.5mg', '5mg', '7.5mg', '10mg', '15mg', '20mg',
    '25mg', '30mg', '40mg', '60mg', '75mg', '80mg', '120mg', '160mg', '320mg', '0.25mg', '0.5mg',
    '1mg', '2mg', '3mg', '4mg', '6mg', '8mg', '12mg', '16mg', '24mg', '32mg', '0.1%', '0.05%', '1%',
    '2%', '5%', '10%', '20%', '100IU', '200IU', '400IU', '600IU', '1000IU', '5000IU', '60000IU',
    '10mcg', '25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg', '137mcg', '150mcg',
    '10/500mg', '20/500mg', '5/500mg', '1/500mg', '2/500mg', '50/500mg', '40/12.5mg', '80/12.5mg',
    '40/5mg', '80/5mg', '20/10mg', '10/20mg', '5/10mg', '10/10mg', '75/10mg', '75/20mg', '150/20mg'
  ];

  const dosageForms = [
    'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Oral Drops', 'Injection', 'Infusion', 'Gel',
    'Ointment', 'Cream', 'Lotion', 'Eye Drops', 'Ear Drops', 'Nasal Spray', 'Inhaler', 'Rotacaps',
    'Transcaps', 'Resperules', 'Effervescent Tablet', 'Chewable Tablet', 'Dispersible Tablet',
    'Mouth Dissolving Tablet', 'Sublingual Tablet', 'Sachet', 'Powder', 'Granules', 'Paint',
    'Emulgel', 'Soap', 'Shampoo', 'Mouthwash', 'Gargle', 'Solution', 'Enema', 'Suppository',
    'Softgel Capsule', 'SR Tablet', 'CR Tablet', 'ER Tablet', 'PR Tablet', 'MR Tablet', 'DR Tablet',
    'Forte Tablet', 'Plus Tablet', 'DSR Capsule', 'L Capsule', 'H Tablet', 'AM Tablet', 'AZ Tablet',
    'Kid Tablet', 'Junior Syrup', 'Pediatric Drops', 'Dry Syrup', 'Ready Mix'
  ];

  const suffixes = [
    '', 'Gold', 'Max', 'Plus', 'Forte', 'Ultra', 'Advance', 'Pro', 'Neo', 'Active', 'Duo',
    'Trio', 'Fast', 'Easy', 'Quick', 'Care', 'Safe', 'Sure', 'Life', 'Prime', 'Direct',
    'Express', 'Relief', 'Action', 'Daily', 'Total', 'Complete', 'Defend', 'Protect', 'Shield'
  ];

  const medicineSet = new Set();

  // First, add exact popular core brand names
  for (const brand of brandRoots) {
    medicineSet.add(brand);
  }

  // Next, generate balanced permutations across ALL brands
  for (const form of dosageForms) {
    for (const str of strengthModifiers) {
      for (const brand of brandRoots) {
        medicineSet.add(`${brand} ${str} ${form}`);
        if (medicineSet.size >= targetCount) break;
      }
      if (medicineSet.size >= targetCount) break;
    }
    if (medicineSet.size >= targetCount) break;
  }

  // Secondary layer with suffixes if more are needed
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

  // Additional combinations: Brand + Form
  if (medicineSet.size < targetCount) {
    for (const form of dosageForms) {
      for (const brand of brandRoots) {
        medicineSet.add(`${brand} ${form}`);
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

    const targetCount = 50000;
    console.log(`Generating ${targetCount} Indian medicine records (only names)...`);
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
