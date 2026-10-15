import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Address } from "@/hooks/useAddresses";
import { STATUS_COLORS } from "@/lib/utils";

interface MapViewProps {
  addresses: Address[];
  onAddressSelect?: (address: Address) => void;
}

export default function MapView({ addresses, onAddressSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
    });

    loader.load().then(async () => {
      const google = window.google;
      const newMap = new google.maps.Map(mapRef.current!, {
        center: { lat: 50.0, lng: 10.0 },
        zoom: 14,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
      });

      setMap(newMap);
    });
  }, [apiKey]);

  useEffect(() => {
    if (!map || addresses.length === 0) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Center map on first address
    const firstWithCoords = addresses.find((a) => a.lat && a.lng);
    if (firstWithCoords) {
      map.setCenter({
        lat: firstWithCoords.lat!,
        lng: firstWithCoords.lng!,
      });
    }

    // Add markers
    addresses.forEach((address) => {
      if (!address.lat || !address.lng) return;

      const marker = new google.maps.Marker({
        position: { lat: address.lat, lng: address.lng },
        map,
        title: `${address.street_name} ${address.house_number}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: STATUS_COLORS[address.status],
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      if (onAddressSelect) {
        marker.addListener("click", () => {
          onAddressSelect(address);
        });
      }

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit bounds if multiple markers
    if (newMarkers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((marker) => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds);
    }
  }, [map, addresses, onAddressSelect]);

  return <div ref={mapRef} className="map-container h-full w-full" />;
}