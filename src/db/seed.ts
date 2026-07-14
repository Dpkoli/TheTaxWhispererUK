/**
 * Idempotent seed script — safe to re-run. Upserts by natural key (slug /
 * tax-area+year) so it never duplicates rows.
 *
 * Scope note: this deliberately does NOT touch sources/topics that already
 * exist in the live database with content that predates this script (e.g.
 * ita-2007-s35, pensions-act-2014-s2, income-tax-personal-allowance) —
 * doing so risked silently overwriting already-verified live content with
 * a fresh reconstruction that might describe the same slug slightly
 * differently. It only adds genuinely new sources/topics/rate tables (for
 * National Insurance and Capital Gains Tax) that didn't exist before, all
 * freshly verified via search in this session. Run with `npm run db:seed`.
 */
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { rateTables, sources, topics, topicSources } from "./schema";

async function upsertSource(row: typeof sources.$inferInsert) {
  const [result] = await db
    .insert(sources)
    .values(row)
    .onConflictDoUpdate({
      target: sources.slug,
      set: { ...row, updatedAt: new Date() },
    })
    .returning();
  return result;
}

async function upsertTopic(row: typeof topics.$inferInsert) {
  const [result] = await db
    .insert(topics)
    .values(row)
    .onConflictDoUpdate({ target: topics.slug, set: row })
    .returning();
  return result;
}

