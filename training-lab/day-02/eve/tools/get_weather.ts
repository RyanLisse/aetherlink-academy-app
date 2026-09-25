/**
 * Get Weather — same HTTP contract as day-1 n8n HTTP Request Tool.
 * Path: GET {base}/weather?city=&date=
 * Eve learners later wrap this with `defineTool` from `eve/tools` after installing the pin.
 */
export type WeatherInput = { city: string; date: string; baseUrl?: string };

export const weatherUrl = (baseUrl: string, input: WeatherInput) =>
  `${baseUrl.replace(/\/$/, "")}/weather?city=${encodeURIComponent(input.city)}&date=${encodeURIComponent(input.date)}`;

export const getWeatherDescription =
  "Fetch fictional weather from the training-lab mock (Get Weather step).";
