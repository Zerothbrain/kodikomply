import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EFFECTIVE_FROM = new Date('2024-01-01');

async function main() {
  console.log('Seeding VAT exempt items and new tables...');

  // ── VAT EXEMPT ITEMS ────────────────────────────────────────────────────────
  await prisma.vatExemptItem.deleteMany();

  const vatItems = [
    // Category 1: Agricultural Implements
    { category: 'Agricultural Implements', itemName: 'Tractors', hsCode: '8701.x', exemptionType: 'EXEMPT', notes: 'All tractor types' },
    { category: 'Agricultural Implements', itemName: 'Agricultural machinery', hsCode: '84.32', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Harvesting machinery', hsCode: '84.33', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Liquid sprayers', hsCode: '8424.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Powder sprayers', hsCode: '8424.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Spades', hsCode: '8201.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Shovels', hsCode: '8201.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Mattocks', hsCode: '8201.30', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Picks', hsCode: '8201.30', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Hoes', hsCode: '8201.30', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Forks', hsCode: '8201.90', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Rakes', hsCode: '8201.30', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Axes', hsCode: '8201.40', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Tractor trailers', hsCode: '8716.20.90', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Agricultural tyres', hsCode: '4011.70.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Rotavator', hsCode: '8432.29.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Poultry incubator', hsCode: '8436.21.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Irrigation equipment', hsCode: '8424.82.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Irrigation parts', hsCode: '8424.90.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Greenhouse system', hsCode: '9406.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Bovine semen', hsCode: '0511.10.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Non-bovine semen', hsCode: '0511.99.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Dam liner', hsCode: '3920', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Ear tags', hsCode: '3926.90.90', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Ear tag applicators', hsCode: '8456.90.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Automatic turning table', hsCode: '8207.30.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Stunning box', hsCode: '8438.50.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Implements', itemName: 'Lessor beam machines', hsCode: '9402.90.90', exemptionType: 'EXEMPT', notes: null },
    // Category 2: Agricultural Inputs
    { category: 'Agricultural Inputs', itemName: 'Fertilisers', hsCode: 'Chapter 31', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Pesticides', hsCode: '3808.99.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Insecticides', hsCode: '3808.91.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Fungicides', hsCode: '3808.92.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Rodenticides', hsCode: '3808.99.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Herbicides', hsCode: '3808.93.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Anti-sprouting products', hsCode: '3808.93.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Plant growth regulators', hsCode: '3808.93.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Agricultural Inputs', itemName: 'Agro net', hsCode: '56.08', exemptionType: 'EXEMPT', notes: null },
    // Category 3: Livestock and Unprocessed Food
    { category: 'Livestock & Unprocessed Food', itemName: 'Live cattle', hsCode: '0102.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Live swine', hsCode: '0103.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Live sheep', hsCode: '0104.10.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Live goats', hsCode: '0104.20.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Live poultry', hsCode: '01.05', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed animal meat', hsCode: 'Chapter 2', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed eggs', hsCode: '0407.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Cow milk (unpasteurised/pasteurised)', hsCode: '04.01', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Goat milk', hsCode: '04.01', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed fish', hsCode: '03.02-03.08', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed vegetables', hsCode: 'Chapter 7', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed fruits', hsCode: '08.03-08.13', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed nuts', hsCode: '08.01-08.02', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed bulbs', hsCode: '0601.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed tubers', hsCode: '0601.20', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed cereals', hsCode: 'Chapter 10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Wheat/meslin flour', hsCode: '11.01', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Maize flour', hsCode: '11.02', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Tobacco not stemmed', hsCode: '2401.10.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed cashew nuts', hsCode: '0801.31.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed coffee', hsCode: '0901.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed tea', hsCode: '0902.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Soya beans', hsCode: '12.01', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Ground nuts', hsCode: '12.02', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Sunflower seeds', hsCode: '12.06', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Oil seeds', hsCode: '12.07', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed pyrethrum', hsCode: '1211.90.20', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed cotton', hsCode: '52.01', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed sisal', hsCode: '5303.10.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Unprocessed sugar cane', hsCode: '1212.93.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Seeds and plants for sowing', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Animal feed preparations', hsCode: '23.09', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Fertilised eggs for incubation', hsCode: '0407.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Oil-cake soya beans', hsCode: '2304.00.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Cotton seed residues', hsCode: '2306.10.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Sunflower residues', hsCode: '2306.30.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Maize bran', hsCode: '2302.10.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Wheat bran', hsCode: '2302.30.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Lysine', hsCode: '2922.41.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Methionine', hsCode: '2939.40.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Mycotoxin binders', hsCode: '2309.90.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Pollard', hsCode: '2309.90.90', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Standing tree', hsCode: '06.02', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Rice bran', hsCode: '2302.40.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Livestock & Unprocessed Food', itemName: 'Cotton cake', hsCode: '2306.10.00', exemptionType: 'EXEMPT', notes: null },
    // Category 4: Fisheries Implements
    { category: 'Fisheries Implements', itemName: 'Floats for fishing nets', hsCode: '3926.90.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Fisheries Implements', itemName: 'Fishing nets', hsCode: '5608.11.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Fisheries Implements', itemName: 'Fishing vessels', hsCode: '8902.00.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Fisheries Implements', itemName: 'Nylon fishing twine', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Fisheries Implements', itemName: 'Outboard engine', hsCode: '8407.21.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Fisheries Implements', itemName: 'Fishing hooks, reels and lines', hsCode: '9507.x', exemptionType: 'EXEMPT', notes: null },
    // Category 5: Beekeeping Implements
    { category: 'Beekeeping Implements', itemName: 'Bee hive', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Beekeeping Implements', itemName: 'Protective beekeeping jacket/veil', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Beekeeping Implements', itemName: 'Mask (beekeeping)', hsCode: '6307.90.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Beekeeping Implements', itemName: 'Honey strainer', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Beekeeping Implements', itemName: 'Bee hive smoker', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    // Category 6: Dairy Equipment
    { category: 'Dairy Equipment', itemName: 'Hay making machine', hsCode: '8433.30.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Aluminium/stainless steel milk cans', hsCode: '7310.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Milking machines', hsCode: '8434.10.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Homogenizer/butter churn/pasteurizer', hsCode: '8434.20.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Cream separator', hsCode: '8421.11.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Milk plate heat exchanger', hsCode: '8419.50.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Milk hose', hsCode: '3917.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Milk pump', hsCode: '8413.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Heat insulated cooling tanks', hsCode: '8419.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Milk storage tanks', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Dairy Equipment', itemName: 'Dairy packaging materials', hsCode: '3922.30.00 / 4819.x', exemptionType: 'EXEMPT', notes: null },
    // Category 7: Medicine & Pharmaceuticals
    { category: 'Medicine & Pharmaceuticals', itemName: 'Essential human medicine approved by Minister', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be approved by Minister of Health', notes: null },
    { category: 'Medicine & Pharmaceuticals', itemName: 'Essential veterinary medicine approved by Minister', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be approved by Minister responsible', notes: null },
    { category: 'Medicine & Pharmaceuticals', itemName: 'Medical equipment approved by Minister', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be approved by Minister of Health', notes: null },
    { category: 'Medicine & Pharmaceuticals', itemName: 'Pharmaceutical packaging (specifically designed)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Specifically designed for pharmaceutical use', notes: null },
    { category: 'Medicine & Pharmaceuticals', itemName: 'Food supplements/vitamins supplied to Government', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be supplied directly to Government', notes: null },
    // Category 8: Articles for People with Disabilities
    { category: 'Disability Articles', itemName: 'Orthopaedic appliances', hsCode: '90.21', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'White cane for blind', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Spectacles for vision correction', hsCode: '9004.90.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Contact lenses', hsCode: '9001.30.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Spectacle lenses (glass)', hsCode: '9001.40.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Spectacle lenses (other)', hsCode: '9001.50.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Sunscreen for albino', hsCode: '33.04', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Braille', hsCode: '8472.90.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Mechanically propelled tricycle for disabled', hsCode: '8713.90.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Disability Articles', itemName: 'Motor vehicle for disabled', hsCode: '87.03', exemptionType: 'EXEMPT', conditions: 'For use by person with disability', notes: null },
    // Category 9: Education Materials
    { category: 'Education Materials', itemName: 'Dictionary/encyclopedia', hsCode: '4901.91.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Education Materials', itemName: 'Printed books', hsCode: '4901', exemptionType: 'EXEMPT', notes: null },
    { category: 'Education Materials', itemName: 'Newspapers', hsCode: '4902.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Education Materials', itemName: "Children's drawing/colouring books", hsCode: '4903.00.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Education Materials', itemName: 'Maps and hydrographic charts', hsCode: '4905.99.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Education Materials', itemName: 'Examination question papers', hsCode: '4911.99.20', exemptionType: 'EXEMPT', notes: null },
    { category: 'Education Materials', itemName: 'Instructional charts and diagrams', hsCode: '4911.99.10', exemptionType: 'EXEMPT', notes: null },
    { category: 'Education Materials', itemName: 'Examination answer sheets', hsCode: '4011.00.90', exemptionType: 'EXEMPT', notes: null },
    // Category 10: Health Care Services
    { category: 'Health Care Services', itemName: 'Medical services (government-approved institution)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be provided by government-approved institution under supervision of registered qualified person', notes: 'Includes medical, dental, nursing, rehabilitation, midwifery, paramedical, optical' },
    { category: 'Health Care Services', itemName: 'Nursing home / residential care (approved)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Government-approved facility for children, aged, or disabled', notes: null },
    // Category 11: Immovable Property
    { category: 'Immovable Property', itemName: 'Sale of vacant land', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Vacant land only', notes: 'S.10 VAT Act' },
    { category: 'Immovable Property', itemName: 'Lease/hire of residential premises', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Right to occupy and reside — residential use only', notes: 'S.10 VAT Act' },
    { category: 'Immovable Property', itemName: 'Sale of existing residential property (2+ years)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must have been occupied as residence for 2 or more years', notes: 'S.10 VAT Act' },
    { category: 'Immovable Property', itemName: 'Sale of newly constructed residential property (first sale)', hsCode: null, exemptionType: 'TAXABLE', conditions: 'First sale of newly constructed residential premises is taxable at 18%', notes: 'S.10 VAT Act' },
    { category: 'Immovable Property', itemName: 'House sale by developer ≤ TZS 50,000,000', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Real estate developer sale price must not exceed TZS 50,000,000', notes: 'S.10 VAT Act — threshold admin editable' },
    // Category 12: Educational Services
    { category: 'Educational Services', itemName: 'Tuition/instruction by approved educational institution', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Institution must be approved by Minister responsible for education. Covers: pre-primary, primary, secondary, technical, community college, university, adult education, vocational, literacy, special needs, sports training', notes: null },
    // Category 13: Financial and Insurance Services
    { category: 'Financial & Insurance Services', itemName: 'Financial services (free of charge)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Services supplied free of charge only', notes: 'Fee-charging financial services are taxable' },
    { category: 'Financial & Insurance Services', itemName: 'Insurance premiums for aircraft', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Financial & Insurance Services', itemName: 'Life insurance', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Financial & Insurance Services', itemName: 'Health insurance', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Financial & Insurance Services', itemName: 'Workers compensation insurance', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Financial & Insurance Services', itemName: 'Crop agricultural insurance', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Financial & Insurance Services', itemName: 'Livestock farming insurance', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Financial & Insurance Services', itemName: 'Arranging/facilitating financial services', hsCode: null, exemptionType: 'TAXABLE', conditions: 'Facilitating or arranging financial services is TAXABLE — not covered by exemption', notes: null },
    // Category 14: Government Non-Commercial
    { category: 'Government Activities', itemName: 'Non-commercial activities by government entity', hsCode: null, exemptionType: 'EXEMPT', conditions: 'EXEMPT only where the same goods/services are NOT also supplied by non-government entities. If non-government entities supply same item → TAXABLE', notes: null },
    // Category 15: Petroleum Products
    { category: 'Petroleum Products', itemName: 'Aviation spirit', hsCode: '2710.12.30', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Spirit type jet fuel', hsCode: '2710.12.40', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Kerosene jet fuel Jet A-1', hsCode: '2710.19.21', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Petrol MSR/MSP', hsCode: '2710.12.x', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Diesel GO', hsCode: '2710.19.31', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Kerosene IK', hsCode: '2710.19.22', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Bitumen', hsCode: '2713.20.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'LPG and Natural gas', hsCode: '2711', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Compressed petroleum/natural gas', hsCode: '2711', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Gas cylinders for cooking', hsCode: '7311.00.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Petroleum Products', itemName: 'Crude oil', hsCode: '2709.00.00', exemptionType: 'EXEMPT', notes: null },
    // Category 16: Other Exempt Supplies
    { category: 'Other Exempt Supplies', itemName: 'Piped/tap water supply', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Piped or tap water only. Bottled or canned water is TAXABLE.', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Bottled/canned water', hsCode: null, exemptionType: 'TAXABLE', conditions: 'Bottled/canned water is taxable at 18%', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Public passenger transport (road/rail/air/water)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Public transport only. Taxis, rental cars, boat charters are TAXABLE.', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Taxi services', hsCode: null, exemptionType: 'TAXABLE', conditions: 'Taxis are NOT exempt — taxable at 18%', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Importation of arms/ammunition for armed forces', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be certified by Ministry of Defence', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Funeral services (coffin, shroud, transportation, mortuary, disposal)', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Gaming supply (gaming tax paid)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Only where gaming tax has been paid under the Gaming Act', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Solar panels and modules', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Solar charger controllers', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Solar inverters', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Vacuum tube solar collectors', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Solar batteries', hsCode: null, exemptionType: 'EXEMPT', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Precious metals/gemstones at TRA designated facilities', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be supplied at TRA-designated facilities', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Aircraft lubricants to local air transport operators', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Must be to local air transport operators', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Aircraft, engines, parts, maintenance (local air operators)', hsCode: null, exemptionType: 'EXEMPT', conditions: 'Supplied to local air transport operators', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Automobile accessories for CNG/electric conversion', hsCode: null, exemptionType: 'EXEMPT', conditions: 'For converting vehicles to natural gas or electric power', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Sisal ropes', hsCode: '5607.21.00 / 5607.29.00', exemptionType: 'EXEMPT', notes: null },
    { category: 'Other Exempt Supplies', itemName: 'Locally manufactured sisal bags', hsCode: '6305.90.00', exemptionType: 'EXEMPT', conditions: 'Locally manufactured only', notes: null },
  ];

  for (const item of vatItems) {
    await prisma.vatExemptItem.create({
      data: { ...item, effectiveFrom: EFFECTIVE_FROM, isActive: true },
    });
  }
  console.log(`VAT exempt items seeded: ${vatItems.length} items`);

  // ── VAT EXEMPT IMPORTS ──────────────────────────────────────────────────────
  await prisma.vatExemptImport.deleteMany();
  const vatImports = [
    { itemNumber: 1, description: 'Unconditional gifts to the State', conditions: null },
    { itemNumber: 2, description: 'Personal baggage exempt under EAC Customs Management Act', conditions: null },
    { itemNumber: 3, description: 'Returned goods — exported and returned unchanged', conditions: 'Goods must be returned in the same condition as exported' },
    { itemNumber: 4, description: 'Transit goods (transshipment to another country)', conditions: null },
    { itemNumber: 5, description: 'Foreign government or international institution free aid goods', conditions: 'Must be free aid — not purchased', notes: null },
    { itemNumber: 6, description: 'Food, clothing, shoes donated to non-profit for orphanages or special needs schools', conditions: 'Must be donated to registered non-profit organisation', notes: null },
    { itemNumber: 7, description: 'NGO goods for emergency/disaster relief', conditions: 'Must be for emergency or disaster relief purposes', notes: null },
    { itemNumber: 8, description: 'Religious organisation goods for health/education/water/religious services', conditions: 'Goods must be supplied free or at ≤50% of market value', notes: null },
    { itemNumber: 9, description: 'Goods exempt under diplomatic agreement', conditions: 'Subject to applicable diplomatic agreement', notes: null },
    { itemNumber: 10, description: 'Oil, gas, mineral exploration goods by registered explorer', conditions: 'Importer must be a registered exploration company', notes: null },
    { itemNumber: 11, description: 'Railway locomotives, wagons, tramways and parts by registered railway company', conditions: 'Must be imported by registered railway company', notes: null },
    { itemNumber: 12, description: 'Fire fighting vehicles by Government', conditions: 'Must be imported directly by Government', notes: null },
    { itemNumber: 13, description: 'Laboratory equipment and reagents by registered education institutions', conditions: 'Must be for educational use by registered institution', notes: null },
    { itemNumber: 14, description: 'CNG gas distribution equipment by natural gas distributor', conditions: 'Must be licensed natural gas distributor', notes: null },
    { itemNumber: 15, description: 'Firefighting equipment', conditions: null, notes: null },
    { itemNumber: 16, description: 'Machinery for vegetable oil manufacturers', conditions: 'HS 8479.20.00, 8438.60.00, 8421.29.00, 8419.89.00', notes: null },
    { itemNumber: 17, description: 'Textile manufacturing machinery', conditions: 'HS 8444-8451 range', notes: null },
    { itemNumber: 18, description: 'Pharmaceutical manufacturing machinery', conditions: 'Chapter 84 + moulds', notes: null },
    { itemNumber: 19, description: 'Hide/leather processing machinery', conditions: 'HS 8438.50.00, 8453.10.00', notes: null },
    { itemNumber: 20, description: 'Ambulances by registered health facilities', conditions: 'HS 8703.90.10. Must be imported by registered health facility', notes: null },
    { itemNumber: 21, description: 'Refrigerated containers for horticulture', conditions: 'HS 8418.69.90 — for horticultural products', notes: null },
    { itemNumber: 22, description: 'Grain drying equipment for agriculture', conditions: 'HS 8419.34.00', notes: null },
    { itemNumber: 23, description: 'Aircraft lubricants and airline items under bilateral agreements', conditions: 'Subject to bilateral air transport agreement', notes: null },
    { itemNumber: 24, description: 'Cold rooms and refrigerated trucks for livestock/fishery/agriculture', conditions: 'Must be for livestock, fishery, or agricultural use', notes: null },
    { itemNumber: 25, description: 'Contactless smart cards by National Identification Authority', conditions: 'Must be imported by NIDA', notes: null },
    { itemNumber: 26, description: 'Fertiliser manufacturing raw materials', conditions: null, notes: null },
    { itemNumber: 27, description: 'Soil testing equipment for agriculture', conditions: null, notes: null },
    { itemNumber: 28, description: 'Meteorological equipment by Tanzania Meteorological Authority', conditions: 'Must be imported by TMA', notes: null },
    { itemNumber: 29, description: 'Gas cylinder manufacturing raw materials', conditions: null, notes: null },
  ];
  for (const item of vatImports) {
    await prisma.vatExemptImport.create({ data: { ...item, isActive: true } });
  }
  console.log(`VAT exempt imports seeded: ${vatImports.length} items`);

  // ── REAL ESTATE VAT RULES ───────────────────────────────────────────────────
  await prisma.realEstateVatRule.deleteMany();
  const reRules = [
    { transactionType: 'SALE', propertyType: 'VACANT_LAND', condition: 'ANY', vatTreatment: 'EXEMPT', threshold: null, notes: 'Sale of vacant land is always EXEMPT — S.10 VAT Act' },
    { transactionType: 'LEASE', propertyType: 'RESIDENTIAL', condition: 'ANY', vatTreatment: 'EXEMPT', threshold: null, notes: 'Lease/hire of residential premises (right to occupy and reside) is EXEMPT — S.10 VAT Act' },
    { transactionType: 'HIRE', propertyType: 'RESIDENTIAL', condition: 'ANY', vatTreatment: 'EXEMPT', threshold: null, notes: 'Hire of residential premises is EXEMPT — S.10 VAT Act' },
    { transactionType: 'SALE', propertyType: 'RESIDENTIAL', condition: 'EXISTING_2YR_PLUS', vatTreatment: 'EXEMPT', threshold: null, notes: 'Sale of existing residential property occupied as residence for 2+ years is EXEMPT — S.10 VAT Act' },
    { transactionType: 'SALE', propertyType: 'RESIDENTIAL', condition: 'NEW', vatTreatment: 'TAXABLE', threshold: null, notes: 'First sale of newly constructed residential premises is TAXABLE at 18% — S.10 VAT Act' },
    { transactionType: 'SALE', propertyType: 'RESIDENTIAL', condition: 'EXISTING_UNDER_2YR', vatTreatment: 'TAXABLE', threshold: null, notes: 'Sale of residential property occupied less than 2 years is TAXABLE at 18% — S.10 VAT Act' },
    { transactionType: 'SALE', propertyType: 'RESIDENTIAL', condition: 'DEVELOPER', vatTreatment: 'EXEMPT', threshold: 50000000, notes: 'Sale by real estate developer at ≤ TZS 50,000,000 is EXEMPT — S.10 VAT Act' },
    { transactionType: 'SALE', propertyType: 'COMMERCIAL', condition: 'ANY', vatTreatment: 'TAXABLE', threshold: null, notes: 'Sale of commercial property is TAXABLE at 18%' },
    { transactionType: 'LEASE', propertyType: 'COMMERCIAL', condition: 'ANY', vatTreatment: 'TAXABLE', threshold: null, notes: 'Lease of commercial property is TAXABLE at 18%' },
  ];
  for (const r of reRules) {
    await prisma.realEstateVatRule.create({ data: { ...r, isActive: true, effectiveFrom: EFFECTIVE_FROM } });
  }
  console.log('Real estate VAT rules seeded');

  // ── VEHICLE BENEFIT TABLE ───────────────────────────────────────────────────
  await prisma.vehicleBenefitTable.deleteMany();
  const vehicleRows = [
    { engineSizeFrom: 0,    engineSizeTo: 1000, monthlyNewVehicle: 250000,  monthlyOldVehicle: 125000 },
    { engineSizeFrom: 1001, engineSizeTo: 2000, monthlyNewVehicle: 500000,  monthlyOldVehicle: 250000 },
    { engineSizeFrom: 2001, engineSizeTo: 3000, monthlyNewVehicle: 1000000, monthlyOldVehicle: 500000 },
    { engineSizeFrom: 3001, engineSizeTo: null, monthlyNewVehicle: 1500000, monthlyOldVehicle: 750000 },
  ];
  for (const row of vehicleRows) {
    await prisma.vehicleBenefitTable.create({ data: { ...row, vehicleAgeThreshold: 5, isActive: true, effectiveFrom: EFFECTIVE_FROM } });
  }
  console.log('Vehicle benefit table seeded (Fifth Schedule ITA)');

  // ── DIGITAL SERVICE TYPES ───────────────────────────────────────────────────
  await prisma.digitalServiceType.deleteMany();
  const digitalServices = [
    { name: 'Websites and web hosting', description: 'Website design, hosting, domain registration, remote maintenance of programs or equipment' },
    { name: 'Software and software updates', description: 'Sale or licensing of software, apps, operating systems, and updates' },
    { name: 'Images, text and information', description: 'Digital images, stock photos, text content, news feeds, and information services' },
    { name: 'Access to databases', description: 'Subscription access to online databases, research portals, information repositories' },
    { name: 'Self-education packages', description: 'Online courses, e-learning platforms, distance education, tutorial services' },
    { name: 'Music, films and games', description: 'Streaming music, video on demand, online gaming, digital media downloads' },
    { name: 'Gaming activities', description: 'Online gaming including gambling, virtual reality gaming, e-sports platforms' },
    { name: 'Political, cultural, artistic, sporting, scientific broadcasts', description: 'Live and recorded broadcasts and events delivered electronically' },
    { name: 'Online intermediation services', description: 'Platforms connecting buyers and sellers (Airbnb, Fiverr, Upwork, Uber types)' },
    { name: 'Online advertisement services', description: 'Digital advertising, sponsored content, targeted ad placement, ad networks' },
  ];
  for (const s of digitalServices) {
    await prisma.digitalServiceType.create({ data: { ...s, isActive: true } });
  }
  console.log('Digital service types seeded (S.51 VAT Act / S.116 ITA)');

  // ── TREATY COUNTRIES ────────────────────────────────────────────────────────
  await prisma.treatyCountry.deleteMany();
  const treaties = [
    { countryName: 'Canada', hasFullTreaty: true },
    { countryName: 'Denmark', hasFullTreaty: true },
    { countryName: 'Finland', hasFullTreaty: true },
    { countryName: 'India', hasFullTreaty: true },
    { countryName: 'Italy', hasFullTreaty: true },
    { countryName: 'Norway', hasFullTreaty: true },
    { countryName: 'South Africa', hasFullTreaty: true },
    { countryName: 'Sweden', hasFullTreaty: true },
    { countryName: 'Zambia', hasFullTreaty: true },
    { countryName: 'Kenya', hasFullTreaty: false, notes: 'EAC partner' },
    { countryName: 'Uganda', hasFullTreaty: false, notes: 'EAC partner' },
    { countryName: 'Rwanda', hasFullTreaty: false, notes: 'EAC partner' },
    { countryName: 'Burundi', hasFullTreaty: false, notes: 'EAC partner' },
    { countryName: 'United Kingdom', hasFullTreaty: true },
    { countryName: 'Netherlands', hasFullTreaty: false },
    { countryName: 'France', hasFullTreaty: false },
    { countryName: 'Germany', hasFullTreaty: false },
    { countryName: 'China', hasFullTreaty: false },
    { countryName: 'United States', hasFullTreaty: false },
    { countryName: 'Other', hasFullTreaty: false, notes: 'Credit still applies — calculated on average TZ rate' },
  ];
  for (const c of treaties) {
    await prisma.treatyCountry.create({ data: { ...c, isActive: true } });
  }
  console.log('Treaty countries seeded');

  // ── VAT SPECIAL SETTINGS (stored in TaxRule) ────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'VAT_SPECIAL' } });
  const vatSpecial = [
    { name: 'Bad debt overdue threshold (months)',    rate: null, fixedAmount: 18,         valueType: 'FIXED', notes: 'S.78 VAT Act — months before bad debt adjustment allowed' },
    { name: 'VAT carry forward periods',              rate: null, fixedAmount: 6,          valueType: 'FIXED', notes: 'S.85 VAT Act — max consecutive periods before refund' },
    { name: 'VAT refund application deadline (years)',rate: null, fixedAmount: 3,          valueType: 'FIXED', notes: 'S.86 VAT Act — years from end of tax period' },
    { name: 'Commissioner refund decision (days)',    rate: null, fixedAmount: 90,         valueType: 'FIXED', notes: 'S.86 VAT Act — days for Commissioner to decide on refund' },
    { name: 'Real estate developer threshold',        rate: null, fixedAmount: 50000000,   valueType: 'FIXED', notes: 'S.10 VAT Act — TZS 50M threshold for developer exemption' },
    { name: 'VAT rate standard',                      rate: 0.18, fixedAmount: null,       valueType: 'PERCENTAGE', notes: '18% standard VAT rate' },
    { name: 'VAT tax fraction',                       rate: 18/118, fixedAmount: null,     valueType: 'PERCENTAGE', notes: '18/118 — extract VAT from VAT-inclusive price' },
    { name: 'Zero-rated refund threshold (%)',        rate: 0.50, fixedAmount: null,       valueType: 'PERCENTAGE', notes: 'S.86 VAT Act — 50% zero-rated turnover for immediate refund' },
    { name: 'Digital marketplace tax rate',           rate: 0.02, fixedAmount: null,       valueType: 'PERCENTAGE', notes: 'S.116 ITA — 2% of gross payment from Tanzania individuals' },
    { name: 'Digital marketplace filing day',         rate: null, fixedAmount: 20,         valueType: 'FIXED', notes: 'S.116 ITA — 20th of following month' },
    { name: 'Capital goods deferral active',          rate: null, fixedAmount: 0,          valueType: 'FIXED', notes: 'S.11 VAT Act — 0=ceased (from 30 June 2026), 1=active' },
    { name: 'Adjustment note deadline (days)',        rate: null, fixedAmount: 7,          valueType: 'FIXED', notes: 'S.77 VAT Act — days to issue adjustment note to customer' },
    { name: 'Customer adjustment periods',            rate: null, fixedAmount: 6,          valueType: 'FIXED', notes: 'S.77 VAT Act — periods customer has to make adjustment' },
  ];
  for (const v of vatSpecial) {
    await prisma.taxRule.create({ data: { category: 'VAT_SPECIAL', effectiveFrom: EFFECTIVE_FROM, isActive: true, minValue: null, maxValue: null, ...v } });
  }
  console.log('VAT special settings seeded');

  console.log('\nVAT seed completed successfully!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
