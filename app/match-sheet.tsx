"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import "./platform.css";
import "./platform-overrides.css";

type Side = "home" | "away";
type Pick = { player_id: string; is_starter: boolean; jersey_number: number | null };

export function MatchSheet({ id }: { id: string }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [rosters, setRosters] = useState<Record<Side, any[]>>({ home: [], away: [] });
  const [picks, setPicks] = useState<Record<Side, Pick[]>>({ home: [], away: [] });
  const [saved, setSaved] = useState<Record<Side, boolean>>({ home: false, away: false });
  const [side, setSide] = useState<Side>("home");
  const [events, setEvents] = useState<any[]>([]);
  const [showEvent, setShowEvent] = useState(false);
  const [eventTeamId, setEventTeamId] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data: { user: currentUser } } = await supabase!.auth.getUser();
    setUser(currentUser);
    if (!currentUser) { setLoading(false); return; }
    const { data: currentMatch } = await supabase!.from("matches").select("*,tournaments(id,name,owner_id,players_on_field),home:teams!matches_home_team_id_fkey(id,name,crest_url),away:teams!matches_away_team_id_fkey(id,name,crest_url),venue:venues(name)").eq("id", id).maybeSingle();
    setMatch(currentMatch);
    if (!currentMatch) { setLoading(false); return; }
    if (currentMatch.tournaments.owner_id !== currentUser.id) {
      const { data: membership } = await supabase!.from("tournament_members").select("user_id").eq("tournament_id", currentMatch.tournaments.id).eq("user_id", currentUser.id).eq("role", "scorekeeper").maybeSingle();
      if (!membership) { setAccessDenied(true); setLoading(false); return; }
    }
    const [homePlayers, awayPlayers, sheets, matchEvents] = await Promise.all([
      supabase!.from("players").select("*").eq("team_id", currentMatch.home_team_id).eq("active", true).order("jersey_number"),
      supabase!.from("players").select("*").eq("team_id", currentMatch.away_team_id).eq("active", true).order("jersey_number"),
      supabase!.from("match_sheets").select("id,team_id,match_sheet_players(player_id,is_starter,jersey_number)").eq("match_id", id),
      supabase!.from("match_events").select("*,player:players!match_events_player_id_fkey(full_name,jersey_number),secondary:players!match_events_secondary_player_id_fkey(full_name,jersey_number)").eq("match_id", id).order("minute"),
    ]);
    setRosters({ home: homePlayers.data ?? [], away: awayPlayers.data ?? [] });
    const homeSheet = (sheets.data ?? []).find((sheet: any) => sheet.team_id === currentMatch.home_team_id);
    const awaySheet = (sheets.data ?? []).find((sheet: any) => sheet.team_id === currentMatch.away_team_id);
    setPicks({ home: homeSheet?.match_sheet_players ?? [], away: awaySheet?.match_sheet_players ?? [] });
    setSaved({ home: !!homeSheet, away: !!awaySheet });
    setEvents(matchEvents.data ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [id]);

  const togglePlayer = (player: any) => {
    setSaved({ ...saved, [side]: false });
    setPicks(current => {
      const exists = current[side].some(item => item.player_id === player.id);
      return { ...current, [side]: exists ? current[side].filter(item => item.player_id !== player.id) : [...current[side], { player_id: player.id, is_starter: current[side].filter(item => item.is_starter).length < (match.tournaments.players_on_field || 11), jersey_number: player.jersey_number }] };
    });
  };

  const toggleStarter = (playerId: string) => setPicks(current => ({ ...current, [side]: current[side].map(item => item.player_id === playerId ? { ...item, is_starter: !item.is_starter } : item) }));

  const saveLineup = async (targetSide: Side) => {
    const teamId = targetSide === "home" ? match.home_team_id : match.away_team_id;
    const { data: sheet, error: sheetError } = await supabase!.from("match_sheets").upsert({ match_id: id, team_id: teamId, submitted_by: user.id, submitted_at: new Date().toISOString() }, { onConflict: "match_id,team_id" }).select("id").single();
    if (sheetError || !sheet) return setMessage(sheetError?.message || "No se pudo guardar la planilla.");
    const { error: deleteError } = await supabase!.from("match_sheet_players").delete().eq("sheet_id", sheet.id);
    if (deleteError) return setMessage(deleteError.message);
    if (picks[targetSide].length) {
      const { error } = await supabase!.from("match_sheet_players").insert(picks[targetSide].map(item => ({ ...item, sheet_id: sheet.id })));
      if (error) return setMessage(error.message);
    }
    setSaved(current => ({ ...current, [targetSide]: true }));
    setMessage(`Planilla de ${targetSide === "home" ? match.home.name : match.away.name} guardada.`);
  };

  const startMatch = async () => {
    if (!saved.home || !saved.away) return setMessage("Primero guarda la planilla de ambos equipos.");
    const starters = match.tournaments.players_on_field || 11;
    const homeStarters = picks.home.filter(item => item.is_starter).length;
    const awayStarters = picks.away.filter(item => item.is_starter).length;
    const incomplete = homeStarters < starters || awayStarters < starters;
    if (!confirm(incomplete ? `Las nóminas están incompletas (${homeStarters}/${starters} y ${awayStarters}/${starters}). ¿Iniciar de todas formas?` : "¿Confirmas iniciar el partido?")) return;
    const { error } = await supabase!.from("matches").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", id);
    setMessage(error ? error.message : "Partido iniciado.");
    if (!error) await load();
  };

  const syncScore = async () => {
    const { data } = await supabase!.from("match_events").select("team_id,event_type").eq("match_id", id);
    const goals = (teamId: string) => (data ?? []).filter(event => event.team_id === teamId && ["goal", "own_goal", "penalty_scored"].includes(event.event_type)).length;
    await supabase!.from("matches").update({ home_score: goals(match.home_team_id), away_score: goals(match.away_team_id) }).eq("id", id);
  };

  const addEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("match_events").insert({ match_id: id, team_id: String(form.get("team")), player_id: String(form.get("player")) || null, secondary_player_id: String(form.get("secondary")) || null, event_type: String(form.get("type")) as any, minute: Number(form.get("minute")), stoppage_minute: Number(form.get("stoppage")) || 0, notes: String(form.get("notes") || ""), recorded_by: user.id });
    if (error) return setMessage(error.message);
    await syncScore(); setShowEvent(false); setMessage("Evento registrado."); await load();
  };

  const finishMatch = async () => {
    if (!confirm("¿Confirmas finalizar el partido? Después podrás corregirlo desde el calendario.")) return;
    const { error } = await supabase!.from("matches").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", id);
    setMessage(error ? error.message : "Partido finalizado."); if (!error) await load();
  };

  if (loading) return <main className="realPanelState"><h1>Cargando planilla…</h1></main>;
  if (!user) return <main className="realPanelState"><h1>Inicia sesión para planillar</h1><a className="primaryBtn" href="/">Ingresar</a></main>;
  if (accessDenied) return <main className="realPanelState"><h1>No tienes permiso para planillar este partido</h1><p>Solo puede hacerlo el organizador o un planillero autorizado.</p><a className="primaryBtn" href="/panel">Volver al panel</a></main>;
  if (!match) return <main className="realPanelState"><h1>No tienes acceso a este partido</h1></main>;

  const currentTeam = side === "home" ? match.home : match.away;
  const selectedIds = new Set(picks[side].map(item => item.player_id));
  const available = rosters[side].filter(player => !selectedIds.has(player.id));
  const selected = picks[side].map(item => ({ ...rosters[side].find(player => player.id === item.player_id), ...item })).filter(player => player.id);
  const eventSide: Side = eventTeamId === match.away_team_id ? "away" : "home";
  const eventPlayers = picks[eventSide].map(item => rosters[eventSide].find(player => player.id === item.player_id)).filter(Boolean);
  const isLive = match.status === "in_progress";

  return <main className="sheetPage"><header><a href={`/panel/torneos/${match.tournaments.id}`}>← Volver al torneo</a><div><span className="sectionLabel">PLANILLA OFICIAL</span><h1>{match.home.name} <b>{match.home_score} — {match.away_score}</b> {match.away.name}</h1><p>{match.scheduled_at ? new Date(match.scheduled_at).toLocaleString("es-CO") : "Sin fecha"} · {match.venue?.name || "Sin cancha"}</p></div><span className={`sheetStatus ${match.status}`}>{match.status === "in_progress" ? "En juego" : match.status === "finished" ? "Finalizado" : "Por iniciar"}</span></header>
    {message && <div className="adminMessage">{message}<button onClick={() => setMessage("")}>×</button></div>}
    {!isLive && match.status !== "finished" && <><nav className="lineupTabs"><button className={side === "home" ? "active" : ""} onClick={() => setSide("home")}>{match.home.name}<span>{saved.home ? "Guardada" : `${picks.home.length} elegidos`}</span></button><button className={side === "away" ? "active" : ""} onClick={() => setSide("away")}>{match.away.name}<span>{saved.away ? "Guardada" : `${picks.away.length} elegidos`}</span></button></nav><section className="lineupWorkspace"><div><h2>Disponibles</h2><p>Pulsa un jugador para agregarlo a la planilla.</p>{available.length ? available.map(player => <button className="lineupPlayer" onClick={() => togglePlayer(player)} key={player.id}><span>#{player.jersey_number}</span><b>{player.full_name}</b><small>{player.position}</small></button>) : <p>No quedan jugadores disponibles.</p>}</div><div><h2>Planillados</h2><p>Marca cada jugador como titular o suplente.</p>{selected.map(player => <article className="pickedPlayer" key={player.id}><button onClick={() => togglePlayer(player)}>×</button><span>#{player.jersey_number}</span><b>{player.full_name}</b><label><input type="checkbox" checked={player.is_starter} onChange={() => toggleStarter(player.id)}/>{player.is_starter ? "Titular" : "Suplente"}</label></article>)}<button className="primaryBtn wide" onClick={() => saveLineup(side)}>Guardar planilla de {currentTeam.name}</button></div></section><div className="startMatchBar"><span>Local: {picks.home.filter(x => x.is_starter).length}/{match.tournaments.players_on_field} titulares · Visitante: {picks.away.filter(x => x.is_starter).length}/{match.tournaments.players_on_field} titulares</span><button className="primaryBtn" onClick={startMatch}>Iniciar partido</button></div></>}
    {(isLive || match.status === "finished") && <section className="liveSheet"><div className="liveActions"><div><span className="sectionLabel">EVENTOS DEL PARTIDO</span><h2>{match.home.name} {match.home_score} — {match.away_score} {match.away.name}</h2></div>{isLive && <div><button className="primaryBtn" onClick={() => { setEventTeamId(match.home_team_id); setShowEvent(true); }}>+ Registrar evento</button><button className="outlineBtn" onClick={finishMatch}>Finalizar partido</button></div>}</div>{events.length ? events.map(item => <article className="matchEvent" key={item.id}><b>{item.minute}{item.stoppage_minute ? `+${item.stoppage_minute}` : ""}&apos;</b><span>{item.event_type.replaceAll("_", " ")}</span><strong>#{item.player?.jersey_number} {item.player?.full_name || "Sin jugador"}</strong><small>{item.notes}</small></article>) : <p>Aún no se han registrado eventos.</p>}</section>}
    {showEvent && <div className="createOverlay"><form className="createTournament" onSubmit={addEvent}><button type="button" className="modalClose" onClick={() => setShowEvent(false)}>×</button><p className="sectionLabel">NUEVO EVENTO</p><h2>Registrar novedad</h2><div className="formPair"><label>Equipo<select name="team" required>{[[match.home_team_id,match.home.name],[match.away_team_id,match.away.name]].map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label>Tipo<select name="type"><option value="goal">Gol</option><option value="own_goal">Autogol</option><option value="yellow_card">Tarjeta amarilla</option><option value="red_card">Tarjeta roja</option><option value="substitution">Sustitución</option><option value="penalty_scored">Penal convertido</option><option value="penalty_missed">Penal errado</option></select></label></div><div className="formPair"><label>Minuto<input name="minute" type="number" min="0" max="180" required/></label><label>Reposición<input name="stoppage" type="number" min="0" max="30" defaultValue="0"/></label></div><label>Jugador<select name="player" required><option value="">Seleccionar jugador</option>{eventPlayers.map(player => <option value={player.id} key={player.id}>#{player.jersey_number} · {player.full_name}</option>)}</select></label><label>Segundo jugador (para sustitución)<select name="secondary"><option value="">No aplica</option>{eventPlayers.map(player => <option value={player.id} key={player.id}>#{player.jersey_number} · {player.full_name}</option>)}</select></label><label>Nota<textarea name="notes" rows={2}/></label><button className="primaryBtn wide">Guardar evento</button></form></div>}
  </main>;
}
