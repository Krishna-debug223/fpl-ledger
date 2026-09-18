export default async function handler(request, response) {
  const rawEvent = Array.isArray(request.query?.event) ? request.query.event[0] : request.query?.event;
  const event = Number(rawEvent);

  if (!Number.isInteger(event) || event < 1 || event > 38) {
    return response.status(400).json({ error: "Invalid FPL event." });
  }

  try {
    const upstream = await fetch(`https://fantasy.premierleague.com/api/event/${event}/live/`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FPL-Modelbook/1.0",
      },
    });

    if (!upstream.ok) {
      return response.status(upstream.status).json({ error: `FPL live data returned ${upstream.status}.` });
    }

    const payload = await upstream.json();
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    response.setHeader("Access-Control-Allow-Origin", "*");
    return response.status(200).json(payload);
  } catch (error) {
    return response.status(502).json({
      error: "Could not load official FPL live data.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
