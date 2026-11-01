// Codes ISO 3166-1 alpha-2 ; les noms sont générés via Intl.DisplayNames selon la langue.
export const COUNTRY_CODES = "HT US CA FR DO BS BR CL MX PA CU JM TT GP MQ GF BE CH DE ES IT GB NL PT IE LU AT SE NO DK FI PL GR AF AL DZ AD AO AG AR AM AU AZ BH BD BB BY BZ BJ BT BO BA BW BN BG BF BI CV KH CM CF TD CN CO KM CG CD CR CI HR CY CZ DJ DM EC EG SV GQ ER EE SZ ET FJ GA GM GE GH GD GT GN GW GY HN HU IS IN ID IR IQ IL JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT MG MW MY MV ML MT MH MR MU FM MD MC MN ME MA MZ MM NA NR NP NZ NI NE NG KP MK OM PK PW PS PG PY PE PH QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS LK SD SR SY TW TJ TZ TH TL TG TO TN TR TM TV UG UA AE UY UZ VU VA VE VN YE ZM ZW PR VI VG AW CW SX TC KY BM".split(
  " ",
);

export function countryOptions(locale: string, allowed: string[] = []) {
  const names = new Intl.DisplayNames([locale === "ht" ? "fr" : locale], { type: "region" });
  const allow = allowed.map((a) => a.trim().toUpperCase()).filter(Boolean);
  const codes = allow.length ? COUNTRY_CODES.filter((c) => allow.includes(c)) : COUNTRY_CODES;
  const list = codes.map((code) => ({ code, name: names.of(code) ?? code }));
  const ht = list.filter((c) => c.code === "HT");
  const others = list.filter((c) => c.code !== "HT").sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return [...ht, ...others];
}
