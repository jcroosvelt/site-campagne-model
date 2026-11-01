/** Tests d'intégration sur PostgreSQL (ignorés si DATABASE_URL n'est pas défini). */
import { afterAll, describe, expect, it } from "vitest";
import "dotenv/config";

const enabled = Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("dons — base de données", async () => {
  const { prisma } = await import("@/lib/db");
  const { confirmDonation, transitionDonation, generateAccessToken, generateReference, confirmedDonationStats } = await import("@/lib/donations");
  const created: string[] = [];
  const make = async (amountCents = 100000) => {
    const d = await prisma.donation.create({
      data: {
        reference: generateReference(), accessToken: generateAccessToken(), firstName: "Test", lastName: "Vitest", email: "vitest@example.com",
        country: "HT", amountCents, method: "BANK_TRANSFER", provider: "bank", attestations: {}, termsVersion: "test", termsAcceptedAt: new Date(),
      },
    });
    created.push(d.id);
    return d;
  };
  afterAll(async () => {
    await prisma.donation.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("confirme une seule fois (idempotence) et attribue un numéro de reçu", async () => {
    const d = await make();
    const [a, b] = await Promise.all([
      confirmDonation(d, { providerPaymentId: "X", amountCents: d.amountCents, currency: "HTG" }, "test"),
      confirmDonation(d, { providerPaymentId: "X", amountCents: d.amountCents, currency: "HTG" }, "test"),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
    const after = await prisma.donation.findUniqueOrThrow({ where: { id: d.id } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.receiptNumber).toMatch(/^REC-\d{4}-\d{6}$/);
  });

  it("refuse une confirmation dont le montant ne correspond pas", async () => {
    const d = await make();
    expect(await confirmDonation(d, { providerPaymentId: "X", amountCents: 1, currency: "HTG" }, "test")).toBe(false);
    expect((await prisma.donation.findUniqueOrThrow({ where: { id: d.id } })).status).toBe("FAILED");
  });

  it("refuse les transitions interdites", async () => {
    const d = await make();
    expect(await transitionDonation(d.id, "REFUNDED")).toBe(false);
    expect(await transitionDonation(d.id, "CANCELLED")).toBe(true);
    expect(await transitionDonation(d.id, "PENDING" as never)).toBe(false);
  });

  it("calcule les statistiques uniquement sur les dons confirmés", async () => {
    const before = await confirmedDonationStats({ email: "vitest@example.com" });
    await make(999900); // reste en attente
    const after = await confirmedDonationStats({ email: "vitest@example.com" });
    expect(after.totalCents).toBe(before.totalCents);
  });
});