async function main() {
  const now = new Date();

  const itaS58 = await upsertSource({
    slug: "ita-2007-s58",
    sourceType: "act",
    title: 'Income Tax Act 2007, s.58 — Meaning of "adjusted net income"',
    citationCode: "ITA 2007 s.58",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2007/3/section/58",
    jurisdiction: "uk",
    effectiveFrom: "2007-04-06",
    summaryPlainEnglish:
      "Defines 'adjusted net income' — the figure the Personal Allowance taper (s.35) is measured against — as net income minus grossed-up Gift Aid donations and grossed-up pension contributions given relief at source.",
    fullTextExtract:
      "Step 1: take the amount of the individual's net income for the tax year. Step 2: deduct the grossed up amount of any qualifying Gift Aid donation. Step 3: deduct the gross amount of any pension contribution given relief at source. The result is adjusted net income.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const sscbaS6 = await upsertSource({
    slug: "sscba-1992-s6",
    sourceType: "act",
    title: "Social Security Contributions and Benefits Act 1992, s.6 — Liability for Class 1 contributions",
    citationCode: "SSCBA 1992 s.6",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1992/4/section/6",
    jurisdiction: "uk",
    effectiveFrom: "1992-07-13",
    summaryPlainEnglish:
      "Where an employee over 16 is paid earnings above the primary threshold, a primary (employee) Class 1 National Insurance contribution is payable; the employer separately owes a secondary contribution above the secondary threshold. No primary contribution is due once the employee is over State Pension age.",
    fullTextExtract:
      "Where in any tax week earnings are paid to or for the benefit of an earner... a primary Class 1 contribution shall be payable... if the amount paid exceeds the current primary threshold... No primary Class 1 contribution shall be payable in respect of earnings paid to or for the benefit of an earner after he attains pensionable age.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukNiRates = await upsertSource({
    slug: "govuk-ni-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Rates and thresholds for employers 2026 to 2027",
    citationCode: "GOV.UK, Rates and thresholds for employers 2026-27",
    officialUrl: "https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "Publishes the actual Class 1 employee National Insurance figures for the 2026/27 tax year: Primary Threshold £12,570/year, Upper Earnings Limit £50,270/year, main rate 8% between those, and 2% above the Upper Earnings Limit.",
    fullTextExtract:
      "Employee (primary) Class 1 National Insurance: 0% on earnings up to the Primary Threshold (£242/week, £12,570/year); 8% on earnings between the Primary Threshold and the Upper Earnings Limit (£967/week, £50,270/year); 2% on earnings above the Upper Earnings Limit.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const tcgaS1k = await upsertSource({
    slug: "tcga-1992-s1k",
    sourceType: "act",
    title: "Taxation of Chargeable Gains Act 1992, s.1K — Annual exempt amount",
    citationCode: "TCGA 1992 s.1K",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1992/12/section/1K",
    jurisdiction: "uk",
    effectiveFrom: "2019-04-06",
    summaryPlainEnglish:
      "An individual chargeable to Capital Gains Tax gets an annual exempt amount deducted from their chargeable gains for the year, applied in whatever way is most beneficial to them. The amount itself is set separately each year (currently £3,000).",
    fullTextExtract:
      "If an individual is chargeable to capital gains tax for a tax year on chargeable gains, the annual exempt amount for the year is to be deducted from those gains (but no further than necessary to eliminate them). The annual exempt amount may be deducted from gains in whatever way is most beneficial to the person chargeable.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukCgtRates = await upsertSource({
    slug: "govuk-cgt-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Capital Gains Tax rates and allowances",
    citationCode: "GOV.UK, Capital Gains Tax rates and allowances (2026-27)",
    officialUrl: "https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "For 2026/27 the Capital Gains Tax annual exempt amount is £3,000. Gains are taxed at 18% to the extent they fall within the individual's unused basic rate band, and 24% above that — the same rate structure now applies to residential property and other chargeable assets.",
    fullTextExtract:
      "Annual exempt amount for 2026 to 2027: £3,000. Capital Gains Tax rates for individuals: 18% (basic rate) or 24% (higher/additional rate), on both residential property and other chargeable assets.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukScottishIncomeTaxRates = await upsertSource({
    slug: "govuk-scottish-income-tax-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Income Tax in Scotland: Current rates",
    citationCode: "GOV.UK, Income Tax in Scotland — current rates (2026-27)",
    officialUrl: "https://www.gov.uk/scottish-income-tax",
    jurisdiction: "scotland",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "Scotland sets its own Income Tax bands under devolved powers. For 2026/27 there are six bands: Starter 19%, Basic 20%, Intermediate 21%, Higher 42%, Advanced 45%, and Top 48% — different from the three-band rest-of-UK structure, though the £12,570 Personal Allowance and its £100,000 taper are UK-wide.",
    fullTextExtract:
      "Scottish Income Tax rates 2026 to 2027: Starter rate 19% on taxable income £0-£3,967; Basic rate 20% on £3,967-£16,956; Intermediate rate 21% on £16,956-£31,092; Higher rate 42% on £31,092-£62,430; Advanced rate 45% on £62,430-£112,570; Top rate 48% above that.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const ihtS7 = await upsertSource({
    slug: "iht-1984-s7",
    sourceType: "act",
    title: "Inheritance Tax Act 1984, s.7 — Rates",
    citationCode: "IHTA 1984 s.7",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1984/51/section/7",
    jurisdiction: "uk",
    effectiveFrom: "1984-01-01",
    summaryPlainEnglish:
      "Sets the rate of Inheritance Tax charged on the value of a chargeable transfer above the nil-rate band, by reference to the Table in Schedule 1 — currently a flat 40% on death.",
    fullTextExtract:
      "Tax is charged... at the rate or rates in the second column of the Table in Schedule 1 to this Act, so far as the value is within the band set out in the corresponding entry in the first column.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const ihtS8d = await upsertSource({
    slug: "iht-1984-s8d",
    sourceType: "act",
    title: "Inheritance Tax Act 1984, s.8D — Residence nil-rate band",
    citationCode: "IHTA 1984 s.8D",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1984/51/section/8D",
    jurisdiction: "uk",
    effectiveFrom: "2017-04-06",
    summaryPlainEnglish:
      "Gives an additional nil-rate band (the residence nil-rate band) where a qualifying residential interest is closely inherited by direct descendants, on top of the standard nil-rate band. Inserted by Finance (No. 2) Act 2015.",
    fullTextExtract:
      "Section 8D: where a person's estate includes a qualifying residential interest which is closely inherited, an additional nil-rate amount is available, up to the residence nil-rate band for the tax year.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukIhtThresholds = await upsertSource({
    slug: "govuk-iht-thresholds-2026-27",
    sourceType: "govuk_guidance",
    title: "Inheritance Tax: thresholds and rates",
    citationCode: "GOV.UK, Inheritance Tax thresholds and rates (2026-27)",
    officialUrl: "https://www.gov.uk/inheritance-tax",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "For 2026/27 the standard nil-rate band is £325,000 (frozen since 2009, confirmed frozen until at least April 2030). The residence nil-rate band is up to £175,000, tapered away by £1 for every £2 the estate exceeds £2 million. Both bands can be transferred between spouses/civil partners. The rate above the available bands is 40%.",
    fullTextExtract:
      "Nil-rate band: £325,000. Residence nil-rate band: £175,000 (maximum). Residence nil-rate band taper: reduced by £1 for every £2 the estate is worth more than £2 million. Inheritance Tax rate: 40% on the value above the available thresholds.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const fa2003S55 = await upsertSource({
    slug: "fa2003-s55",
    sourceType: "act",
    title: "Finance Act 2003, s.55 — Amount of tax chargeable",
    citationCode: "FA 2003 s.55",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2003/14/section/55",
    jurisdiction: "uk",
    effectiveFrom: "2003-07-10",
    summaryPlainEnglish:
      'Sets how Stamp Duty Land Tax is calculated on a land transaction: Table A applies to wholly residential property, charging each rate of tax on the portion of the price within that band and adding the amounts together (a "slice" system, not a slab).',
    fullTextExtract:
      "The amount of tax chargeable... is calculated by applying the rate or rates specified in the applicable Table to the parts of the relevant consideration, and adding together the amounts so produced.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukSdltRates = await upsertSource({
    slug: "govuk-sdlt-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Stamp Duty Land Tax: Residential property rates",
    citationCode: "GOV.UK, SDLT residential property rates (2026-27)",
    officialUrl: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "For 2026/27, standard residential SDLT (England/NI) is charged in slices: 0% to £125,000, 2% to £250,000, 5% to £925,000, 10% to £1,500,000, 12% above. First-time buyers pay 0% up to £300,000 and 5% up to £500,000, with no relief at all above £500,000 (standard rates then apply to the whole price).",
    fullTextExtract:
      "Residential rates from 1 April 2025: 0% up to £125,000; 2% from £125,001 to £250,000; 5% from £250,001 to £925,000; 10% from £925,001 to £1,500,000; 12% above £1,500,000. First-time buyer relief: 0% up to £300,000; 5% from £300,001 to £500,000; no relief above £500,000.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const vataS2 = await upsertSource({
    slug: "vata-1994-s2",
    sourceType: "act",
    title: "Value Added Tax Act 1994, s.2 — Rate of VAT",
    citationCode: "VATA 1994 s.2",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1994/23/section/2",
    jurisdiction: "uk",
    effectiveFrom: "1994-01-01",
    summaryPlainEnglish:
      "Sets the standard rate of VAT at 20%, chargeable on the value of a taxable supply of goods or services. The Treasury may vary this rate by order within statutory limits.",
    fullTextExtract:
      "VAT shall be charged at the rate of 20 per cent and shall be charged on the supply of goods or services, by reference to the value of the supply as determined under this Act.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukVatRates = await upsertSource({
    slug: "govuk-vat-rates",
    sourceType: "govuk_guidance",
    title: "VAT rates on different goods and services",
    citationCode: "GOV.UK, VAT rates",
    officialUrl: "https://www.gov.uk/vat-rates",
    jurisdiction: "uk",
    effectiveFrom: "2011-01-04",
    summaryPlainEnglish:
      "The three current UK VAT rates: standard rate 20% (most goods and services), reduced rate 5% (a narrow list including domestic fuel and power), and zero rate 0% (e.g. most food, children's clothing, books).",
    fullTextExtract:
      "Standard rate: 20%, most goods and services. Reduced rate: 5%, some goods and services (e.g. home energy, children's car seats). Zero rate: 0%, zero-rated goods and services (e.g. most food, books, children's clothes).",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const ctaS3 = await upsertSource({
    slug: "cta-2010-s3",
    sourceType: "act",
    title: "Corporation Tax Act 2010, s.3 — The rate of corporation tax",
    citationCode: "CTA 2010 s.3",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2010/4/section/3",
    jurisdiction: "uk",
    effectiveFrom: "2010-04-01",
    summaryPlainEnglish:
      "Corporation tax is charged at the main rate set annually by Parliament, unless section 18 applies the lower small profits rate instead for qualifying companies.",
    fullTextExtract:
      'Corporation tax is charged at the rate set by Parliament for the financial year ("the main rate"). Section 18 provides for tax to be charged at the small profits rate instead of the main rate in certain cases.',
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukCorporationTaxRates = await upsertSource({
    slug: "govuk-corporation-tax-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Corporation Tax rates and allowances",
    citationCode: "GOV.UK, Corporation Tax rates and allowances (2026-27)",
    officialUrl:
      "https://www.gov.uk/government/publications/rates-and-allowances-corporation-tax/rates-and-allowances-corporation-tax",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    summaryPlainEnglish:
      "For 2026/27: small profits rate 19% for profits up to £50,000, main rate 25% for profits above £250,000, and marginal relief tapering the rate between the two using the standard fraction 3/200.",
    fullTextExtract:
      "Small profits rate: 19% (profits up to £50,000). Main rate: 25% (profits over £250,000). Marginal relief fraction: 3/200, applied between £50,000 and £250,000.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const sscbaS15 = await upsertSource({
    slug: "sscba-1992-s15",
    sourceType: "act",
    title:
      "Social Security Contributions and Benefits Act 1992, s.15 — Class 4 contributions recoverable under the Income Tax Acts",
    citationCode: "SSCBA 1992 s.15",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1992/4/section/15",
    jurisdiction: "uk",
    effectiveFrom: "1992-07-13",
    summaryPlainEnglish:
      "Charges Class 4 National Insurance contributions on the profits or gains of a trade, profession, or vocation carried on by a self-employed individual, collected alongside Income Tax.",
    fullTextExtract:
      "Class 4 contributions are payable under this section in respect of the profits or gains of a trade, profession or vocation... Class 4 contributions are levied and recovered as if they were an amount of income tax.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukClass4NicRates = await upsertSource({
    slug: "govuk-class4-nic-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Self-employed National Insurance rates",
    citationCode: "GOV.UK, Self-employed National Insurance rates (2026-27)",
    officialUrl: "https://www.gov.uk/self-employed-national-insurance-rates",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "For 2026/27, Class 4 self-employed National Insurance is charged at 6% on annual profits between the Lower Profits Limit (£12,570) and the Upper Profits Limit (£50,270), and 2% above the Upper Profits Limit.",
    fullTextExtract:
      "Class 4 National Insurance: 0% up to £12,570; 6% on profits between £12,570 and £50,270; 2% on profits above £50,270.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const lbttS25 = await upsertSource({
    slug: "lbtt-scotland-2013-s25",
    sourceType: "act",
    title: "Land and Buildings Transaction Tax (Scotland) Act 2013, s.25 — Amount of tax chargeable",
    citationCode: "LBTT(S)A 2013 s.25",
    officialUrl: "https://www.legislation.gov.uk/asp/2013/11/section/25",
    jurisdiction: "scotland",
    effectiveFrom: "2015-04-01",
    summaryPlainEnglish:
      "Sets how LBTT is calculated: for each tax band applicable, the portion of the price within that band is multiplied by the band's rate, and the amounts summed — the same slice mechanism as SDLT, administered separately by Revenue Scotland.",
    fullTextExtract:
      "The amount of tax chargeable in respect of a chargeable transaction is to be determined by, for each tax band, multiplying so much of the chargeable consideration as falls within the band by the tax rate for that band, and summing the results.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const revenueScotlandLbttRates = await upsertSource({
    slug: "revenue-scotland-lbtt-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "LBTT residential rates and bands",
    citationCode: "Revenue Scotland, LBTT residential rates (2026-27)",
    officialUrl: "https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property",
    jurisdiction: "scotland",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "For 2026/27, LBTT residential rates remain: 0% up to £145,000, 2% to £250,000, 5% to £325,000, 10% to £750,000, 12% above. First-time buyer relief raises the nil-rate ceiling to £175,000.",
    fullTextExtract:
      "LBTT residential rates: 0% up to £145,000; 2% from £145,001 to £250,000; 5% from £250,001 to £325,000; 10% from £325,001 to £750,000; 12% above £750,000. First-time buyer relief: nil rate band extended to £175,000.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const lttS24 = await upsertSource({
    slug: "ltt-wales-2017-s24",
    sourceType: "act",
    title:
      "Land Transaction Tax and Anti-avoidance of Devolved Taxes (Wales) Act 2017, s.24 — Amount of tax chargeable",
    citationCode: "LTTADTWA 2017 s.24",
    officialUrl: "https://www.legislation.gov.uk/anaw/2017/1/section/24",
    jurisdiction: "wales",
    effectiveFrom: "2018-04-01",
    summaryPlainEnglish:
      "Sets how LTT is calculated using the same slice-band mechanism as SDLT and LBTT: the portion of the price within each tax band is multiplied by that band's rate. The actual bands and rates are set by regulations under this section, not fixed in the Act itself.",
    fullTextExtract:
      "The liability is established by multiplying so much of the chargeable consideration that falls within each tax band by the percentage rate applicable to that band, and summing the amounts, to give the amount of tax chargeable.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukWalesLttRates = await upsertSource({
    slug: "govuk-wales-ltt-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Land Transaction Tax rates and bands",
    citationCode: "GOV.WALES, Land Transaction Tax rates and bands (2026-27)",
    officialUrl: "https://www.gov.wales/land-transaction-tax-rates-and-bands",
    jurisdiction: "wales",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    summaryPlainEnglish:
      "For 2026/27, LTT main residential rates are unchanged: 0% up to £225,000, 6% to £400,000, 7.5% to £750,000, 10% to £1,500,000, 12% above. Wales does not offer a first-time buyer relief for LTT.",
    fullTextExtract:
      "LTT residential rates: 0% up to £225,000; 6% from £225,001 to £400,000; 7.5% from £400,001 to £750,000; 10% from £750,001 to £1,500,000; 12% above £1,500,000. No first-time buyer relief is available.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const lgfa1992Sch1 = await upsertSource({
    slug: "lgfa-1992-sch1",
    sourceType: "act",
    title: "Local Government Finance Act 1992, Schedule 1 — Valuation bands and proportions",
    citationCode: "LGFA 1992 Sch.1",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1992/14/schedule/1",
    jurisdiction: "uk",
    effectiveFrom: "1993-04-01",
    summaryPlainEnglish:
      "Sets the statutory, nationally-fixed proportions each Council Tax valuation band (A-H) pays relative to Band D: A=6/9, B=7/9, C=8/9, D=9/9, E=11/9, F=13/9, G=15/9, H=18/9. These ratios cannot be varied by individual councils.",
    fullTextExtract:
      "The amount of council tax payable in respect of a dwelling in a particular valuation band is calculated by applying the proportion set out for that band relative to Band D, as set out in the Table in this Schedule.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukCouncilTaxBands = await upsertSource({
    slug: "govuk-council-tax-bands",
    sourceType: "govuk_guidance",
    title: "Council Tax bands and rates",
    citationCode: "GOV.UK, Council Tax bands",
    officialUrl: "https://www.gov.uk/council-tax-bands",
    jurisdiction: "uk",
    effectiveFrom: "1993-04-01",
    summaryPlainEnglish:
      "Confirms the statutory band ratios and explains that the actual amount charged (the Band D figure) is set annually by each of England's billing authorities individually — there is no single national Council Tax rate.",
    fullTextExtract:
      "Band A: 6/9 of Band D. Band B: 7/9. Band C: 8/9. Band D: 9/9 (the reference amount). Band E: 11/9. Band F: 13/9. Band G: 15/9. Band H: 18/9.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const lgfa1988S43 = await upsertSource({
    slug: "lgfa-1988-s43",
    sourceType: "act",
    title: "Local Government Finance Act 1988, s.43 — Occupied hereditaments: liability",
    citationCode: "LGFA 1988 s.43",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1988/41/section/43",
    jurisdiction: "uk",
    effectiveFrom: "1990-04-01",
    summaryPlainEnglish:
      "Establishes liability for non-domestic (business) rates on occupied property, calculated as the rateable value multiplied by a multiplier set annually — the small business multiplier for lower-value properties, the standard multiplier for higher-value ones.",
    fullTextExtract:
      "A person (the ratepayer) shall as regards a hereditament be subject to a non-domestic rate in respect of a chargeable financial year if the ratepayer is in occupation of the whole or part of the hereditament on the day concerned.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukBusinessRatesMultipliers = await upsertSource({
    slug: "govuk-business-rates-multipliers-2026-27",
    sourceType: "govuk_guidance",
    title: "Business rates multipliers and Small Business Rate Relief",
    citationCode: "GOV.UK, Business rates multipliers (2026-27)",
    officialUrl: "https://www.gov.uk/calculate-your-business-rates",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    summaryPlainEnglish:
      "For 2026/27 (England): small business multiplier 43.2p (non-RHL) / 38.2p (retail, hospitality, leisure), standard multiplier 48.0p (non-RHL) / 43.0p (RHL), for properties under £51,000 rateable value using the small business multiplier. Small Business Rate Relief gives 100% relief up to £12,000 rateable value, tapering to 0% at £15,000.",
    fullTextExtract:
      "Small business non-RHL multiplier: 43.2p. Small business RHL multiplier: 38.2p. Standard non-RHL multiplier: 48.0p. Standard RHL multiplier: 43.0p. Small Business Rate Relief: 100% relief for rateable value up to £12,000, tapering to 0% at £15,000.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const cta2009Part13 = await upsertSource({
    slug: "cta-2009-part13",
    sourceType: "act",
    title: "Corporation Tax Act 2009, Part 13 — Additional relief for expenditure on research and development",
    citationCode: "CTA 2009 Part 13",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2009/4/part/13",
    jurisdiction: "uk",
    effectiveFrom: "2009-04-01",
    summaryPlainEnglish:
      "The statutory basis for R&D tax relief. For accounting periods beginning on or after 1 April 2024, this Part provides the merged R&D Expenditure Credit (RDEC) scheme: an above-the-line taxable credit calculated on qualifying R&D expenditure.",
    fullTextExtract:
      "A company is entitled to an R&D expenditure credit for an accounting period if it has qualifying Chapter 1A expenditure in the period. The credit is calculated by applying the specified percentage to the qualifying expenditure.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukRdReliefMergedScheme = await upsertSource({
    slug: "govuk-rd-relief-merged-scheme-2026-27",
    sourceType: "govuk_guidance",
    title: "R&D tax relief: the merged R&D expenditure credit scheme",
    citationCode: "GOV.UK, R&D tax relief — merged scheme (2026-27)",
    officialUrl:
      "https://www.gov.uk/guidance/research-and-development-rd-tax-relief-the-merged-scheme-and-enhanced-rd-intensive-support",
    jurisdiction: "uk",
    effectiveFrom: "2024-04-01",
    summaryPlainEnglish:
      "The merged RDEC scheme applies to accounting periods beginning on or after 1 April 2024. It gives an above-the-line credit of 20% of qualifying R&D expenditure. Because the credit itself is taxable income, the net cash benefit after Corporation Tax at the 25% main rate is 15% of qualifying expenditure for a profitable company.",
    fullTextExtract:
      "R&D expenditure credit rate: 20% of qualifying expenditure. The credit is subject to Corporation Tax, giving a net benefit of 15% of qualifying expenditure for companies paying the 25% main rate.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const itepaS54 = await upsertSource({
    slug: "itepa-2003-s54",
    sourceType: "act",
    title: "Income Tax (Earnings and Pensions) Act 2003, s.54 — Calculation of deemed employment payment",
    citationCode: "ITEPA 2003 s.54",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2003/1/section/54",
    jurisdiction: "uk",
    effectiveFrom: "2003-04-06",
    summaryPlainEnglish:
      "Sets out the 8-step statutory calculation an intermediary (the worker's own company) must use under Chapter 8 IR35 rules to work out the deemed employment payment: starting from fee income less a flat 5% deduction, adding/deducting situational items, and finishing with an employer National Insurance grossing-up step.",
    fullTextExtract:
      "The deemed employment payment for a tax year is calculated by taking the Step One amount and following the process in steps 2 to 8... Step One: find the amount of all payments and benefits received by the intermediary in the year in respect of the relevant engagements, and reduce that amount by 5%.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukDeemedEmploymentPayment = await upsertSource({
    slug: "govuk-deemed-employment-payment",
    sourceType: "govuk_guidance",
    title: "How to calculate the deemed employment payment",
    citationCode: "GOV.UK, How to calculate the deemed employment payment",
    officialUrl: "https://www.gov.uk/guidance/how-to-calculate-the-deemed-employment-payment",
    jurisdiction: "uk",
    effectiveFrom: "2003-04-06",
    summaryPlainEnglish:
      "HMRC's worked guidance on the 8-step deemed employment payment calculation, including the employer National Insurance grossing-up mechanism at step 8: finding the deemed payment figure which, together with the employer NIC due on it, equals the step 7 result.",
    fullTextExtract:
      "Step 8: deduct the amount of employer National Insurance contributions due on the deemed payment. Because the deemed payment and the NIC on it are interdependent, this step uses a grossing-up calculation to find the correct figures.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const sscbaS11a = await upsertSource({
    slug: "sscba-1992-s11a",
    sourceType: "act",
    title: "Social Security Contributions and Benefits Act 1992, s.11A — Class 2 contributions: rates",
    citationCode: "SSCBA 1992 s.11A",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1992/4/section/11A",
    jurisdiction: "uk",
    effectiveFrom: "2024-04-06",
    summaryPlainEnglish:
      "Sets out the Class 2 self-employed National Insurance rules. As amended with effect from 6 April 2024, self-employed people with profits at or above the Small Profits Threshold are treated as having paid Class 2 (getting the qualifying-year credit automatically, at no cost); below the threshold they may pay voluntarily at the flat weekly rate to secure a qualifying year.",
    fullTextExtract:
      "A self-employed earner is not liable to pay a Class 2 contribution for a tax year if their relevant profits for the year equal or exceed the small profits threshold for the year, but is instead treated as having actually paid a Class 2 contribution.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const sscbaS13 = await upsertSource({
    slug: "sscba-1992-s13",
    sourceType: "act",
    title: "Social Security Contributions and Benefits Act 1992, s.13 — Class 3 contributions",
    citationCode: "SSCBA 1992 s.13",
    officialUrl: "https://www.legislation.gov.uk/ukpga/1992/4/section/13",
    jurisdiction: "uk",
    effectiveFrom: "1992-07-13",
    summaryPlainEnglish:
      "Allows anyone (employed, self-employed, or not working) to pay voluntary Class 3 National Insurance contributions to fill a gap in their contribution record, at a flat weekly rate set annually — more expensive than the Class 2 voluntary rate where that option is available.",
    fullTextExtract:
      "A person shall be entitled, if he is under pensionable age... to pay a Class 3 contribution in respect of that year, at the rate for the time being in force under section 19 below.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukClass2Class3Rates = await upsertSource({
    slug: "govuk-class2-class3-rates-2026-27",
    sourceType: "govuk_guidance",
    title: "Voluntary National Insurance rates: Class 2 and Class 3",
    citationCode: "GOV.UK, Voluntary National Insurance rates (2026-27)",
    officialUrl: "https://www.gov.uk/national-insurance/rates-and-thresholds",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    summaryPlainEnglish:
      "For 2026/27: the Small Profits Threshold is £7,105 — self-employed profits at or above this are credited automatically at no cost. Voluntary Class 2 costs £3.65/week. Voluntary Class 3 costs £18.40/week and is available to anyone topping up a gap year.",
    fullTextExtract:
      "Small Profits Threshold: £7,105. Class 2 voluntary rate: £3.65 per week. Class 3 voluntary rate: £18.40 per week.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const itepaS61n = await upsertSource({
    slug: "itepa-2003-s61n",
    sourceType: "act",
    title: "Income Tax (Earnings and Pensions) Act 2003, s.61N — Worker treated as receiving earnings from employment",
    citationCode: "ITEPA 2003 s.61N",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2003/1/section/61N",
    jurisdiction: "uk",
    effectiveFrom: "2021-04-06",
    summaryPlainEnglish:
      "Defines the \"chain payment\" for Chapter 10 off-payroll working: a payment (net of VAT) that can reasonably be taken to be for the worker's services to the client, where the client has determined the engagement is inside IR35 and the client is medium/large private sector or public sector.",
    fullTextExtract:
      "A chain payment is a payment, money's worth or any other benefit, that can reasonably be taken to be for the worker's services to the client... amounts in respect of value added tax are to be excluded.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukOffPayrollChapter10 = await upsertSource({
    slug: "govuk-off-payroll-chapter10-2026-27",
    sourceType: "govuk_guidance",
    title: "Off-payroll working (IR35): fee-payer deductions",
    citationCode: "GOV.UK, Off-payroll working fee-payer guidance (2026-27)",
    officialUrl: "https://www.gov.uk/guidance/prepare-for-changes-to-the-off-payroll-working-rules-ir35",
    jurisdiction: "uk",
    effectiveFrom: "2021-04-06",
    summaryPlainEnglish:
      "Under Chapter 10, the fee-payer deducts Income Tax and employee Class 1 NIC from the chain payment (net of VAT and direct materials costs) via PAYE, exactly as for a direct employee. Employer Class 1 NIC is calculated separately and borne by the fee-payer on top — unlike Chapter 8, it is not deducted from the worker's payment via a grossing-up calculation.",
    fullTextExtract:
      "The fee-payer must deduct tax and employee National Insurance contributions from payments made to the worker's intermediary, and account for these to HMRC through PAYE. The fee-payer is also liable for employer National Insurance contributions on the deemed direct payment.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const tiopaS147 = await upsertSource({
    slug: "tiopa-2010-s147",
    sourceType: "act",
    title: "Taxation (International and Other Provisions) Act 2010, s.147 — Basic transfer-pricing rule",
    citationCode: "TIOPA 2010 s.147",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2010/8/section/147",
    jurisdiction: "uk",
    effectiveFrom: "2010-04-01",
    summaryPlainEnglish:
      "Sets out the basic UK transfer pricing rule: where a provision made between two connected persons differs from what independent parties would have agreed, and the actual provision gives one of them a UK tax advantage, that person's profits and losses are recomputed for tax purposes as if the arm's-length provision had been made instead.",
    fullTextExtract:
      "This section applies where provision (the actual provision) has been made or imposed as between any two persons by means of a transaction or series of transactions, the participation condition is met, and the actual provision differs from the provision that would have been made as between independent enterprises (the arm's length provision). Where the actual provision confers a potential UK tax advantage on one of the affected persons, that person's profits and losses are to be computed for tax purposes as if the arm's length provision had been made instead of the actual provision.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const govukTransferPricing = await upsertSource({
    slug: "govuk-intm412020-transfer-pricing",
    sourceType: "govuk_guidance",
    title: "INTM412020 — Transfer pricing: legislation: rules: the basic transfer pricing rule",
    citationCode: "HMRC INTM412020",
    officialUrl: "https://www.gov.uk/hmrc-internal-manuals/international-manual/intm412020",
    jurisdiction: "uk",
    effectiveFrom: "2010-04-01",
    summaryPlainEnglish:
      "HMRC's internal manual guidance explaining the basic transfer pricing rule in TIOPA 2010 s.147, founded on the OECD arm's-length principle, and how UK domestic law applies it as a one-way adjustment in favour of UK tax.",
    fullTextExtract:
      "TIOPA10/S147(3) and (5) contains the basic transfer pricing rule, which is founded on the arm's length principle. The rule requires a person's or persons' profits and losses to be calculated for tax purposes by substituting an arm's length provision for an actual provision if certain criteria are met. UK domestic transfer pricing legislation operates as a one-way street: it can only increase a UK taxpayer's profits (or reduce a loss) toward the arm's length position, it cannot be used by a taxpayer to reduce profits below what was actually returned.",
    status: "in_force",
    lastVerifiedAt: now,
  });

  const incomeTaxTopic = await db.query.topics.findFirst({
    where: eq(topics.slug, "income-tax-personal-allowance"),
  });

  const nicTopic = await upsertTopic({
    slug: "national-insurance-class-1",
    name: "National Insurance: Class 1 (employee)",
    taxArea: "nic",
    difficultyLevel: "foundational",
  });

  const cgtTopic = await upsertTopic({
    slug: "capital-gains-tax-individuals",
    name: "Capital Gains Tax: individuals",
    taxArea: "cgt",
    difficultyLevel: "foundational",
  });

  const ihtTopic = await upsertTopic({
    slug: "inheritance-tax-nil-rate-bands",
    name: "Inheritance Tax: nil-rate bands",
    taxArea: "iht",
    difficultyLevel: "foundational",
  });

  const sdltTopic = await upsertTopic({
    slug: "sdlt-residential-rates",
    name: "Stamp Duty Land Tax: residential rates",
    taxArea: "sdlt",
    difficultyLevel: "foundational",
  });

  const corporationTaxTopic = await upsertTopic({
    slug: "corporation-tax-rates",
    name: "Corporation Tax: rates and marginal relief",
    taxArea: "corporation_tax",
    difficultyLevel: "intermediate",
  });

  const vatTopic = await upsertTopic({
    slug: "vat-rates",
    name: "VAT: rates and output/input tax",
    taxArea: "vat",
    difficultyLevel: "foundational",
  });

  const nicClass4Topic = await upsertTopic({
    slug: "national-insurance-class-4",
    name: "National Insurance: Class 4 (self-employed)",
    taxArea: "nic_class4",
    difficultyLevel: "foundational",
  });

  const councilTaxTopic = await upsertTopic({
    slug: "council-tax-bands",
    name: "Council Tax: valuation bands",
    taxArea: "council_tax",
    difficultyLevel: "foundational",
  });

  const businessRatesTopic = await upsertTopic({
    slug: "business-rates-multipliers",
    name: "Business Rates: multipliers and relief",
    taxArea: "business_rates",
    difficultyLevel: "foundational",
  });

  const rdReliefTopic = await upsertTopic({
    slug: "rd-tax-relief-merged-scheme",
    name: "R&D Tax Relief: merged RDEC scheme",
    taxArea: "r_and_d_relief",
    difficultyLevel: "intermediate",
  });

  const ir35Topic = await upsertTopic({
    slug: "ir35-deemed-payment",
    name: "IR35: deemed employment payment",
    taxArea: "ir35",
    difficultyLevel: "advanced",
  });

  const class2Class3Topic = await upsertTopic({
    slug: "nic-class2-class3-voluntary",
    name: "National Insurance: Class 2/3 voluntary contributions",
    taxArea: "nic_class2_3",
    difficultyLevel: "foundational",
  });

  const ir35Chapter10Topic = await upsertTopic({
    slug: "ir35-chapter10-fee-payer",
    name: "IR35 / Off-Payroll: Chapter 10 fee-payer deduction",
    taxArea: "ir35_ch10",
    difficultyLevel: "advanced",
  });

  const transferPricingTopic = await upsertTopic({
    slug: "transfer-pricing-arms-length",
    name: "Transfer Pricing: the arm's-length principle",
    taxArea: "transfer_pricing",
    difficultyLevel: "advanced",
  });

  const topicSourceLinks: (typeof topicSources.$inferInsert)[] = [
    ...(incomeTaxTopic
      ? [
          { topicId: incomeTaxTopic.id, sourceId: itaS58.id, relevance: "supporting" as const },
          {
            topicId: incomeTaxTopic.id,
            sourceId: govukScottishIncomeTaxRates.id,
            relevance: "supporting" as const,
          },
        ]
      : []),
    { topicId: nicTopic.id, sourceId: sscbaS6.id, relevance: "primary" },
    { topicId: nicTopic.id, sourceId: govukNiRates.id, relevance: "primary" },
    { topicId: cgtTopic.id, sourceId: tcgaS1k.id, relevance: "primary" },
    { topicId: cgtTopic.id, sourceId: govukCgtRates.id, relevance: "primary" },
    { topicId: ihtTopic.id, sourceId: ihtS7.id, relevance: "primary" },
    { topicId: ihtTopic.id, sourceId: ihtS8d.id, relevance: "primary" },
    { topicId: ihtTopic.id, sourceId: govukIhtThresholds.id, relevance: "primary" },
    { topicId: sdltTopic.id, sourceId: fa2003S55.id, relevance: "primary" },
    { topicId: sdltTopic.id, sourceId: govukSdltRates.id, relevance: "primary" },
    { topicId: sdltTopic.id, sourceId: lbttS25.id, relevance: "primary" },
    { topicId: sdltTopic.id, sourceId: revenueScotlandLbttRates.id, relevance: "primary" },
    { topicId: sdltTopic.id, sourceId: lttS24.id, relevance: "primary" },
    { topicId: sdltTopic.id, sourceId: govukWalesLttRates.id, relevance: "primary" },
    { topicId: corporationTaxTopic.id, sourceId: ctaS3.id, relevance: "primary" },
    { topicId: corporationTaxTopic.id, sourceId: govukCorporationTaxRates.id, relevance: "primary" },
    { topicId: vatTopic.id, sourceId: vataS2.id, relevance: "primary" },
    { topicId: vatTopic.id, sourceId: govukVatRates.id, relevance: "primary" },
    { topicId: nicClass4Topic.id, sourceId: sscbaS15.id, relevance: "primary" },
    { topicId: nicClass4Topic.id, sourceId: govukClass4NicRates.id, relevance: "primary" },
    { topicId: councilTaxTopic.id, sourceId: lgfa1992Sch1.id, relevance: "primary" },
    { topicId: councilTaxTopic.id, sourceId: govukCouncilTaxBands.id, relevance: "primary" },
    { topicId: businessRatesTopic.id, sourceId: lgfa1988S43.id, relevance: "primary" },
    {
      topicId: businessRatesTopic.id,
      sourceId: govukBusinessRatesMultipliers.id,
      relevance: "primary",
    },
    { topicId: rdReliefTopic.id, sourceId: cta2009Part13.id, relevance: "primary" },
    { topicId: rdReliefTopic.id, sourceId: govukRdReliefMergedScheme.id, relevance: "primary" },
    { topicId: ir35Topic.id, sourceId: itepaS54.id, relevance: "primary" },
    { topicId: ir35Topic.id, sourceId: govukDeemedEmploymentPayment.id, relevance: "primary" },
    { topicId: class2Class3Topic.id, sourceId: sscbaS11a.id, relevance: "primary" },
    { topicId: class2Class3Topic.id, sourceId: sscbaS13.id, relevance: "primary" },
    { topicId: class2Class3Topic.id, sourceId: govukClass2Class3Rates.id, relevance: "primary" },
    { topicId: ir35Chapter10Topic.id, sourceId: itepaS61n.id, relevance: "primary" },
    { topicId: ir35Chapter10Topic.id, sourceId: govukOffPayrollChapter10.id, relevance: "primary" },
    { topicId: transferPricingTopic.id, sourceId: tiopaS147.id, relevance: "primary" },
    { topicId: transferPricingTopic.id, sourceId: govukTransferPricing.id, relevance: "primary" },
  ];

  for (const link of topicSourceLinks) {
    await db
      .insert(topicSources)
      .values(link)
      .onConflictDoUpdate({
        target: [topicSources.topicId, topicSources.sourceId],
        set: { relevance: link.relevance },
      });
  }

  await upsertRateTable({
    taxArea: "nic",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukNiRates.id,
    status: "published",
    values: {
      primaryThreshold: 12570,
      upperEarningsLimit: 50270,
      mainRate: 0.08,
      additionalRate: 0.02,
    },
  });

  await upsertRateTable({
    taxArea: "cgt",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukCgtRates.id,
    status: "published",
    values: {
      annualExemptAmount: 3000,
      basicRate: 0.18,
      higherRate: 0.24,
    },
  });

  await upsertRateTable({
    taxArea: "income_tax",
    taxYear: "2026-27",
    jurisdiction: "scotland",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukScottishIncomeTaxRates.id,
    status: "published",
    values: {
      personalAllowance: 12570,
      personalAllowanceTaperThreshold: 100000,
      personalAllowanceTaperRate: 0.5,
      bands: [
        { label: "Starter rate", upTo: 3967, rate: 0.19 },
        { label: "Basic rate", upTo: 16956, rate: 0.2 },
        { label: "Intermediate rate", upTo: 31092, rate: 0.21 },
        { label: "Higher rate", upTo: 62430, rate: 0.42 },
        { label: "Advanced rate", upTo: 112570, rate: 0.45 },
        { label: "Top rate", upTo: null, rate: 0.48 },
      ],
    },
  });

  await upsertRateTable({
    taxArea: "iht",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukIhtThresholds.id,
    status: "published",
    values: {
      nilRateBand: 325000,
      residenceNilRateBand: 175000,
      residenceTaperThreshold: 2000000,
      rate: 0.4,
    },
  });

  await upsertRateTable({
    taxArea: "sdlt",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukSdltRates.id,
    status: "published",
    values: {
      standardBands: [
        { label: "Up to £125,000", upTo: 125000, rate: 0 },
        { label: "£125,001 to £250,000", upTo: 250000, rate: 0.02 },
        { label: "£250,001 to £925,000", upTo: 925000, rate: 0.05 },
        { label: "£925,001 to £1,500,000", upTo: 1500000, rate: 0.1 },
        { label: "Above £1,500,000", upTo: null, rate: 0.12 },
      ],
      firstTimeBuyerBands: [
        { label: "Up to £300,000", upTo: 300000, rate: 0 },
        { label: "£300,001 to £500,000", upTo: 500000, rate: 0.05 },
      ],
      firstTimeBuyerReliefCeiling: 500000,
    },
  });

  await upsertRateTable({
    taxArea: "corporation_tax",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    sourceId: govukCorporationTaxRates.id,
    status: "published",
    values: {
      smallProfitsRate: 0.19,
      smallProfitsLimit: 50000,
      mainRate: 0.25,
      mainRateThreshold: 250000,
      marginalReliefFraction: 3 / 200,
    },
  });

  await upsertRateTable({
    taxArea: "vat",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukVatRates.id,
    status: "published",
    values: {
      standardRate: 0.2,
      reducedRate: 0.05,
      zeroRate: 0,
    },
  });

  await upsertRateTable({
    taxArea: "nic_class4",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukClass4NicRates.id,
    status: "published",
    values: {
      primaryThreshold: 12570,
      upperEarningsLimit: 50270,
      mainRate: 0.06,
      additionalRate: 0.02,
    },
  });

  await upsertRateTable({
    taxArea: "sdlt",
    taxYear: "2026-27",
    jurisdiction: "scotland",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: revenueScotlandLbttRates.id,
    status: "published",
    values: {
      standardBands: [
        { label: "Up to £145,000", upTo: 145000, rate: 0 },
        { label: "£145,001 to £250,000", upTo: 250000, rate: 0.02 },
        { label: "£250,001 to £325,000", upTo: 325000, rate: 0.05 },
        { label: "£325,001 to £750,000", upTo: 750000, rate: 0.1 },
        { label: "Above £750,000", upTo: null, rate: 0.12 },
      ],
      firstTimeBuyerBands: [
        { label: "Up to £175,000", upTo: 175000, rate: 0 },
        { label: "£175,001 to £250,000", upTo: 250000, rate: 0.02 },
        { label: "£250,001 to £325,000", upTo: 325000, rate: 0.05 },
        { label: "£325,001 to £750,000", upTo: 750000, rate: 0.1 },
        { label: "Above £750,000", upTo: null, rate: 0.12 },
      ],
      firstTimeBuyerReliefCeiling: 100000000,
    },
  });

  await upsertRateTable({
    taxArea: "sdlt",
    taxYear: "2026-27",
    jurisdiction: "wales",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    sourceId: govukWalesLttRates.id,
    status: "published",
    values: {
      standardBands: [
        { label: "Up to £225,000", upTo: 225000, rate: 0 },
        { label: "£225,001 to £400,000", upTo: 400000, rate: 0.06 },
        { label: "£400,001 to £750,000", upTo: 750000, rate: 0.075 },
        { label: "£750,001 to £1,500,000", upTo: 1500000, rate: 0.1 },
        { label: "Above £1,500,000", upTo: null, rate: 0.12 },
      ],
      firstTimeBuyerBands: [
        { label: "Up to £225,000", upTo: 225000, rate: 0 },
        { label: "£225,001 to £400,000", upTo: 400000, rate: 0.06 },
        { label: "£400,001 to £750,000", upTo: 750000, rate: 0.075 },
        { label: "£750,001 to £1,500,000", upTo: 1500000, rate: 0.1 },
        { label: "Above £1,500,000", upTo: null, rate: 0.12 },
      ],
      firstTimeBuyerReliefCeiling: 0,
    },
  });

  await upsertRateTable({
    taxArea: "council_tax",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    sourceId: govukCouncilTaxBands.id,
    status: "published",
    values: {
      bandRatios: {
        A: 6 / 9,
        B: 7 / 9,
        C: 8 / 9,
        D: 1,
        E: 11 / 9,
        F: 13 / 9,
        G: 15 / 9,
        H: 2,
      },
    },
  });

  await upsertRateTable({
    taxArea: "business_rates",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    sourceId: govukBusinessRatesMultipliers.id,
    status: "published",
    values: {
      smallBusinessMultiplier: 0.432,
      smallBusinessRhlMultiplier: 0.382,
      standardMultiplier: 0.48,
      standardRhlMultiplier: 0.43,
      smallBusinessThreshold: 51000,
      smallBusinessRateReliefFullThreshold: 12000,
      smallBusinessRateReliefTaperCeiling: 15000,
    },
  });

  await upsertRateTable({
    taxArea: "r_and_d_relief",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    sourceId: govukRdReliefMergedScheme.id,
    status: "published",
    values: {
      creditRate: 0.2,
      corporationTaxRate: 0.25,
    },
  });

  await upsertRateTable({
    taxArea: "ir35",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukDeemedEmploymentPayment.id,
    status: "published",
    values: {
      flatRateDeduction: 0.05,
      employerNicRate: 0.15,
      employerNicSecondaryThreshold: 5000,
    },
  });

  await upsertRateTable({
    taxArea: "nic_class2_3",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukClass2Class3Rates.id,
    status: "published",
    values: {
      smallProfitsThreshold: 7105,
      class2WeeklyRate: 3.65,
      class3WeeklyRate: 18.4,
    },
  });

  await upsertRateTable({
    taxArea: "ir35_ch10",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: govukOffPayrollChapter10.id,
    status: "published",
    values: {
      employerNicRate: 0.15,
      employerNicSecondaryThreshold: 5000,
    },
  });

  await upsertRateTable({
    taxArea: "transfer_pricing",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    sourceId: govukTransferPricing.id,
    status: "published",
    values: {
      corporationTaxRate: 0.25,
    },
  });

  console.log("Seed complete.");
  process.exit(0);
}

async function upsertRateTable(row: typeof rateTables.$inferInsert) {
  const existing = await db.query.rateTables.findFirst({
    where: and(
      eq(rateTables.taxArea, row.taxArea),
      eq(rateTables.taxYear, row.taxYear),
      eq(rateTables.jurisdiction, row.jurisdiction!),
    ),
  });
  if (existing) {
    await db.update(rateTables).set(row).where(eq(rateTables.id, existing.id));
    return;
  }
  await db.insert(rateTables).values(row);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
