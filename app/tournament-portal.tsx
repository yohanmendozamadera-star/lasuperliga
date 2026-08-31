"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import "./platform.css";

export function TournamentPortal({ slug }: { slug: string }) {
  const publicPath = `/torneos/${slug}`;
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [tournament,setTournament] = useState<any>(null);
  const [teams,setTeams] = useState<any[]>([]);
  const [matches,setMatches] = useState<any[]>([]);
  const [standings,setStandings] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{ if(!supabase)return; (async()=>{
    const {data:t}=await supabase.from("tournaments").select("*").eq("slug",slug).maybeSingle();
    setTournament(t); if(t){
      const [a,b,c]=await Promise.all([
        supabase.from("teams").select("id,name,crest_url").eq("tournament_id",t.id).eq("approved",true),
        supabase.from("matches").select("id,scheduled_at,status,home_score,away_score,home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name)").eq("tournament_id",t.id).order("scheduled_at"),
        supabase.from("team_standings").select("*").eq("tournament_id",t.id).order("points",{ascending:false}),
      ]); setTeams(a.data??[]);setMatches(b.data??[]);setStandings(c.data??[]);
    } setLoading(false);
  })();},[supabase,slug]);

  if(loading)return <main className="portalState"><img src="/liguita-logo-google-white.png" alt="Liguita"/><p>Cargando campeonato…</p></main>;
  if(!tournament)return <main className="portalState"><img src="/liguita-logo-google-white.png" alt="Liguita"/><h1>Este torneo aún no existe</h1><a href="https://liguita.co">Volver a Liguita</a></main>;
  return <main className="publicPortal"><header><a href="/"><img src="/liguita-logo-google-white.png" alt="Liguita"/>LIGUITA</a><nav><a href="#equipos">Equipos</a><a href="#partidos">Partidos</a><a href="#posiciones">Posiciones</a></nav><button onClick={()=>location.href="/"}>Mi cuenta</button></header><section className="portalHero" style={{backgroundImage:`linear-gradient(90deg,#042f27ed,#073f32b8),url(${tournament.image_url||"/liguita-logo-white.png"})`}}><span>{tournament.status.replace("_"," ")}</span><h1>{tournament.name}</h1><p>{tournament.description||"Toda la información oficial del campeonato."}</p><div>📅 Inicia {new Date(`${tournament.start_date}T12:00:00`).toLocaleDateString("es-CO")} · ⚽ {tournament.players_on_field} jugadores · 🏆 {tournament.qualifiers} clasifican</div></section><section id="equipos" className="portalSection"><p className="sectionLabel">PARTICIPANTES</p><h2>Equipos inscritos</h2><div className="teamTiles">{teams.length?teams.map(t=><article key={t.id}><img src={t.crest_url||"/liguita-logo-google-white.png"} alt=""/><b>{t.name}</b></article>):<p>Aún no hay equipos aprobados.</p>}</div></section><section id="partidos" className="portalSection soft"><p className="sectionLabel">CALENDARIO</p><h2>Próximos partidos</h2>{matches.length?matches.slice(0,8).map(m=><article className="publicMatch" key={m.id}><span>{m.scheduled_at?new Date(m.scheduled_at).toLocaleString("es-CO"):"Por programar"}</span><b>{m.home?.name} {m.home_score} — {m.away_score} {m.away?.name}</b><small>{m.status}</small></article>):<p>Los partidos aparecerán cuando el organizador publique el calendario.</p>}</section><section id="posiciones" className="portalSection"><p className="sectionLabel">CLASIFICACIÓN</p><h2>Tabla de posiciones</h2><div className="portalTable"><table><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>DG</th><th>PTS</th></tr></thead><tbody>{standings.map((s,i)=><tr key={s.team_id}><td>{i+1}</td><td>{s.team_name}</td><td>{s.played}</td><td>{s.goal_difference}</td><td><b>{s.points}</b></td></tr>)}</tbody></table></div></section><footer className="platformFooter"><b>LIGUITA</b><span>liguita.co{publicPath}</span><div><a href="/privacidad">Privacidad</a></div></footer></main>;
}
