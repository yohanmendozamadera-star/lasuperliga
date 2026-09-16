"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

type Pairing = { home: string; away: string };

const phaseName = (qualifiers: number) => qualifiers === 2 ? "Final" : qualifiers === 4 ? "Semifinales" : qualifiers === 8 ? "Cuartos de final" : `Eliminación · ${qualifiers} equipos`;

export function KnockoutManager({ tournament, standings, matches, phases, venues, onChanged, onMessage }:{ tournament:any; standings:any[]; matches:any[]; phases:any[]; venues:any[]; onChanged:()=>Promise<void>; onMessage:(message:string)=>void }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const qualifiers = Number(tournament.qualifiers || 0);
  const ranked = standings.slice(0, qualifiers);
  const regularMatches = matches.filter(match => match.phase?.phase_type !== "knockout");
  const remaining = regularMatches.filter(match => !["finished", "cancelled"].includes(match.status)).length;
  const existingPhase = phases.find(phase => phase.phase_type === "knockout");
  const validBracketSize = qualifiers >= 2 && qualifiers <= 16 && (qualifiers & (qualifiers - 1)) === 0;
  const seeded = useMemo<Pairing[]>(() => Array.from({ length: Math.floor(ranked.length / 2) }, (_, index) => ({ home: ranked[index]?.team_id || "", away: ranked[ranked.length - 1 - index]?.team_id || "" })), [standings, qualifiers]);
  const [mode, setMode] = useState<"seeded"|"random"|"manual">("seeded");
  const [pairings, setPairings] = useState<Pairing[]>(seeded);
  const [date, setDate] = useState("");
  const [venueId, setVenueId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setPairings(seeded); }, [seeded]);

  const randomize = () => {
    const pool = ranked.map(row => row.team_id);
    for (let index = pool.length - 1; index > 0; index--) { const swap = Math.floor(Math.random() * (index + 1)); [pool[index], pool[swap]] = [pool[swap], pool[index]]; }
    setMode("random");
    setPairings(Array.from({ length: pool.length / 2 }, (_, index) => ({ home: pool[index * 2], away: pool[index * 2 + 1] })));
  };

  const chooseMode = (next:"seeded"|"manual") => { setMode(next); setPairings(seeded); };
  const updatePair = (index:number, field:keyof Pairing, value:string) => setPairings(current => current.map((pair, pairIndex) => pairIndex === index ? { ...pair, [field]: value } : pair));
  const teamName = (teamId:string) => standings.find(row => row.team_id === teamId)?.team_name || "Por definir";

  const createBracket = async () => {
    if (remaining > 2) return onMessage(`La fase eliminatoria se habilita cuando queden 2 partidos; todavía faltan ${remaining}.`);
    if (!validBracketSize) return onMessage("Los clasificados deben ser 2, 4, 8 o 16 para crear una llave completa.");
    if (ranked.length < qualifiers) return onMessage(`Se necesitan ${qualifiers} equipos clasificados y actualmente hay ${ranked.length}.`);
    const selected = pairings.flatMap(pair => [pair.home, pair.away]);
    if (selected.some(value => !value) || new Set(selected).size !== qualifiers) return onMessage("Cada clasificado debe aparecer exactamente una vez en las llaves.");
    setSaving(true);
    const sequence = Math.max(0, ...phases.map(phase => Number(phase.sequence || 0))) + 1;
    const { data: phase, error: phaseError } = await supabase!.from("phases").insert({ tournament_id:tournament.id, name:phaseName(qualifiers), phase_type:"knockout", sequence, qualifiers:Math.max(1, qualifiers / 2), status:"pending" }).select("id").single();
    if (phaseError || !phase) { setSaving(false); return onMessage(phaseError?.message || "No se pudo crear la fase eliminatoria."); }
    const start = date ? new Date(date) : new Date(Math.max(Date.now(), ...regularMatches.map(match => match.scheduled_at ? new Date(match.scheduled_at).getTime() : 0)) + 7 * 86400000);
    const rows = pairings.map((pair, index) => ({ tournament_id:tournament.id, phase_id:phase.id, home_team_id:pair.home, away_team_id:pair.away, venue_id:venueId || null, scheduled_at:new Date(start.getTime() + index * 2 * 60 * 60 * 1000).toISOString(), round_number:1, status:"scheduled" as const }));
    const { error } = await supabase!.from("matches").insert(rows);
    if (error) { await supabase!.from("phases").delete().eq("id", phase.id); setSaving(false); return onMessage(error.message); }
    setSaving(false); onMessage(`${phaseName(qualifiers)} creada con ${rows.length} llaves.`); await onChanged();
  };

  if (existingPhase) return <section className="knockoutManager"><div className="knockoutReady"><span>✓</span><div><b>Fase eliminatoria creada</b><p>{existingPhase.name}. Los partidos aparecen en Calendario y pueden editarse individualmente.</p></div></div></section>;

  return <section className="knockoutManager"><header><div><p className="sectionLabel">FASE DEFINITIVA</p><h2>Configurar eliminación directa</h2><span>Se habilita cuando restan dos partidos de la fase regular.</span></div><b className={remaining <= 2 ? "available" : "waiting"}>{remaining <= 2 ? "Disponible" : `${remaining} partidos pendientes`}</b></header>
    <div className="knockoutExplainer"><strong>{qualifiers || "—"} clasificados</strong><span>→</span><strong>{Math.floor(qualifiers / 2) || "—"} llaves iniciales</strong><span>→</span><strong>Un campeón</strong></div>
    {!validBracketSize && <div className="knockoutWarning">Configura 2, 4, 8 o 16 clasificados para formar llaves completas.</div>}
    <div className="bracketModes"><button className={mode === "seeded" ? "active" : ""} onClick={() => chooseMode("seeded")}>Por clasificación<br/><small>1.º vs último, 2.º vs penúltimo</small></button><button className={mode === "random" ? "active" : ""} onClick={randomize}>Sorteo aleatorio<br/><small>Mezclar todos los clasificados</small></button><button className={mode === "manual" ? "active" : ""} onClick={() => chooseMode("manual")}>Definir manualmente<br/><small>El organizador elige cada cruce</small></button></div>
    <div className="bracketPreview">{pairings.map((pair,index)=><article key={index}><em>LLAVE {index+1}</em>{mode === "manual" ? <><select value={pair.home} onChange={event=>updatePair(index,"home",event.target.value)}><option value="">Equipo A</option>{ranked.map((row,rank)=><option value={row.team_id} key={row.team_id}>{rank+1}. {row.team_name}</option>)}</select><b>VS</b><select value={pair.away} onChange={event=>updatePair(index,"away",event.target.value)}><option value="">Equipo B</option>{ranked.map((row,rank)=><option value={row.team_id} key={row.team_id}>{rank+1}. {row.team_name}</option>)}</select></> : <><span>{teamName(pair.home)}</span><b>VS</b><span>{teamName(pair.away)}</span></>}</article>)}</div>
    <div className="knockoutSchedule"><label>Fecha y hora inicial<input type="datetime-local" value={date} onChange={event=>setDate(event.target.value)}/></label><label>Cancha inicial<select value={venueId} onChange={event=>setVenueId(event.target.value)}><option value="">Rotar/sin definir</option>{venues.map(venue=><option value={venue.id} key={venue.id}>{venue.name}</option>)}</select></label><button className="primaryBtn" disabled={remaining>2||saving||!validBracketSize} onClick={createBracket}>{saving?"Creando llaves…":"Crear fase eliminatoria"}</button></div>
  </section>;
}
