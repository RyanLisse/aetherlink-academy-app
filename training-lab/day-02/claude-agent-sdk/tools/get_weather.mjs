/** Get Weather — identical URL contract to day-1 n8n HTTP tool + Eve helper. */
export const weatherUrl = (baseUrl, { city, date }) =>
  `${String(baseUrl).replace(/\/$/, "")}/weather?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`;

export const toolName = "Get Weather";
