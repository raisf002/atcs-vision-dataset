import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { ATCS_CAMERA_COORDINATES } from "@shared/atcsCoordinates";
import { buildCoordinatePopup, getCoordinateStatusLabel } from "@/lib/coordinateMap";

type CameraPoint = {
  id: string;
  name: string;
  lastCaptureStatus: string;
};

type AtcsCoordinateMapProps = {
  cameras: CameraPoint[];
  selectedId?: string;
  onSelect: (cameraId: string) => void;
};

const officialByName = new Map(ATCS_CAMERA_COORDINATES.map((point) => [point.name, point]));

export default function AtcsCoordinateMap({ cameras, selectedId, onSelect }: AtcsCoordinateMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const cameraSignature = useMemo(() => cameras.map((camera) => `${camera.id}:${camera.name}:${camera.lastCaptureStatus}`).join("|"), [cameras]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: true });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    map.setView([-7.326, 108.219], 13);
    mapRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    const points = cameras.map((camera) => ({ camera, point: officialByName.get(camera.name) })).filter((item) => item.point);
    const bounds = L.latLngBounds([]);
    points.forEach(({ camera, point }) => {
      if (!point) return;
      bounds.extend([point.latitude, point.longitude]);
      const selected = camera.id === selectedId;
      const color = camera.lastCaptureStatus === "success" ? "#a3e635" : camera.lastCaptureStatus === "failed" ? "#fb923c" : "#94a3b8";
      const marker = L.circleMarker([point.latitude, point.longitude], { radius: selected ? 10 : 7, color: selected ? "#f8fafc" : color, weight: selected ? 3 : 2, fillColor: color, fillOpacity: 0.95 });
      marker.bindTooltip(camera.name, { direction: "top", offset: [0, -6], opacity: 0.95 });
      marker.bindPopup(buildCoordinatePopup(point));
      marker.on("click", () => onSelect(camera.id));
      marker.addTo(markerLayer);
    });
    if (points.length && cameraSignature) map.fitBounds(bounds.pad(0.12), { animate: false, maxZoom: 14 });
    containerRef.current?.setAttribute("data-coordinate-status", getCoordinateStatusLabel(points[0]?.point));
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [cameraSignature, cameras, onSelect, selectedId]);

  return <div className="relative h-[460px] overflow-hidden rounded-xl border border-white/10 bg-[#dce5df] sm:h-[560px]" ref={containerRef} aria-label="Peta koordinat kamera ATCS Tasikmalaya" />;
}
