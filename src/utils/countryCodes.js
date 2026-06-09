const COUNTRY_CODES = [
  { code: "+389", iso: "mk", name: "Macedonia" },
  { code: "+1",   iso: "us", name: "USA" },
  { code: "+7",   iso: "ru", name: "Russia" },
  { code: "+27",  iso: "za", name: "South Africa" },
  { code: "+30",  iso: "gr", name: "Greece" },
  { code: "+31",  iso: "nl", name: "Netherlands" },
  { code: "+32",  iso: "be", name: "Belgium" },
  { code: "+33",  iso: "fr", name: "France" },
  { code: "+34",  iso: "es", name: "Spain" },
  { code: "+36",  iso: "hu", name: "Hungary" },
  { code: "+39",  iso: "it", name: "Italy" },
  { code: "+40",  iso: "ro", name: "Romania" },
  { code: "+41",  iso: "ch", name: "Switzerland" },
  { code: "+43",  iso: "at", name: "Austria" },
  { code: "+44",  iso: "gb", name: "UK" },
  { code: "+45",  iso: "dk", name: "Denmark" },
  { code: "+46",  iso: "se", name: "Sweden" },
  { code: "+47",  iso: "no", name: "Norway" },
  { code: "+48",  iso: "pl", name: "Poland" },
  { code: "+49",  iso: "de", name: "Germany" },
  { code: "+52",  iso: "mx", name: "Mexico" },
  { code: "+55",  iso: "br", name: "Brazil" },
  { code: "+61",  iso: "au", name: "Australia" },
  { code: "+64",  iso: "nz", name: "New Zealand" },
  { code: "+81",  iso: "jp", name: "Japan" },
  { code: "+82",  iso: "kr", name: "South Korea" },
  { code: "+86",  iso: "cn", name: "China" },
  { code: "+90",  iso: "tr", name: "Turkey" },
  { code: "+91",  iso: "in", name: "India" },
  { code: "+355", iso: "al", name: "Albania" },
  { code: "+358", iso: "fi", name: "Finland" },
  { code: "+359", iso: "bg", name: "Bulgaria" },
  { code: "+370", iso: "lt", name: "Lithuania" },
  { code: "+371", iso: "lv", name: "Latvia" },
  { code: "+372", iso: "ee", name: "Estonia" },
  { code: "+380", iso: "ua", name: "Ukraine" },
  { code: "+381", iso: "rs", name: "Serbia" },
  { code: "+382", iso: "me", name: "Montenegro" },
  { code: "+385", iso: "hr", name: "Croatia" },
  { code: "+386", iso: "si", name: "Slovenia" },
  { code: "+387", iso: "ba", name: "Bosnia" },
  { code: "+420", iso: "cz", name: "Czech Rep." },
  { code: "+421", iso: "sk", name: "Slovakia" },
  { code: "+966", iso: "sa", name: "Saudi Arabia" },
  { code: "+971", iso: "ae", name: "UAE" },
];

export function stripCountryCode(phoneNumber) {
  if (!phoneNumber) return phoneNumber;
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  const match = sorted.find(c => phoneNumber.startsWith(c.code));
  return match ? phoneNumber.slice(match.code.length) : phoneNumber;
}

export default COUNTRY_CODES;
