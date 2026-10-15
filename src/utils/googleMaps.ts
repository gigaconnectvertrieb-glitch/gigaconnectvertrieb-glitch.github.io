import { Loader } from "@googlemaps/js-api-loader";

let loader: Loader | null = null;

export const getGoogleMapsLoader = () => {
  if (!loader) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API Key fehlt");
    }
    loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
    });
  }
  return loader;
};