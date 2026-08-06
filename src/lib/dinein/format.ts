/** Summani o'zbekcha formatda: 45 000 so'm */
export function som(n: number | undefined | null): string {
  const value = Number(n) || 0;
  return `${value.toLocaleString("ru-RU").replace(/,/g, " ")} so'm`;
}

/** Faqat raqam: 45 000 */
export function num(n: number | undefined | null): string {
  return (Number(n) || 0).toLocaleString("ru-RU").replace(/,/g, " ");
}
