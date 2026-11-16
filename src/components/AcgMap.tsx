'use client';
// The astrocartography map, in wine and powder blue. Land shapes are Natural Earth (public domain),
// drawn directly: no map tiles and no outside map service.
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { AcgLine, AcgGroup, AcgGroupKey } from '../engine/astrocartography';

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Break a line wherever it jumps across the edge of the map. */
function segments(points: [number, number][]): [number, number][][] {
  const out: [number, number][][] = [];
  let cur: [number, number][] = [];
  for (const p of points) {
    if (cur.length && Math.abs(cur[cur.length - 1][1] - p[1]) > 180) { out.push(cur); cur = []; }
    cur.push(p);
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

export default function AcgMap({ lines, groups }: { lines: AcgLine[]; groups: AcgGroup[] }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const [filter, setFilter] = useState<AcgGroupKey | 'all'>('all');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !box.current || mapRef.current) return;
      const map = L.map(box.current, { minZoom: 1, maxZoom: 6, zoomSnap: 0.5, worldCopyJump: false, maxBounds: [[-88, -220], [88, 220]], attributionControl: true });
      map.attributionControl.setPrefix(false).addAttribution('Land: Natural Earth');
      map.setView([22, 0], box.current.clientWidth < 500 ? 0.5 : 1.5);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      try {
        const land = await (await fetch('/data/land.json')).json();
        if (!cancelled) L.geoJSON(land, { interactive: false, style: { fillColor: '#5e2533', fillOpacity: 1, color: 'rgba(189,211,226,0.28)', weight: 0.6 } }).addTo(map).bringToBack();
      } catch { /* the lines still draw without the land shapes */ }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      const layer = layerRef.current;
      if (cancelled || !layer) return;
      layer.clearLayers();
      const wanted = filter === 'all' ? null : new Set(groups.find((g) => g.key === filter)?.lines.map((l) => `${l.planet}-${l.angle}`));
      for (const line of lines) {
        const on = !wanted || wanted.has(`${line.planet}-${line.angle}`);
        if (wanted && !on) continue;
        const style = {
          color: wanted ? '#B7D1EA' : '#BDD3E2', weight: wanted ? 2.2 : 1, opacity: wanted ? 0.95 : 0.42,
          dashArray: line.angle === 'ASC' ? '7 6' : line.angle === 'DSC' ? '2 6' : undefined,
        };
        for (const seg of segments(line.points)) L.polyline(seg, style).bindTooltip(`${cap(line.planet)} ${line.angle}`, { sticky: true, className: 'sb-tip' }).addTo(layer);
        if (wanted) {
          for (const c of line.cities) L.circleMarker([c.lat, c.lon], { radius: 4, color: '#F3EEE6', weight: 1, fillColor: '#F3EEE6', fillOpacity: 0.9 }).bindTooltip(`${c.name} (${cap(line.planet)} ${line.angle})`, { className: 'sb-tip' }).addTo(layer);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [ready, filter, lines, groups]);

  return (
    <div className="no-print">
      <div className="map-legend" role="group" aria-label="Show lines for">
        <button type="button" className={`chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>All lines</button>
        {groups.map((g) => (
          <button type="button" key={g.key} className={`chip${filter === g.key ? ' on' : ''}`} onClick={() => setFilter(g.key)}>{g.title}</button>
        ))}
      </div>
      <div className="map"><div ref={box} style={{ height: '100%' }} /></div>
      <p className="quiet">Solid lines: a planet overhead (MC) or underfoot (IC). Dashed lines: rising (ASC) or setting (DSC). Choose a group to see its lines and cities. Tap a line or a dot for its name.</p>
    </div>
  );
}
