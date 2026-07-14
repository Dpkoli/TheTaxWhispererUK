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
