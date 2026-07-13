/**
 * Idempotent seed script — safe to re-run. Upserts by natural key (slug /
 * tax-area+year) so it never duplicates rows.
 *
 * Scope note: this does not attempt to mirror every source that may already
 * exist in a live database (e.g. the FTT case and HMRC manual entries added
 * during initial buildout) — those weren't re-verifiable from this session
 * without live access to legislation.gov.uk / gov.uk manuals (both blocked
 * the fetch). It seeds only sources whose text was freshly confirmed via
 * search in this session: the Income Tax personal allowance mechanism,
 * State Pension qualifying-years mechanism, and the newly added National
 * Insurance and Capital Gains Tax sources + rate tables. Run with
 * `npm run db:seed`.
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

  const itaS35 = await upsertSource({
    slug: "ita-2007-s35",
    sourceType: "act",
    title: "Income Tax Act 2007, s.35 — Personal allowance",
    citationCode: "ITA 2007 s.35",
    officialUrl: "https://www.legislation.gov.uk/ukpga/2007/3/section/35",
    jurisdiction: "uk",
    effectiveFrom: "2007-04-06",
    summaryPlainEnglish:
      "Sets the Personal Allowance an individual can claim against income tax, and reduces ('tapers') it by £1 for every £2 of adjusted net income above £100,000.",
    fullTextExtract:
      "An individual who makes a claim is entitled to a personal allowance for a tax year... If the individual's adjusted net income exceeds £100,000, the allowance is reduced by one-half of the excess.",
    status: "in_force",
    lastVerifiedAt: now,
  });

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

  const pensionsActS2 = await upsertSource({
    slug: "pensions-act-2014-s2",
    sourceType: "act",
    title: "Pensions Act 2014, s.2 — Full rate of state pension",
    citationCode: "Pensions Act 2014 s.2",
    officialUrl:
      "https://www.legislation.gov.uk/ukpga/2014/19/part/1/crossheading/state-pension-at-the-full-or-reduced-rate",
    jurisdiction: "uk",
    effectiveFrom: "2016-04-06",
    summaryPlainEnglish:
      "A person reaching pensionable age is entitled to the new State Pension at the full weekly rate if they have 35 or more qualifying years; fewer qualifying years (but at least the minimum) gives a reduced rate on a pro-rata basis.",
    fullTextExtract:
      "A person is entitled to a state pension payable at the full rate if the person has reached pensionable age and has 35 or more qualifying years. A qualifying year means a tax year in which the person's earnings factor is equal to or greater than the qualifying earnings factor for the year.",
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

  const incomeTaxTopic = await upsertTopic({
    slug: "income-tax-personal-allowance",
    name: "Income Tax: Personal Allowance",
    taxArea: "income_tax",
    difficultyLevel: "foundational",
  });

  const statePensionTopic = await upsertTopic({
    slug: "state-pension-qualifying-years",
    name: "State Pension: qualifying years",
    taxArea: "state_pension",
    difficultyLevel: "foundational",
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

  const topicSourceLinks: (typeof topicSources.$inferInsert)[] = [
    { topicId: incomeTaxTopic.id, sourceId: itaS35.id, relevance: "primary" },
    { topicId: incomeTaxTopic.id, sourceId: itaS58.id, relevance: "supporting" },
    { topicId: statePensionTopic.id, sourceId: pensionsActS2.id, relevance: "primary" },
    { topicId: nicTopic.id, sourceId: sscbaS6.id, relevance: "primary" },
    { topicId: nicTopic.id, sourceId: govukNiRates.id, relevance: "primary" },
    { topicId: cgtTopic.id, sourceId: tcgaS1k.id, relevance: "primary" },
    { topicId: cgtTopic.id, sourceId: govukCgtRates.id, relevance: "primary" },
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
    taxArea: "income_tax",
    taxYear: "2026-27",
    jurisdiction: "uk",
    effectiveFrom: "2026-04-06",
    effectiveTo: "2027-04-05",
    sourceId: itaS35.id,
    status: "published",
    values: {
      personalAllowance: 12570,
      personalAllowanceTaperThreshold: 100000,
      personalAllowanceTaperRate: 0.5,
      bands: [
        { label: "Basic rate", upTo: 37700, rate: 0.2 },
        { label: "Higher rate", upTo: 125140, rate: 0.4 },
        { label: "Additional rate", upTo: null, rate: 0.45 },
      ],
    },
  });

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
