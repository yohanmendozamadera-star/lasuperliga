"use client";

import { useMemo, useState } from "react";

type View = "Inicio" | "Partidos" | "Posiciones" | "Goleadores" | "Valla menos vencida" | "Jugadores" | "Fases";

const nav: View[] = ["Inicio", "Partidos", "Posiciones", "Goleadores", "Valla menos vencida", "Jugadores", "Fases"];
const teams = [
  { pos: 1, name: "Deportivo Bahía", code: "DB", pj: 8, g: 6, e: 2, p: 0, gf: 18, gc: 5, pts: 20, color: "#f6c445" },
  { pos: 2, name: "Real Ciénaga", code: "RC", pj: 8, g: 5, e: 2, p: 1, gf: 16, gc: 8, pts: 17, color: "#cf4539" },
  { pos: 3, name: "Atlético Caribe", code: "AC", pj: 8, g: 4, e: 3, p: 1, gf: 14, gc: 9, pts: 15, color: "#21a879" },
  { pos: 4, name: "Unión Pescadores", code: "UP", pj: 8, g: 4, e: 1, p: 3, gf: 12, gc: 10, pts: 13, color: "#4778d8" },
  { pos: 5, name: "Jaguares del Mar", code: "JM", pj: 8, g: 3, e: 2, p: 3, gf: 11, gc: 11, pts: 11, color: "#8d5ab5" },
  { pos: 6, name: "Sporting Rodadero", code: "SR", pj: 8, g: 2, e: 2, p: 4, gf: 9, gc: 13, pts: 8, color: "#e27333" },
];
const players = [
  { name: "Mateo Cárdenas", team: "Deportivo Bahía", goals: 11, rating: 4.9, img: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=220&q=80" },
  { name: "Samuel Rojas", team: "Real Ciénaga", goals: 9, rating: 4.7, img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=220&q=80" },
  { name: "Diego Pacheco", team: "Atlético Caribe", goals: 8, rating: 4.8, img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=220&q=80" },
  { name: "Nicolás Martínez", team: "Unión Pescadores", goals: 7, rating: 4.6, img: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=220&q=80" },
];
const matches = [
  { date: "SÁB · 15 AGO", time: "3:30 PM", a: "Deportivo Bahía", ac: "DB", b: "Unión Pescadores", bc: "UP", field: "Cancha La Castellana" },
  { date: "SÁB · 15 AGO", time: "5:30 PM", a: "Real Ciénaga", ac: "RC", b: "Atlético Caribe", bc: "AC", field: "Cancha La Castellana" },
  { date: "DOM · 16 AGO", time: "4:00 PM", a: "Jaguares del Mar", ac: "JM", b: "Sporting Rodadero", bc: "SR", field: "Estadio Municipal" },
];

function Crest({ code, small = false }: { code: string; small?: boolean }) {
  const team = teams.find(t => t.code === code);
  return <span className={`crest ${small ? "crestSmall" : ""}`} style={{ background: team?.color || "#0b6248" }}>{code}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>("Inicio");
  const [adminOpen, setAdminOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [starred, setStarred] = useState<string[]>([]);
  const visiblePlayers = useMemo(() => players.filter(p => `${p.name} ${p.team}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(""), 2600); };

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setView("Inicio")} aria-label="Ir al inicio">
          <span className="brandBall">●</span><span>LA<strong>SUPERLIGA</strong></span>
        </button>
        <nav className="desktopNav" aria-label="Navegación principal">
          {nav.slice(0, 5).map(item => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}
        </nav>
        <div className="headerActions">
          <button className="bell" onClick={() => notify("Notificaciones activadas para este torneo")}>♢<span /></button>
          <button className="login" onClick={() => notify("Conecta Google para iniciar sesión")}>G&nbsp;&nbsp; Iniciar sesión</button>
          <button className="owner" onClick={() => setAdminOpen(true)}>Administrar torneo</button>
        </div>
      </header>

      <section className="hero">
        <div className="heroShade" />
        <div className="heroContent">
          <div className="leagueMark"><span>⚽</span><div>COPA<br/><b>LA PLAYA</b><small>2026</small></div></div>
          <div>
            <p className="eyebrow">TORNEO ABIERTO · SANTA MARTA</p>
            <h1>Donde el barrio<br/>se vuelve <em>leyenda.</em></h1>
            <div className="heroMeta"><span>📅 02 AGO — 28 NOV 2026</span><span>👥 16 EQUIPOS</span><span>🏆 TODOS CONTRA TODOS</span></div>
          </div>
        </div>
        <div className="sponsors"><span>PATROCINAN</span><b>DEPORTES<br/>DEL CARIBE</b><b>AGUA<br/>SIERRA</b><b>RADIO<br/>FÚTBOL 98.5</b><i>1 / 4</i></div>
      </section>

      <nav className="subnav" aria-label="Secciones del campeonato">
        {nav.map(item => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}
      </nav>

      {view === "Inicio" && <HomeView setView={setView} notify={notify} />}
      {view === "Posiciones" && <Standings />}
      {view === "Partidos" && <Matches />}
      {view === "Goleadores" && <Scorers />}
      {view === "Valla menos vencida" && <Keepers />}
      {view === "Jugadores" && <Players search={search} setSearch={setSearch} players={visiblePlayers} starred={starred} setStarred={setStarred} notify={notify} />}
      {view === "Fases" && <Phases />}

      <section className="cta">
        <div><span className="miniBall">●</span><div><p>¿ORGANIZAS UN CAMPEONATO?</p><h2>Tu torneo merece<br/>una casa propia.</h2></div></div>
        <button onClick={() => setAdminOpen(true)}>Crear mi torneo <span>→</span></button>
      </section>
      <footer><div className="brand"><span className="brandBall">●</span><span>LA<strong>SUPERLIGA</strong></span></div><p>La plataforma del fútbol que se juega de verdad.</p><span>© 2026 · Hecho en Colombia 🇨🇴</span></footer>

      {toast && <div className="toast">✓ {toast}</div>}
      {adminOpen && <AdminModal close={() => setAdminOpen(false)} notify={notify} />}
    </main>
  );
}

function HomeView({ setView, notify }: { setView: (v: View) => void; notify: (s: string) => void }) {
  return <div className="page homeGrid">
    <section className="panel nextMatch">
      <div className="sectionHead"><div><p>PRÓXIMO PARTIDO</p><h2>La fecha que viene</h2></div><button onClick={() => setView("Partidos")}>Ver calendario completo →</button></div>
      <div className="matchFeature">
        <div className="team"><Crest code="DB"/><h3>Deportivo<br/>Bahía</h3><span>LOCAL</span></div>
        <div className="matchCenter"><p>SÁBADO · 15 AGOSTO</p><b>3:30 <small>PM</small></b><span>Cancha La Castellana</span><button onClick={() => notify("Te avisaremos cuando comience el partido")}>♢ Avisarme del partido</button></div>
        <div className="team"><Crest code="UP"/><h3>Unión<br/>Pescadores</h3><span>VISITANTE</span></div>
      </div>
    </section>
    <aside className="panel liveCard"><div className="liveTop"><span className="liveDot"/> EN VIVO · 67&apos;</div><p>FECHA 8</p><div className="scoreLine"><span><Crest code="RC" small/> Real Ciénaga</span><b>2</b></div><div className="scoreLine"><span><Crest code="JM" small/> Jaguares del Mar</span><b>1</b></div><hr/><p>ÚLTIMO GOL · 64&apos;</p><strong>⚽ Samuel Rojas</strong><button onClick={() => setView("Partidos")}>Seguir partido →</button></aside>
    <section className="panel standingsPreview"><div className="sectionHead"><div><p>CLASIFICACIÓN</p><h2>Así va la tabla</h2></div><button onClick={() => setView("Posiciones")}>Ver tabla completa →</button></div><Standings compact/></section>
    <aside className="panel scorerCard"><p>GOLEADOR DEL TORNEO</p><img src={players[0].img} alt="Mateo Cárdenas"/><div className="goalBadge">11<small>GOLES</small></div><h3>Mateo<br/>Cárdenas</h3><span><Crest code="DB" small/> Deportivo Bahía</span><button onClick={() => setView("Goleadores")}>Ver goleadores →</button></aside>
  </div>;
}

function Standings({ compact = false }: { compact?: boolean }) {
  const shown = compact ? teams.slice(0, 5) : teams;
  return <div className={compact ? "tableWrap compact" : "page singlePage"}>{!compact && <div className="pageTitle"><p>CLASIFICACIÓN GENERAL</p><h2>Tabla de posiciones</h2><span>Los 8 primeros clasifican a cuartos de final</span></div>}<div className="tableWrap"><table><thead><tr><th>POS</th><th>EQUIPO</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>{shown.map(t => <tr key={t.code}><td><b className={t.pos <= 4 ? "qualify" : ""}>{t.pos}</b></td><td><span className="teamCell"><Crest code={t.code} small/>{t.name}</span></td><td>{t.pj}</td><td>{t.g}</td><td>{t.e}</td><td>{t.p}</td><td>{t.gf}</td><td>{t.gc}</td><td>+{t.gf-t.gc}</td><td><strong>{t.pts}</strong></td></tr>)}</tbody></table>{compact && <p className="tableNote"><i/> CLASIFICACIÓN DIRECTA A CUARTOS DE FINAL</p>}</div></div>;
}

function Matches() { return <div className="page singlePage"><div className="pageTitle"><p>FECHA 9 · PRÓXIMAMENTE</p><h2>Calendario de partidos</h2><span>Todos los horarios corresponden a Colombia</span></div><div className="matchList">{matches.map((m,i)=><article key={m.time}><div className="dateBlock"><b>{m.date}</b><span>{m.field}</span></div><div className="fixture"><span>{m.a}<Crest code={m.ac}/></span><div><b>{m.time}</b><small>VS</small></div><span><Crest code={m.bc}/>{m.b}</span></div><button aria-label="Recibir aviso">♢</button></article>)}</div></div> }

function Scorers() { return <div className="page singlePage"><div className="pageTitle"><p>BOTÍN DE ORO</p><h2>Goleadores</h2><span>Máximos anotadores del campeonato</span></div><div className="playerGrid">{players.map((p,i)=><article className="playerCard" key={p.name}><span className="rank">#{i+1}</span><img src={p.img} alt={p.name}/><div><p>{p.team}</p><h3>{p.name}</h3><b>{p.goals} <small>GOLES</small></b></div></article>)}</div></div> }

function Keepers() { return <div className="page singlePage"><div className="pageTitle"><p>GUANTE DE ORO</p><h2>Valla menos vencida</h2><span>Arqueros con menor promedio de goles recibidos</span></div><div className="keeperList">{[{n:"Andrés Salcedo",t:"Deportivo Bahía",g:5,p:8,c:"DB"},{n:"Julián Polo",t:"Real Ciénaga",g:8,p:8,c:"RC"},{n:"Emilio Acosta",t:"Atlético Caribe",g:9,p:8,c:"AC"}].map((k,i)=><article key={k.n}><span>0{i+1}</span><Crest code={k.c}/><div><h3>{k.n}</h3><p>{k.t}</p></div><b>{k.g}<small>GOLES RECIBIDOS</small></b><strong>{(k.g/k.p).toFixed(2)}<small>PROMEDIO</small></strong></article>)}</div></div> }

function Players({ search, setSearch, players, starred, setStarred, notify }: any) { return <div className="page singlePage"><div className="pageTitle searchTitle"><div><p>PLANTILLAS OFICIALES</p><h2>Jugadores</h2></div><input aria-label="Buscar jugador" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar jugador o equipo..."/></div><div className="playerGrid">{players.map((p:any)=><article className="playerCard detailed" key={p.name}><img src={p.img} alt={p.name}/><div><p>{p.team}</p><h3>{p.name}</h3><span className="stars">★★★★★ <i>{p.rating}</i></span><button onClick={()=>{if(!starred.includes(p.name)){setStarred([...starred,p.name]);notify(`Calificaste a ${p.name}`)}}}>{starred.includes(p.name)?"✓ Calificado":"☆ Calificar jugador"}</button></div></article>)}</div></div> }

function Phases() { return <div className="page singlePage"><div className="pageTitle"><p>RUTA AL TÍTULO</p><h2>Fases del torneo</h2><span>La fase eliminatoria se habilita al cerrar todos contra todos</span></div><div className="phases"><article className="done"><span>01</span><p>EN CURSO · FECHA 8 DE 15</p><h3>Todos contra todos</h3><b>16 equipos · clasifican 8</b><div><i style={{width:"53%"}}/></div></article><article className="locked"><span>02</span><p>PRÓXIMA FASE</p><h3>Cuartos de final</h3><b>Eliminación directa · ida y vuelta</b><em>🔒 Se habilita al finalizar la fase 1</em></article><article className="locked"><span>03</span><p>ETAPA FINAL</p><h3>Semifinal y final</h3><b>Partido único</b><em>🔒 Pendiente</em></article></div></div> }

function AdminModal({ close, notify }: { close:()=>void; notify:(s:string)=>void }) {
  const [tab,setTab]=useState("Resumen"); const [approved,setApproved]=useState(false);
  return <div className="modalBack" role="dialog" aria-modal="true"><div className="adminModal"><aside><div className="brand"><span className="brandBall">●</span><span>LA<strong>SUPERLIGA</strong></span></div><p>PANEL DEL ORGANIZADOR</p>{["Resumen","Torneos","Equipos","Calendario","Planillaje","Publicidad","Usuarios"].map(t=><button className={tab===t?"active":""} onClick={()=>setTab(t)} key={t}>{({Resumen:"▦",Torneos:"◆",Equipos:"♟",Calendario:"□",Planillaje:"✓",Publicidad:"▣",Usuarios:"♙"} as any)[t]} {t}</button>)}<span className="sideBottom">Copa La Playa 2026<br/><b>torneo/la-playa</b></span></aside><section className="adminContent"><button className="close" onClick={close}>×</button><div className="adminHead"><div><p>COPA LA PLAYA 2026</p><h2>{tab}</h2></div><button className="green" onClick={()=>notify("Nuevo torneo listo para configurar")}>＋ Crear torneo</button></div>{tab==="Resumen"?<><div className="stats"><div><p>EQUIPOS</p><b>16</b><span>de 16 cupos</span></div><div><p>PARTIDOS</p><b>64</b><span>32 jugados</span></div><div><p>JUGADORES</p><b>314</b><span>18 pendientes</span></div><div><p>PRÓXIMA FECHA</p><b>09</b><span>15—16 ago</span></div></div><div className="approval"><div className="sectionHead"><div><p>ACCIÓN PENDIENTE</p><h3>Equipos por aprobar</h3></div><span>1 pendiente</span></div>{!approved?<article><Crest code="SR"/><div><h3>Sporting Rodadero</h3><p>Director técnico: Carlos Mendoza · 21 jugadores registrados</p></div><button className="reject">Revisar</button><button className="green" onClick={()=>{setApproved(true);notify("Sporting Rodadero fue aprobado")}}>✓ Aprobar</button></article>:<div className="empty">✓ Todos los equipos están aprobados</div>}</div><div className="quick"><button onClick={()=>setTab("Planillaje")}>✓<span><b>Abrir planillaje</b>Registrar nómina y eventos del partido</span>→</button><button onClick={()=>setTab("Calendario")}>□<span><b>Generar calendario</b>Crear partidos según la metodología</span>→</button><button onClick={()=>setTab("Publicidad")}>▣<span><b>Gestionar publicidad</b>Subir hasta 4 banners rotativos</span>→</button></div></>:<AdminTab tab={tab} notify={notify}/>}</section></div></div>;
}

function AdminTab({tab,notify}:{tab:string;notify:(s:string)=>void}) { if(tab==="Planillaje") return <div className="sheetDemo"><div className="configCard"><p>PARTIDO SELECCIONADO</p><h3>Deportivo Bahía <b>vs</b> Unión Pescadores</h3><span>Sáb. 15 ago · 3:30 PM</span></div><h3>Selecciona la nómina local</h3><p>Jugador seleccionado pasa automáticamente a la planilla.</p><div className="selectPlayers">{players.map((p,i)=><button key={p.name} onClick={(e)=>{e.currentTarget.classList.toggle("picked")}}><img src={p.img} alt=""/><span>{p.name}<small>#{9+i} · Delantero</small></span><i>＋</i></button>)}</div><button className="green wide" onClick={()=>notify("Planilla guardada correctamente")}>Guardar planilla</button></div>; return <div className="emptyState"><span>{tab==="Equipos"?"♟":tab==="Publicidad"?"▣":"◆"}</span><h3>Gestionar {tab.toLowerCase()}</h3><p>Este módulo queda listo para conectar con la información oficial del campeonato.</p><button className="green" onClick={()=>notify(`${tab}: acción creada`)}>＋ Agregar nuevo</button></div> }
