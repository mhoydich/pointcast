/** Request-date parsing shared by the edge social-card route and its tests. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function requestedKennelOgDate(request, currentDate) {
  const candidate = new URL(request.url).searchParams.get('date');
  return candidate && DATE_RE.test(candidate) ? candidate : currentDate();
}
