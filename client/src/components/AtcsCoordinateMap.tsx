import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { ATCS_CAMERA_COORDINATES } from "@shared/atcsCoordinates";
import { buildCoordinatePopup, getCoordinateStatusLabel } from "@/lib/coordinateMap";
import { getBasemapConfig, type BasemapName } from "@/lib/earthBasemap";

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
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const [basemap, setBasemap] = useState<BasemapName>("earth");
  const cameraSignature = useMemo(() => cameras.map((camera) => `${camera.id}:${camera.name}:${camera.lastCaptureStatus}`).join("|"), [cameras]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: true });
    L.control.zoom({ position: "bottomright" }).addTo(map);
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
    if (!map) return;
    const config = getBasemapConfig(basemap);
    baseLayerRef.current?.remove();
    const layer = L.tileLayer(config.url, { maxZoom: 19, attribution: config.attribution });
    layer.addTo(map);
    baseLayerRef.current = layer;
    return () => {
      layer.remove();
      if (baseLayerRef.current === layer) baseLayerRef.current = null;
    };
  }, [basemap]);

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

  return (
    <div className="relative h-[460px] overflow-hidden rounded-xl border border-white/10 bg-[#dce5df] sm:h-[560px]">
      <div ref={containerRef} className="h-full w-full" aria-label="Peta koordinat kamera ATCS Tasikmalaya" />
      <div className="absolute left-3 top-3 z-[500] flex rounded-lg border border-white/20 bg-slate-950/85 p-1 shadow-lg backdrop-blur" aria-label="Pilihan tampilan peta">
        {(["earth", "street"] as BasemapName[]).map((option) => {
          const config = getBasemapConfig(option);
          const active = basemap === option;
          return <button key={option} type="button" aria-pressed={active} onClick={() => setBasemap(option)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-lime-300 text-slate-950" : "text-slate-100 hover:bg-white/10"}`}>{config.label}</button>;
        })}
      </div>
    </div>
  );
}
