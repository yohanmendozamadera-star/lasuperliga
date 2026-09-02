"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import { PlatformLanding } from "./platform-landing";
import { OrganizationPortal } from "./organization-portal";

type View =
  | "Inicio"
  | "Partidos"
  | "Posiciones"
  | "Goleadores"
  | "Valla menos vencida"
  | "Jugadores"
  | "Fases";

const nav: View[] = [
  "Inicio",
  "Partidos",
  "Posiciones",
  "Goleadores",
  "Valla menos vencida",
  "Jugadores",
  "Fases",
];
const teams = [
  {
    pos: 1,
    name: "Deportivo Bahía",
    code: "DB",
    pj: 8,
    g: 6,
    e: 2,
    p: 0,
    gf: 18,
    gc: 5,
    pts: 20,
    color: "#f6c445",
  },
  {
    pos: 2,
    name: "Real Ciénaga",
    code: "RC",
    pj: 8,
    g: 5,
    e: 2,
    p: 1,
    gf: 16,
    gc: 8,
    pts: 17,
    color: "#cf4539",
  },
  {
    pos: 3,
    name: "Atlético Caribe",
    code: "AC",
    pj: 8,
    g: 4,
    e: 3,
    p: 1,
    gf: 14,
    gc: 9,
    pts: 15,
    color: "#21a879",
  },
  {
    pos: 4,
    name: "Unión Pescadores",
    code: "UP",
    pj: 8,
    g: 4,
    e: 1,
    p: 3,
    gf: 12,
    gc: 10,
    pts: 13,
    color: "#4778d8",
  },
  {
    pos: 5,
    name: "Jaguares del Mar",
    code: "JM",
    pj: 8,
    g: 3,
    e: 2,
    p: 3,
    gf: 11,
    gc: 11,
    pts: 11,
    color: "#8d5ab5",
  },
  {
    pos: 6,
    name: "Sporting Rodadero",
    code: "SR",
    pj: 8,
    g: 2,
    e: 2,
    p: 4,
    gf: 9,
    gc: 13,
    pts: 8,
    color: "#e27333",
  },
];
const players = [
  {
    name: "Mateo Cárdenas",
    team: "Deportivo Bahía",
    goals: 11,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Samuel Rojas",
    team: "Real Ciénaga",
    goals: 9,
    rating: 4.7,
    img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Diego Pacheco",
    team: "Atlético Caribe",
    goals: 8,
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=220&q=80",
  },
  {
    name: "Nicolás Martínez",
    team: "Unión Pescadores",
    goals: 7,
    rating: 4.6,
    img: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=220&q=80",
  },
];
const matches = [
  {
    date: "SÁB · 15 AGO",
    time: "3:30 PM",
    a: "Deportivo Bahía",
    ac: "DB",
    b: "Unión Pescadores",
    bc: "UP",
    field: "Cancha La Castellana",
  },
  {
    date: "SÁB · 15 AGO",
    time: "5:30 PM",
    a: "Real Ciénaga",
    ac: "RC",
    b: "Atlético Caribe",
    bc: "AC",
    field: "Cancha La Castellana",
  },
  {
    date: "DOM · 16 AGO",
    time: "4:00 PM",
    a: "Jaguares del Mar",
    ac: "JM",
    b: "Sporting Rodadero",
    bc: "SR",
    field: "Estadio Municipal",
  },
];

type RegisteredPlayer = {
  id: number;
  name: string;
  document: string;
  number: string;
  position: string;
  photo: string;
};
type TeamApplication = {
  id: number;
  teamName: string;
  representative: string;
  phone: string;
  email: string;
  city: string;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  coach: string;
  shirtColor: string;
  shortsColor: string;
  socksColor: string;
  profileComplete: boolean;
  players: RegisteredPlayer[];
  source: "Representante" | "Organizador";
};

function Crest({ code, small = false }: { code: string; small?: boolean }) {
  const team = teams.find((t) => t.code === code);
  return (
    <span
      className={`crest ${small ? "crestSmall" : ""}`}
      style={{ background: team?.color || "#0b6248" }}
    >
      {code}
    </span>
  );
}

export default function Home() {
  const [portalMode, setPortalMode] = useState<{ type: "landing" } | { type: "organization"; slug: string } | null>(null);
  const [view, setView] = useState<View>("Inicio");
  const [adminOpen, setAdminOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [starred, setStarred] = useState<string[]>([]);
  const [qualifiers, setQualifiers] = useState(4);
  const [registrationMode, setRegistrationMode] = useState<
    "Representante" | "Organizador" | null
  >(null);
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith(".liguita.co") && host !== "www.liguita.co") {
      setPortalMode({ type: "organization", slug: host.slice(0, -".liguita.co".length).split(".")[0] });
    } else {
      setPortalMode({ type: "landing" });
    }
  }, []);
  useEffect(() => {
    const update = (event: Event) =>
      setQualifiers((event as CustomEvent<number>).detail);
    window.addEventListener("qualifiers-change", update);
    return () => window.removeEventListener("qualifiers-change", update);
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const visiblePlayers = useMemo(
    () =>
      players.filter((p) =>
        `${p.name} ${p.team}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  };
  const handleGoogleAuth = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      notify("Falta conectar Supabase en la configuración del sitio");
      return;
    }
    if (authUser) {
      await supabase.auth.signOut();
      notify("Sesión cerrada");
      return;
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl.replace(/\/$/, "")}/` },
    });
    if (error) notify(`No fue posible iniciar sesión: ${error.message}`);
  };

  if (!portalMode) {
    return <main className="portalState"><img src="/liguita-logo-google-white.png" alt="Liguita" /><p>Cargando Liguita…</p></main>;
  }
  if (portalMode.type === "landing") return <PlatformLanding />;
  if (portalMode.type === "organization") return <OrganizationPortal slug={portalMode.slug} />;

  return (
    <main>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setView("Inicio")}
          aria-label="Ir al inicio"
        >
          <span className="brandBall">●</span>
          <span>
            <strong>LIGUITA</strong>
          </span>
        </button>
        <nav className="desktopNav" aria-label="Navegación principal">
          {nav.slice(0, 5).map((item) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="headerActions">
          <button
            className="bell"
            onClick={() => notify("Notificaciones activadas para este torneo")}
          >
            ♢<span />
          </button>
          <button
            className="login"
            onClick={handleGoogleAuth}
            disabled={authLoading}
            title={authUser ? "Cerrar sesión" : "Iniciar sesión con Google"}
          >
            {authUser
              ? `● ${authUser.user_metadata?.full_name || authUser.email || "Mi cuenta"}`
              : "G  Iniciar sesión"}
          </button>
          <button className="owner" onClick={() => setAdminOpen(true)}>
            Administrar torneo
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="heroShade" />
        <div className="heroContent">
          <div className="leagueMark">
            <span>⚽</span>
            <div>
              COPA
              <br />
              <b>LA PLAYA</b>
              <small>2026</small>
            </div>
          </div>
          <div>
            <p className="eyebrow">TORNEO ABIERTO · SANTA MARTA</p>
            <h1>
              Donde el barrio
              <br />
              se vuelve <em>leyenda.</em>
            </h1>
            <div className="heroMeta">
              <span>📅 02 AGO — 28 NOV 2026</span>
              <span>👥 16 EQUIPOS</span>
              <span>🏆 TODOS CONTRA TODOS</span>
            </div>
            <button
              className="joinTournament"
              onClick={() => setRegistrationMode("Representante")}
            >
              ⚽ Inscribir mi equipo <span>→</span>
            </button>
          </div>
        </div>
        <div className="sponsors">
          <span>PATROCINAN</span>
          <b>
            DEPORTES
            <br />
            DEL CARIBE
          </b>
          <b>
            AGUA
            <br />
            SIERRA
          </b>
          <b>
            RADIO
            <br />
            FÚTBOL 98.5
          </b>
          <i>1 / 4</i>
        </div>
      </section>

      <nav className="subnav" aria-label="Secciones del campeonato">
        {nav.map((item) => (
          <button
            key={item}
            className={view === item ? "active" : ""}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {view === "Inicio" && (
        <HomeView setView={setView} notify={notify} qualifiers={qualifiers} />
      )}
      {view === "Posiciones" && <Standings qualifiers={qualifiers} />}
      {view === "Partidos" && <Matches />}
      {view === "Goleadores" && <Scorers />}
      {view === "Valla menos vencida" && <Keepers />}
      {view === "Jugadores" && (
        <Players
          search={search}
          setSearch={setSearch}
          players={visiblePlayers}
          starred={starred}
          setStarred={setStarred}
          notify={notify}
        />
      )}
      {view === "Fases" && <Phases />}

      <section className="cta">
        <div>
          <span className="miniBall">●</span>
          <div>
            <p>¿ORGANIZAS UN CAMPEONATO?</p>
            <h2>
              Tu torneo merece
              <br />
              una casa propia.
            </h2>
          </div>
        </div>
        <button onClick={() => setAdminOpen(true)}>
          Crear mi torneo <span>→</span>
        </button>
      </section>
      <footer>
        <div className="brand">
          <span className="brandBall">●</span>
          <span>
            <strong>LIGUITA</strong>
          </span>
        </div>
        <p>La plataforma del fútbol que se juega de verdad.</p>
        <span>© 2026 · Hecho en Colombia 🇨🇴</span>
      </footer>

      {toast && <div className="toast">✓ {toast}</div>}
      {adminOpen && (
        <AdminModal
          close={() => setAdminOpen(false)}
          notify={notify}
          applications={applications}
          setApplications={setApplications}
          onManualRegistration={() => {
            setAdminOpen(false);
            setRegistrationMode("Organizador");
          }}
        />
      )}
      {registrationMode && (
        <TeamRegistrationFlow
          mode={registrationMode}
          applications={applications}
          setApplications={setApplications}
          close={() => setRegistrationMode(null)}
          notify={notify}
        />
      )}
    </main>
  );
}

function HomeView({
  setView,
  notify,
  qualifiers,
}: {
  setView: (v: View) => void;
  notify: (s: string) => void;
  qualifiers: number;
}) {
  return (
    <div className="page homeGrid">
      <section className="panel nextMatch">
        <div className="sectionHead">
          <div>
            <p>PRÓXIMO PARTIDO</p>
            <h2>La fecha que viene</h2>
          </div>
          <button onClick={() => setView("Partidos")}>
            Ver calendario completo →
          </button>
        </div>
        <div className="matchFeature">
          <div className="team">
            <Crest code="DB" />
            <h3>
              Deportivo
              <br />
              Bahía
            </h3>
            <span>LOCAL</span>
          </div>
          <div className="matchCenter">
            <p>SÁBADO · 15 AGOSTO</p>
            <b>
              3:30 <small>PM</small>
            </b>
            <span>Cancha La Castellana</span>
            <button
              onClick={() => notify("Te avisaremos cuando comience el partido")}
            >
              ♢ Avisarme del partido
            </button>
          </div>
          <div className="team">
            <Crest code="UP" />
            <h3>
              Unión
              <br />
              Pescadores
            </h3>
            <span>VISITANTE</span>
          </div>
        </div>
      </section>
      <aside className="panel liveCard">
        <div className="liveTop">
          <span className="liveDot" /> EN VIVO · 67&apos;
        </div>
        <p>FECHA 8</p>
        <div className="scoreLine">
          <span>
            <Crest code="RC" small /> Real Ciénaga
          </span>
          <b>2</b>
        </div>
        <div className="scoreLine">
          <span>
            <Crest code="JM" small /> Jaguares del Mar
          </span>
          <b>1</b>
        </div>
        <hr />
        <p>ÚLTIMO GOL · 64&apos;</p>
        <strong>⚽ Samuel Rojas</strong>
        <button onClick={() => setView("Partidos")}>Seguir partido →</button>
      </aside>
      <section className="panel standingsPreview">
        <div className="sectionHead">
          <div>
            <p>CLASIFICACIÓN</p>
            <h2>Así va la tabla</h2>
          </div>
          <button onClick={() => setView("Posiciones")}>
            Ver tabla completa →
          </button>
        </div>
        <Standings compact qualifiers={qualifiers} />
      </section>
      <aside className="panel scorerCard">
        <p>GOLEADOR DEL TORNEO</p>
        <img src={players[0].img} alt="Mateo Cárdenas" />
        <div className="goalBadge">
          11<small>GOLES</small>
        </div>
        <h3>
          Mateo
          <br />
          Cárdenas
        </h3>
        <span>
          <Crest code="DB" small /> Deportivo Bahía
        </span>
        <button onClick={() => setView("Goleadores")}>Ver goleadores →</button>
      </aside>
    </div>
  );
}

function Standings({
  compact = false,
  qualifiers = 4,
}: {
  compact?: boolean;
  qualifiers?: number;
}) {
  const shown = compact ? teams.slice(0, 5) : teams;
  return (
    <div className={compact ? "tableWrap compact" : "page singlePage"}>
      {!compact && (
        <div className="pageTitle">
          <p>CLASIFICACIÓN GENERAL</p>
          <h2>Tabla de posiciones</h2>
          <span>
            Los primeros {qualifiers} equipos avanzan a la siguiente fase
          </span>
        </div>
      )}
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>POS</th>
              <th>EQUIPO</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr
                key={t.code}
                className={t.pos > qualifiers ? "outsideQualification" : ""}
              >
                <td>
                  <b className={t.pos <= qualifiers ? "qualify" : "notQualify"}>
                    {t.pos}
                  </b>
                </td>
                <td>
                  <span className="teamCell">
                    <Crest code={t.code} small />
                    {t.name}
                  </span>
                </td>
                <td>{t.pj}</td>
                <td>{t.g}</td>
                <td>{t.e}</td>
                <td>{t.p}</td>
                <td>{t.gf}</td>
                <td>{t.gc}</td>
                <td>+{t.gf - t.gc}</td>
                <td>
                  <strong>{t.pts}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {compact && (
          <p className="tableNote">
            <i /> CLASIFICAN LOS PRIMEROS {qualifiers} EQUIPOS
          </p>
        )}
      </div>
    </div>
  );
}

function Matches() {
  return (
    <div className="page singlePage">
      <div className="pageTitle">
        <p>FECHA 9 · PRÓXIMAMENTE</p>
        <h2>Calendario de partidos</h2>
        <span>Todos los horarios corresponden a Colombia</span>
      </div>
      <div className="matchList">
        {matches.map((m, i) => (
          <article key={m.time}>
            <div className="dateBlock">
              <b>{m.date}</b>
              <span>{m.field}</span>
            </div>
            <div className="fixture">
              <span>
                {m.a}
                <Crest code={m.ac} />
              </span>
              <div>
                <b>{m.time}</b>
                <small>VS</small>
              </div>
              <span>
                <Crest code={m.bc} />
                {m.b}
              </span>
            </div>
            <button aria-label="Recibir aviso">♢</button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Scorers() {
  return (
    <div className="page singlePage">
      <div className="pageTitle">
        <p>BOTÍN DE ORO</p>
        <h2>Goleadores</h2>
        <span>Máximos anotadores del campeonato</span>
      </div>
      <div className="playerGrid">
        {players.map((p, i) => (
          <article className="playerCard" key={p.name}>
            <span className="rank">#{i + 1}</span>
            <img src={p.img} alt={p.name} />
            <div>
              <p>{p.team}</p>
              <h3>{p.name}</h3>
              <b>
                {p.goals} <small>GOLES</small>
              </b>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Keepers() {
  return (
    <div className="page singlePage">
      <div className="pageTitle">
        <p>GUANTE DE ORO</p>
        <h2>Valla menos vencida</h2>
        <span>Arqueros con menor promedio de goles recibidos</span>
      </div>
      <div className="keeperList">
        {[
          { n: "Andrés Salcedo", t: "Deportivo Bahía", g: 5, p: 8, c: "DB" },
          { n: "Julián Polo", t: "Real Ciénaga", g: 8, p: 8, c: "RC" },
          { n: "Emilio Acosta", t: "Atlético Caribe", g: 9, p: 8, c: "AC" },
        ].map((k, i) => (
          <article key={k.n}>
            <span>0{i + 1}</span>
            <Crest code={k.c} />
            <div>
              <h3>{k.n}</h3>
              <p>{k.t}</p>
            </div>
            <b>
              {k.g}
              <small>GOLES RECIBIDOS</small>
            </b>
            <strong>
              {(k.g / k.p).toFixed(2)}
              <small>PROMEDIO</small>
            </strong>
          </article>
        ))}
      </div>
    </div>
  );
}

function Players({
  search,
  setSearch,
  players,
  starred,
  setStarred,
  notify,
}: any) {
  return (
    <div className="page singlePage">
      <div className="pageTitle searchTitle">
        <div>
          <p>PLANTILLAS OFICIALES</p>
          <h2>Jugadores</h2>
        </div>
        <input
          aria-label="Buscar jugador"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar jugador o equipo..."
        />
      </div>
      <div className="playerGrid">
        {players.map((p: any) => (
          <article className="playerCard detailed" key={p.name}>
            <img src={p.img} alt={p.name} />
            <div>
              <p>{p.team}</p>
              <h3>{p.name}</h3>
              <span className="stars">
                ★★★★★ <i>{p.rating}</i>
              </span>
              <button
                onClick={() => {
                  if (!starred.includes(p.name)) {
                    setStarred([...starred, p.name]);
                    notify(`Calificaste a ${p.name}`);
                  }
                }}
              >
                {starred.includes(p.name)
                  ? "✓ Calificado"
                  : "☆ Calificar jugador"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Phases() {
  return (
    <div className="page singlePage">
      <div className="pageTitle">
        <p>RUTA AL TÍTULO</p>
        <h2>Fases del torneo</h2>
        <span>
          La fase eliminatoria se habilita al cerrar todos contra todos
        </span>
      </div>
      <div className="phases">
        <article className="done">
          <span>01</span>
          <p>EN CURSO · FECHA 8 DE 15</p>
          <h3>Todos contra todos</h3>
          <b>16 equipos · clasifican 8</b>
          <div>
            <i style={{ width: "53%" }} />
          </div>
        </article>
        <article className="locked">
          <span>02</span>
          <p>PRÓXIMA FASE</p>
          <h3>Cuartos de final</h3>
          <b>Eliminación directa · ida y vuelta</b>
          <em>🔒 Se habilita al finalizar la fase 1</em>
        </article>
        <article className="locked">
          <span>03</span>
          <p>ETAPA FINAL</p>
          <h3>Semifinal y final</h3>
          <b>Partido único</b>
          <em>🔒 Pendiente</em>
        </article>
      </div>
    </div>
  );
}

function AdminModal({
  close,
  notify,
  applications,
  setApplications,
  onManualRegistration,
}: {
  close: () => void;
  notify: (s: string) => void;
  applications: TeamApplication[];
  setApplications: React.Dispatch<React.SetStateAction<TeamApplication[]>>;
  onManualRegistration: () => void;
}) {
  const [tab, setTab] = useState("Resumen");
  const [approved, setApproved] = useState(false);
  return (
    <div className="modalBack" role="dialog" aria-modal="true">
      <div className="adminModal">
        <aside>
          <div className="brand">
            <span className="brandBall">●</span>
            <span>
              <strong>LIGUITA</strong>
            </span>
          </div>
          <p>PANEL DEL ORGANIZADOR</p>
          {[
            "Resumen",
            "Torneos",
            "Equipos",
            "Calendario",
            "Planillaje",
            "Publicidad",
            "Usuarios",
          ].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
              key={t}
            >
              {
                (
                  {
                    Resumen: "▦",
                    Torneos: "◆",
                    Equipos: "♟",
                    Calendario: "□",
                    Planillaje: "✓",
                    Publicidad: "▣",
                    Usuarios: "♙",
                  } as any
                )[t]
              }{" "}
              {t}
            </button>
          ))}
          <span className="sideBottom">
            Copa La Playa 2026
            <br />
            <b>torneo/la-playa</b>
          </span>
        </aside>
        <section className="adminContent">
          <button className="close" onClick={close}>
            ×
          </button>
          <div className="adminHead">
            <div>
              <p>COPA LA PLAYA 2026</p>
              <h2>{tab}</h2>
            </div>
            {tab !== "Torneos" && (
              <button className="green" onClick={() => setTab("Torneos")}>
                Ver mis torneos →
              </button>
            )}
          </div>
          {tab === "Resumen" ? (
            <>
              <div className="stats">
                <div>
                  <p>EQUIPOS</p>
                  <b>16</b>
                  <span>de 16 cupos</span>
                </div>
                <div>
                  <p>PARTIDOS</p>
                  <b>64</b>
                  <span>32 jugados</span>
                </div>
                <div>
                  <p>JUGADORES</p>
                  <b>314</b>
                  <span>18 pendientes</span>
                </div>
                <div>
                  <p>PRÓXIMA FECHA</p>
                  <b>09</b>
                  <span>15—16 ago</span>
                </div>
              </div>
              <div className="approval">
                <div className="sectionHead">
                  <div>
                    <p>ACCIÓN PENDIENTE</p>
                    <h3>Equipos por aprobar</h3>
                  </div>
                  <span>
                    {applications.filter((a) => a.status === "Pendiente")
                      .length || 1}{" "}
                    pendiente
                  </span>
                </div>
                {!approved ? (
                  <article>
                    <Crest code="SR" />
                    <div>
                      <h3>Sporting Rodadero</h3>
                      <p>
                        Director técnico: Carlos Mendoza · 21 jugadores
                        registrados
                      </p>
                    </div>
                    <button className="reject">Revisar</button>
                    <button
                      className="green"
                      onClick={() => {
                        setApproved(true);
                        notify("Sporting Rodadero fue aprobado");
                      }}
                    >
                      ✓ Aprobar
                    </button>
                  </article>
                ) : (
                  <div className="empty">
                    ✓ Todos los equipos están aprobados
                  </div>
                )}
              </div>
              <div className="quick">
                <button onClick={() => setTab("Planillaje")}>
                  ✓
                  <span>
                    <b>Abrir planillaje</b>Registrar nómina y eventos del
                    partido
                  </span>
                  →
                </button>
                <button onClick={() => setTab("Calendario")}>
                  □
                  <span>
                    <b>Generar calendario</b>Crear partidos según la metodología
                  </span>
                  →
                </button>
                <button onClick={() => setTab("Publicidad")}>
                  ▣
                  <span>
                    <b>Gestionar publicidad</b>Subir hasta 4 banners rotativos
                  </span>
                  →
                </button>
              </div>
            </>
          ) : (
            <AdminTab
              tab={tab}
              notify={notify}
              applications={applications}
              setApplications={setApplications}
              onManualRegistration={onManualRegistration}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function AdminTab({
  tab,
  notify,
  applications,
  setApplications,
  onManualRegistration,
}: {
  tab: string;
  notify: (s: string) => void;
  applications: TeamApplication[];
  setApplications: React.Dispatch<React.SetStateAction<TeamApplication[]>>;
  onManualRegistration: () => void;
}) {
  if (tab === "Torneos") return <TournamentManager notify={notify} />;
  if (tab === "Equipos")
    return (
      <TeamsManager
        notify={notify}
        applications={applications}
        setApplications={setApplications}
        onManualRegistration={onManualRegistration}
      />
    );
  if (tab === "Calendario") return <CalendarManager notify={notify} />;
  if (tab === "Planillaje") return <ScoreSheetManager notify={notify} />;
  return (
    <div className="emptyState">
      <span>{tab === "Publicidad" ? "▣" : "◆"}</span>
      <h3>Gestionar {tab.toLowerCase()}</h3>
      <p>
        Este módulo queda listo para conectar con la información oficial del
        campeonato.
      </p>
      <button className="green" onClick={() => notify(`${tab}: acción creada`)}>
        ＋ Agregar nuevo
      </button>
    </div>
  );
}

type SheetPlayer = {
  id: string;
  name: string;
  number: number;
  position: string;
  img: string;
};
type MatchEvent = {
  id: number;
  type: string;
  team: "home" | "away";
  player: string;
  minute: number;
};

function ScoreSheetManager({ notify }: { notify: (s: string) => void }) {
  const assigned = [
    {
      id: 1,
      round: 9,
      home: "Deportivo Bahía",
      homeCode: "DB",
      away: "Unión Pescadores",
      awayCode: "UP",
      date: "Sáb. 15 ago",
      time: "3:30 PM",
      venue: "Cancha La Castellana",
      status: "Por planillar",
    },
    {
      id: 2,
      round: 9,
      home: "Real Ciénaga",
      homeCode: "RC",
      away: "Atlético Caribe",
      awayCode: "AC",
      date: "Sáb. 15 ago",
      time: "5:30 PM",
      venue: "Cancha La Castellana",
      status: "Por planillar",
    },
    {
      id: 3,
      round: 9,
      home: "Jaguares del Mar",
      homeCode: "JM",
      away: "Sporting Rodadero",
      awayCode: "SR",
      date: "Dom. 16 ago",
      time: "4:00 PM",
      venue: "Estadio Municipal",
      status: "Próximo",
    },
  ];
  const names = [
    "Mateo Cárdenas",
    "Samuel Rojas",
    "Diego Pacheco",
    "Nicolás Martínez",
    "Andrés Salcedo",
    "Julián Polo",
    "Emilio Acosta",
    "Carlos Mendoza",
    "Felipe Rincón",
    "Tomás Orozco",
    "Iván Mercado",
    "Brayan López",
    "Daniel Barrios",
    "Óscar Mejía",
  ];
  const awayNames = [
    "Luis Arrieta",
    "Juan Polo",
    "Esteban Ruiz",
    "David Acuña",
    "Mario Pérez",
    "Kevin Díaz",
    "Ángel Torres",
    "Santiago Gil",
    "Camilo Vives",
    "Cristian León",
    "Jorge Campo",
    "Rafael Núñez",
    "Miguel Soto",
    "Alex Villa",
  ];
  const makeRoster = (side: "home" | "away"): SheetPlayer[] =>
    names.map((name, i) => ({
      id: `${side}-${i}`,
      name: side === "home" ? name : awayNames[i],
      number: i + 1,
      position:
        i === 0
          ? "Arquero"
          : i < 5
            ? "Defensa"
            : i < 9
              ? "Volante"
              : "Delantero",
      img: players[i % players.length].img,
    }));
  const [selectedMatch, setSelectedMatch] = useState<
    (typeof assigned)[number] | null
  >(null);
  const [stage, setStage] = useState<"lineup" | "live" | "closed">("lineup");
  const [side, setSide] = useState<"home" | "away">("home");
  const [lineups, setLineups] = useState<{ home: string[]; away: string[] }>({
    home: [],
    away: [],
  });
  const [savedLineups, setSavedLineups] = useState<{
    home: boolean;
    away: boolean;
  }>({ home: false, away: false });
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [minute, setMinute] = useState(1);
  const [eventType, setEventType] = useState("Gol");
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [eventPlayer, setEventPlayer] = useState("");
  const [playerOut, setPlayerOut] = useState("");
  const [playerIn, setPlayerIn] = useState("");
  const [rules, setRules] = useState({
    starters: 11,
    maxSubstitutes: 7,
    allowedChanges: 5,
  });
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lasuperliga-match-rules");
      if (saved) setRules(JSON.parse(saved));
    } catch {}
  }, []);
  const rosters = { home: makeRoster("home"), away: makeRoster("away") };
  const score = (team: "home" | "away") =>
    events.filter((e) => e.team === team && e.type === "Gol").length;
  const choose = (id: string) => {
    setLineups({
      ...lineups,
      [side]: lineups[side].includes(id)
        ? lineups[side].filter((x) => x !== id)
        : [...lineups[side], id],
    });
    setSavedLineups({ ...savedLineups, [side]: false });
  };
  const openMatch = (match: (typeof assigned)[number]) => {
    setSelectedMatch(match);
    setStage("lineup");
    setSide("home");
    setLineups({ home: [], away: [] });
    setSavedLineups({ home: false, away: false });
    setEvents([]);
    setMinute(1);
  };
  const saveCurrentLineup = () => {
    setSavedLineups({ ...savedLineups, [side]: true });
    notify(
      `Planilla de ${side === "home" ? selectedMatch?.home : selectedMatch?.away} guardada`,
    );
    if (side === "home" && !savedLineups.away) setSide("away");
  };
  const begin = () => {
    if (!savedLineups[side]) {
      saveCurrentLineup();
      return;
    }
    if (!savedLineups.home) {
      setSide("home");
      notify("Falta guardar la planilla del equipo local");
      return;
    }
    if (!savedLineups.away) {
      setSide("away");
      notify("Falta guardar la planilla del equipo visitante");
      return;
    }
    const incomplete =
      lineups.home.length < rules.starters ||
      lineups.away.length < rules.starters;
    const message = incomplete
      ? `La nómina está incompleta. Local: ${Math.min(lineups.home.length, rules.starters)}/${rules.starters} titulares · Visitante: ${Math.min(lineups.away.length, rules.starters)}/${rules.starters} titulares. ¿Deseas iniciar de todas formas?`
      : "Las dos planillas están guardadas. ¿Confirmas iniciar el partido?";
    if (window.confirm(message)) {
      setStage("live");
      notify(
        incomplete
          ? "Partido iniciado con nómina incompleta"
          : "Partido iniciado y planillas bloqueadas",
      );
    }
  };
  const addEvent = () => {
    const available = rosters[side].filter((p) => lineups[side].includes(p.id));
    if (!available.length) {
      notify("Este equipo no tiene jugadores convocados");
      return;
    }
    setEventPlayer("");
    setPlayerOut("");
    setPlayerIn("");
    setEventPickerOpen(true);
  };
  const confirmEvent = () => {
    const available = rosters[side].filter((p) => lineups[side].includes(p.id));
    if (eventType === "Cambio") {
      const outgoing = available.find((p) => p.id === playerOut);
      const incoming = available.find((p) => p.id === playerIn);
      if (!outgoing || !incoming) {
        notify("Selecciona el jugador que sale y el que entra");
        return;
      }
      if (playerOut === playerIn) {
        notify("El jugador que entra debe ser diferente al que sale");
        return;
      }
      const detail = `Sale ${outgoing.name} · Entra ${incoming.name}`;
      setEvents([
        { id: Date.now(), type: eventType, team: side, player: detail, minute },
        ...events,
      ]);
      notify(`Cambio registrado: ${detail}`);
      setEventPickerOpen(false);
      return;
    }
    const player = available.find((p) => p.id === eventPlayer);
    if (!player) {
      notify("Selecciona el jugador del evento");
      return;
    }
    setEvents([
      {
        id: Date.now(),
        type: eventType,
        team: side,
        player: player.name,
        minute,
      },
      ...events,
    ]);
    notify(`${eventType} registrado para ${player.name}`);
    setEventPickerOpen(false);
  };
  if (!selectedMatch)
    return (
      <div className="scoreSheet">
        <div className="sheetIntro">
          <div>
            <p>MIS PARTIDOS ASIGNADOS</p>
            <h3>Planillaje de la fecha</h3>
            <span>
              Selecciona un encuentro para preparar la nómina y registrar el
              partido.
            </span>
          </div>
          <div>
            <b>3</b>
            <span>partidos asignados</span>
          </div>
        </div>
        <div className="sheetMatchList">
          {assigned.map((match) => (
            <article key={match.id}>
              <span className="sheetDate">
                <b>FECHA {match.round}</b>
                <small>
                  {match.date} · {match.time}
                </small>
              </span>
              <div className="sheetTeams">
                <span>
                  <Crest code={match.homeCode} small />
                  <b>{match.home}</b>
                </span>
                <i>VS</i>
                <span>
                  <Crest code={match.awayCode} small />
                  <b>{match.away}</b>
                </span>
              </div>
              <span className="sheetVenue">📍 {match.venue}</span>
              <button onClick={() => openMatch(match)}>Abrir planilla →</button>
            </article>
          ))}
        </div>
      </div>
    );
  const currentRoster = rosters[side];
  const picked = currentRoster.filter((p) => lineups[side].includes(p.id));
  const available = currentRoster.filter((p) => !lineups[side].includes(p.id));
  return (
    <div className="scoreSheet">
      <button className="backLink" onClick={() => setSelectedMatch(null)}>
        ← Volver a partidos
      </button>
      <div className="sheetScore">
        <div>
          <Crest code={selectedMatch.homeCode} />
          <span>
            <small>LOCAL</small>
            <b>{selectedMatch.home}</b>
          </span>
        </div>
        <strong>
          {stage === "lineup" ? "VS" : `${score("home")}  —  ${score("away")}`}
        </strong>
        <div>
          <span>
            <small>VISITANTE</small>
            <b>{selectedMatch.away}</b>
          </span>
          <Crest code={selectedMatch.awayCode} />
        </div>
        <p>
          {selectedMatch.date} · {selectedMatch.time} · {selectedMatch.venue}
        </p>
      </div>
      {stage === "lineup" ? (
        <>
          <div className="rulesBadge">
            <span>MODALIDAD</span>
            <b>Fútbol {rules.starters}</b>
            <small>
              Máx. {rules.maxSubstitutes} suplentes · {rules.allowedChanges}{" "}
              cambios permitidos
            </small>
          </div>
          <div className="sheetStepHead">
            <div>
              <p>CONVOCATORIA</p>
              <h3>Selecciona los jugadores</h3>
              <span>
                Los primeros {rules.starters} serán titulares; los siguientes
                quedarán como suplentes.
              </span>
            </div>
            <div className="teamSwitch">
              <button
                className={side === "home" ? "active" : ""}
                onClick={() => setSide("home")}
              >
                {selectedMatch.home} <b>{lineups.home.length}</b>
              </button>
              <button
                className={side === "away" ? "active" : ""}
                onClick={() => setSide("away")}
              >
                {selectedMatch.away} <b>{lineups.away.length}</b>
              </button>
            </div>
          </div>
          <div className="lineupColumns">
            <section>
              <h4>
                Disponibles <span>{available.length}</span>
              </h4>
              <div>
                {available.map((p) => (
                  <button key={p.id} onClick={() => choose(p.id)}>
                    <img src={p.img} alt="" />
                    <span>
                      <b>
                        #{p.number} {p.name}
                      </b>
                      <small>{p.position}</small>
                    </span>
                    <i>＋</i>
                  </button>
                ))}
              </div>
            </section>
            <section className="pickedRoster">
              <h4>
                Planillados <span>{picked.length}</span>
              </h4>
              {picked.length === 0 ? (
                <p>Selecciona jugadores de la lista.</p>
              ) : (
                <div>
                  {picked.map((p, i) => (
                    <button key={p.id} onClick={() => choose(p.id)}>
                      <b>{i < rules.starters ? "TITULAR" : "SUPLENTE"}</b>
                      <span>
                        #{p.number} · {p.name}
                      </span>
                      <i>×</i>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
          <div className="sheetFooter">
            <span>
              Local:{" "}
              <b>
                {Math.min(lineups.home.length, rules.starters)}/{rules.starters}
              </b>{" "}
              titulares · Visitante:{" "}
              <b>
                {Math.min(lineups.away.length, rules.starters)}/{rules.starters}
              </b>{" "}
              titulares
            </span>
            <button className="green" onClick={begin}>
              Confirmar nóminas e iniciar →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="liveControl">
            <div>
              <span className="liveDot" />{" "}
              {stage === "closed" ? "PARTIDO FINALIZADO" : "PARTIDO EN VIVO"}
              <b>{minute}&apos;</b>
            </div>
            {stage === "live" && (
              <label>
                Minuto
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                />
              </label>
            )}
            <button
              disabled={stage === "closed"}
              onClick={() => {
                if (window.confirm("¿Estás seguro de finalizar el partido?")) {
                  setStage("closed");
                  notify("Partido finalizado y estadísticas actualizadas");
                }
              }}
            >
              Finalizar partido
            </button>
          </div>
          {stage === "live" && (
            <div className="eventComposer">
              <div className="teamSwitch">
                <button
                  className={side === "home" ? "active" : ""}
                  onClick={() => setSide("home")}
                >
                  {selectedMatch.home}
                </button>
                <button
                  className={side === "away" ? "active" : ""}
                  onClick={() => setSide("away")}
                >
                  {selectedMatch.away}
                </button>
              </div>
              <div className="eventTypes">
                {["Gol", "Tarjeta amarilla", "Tarjeta roja", "Cambio"].map(
                  (type) => (
                    <button
                      className={eventType === type ? "active" : ""}
                      onClick={() => setEventType(type)}
                      key={type}
                    >
                      {type === "Gol" ? "⚽" : type === "Cambio" ? "↔" : "▰"}{" "}
                      {type}
                    </button>
                  ),
                )}
              </div>
              <button className="green" onClick={addEvent}>
                ＋ Registrar evento
              </button>
            </div>
          )}
          {eventPickerOpen && stage === "live" && (
            <div className="eventPicker" role="dialog" aria-modal="true">
              <div className="eventPickerHead">
                <div>
                  <p>REGISTRAR EVENTO · MINUTO {minute}&apos;</p>
                  <h3>{eventType}</h3>
                  <span>
                    {side === "home" ? selectedMatch.home : selectedMatch.away}
                  </span>
                </div>
                <button onClick={() => setEventPickerOpen(false)}>×</button>
              </div>
              {eventType === "Cambio" ? (
                <div className="changePicker">
                  <section>
                    <h4>Jugador que sale</h4>
                    <div className="eventPlayerGrid">
                      {rosters[side]
                        .filter((p) => lineups[side].includes(p.id))
                        .map((p) => (
                          <button
                            key={p.id}
                            className={playerOut === p.id ? "selected" : ""}
                            onClick={() => setPlayerOut(p.id)}
                          >
                            <img src={p.img} alt="" />
                            <span>
                              <b>#{p.number} {p.name}</b>
                              <small>{p.position}</small>
                            </span>
                            <i>{playerOut === p.id ? "✓" : "○"}</i>
                          </button>
                        ))}
                    </div>
                  </section>
                  <section>
                    <h4>Jugador que entra</h4>
                    <div className="eventPlayerGrid">
                      {rosters[side]
                        .filter((p) => lineups[side].includes(p.id))
                        .map((p) => (
                          <button
                            key={p.id}
                            disabled={playerOut === p.id}
                            className={playerIn === p.id ? "selected" : ""}
                            onClick={() => setPlayerIn(p.id)}
                          >
                            <img src={p.img} alt="" />
                            <span>
                              <b>#{p.number} {p.name}</b>
                              <small>{p.position}</small>
                            </span>
                            <i>{playerIn === p.id ? "✓" : "○"}</i>
                          </button>
                        ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="eventPlayerGrid single">
                  {rosters[side]
                    .filter((p) => lineups[side].includes(p.id))
                    .map((p) => (
                      <button
                        key={p.id}
                        className={eventPlayer === p.id ? "selected" : ""}
                        onClick={() => setEventPlayer(p.id)}
                      >
                        <img src={p.img} alt="" />
                        <span>
                          <b>#{p.number} {p.name}</b>
                          <small>{p.position}</small>
                        </span>
                        <i>{eventPlayer === p.id ? "✓" : "○"}</i>
                      </button>
                    ))}
                </div>
              )}
              <div className="eventPickerActions">
                <button onClick={() => setEventPickerOpen(false)}>Cancelar</button>
                <button className="green" onClick={confirmEvent}>
                  Confirmar {eventType.toLowerCase()}
                </button>
              </div>
            </div>
          )}
          <div className="eventTimeline">
            <div>
              <p>CRONOLOGÍA DEL PARTIDO</p>
              <h3>Eventos registrados</h3>
            </div>
            {events.length === 0 ? (
              <span className="noEvents">
                Todavía no hay eventos en este partido.
              </span>
            ) : (
              events.map((event) => (
                <article key={event.id}>
                  <b>{event.minute}&apos;</b>
                  <span>
                    {event.type === "Gol"
                      ? "⚽"
                      : event.type === "Cambio"
                        ? "↔"
                        : "▰"}
                  </span>
                  <div>
                    <strong>{event.type}</strong>
                    <small>
                      {event.player} ·{" "}
                      {event.team === "home"
                        ? selectedMatch.home
                        : selectedMatch.away}
                    </small>
                  </div>
                  {stage === "live" && (
                    <button
                      onClick={() => {
                        if (window.confirm("¿Anular este evento?"))
                          setEvents(events.filter((e) => e.id !== event.id));
                      }}
                    >
                      Anular
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
          {stage === "closed" && (
            <div className="closedNotice">
              <span>✓</span>
              <div>
                <b>Planilla cerrada correctamente</b>
                <p>
                  El resultado y las estadísticas ya están listos para revisión
                  del organizador.
                </p>
              </div>
              <button onClick={() => setSelectedMatch(null)}>
                Volver a mis partidos
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type ScheduledMatch = {
  id: number;
  round: number;
  phase: string;
  home: string;
  away: string;
  date: string;
  time: string;
  venue: string;
  status: "Programado" | "En vivo" | "Aplazado" | "Finalizado";
};

function CalendarManager({ notify }: { notify: (s: string) => void }) {
  const teamNames = [
    "Deportivo Bahía",
    "Real Ciénaga",
    "Atlético Caribe",
    "Unión Pescadores",
    "Jaguares del Mar",
    "Sporting Rodadero",
  ];
  const venues = [
    "Cancha La Castellana",
    "Estadio Municipal",
    "Cancha El Rodadero",
  ];
  const empty = {
    round: 1,
    phase: "Todos contra todos",
    home: teamNames[0],
    away: teamNames[1],
    date: "2026-08-15",
    time: "15:30",
    venue: venues[0],
    status: "Programado" as ScheduledMatch["status"],
  };
  const [scheduled, setScheduled] = useState<ScheduledMatch[]>([
    {
      id: 1,
      round: 9,
      phase: "Todos contra todos",
      home: "Deportivo Bahía",
      away: "Unión Pescadores",
      date: "2026-08-15",
      time: "15:30",
      venue: venues[0],
      status: "Programado",
    },
    {
      id: 2,
      round: 9,
      phase: "Todos contra todos",
      home: "Real Ciénaga",
      away: "Atlético Caribe",
      date: "2026-08-15",
      time: "17:30",
      venue: venues[0],
      status: "Programado",
    },
    {
      id: 3,
      round: 9,
      phase: "Todos contra todos",
      home: "Jaguares del Mar",
      away: "Sporting Rodadero",
      date: "2026-08-16",
      time: "16:00",
      venue: venues[1],
      status: "Programado",
    },
  ]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState(empty);
  const [roundFilter, setRoundFilter] = useState("Todas");
  const generate = () => {
    if (
      scheduled.length &&
      !window.confirm(
        "¿Estás seguro de generar un calendario nuevo? Los partidos programados actualmente serán reemplazados.",
      )
    )
      return;
    const pairs: { home: string; away: string }[] = [];
    for (let i = 0; i < teamNames.length; i++)
      for (let j = i + 1; j < teamNames.length; j++)
        pairs.push(
          Math.random() > 0.5
            ? { home: teamNames[i], away: teamNames[j] }
            : { home: teamNames[j], away: teamNames[i] },
        );
    const times = ["09:00", "11:00", "15:30", "17:30"];
    const generated = pairs.map((pair, index) => {
      const round = Math.floor(index / 3) + 1;
      const day = 2 + (round - 1) * 7 + (index % 3 > 1 ? 1 : 0);
      return {
        id: Date.now() + index,
        round,
        phase: "Todos contra todos",
        ...pair,
        date: `2026-09-${String(day).padStart(2, "0")}`,
        time: times[index % times.length],
        venue: venues[index % venues.length],
        status: "Programado" as const,
      };
    });
    setScheduled(generated);
    notify(`${generated.length} partidos generados automáticamente`);
  };
  const openNew = () => {
    setEditing(null);
    setDraft({
      ...empty,
      round: scheduled.length
        ? Math.max(...scheduled.map((m) => m.round)) + 1
        : 1,
    });
    setFormOpen(true);
  };
  const edit = (match: ScheduledMatch) => {
    setEditing(match.id);
    setDraft({ ...match });
    setFormOpen(true);
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.home === draft.away) {
      notify("Local y visitante deben ser equipos diferentes");
      return;
    }
    if (editing)
      setScheduled(
        scheduled.map((m) =>
          m.id === editing ? { ...draft, id: editing } : m,
        ),
      );
    else setScheduled([...scheduled, { ...draft, id: Date.now() }]);
    setFormOpen(false);
    notify(editing ? "Partido actualizado" : "Partido creado manualmente");
  };
  const remove = (match: ScheduledMatch) => {
    if (
      window.confirm(`¿Eliminar el partido ${match.home} vs ${match.away}?`)
    ) {
      setScheduled(scheduled.filter((m) => m.id !== match.id));
      notify("Partido eliminado");
    }
  };
  const rounds = [...new Set(scheduled.map((m) => m.round))].sort(
    (a, b) => a - b,
  );
  const visible = scheduled
    .filter((m) => roundFilter === "Todas" || m.round === Number(roundFilter))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <div className="calendarManager">
      <div className="calendarHero">
        <div>
          <p>PROGRAMACIÓN DEL TORNEO</p>
          <h3>Calendario y partidos</h3>
          <span>
            Genera el fixture automáticamente o modifica cada encuentro a tu
            gusto.
          </span>
        </div>
        <div>
          <button onClick={openNew}>＋ Crear partido manual</button>
          <button onClick={generate}>✦ Generar calendario automático</button>
        </div>
      </div>
      <div className="calendarSummary">
        <div>
          <b>{scheduled.length}</b>
          <span>Partidos programados</span>
        </div>
        <div>
          <b>{rounds.length}</b>
          <span>Fechas creadas</span>
        </div>
        <div>
          <b>{venues.length}</b>
          <span>Canchas disponibles</span>
        </div>
        <div>
          <b>{scheduled.filter((m) => m.status === "Aplazado").length}</b>
          <span>Por reprogramar</span>
        </div>
      </div>
      <div className="calendarTools">
        <div>
          <button
            className={roundFilter === "Todas" ? "active" : ""}
            onClick={() => setRoundFilter("Todas")}
          >
            Todas
          </button>
          {rounds.map((r) => (
            <button
              className={roundFilter === String(r) ? "active" : ""}
              onClick={() => setRoundFilter(String(r))}
              key={r}
            >
              Fecha {r}
            </button>
          ))}
        </div>
        <span>Los cambios se reflejarán en la página pública.</span>
      </div>
      {formOpen && (
        <form className="matchEditor" onSubmit={save}>
          <div className="matchEditorHead">
            <div>
              <p>{editing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}</p>
              <h4>
                {editing
                  ? "Modificar programación"
                  : "Crear encuentro manualmente"}
              </h4>
            </div>
            <button type="button" onClick={() => setFormOpen(false)}>
              ×
            </button>
          </div>
          <div className="matchFormGrid">
            <label>
              Fase
              <select
                value={draft.phase}
                onChange={(e) => setDraft({ ...draft, phase: e.target.value })}
              >
                <option>Todos contra todos</option>
                <option>Fase de grupos</option>
                <option>Cuartos de final</option>
                <option>Semifinal</option>
                <option>Final</option>
              </select>
            </label>
            <label>
              Fecha / jornada
              <input
                type="number"
                min="1"
                value={draft.round}
                onChange={(e) =>
                  setDraft({ ...draft, round: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Equipo local
              <select
                value={draft.home}
                onChange={(e) => setDraft({ ...draft, home: e.target.value })}
              >
                {teamNames.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Equipo visitante
              <select
                value={draft.away}
                onChange={(e) => setDraft({ ...draft, away: e.target.value })}
              >
                {teamNames.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Día
              <input
                required
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label>
              Hora
              <input
                required
                type="time"
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              />
            </label>
            <label>
              Cancha
              <select
                value={draft.venue}
                onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
              >
                {venues.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as ScheduledMatch["status"],
                  })
                }
              >
                <option>Programado</option>
                <option>En vivo</option>
                <option>Aplazado</option>
                <option>Finalizado</option>
              </select>
            </label>
          </div>
          <div className="matchEditorActions">
            <button type="button" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button>{editing ? "Guardar cambios" : "Crear partido"}</button>
          </div>
        </form>
      )}
      <div className="adminMatchList">
        {visible.map((match) => (
          <article key={match.id}>
            <div className="matchRound">
              <span>FECHA</span>
              <b>{String(match.round).padStart(2, "0")}</b>
              <small>{match.phase}</small>
            </div>
            <div className="adminFixture">
              <span>
                <b>{match.home}</b>
                <small>LOCAL</small>
              </span>
              <div>
                <strong>{match.time}</strong>
                <i>VS</i>
              </div>
              <span>
                <b>{match.away}</b>
                <small>VISITANTE</small>
              </span>
            </div>
            <div className="matchPlace">
              <b>
                {new Date(`${match.date}T12:00:00`).toLocaleDateString(
                  "es-CO",
                  { weekday: "short", day: "2-digit", month: "short" },
                )}
              </b>
              <span>📍 {match.venue}</span>
            </div>
            <span
              className={`matchStatus ${match.status.toLowerCase().replace(" ", "")}`}
            >
              {match.status}
            </span>
            <div className="matchAdminActions">
              <button onClick={() => edit(match)}>✎ Editar</button>
              <button onClick={() => remove(match)}>⌫</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

type TeamRecord = {
  id: number;
  name: string;
  code: string;
  color: string;
  city: string;
  representative: string;
  phone: string;
  email: string;
  coach: string;
  players: number;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  paid: number;
  fee: number;
  updated: string;
};

function TeamsManager({
  notify,
  applications,
  setApplications,
  onManualRegistration,
}: {
  notify: (s: string) => void;
  applications: TeamApplication[];
  setApplications: React.Dispatch<React.SetStateAction<TeamApplication[]>>;
  onManualRegistration: () => void;
}) {
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [records, setRecords] = useState<TeamRecord[]>([
    {
      id: 1,
      name: "Deportivo Bahía",
      code: "DB",
      color: "#f6c445",
      city: "Santa Marta",
      representative: "Andrés Salcedo",
      phone: "300 418 2056",
      email: "bahia@equipo.com",
      coach: "Juan Carlos Díaz",
      players: 22,
      status: "Aprobado",
      paid: 600000,
      fee: 850000,
      updated: "Hoy, 9:42 AM",
    },
    {
      id: 2,
      name: "Real Ciénaga",
      code: "RC",
      color: "#cf4539",
      city: "Ciénaga",
      representative: "Miguel Herrera",
      phone: "315 740 1182",
      email: "realcienaga@equipo.com",
      coach: "Sergio Mendoza",
      players: 20,
      status: "Pendiente",
      paid: 350000,
      fee: 850000,
      updated: "Ayer, 5:18 PM",
    },
    {
      id: 3,
      name: "Atlético Caribe",
      code: "AC",
      color: "#21a879",
      city: "Santa Marta",
      representative: "Óscar Gómez",
      phone: "301 902 4470",
      email: "caribe@equipo.com",
      coach: "Nelson Polo",
      players: 23,
      status: "Aprobado",
      paid: 850000,
      fee: 850000,
      updated: "12 ago, 2:06 PM",
    },
    {
      id: 4,
      name: "Unión Pescadores",
      code: "UP",
      color: "#4778d8",
      city: "Taganga",
      representative: "Luis Martínez",
      phone: "320 115 8834",
      email: "union@equipo.com",
      coach: "Héctor Rojas",
      players: 19,
      status: "Pendiente",
      paid: 0,
      fee: 850000,
      updated: "11 ago, 10:25 AM",
    },
    {
      id: 5,
      name: "Jaguares del Mar",
      code: "JM",
      color: "#8d5ab5",
      city: "Gaira",
      representative: "Daniel Acosta",
      phone: "310 665 2019",
      email: "jaguares@equipo.com",
      coach: "Ramiro Pacheco",
      players: 21,
      status: "Rechazado",
      paid: 100000,
      fee: 850000,
      updated: "10 ago, 4:30 PM",
    },
  ]);
  const money = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  const updateStatus = (id: number, status: TeamRecord["status"]) => {
    const team = records.find((t) => t.id === id);
    if (
      !team ||
      !window.confirm(
        `¿Confirmas que deseas marcar a ${team.name} como ${status.toLowerCase()}?`,
      )
    )
      return;
    setRecords(records.map((t) => (t.id === id ? { ...t, status } : t)));
    notify(`${team.name} quedó ${status.toLowerCase()}`);
  };
  const visible = records.filter(
    (t) =>
      (filter === "Todos" || t.status === filter) &&
      `${t.name} ${t.representative} ${t.coach}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const current = records.find((t) => t.id === selected);
  if (current)
    return (
      <TeamDetail
        team={current}
        onBack={() => setSelected(null)}
        onStatus={(status) => updateStatus(current.id, status)}
        money={money}
        notify={notify}
      />
    );
  return (
    <div className="teamsManager">
      <div className="teamsTop">
        <div>
          <p>EQUIPOS DEL TORNEO</p>
          <h3>Copa La Playa 2026</h3>
          <span>Revisa inscripciones, pagos y plantillas registradas.</span>
        </div>
        <button className="green" onClick={onManualRegistration}>
          ＋ Registrar equipo
        </button>
      </div>
      {applications.length > 0 && (
        <div className="incomingApplications">
          <div>
            <p>SOLICITUDES DE INSCRIPCIÓN</p>
            <h4>Representantes esperando respuesta</h4>
          </div>
          {applications.map((app) => (
            <article key={app.id}>
              <div>
                <span className="applicationBall">⚽</span>
                <div>
                  <b>{app.teamName}</b>
                  <p>
                    {app.representative} · {app.city} · {app.source}
                  </p>
                </div>
              </div>
              <span className={`teamStatus ${app.status.toLowerCase()}`}>
                {app.status}
              </span>
              <div>
                {app.status !== "Aprobado" && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Aprobar la solicitud de ${app.teamName}?`,
                        )
                      ) {
                        setApplications(
                          applications.map((a) =>
                            a.id === app.id ? { ...a, status: "Aprobado" } : a,
                          ),
                        );
                        notify(
                          `${app.teamName} puede completar su inscripción`,
                        );
                      }
                    }}
                  >
                    ✓ Aprobar
                  </button>
                )}
                {app.status !== "Rechazado" && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Rechazar la solicitud de ${app.teamName}?`,
                        )
                      ) {
                        setApplications(
                          applications.map((a) =>
                            a.id === app.id ? { ...a, status: "Rechazado" } : a,
                          ),
                        );
                        notify(`Solicitud de ${app.teamName} rechazada`);
                      }
                    }}
                  >
                    × Rechazar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="teamMetrics">
        <div>
          <b>
            {records.length +
              applications.filter((a) => a.profileComplete).length}
          </b>
          <span>Registrados</span>
        </div>
        <div>
          <b>
            {records.filter((t) => t.status === "Aprobado").length +
              applications.filter((a) => a.status === "Aprobado").length}
          </b>
          <span>Aprobados</span>
        </div>
        <div>
          <b>
            {records.filter((t) => t.status === "Pendiente").length +
              applications.filter((a) => a.status === "Pendiente").length}
          </b>
          <span>Pendientes</span>
        </div>
        <div>
          <b>
            {records.reduce((s, t) => s + t.players, 0) +
              applications.reduce((s, a) => s + a.players.length, 0)}
          </b>
          <span>Jugadores</span>
        </div>
      </div>
      <div className="teamFilters">
        <div>
          {["Todos", "Pendiente", "Aprobado", "Rechazado"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== "Todos" && (
                <span>{records.filter((t) => t.status === f).length}</span>
              )}
            </button>
          ))}
        </div>
        <input
          aria-label="Buscar equipos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar equipo, representante o técnico..."
        />
      </div>
      <div className="teamsTable">
        <div className="teamsTableHead">
          <span>EQUIPO</span>
          <span>REPRESENTANTE</span>
          <span>PLANTILLA</span>
          <span>PAGO</span>
          <span>ESTADO</span>
          <span>ACCIONES</span>
        </div>
        {visible.map((team) => (
          <article key={team.id}>
            <div className="teamPrimary">
              <span
                className="crest crestSmall"
                style={{ background: team.color }}
              >
                {team.code}
              </span>
              <div>
                <h4>{team.name}</h4>
                <p>
                  {team.city} · Actualizado {team.updated}
                </p>
              </div>
            </div>
            <div className="representativeCell">
              <b>{team.representative}</b>
              <span>{team.phone}</span>
            </div>
            <div className="rosterCell">
              <b>{team.players}</b>
              <span>jugadores</span>
            </div>
            <div className="teamPayment">
              <b>{money(team.paid)}</b>
              <span>de {money(team.fee)}</span>
              <div>
                <i style={{ width: `${(team.paid / team.fee) * 100}%` }} />
              </div>
            </div>
            <span className={`teamStatus ${team.status.toLowerCase()}`}>
              {team.status}
            </span>
            <div className="rowActions">
              <button onClick={() => setSelected(team.id)}>Ver equipo</button>
              {team.status === "Pendiente" && (
                <button
                  className="approveMini"
                  onClick={() => updateStatus(team.id, "Aprobado")}
                >
                  ✓
                </button>
              )}
              <button>•••</button>
            </div>
          </article>
        ))}
        {visible.length === 0 && (
          <div className="noTeams">
            No se encontraron equipos con estos filtros.
          </div>
        )}
      </div>
    </div>
  );
}

function TeamDetail({
  team,
  onBack,
  onStatus,
  money,
  notify,
}: {
  team: TeamRecord;
  onBack: () => void;
  onStatus: (s: TeamRecord["status"]) => void;
  money: (n: number) => string;
  notify: (s: string) => void;
}) {
  const roster = [
    { n: "Mateo Cárdenas", no: 9, p: "Delantero", img: players[0].img },
    { n: "Diego Pacheco", no: 10, p: "Volante", img: players[2].img },
    { n: "Samuel Rojas", no: 7, p: "Extremo", img: players[1].img },
    { n: "Nicolás Martínez", no: 4, p: "Defensa", img: players[3].img },
  ];
  return (
    <div className="teamDetail">
      <button className="backLink" onClick={onBack}>
        ← Volver a equipos
      </button>
      <div className="teamDetailHero">
        <span className="crest" style={{ background: team.color }}>
          {team.code}
        </span>
        <div>
          <p>FICHA DEL EQUIPO</p>
          <h3>{team.name}</h3>
          <span>
            {team.city} · {team.players} jugadores registrados
          </span>
        </div>
        <span className={`teamStatus ${team.status.toLowerCase()}`}>
          {team.status}
        </span>
        <div className="detailActions">
          {team.status !== "Aprobado" && (
            <button onClick={() => onStatus("Aprobado")}>
              ✓ Aprobar equipo
            </button>
          )}
          {team.status !== "Rechazado" && (
            <button onClick={() => onStatus("Rechazado")}>× Rechazar</button>
          )}
        </div>
      </div>
      <div className="teamDetailGrid">
        <section>
          <div className="detailSectionHead">
            <div>
              <p>INFORMACIÓN GENERAL</p>
              <h4>Responsables del equipo</h4>
            </div>
            <button onClick={() => notify("Edición del equipo habilitada")}>
              Editar
            </button>
          </div>
          <div className="contactCards">
            <div>
              <span>REPRESENTANTE</span>
              <b>{team.representative}</b>
              <p>📱 {team.phone}</p>
              <p>✉ {team.email}</p>
            </div>
            <div>
              <span>DIRECTOR TÉCNICO</span>
              <b>{team.coach}</b>
              <p>Responsable deportivo</p>
              <p>✓ Perfil registrado</p>
            </div>
          </div>
        </section>
        <aside>
          <p>ESTADO FINANCIERO</p>
          <h4>{money(team.paid)}</h4>
          <span>abonados de {money(team.fee)}</span>
          <div>
            <i style={{ width: `${(team.paid / team.fee) * 100}%` }} />
          </div>
          <b>Saldo pendiente: {money(team.fee - team.paid)}</b>
          <button onClick={() => notify(`Registrar abono para ${team.name}`)}>
            ＋ Registrar abono
          </button>
        </aside>
      </div>
      <section className="detailRoster">
        <div className="detailSectionHead">
          <div>
            <p>PLANTILLA REGISTRADA</p>
            <h4>Jugadores</h4>
          </div>
          <button onClick={() => notify("Abriendo plantilla completa")}>
            Ver los {team.players} jugadores →
          </button>
        </div>
        <div>
          {roster.map((player) => (
            <article key={player.n}>
              <img src={player.img} alt={player.n} />
              <span>#{player.no}</span>
              <div>
                <b>{player.n}</b>
                <p>{player.p}</p>
              </div>
              <em>✓ Verificado</em>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeamRegistrationFlow({
  mode,
  applications,
  setApplications,
  close,
  notify,
}: {
  mode: "Representante" | "Organizador";
  applications: TeamApplication[];
  setApplications: React.Dispatch<React.SetStateAction<TeamApplication[]>>;
  close: () => void;
  notify: (s: string) => void;
}) {
  const current = [...applications].reverse().find((a) => a.source === mode);
  const [request, setRequest] = useState({
    teamName: "",
    representative: "",
    phone: "",
    email: "",
    city: "",
  });
  const [profile, setProfile] = useState({
    teamName: current?.teamName || "",
    representative: current?.representative || "",
    phone: current?.phone || "",
    email: current?.email || "",
    city: current?.city || "",
    coach: current?.coach || "",
    shirtColor: current?.shirtColor || "#0b6248",
    shortsColor: current?.shortsColor || "#ffffff",
    socksColor: current?.socksColor || "#0b6248",
  });
  const [player, setPlayer] = useState({
    name: "",
    document: "",
    number: "",
    position: "Delantero",
    photo: "",
  });
  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const application: TeamApplication = {
      id: Date.now(),
      ...request,
      status: "Pendiente",
      coach: "",
      shirtColor: "#0b6248",
      shortsColor: "#ffffff",
      socksColor: "#0b6248",
      profileComplete: false,
      players: [],
      source: "Representante",
    };
    setApplications([...applications, application]);
    notify("Solicitud enviada al organizador");
  };
  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (current) {
      setApplications(
        applications.map((a) =>
          a.id === current.id ? { ...a, ...profile, profileComplete: true } : a,
        ),
      );
    } else {
      setApplications([
        ...applications,
        {
          id: Date.now(),
          ...profile,
          status: "Aprobado",
          profileComplete: true,
          players: [],
          source: "Organizador",
        },
      ]);
    }
    notify("Información del equipo guardada");
  };
  const active = [...applications].reverse().find((a) => a.source === mode);
  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    const newPlayer = { ...player, id: Date.now() };
    setApplications(
      applications.map((a) =>
        a.id === active.id ? { ...a, players: [...a.players, newPlayer] } : a,
      ),
    );
    setPlayer({
      name: "",
      document: "",
      number: "",
      position: "Delantero",
      photo: "",
    });
    notify(`${player.name} fue agregado a la plantilla`);
  };
  const registration = active || current;
  return (
    <div className="registrationBack" role="dialog" aria-modal="true">
      <div className="registrationModal">
        <button className="closeRegistration" onClick={close}>
          ×
        </button>
        <aside>
          <div className="brand">
            <span className="brandBall">●</span>
            <span>
              <strong>LIGUITA</strong>
            </span>
          </div>
          <p>
            {mode === "Representante"
              ? "INSCRIPCIÓN AL TORNEO"
              : "REGISTRO DEL ORGANIZADOR"}
          </p>
          <h2>
            Copa La Playa
            <br />
            2026
          </h2>
          <div className="registrationSteps">
            <span className={!registration ? "active" : "done"}>
              <b>1</b> Solicitud de cupo
            </span>
            <span
              className={
                registration?.status === "Aprobado" &&
                !registration.profileComplete
                  ? "active"
                  : registration?.profileComplete
                    ? "done"
                    : ""
              }
            >
              <b>2</b> Datos del equipo
            </span>
            <span className={registration?.profileComplete ? "active" : ""}>
              <b>3</b> Jugadores
            </span>
          </div>
          <small>
            Valor de inscripción
            <br />
            <b>$850.000 por equipo</b>
          </small>
        </aside>
        <section>
          {!registration && mode === "Representante" && (
            <form className="registrationForm" onSubmit={submitRequest}>
              <div className="registrationHead">
                <p>PASO 1 DE 3</p>
                <h3>Solicitar inscripción</h3>
                <span>
                  Envía tus datos al organizador. Cuando te apruebe podrás
                  completar el equipo.
                </span>
              </div>
              <div className="formRow">
                <div className="field">
                  <label>Nombre del equipo *</label>
                  <input
                    required
                    value={request.teamName}
                    onChange={(e) =>
                      setRequest({ ...request, teamName: e.target.value })
                    }
                    placeholder="Ej. Los Titanes FC"
                  />
                </div>
                <div className="field">
                  <label>Ciudad o barrio *</label>
                  <input
                    required
                    value={request.city}
                    onChange={(e) =>
                      setRequest({ ...request, city: e.target.value })
                    }
                    placeholder="Santa Marta"
                  />
                </div>
              </div>
              <div className="field full">
                <label>Nombre del representante *</label>
                <input
                  required
                  value={request.representative}
                  onChange={(e) =>
                    setRequest({ ...request, representative: e.target.value })
                  }
                />
              </div>
              <div className="formRow">
                <div className="field">
                  <label>WhatsApp *</label>
                  <input
                    required
                    type="tel"
                    value={request.phone}
                    onChange={(e) =>
                      setRequest({ ...request, phone: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Correo electrónico *</label>
                  <input
                    required
                    type="email"
                    value={request.email}
                    onChange={(e) =>
                      setRequest({ ...request, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="registrationActions">
                <button type="button" onClick={close}>
                  Cancelar
                </button>
                <button>Enviar solicitud →</button>
              </div>
            </form>
          )}
          {registration && registration.status !== "Aprobado" && (
            <div className="requestStatus">
              <span>{registration.status === "Pendiente" ? "⌛" : "×"}</span>
              <p>ESTADO DE LA SOLICITUD</p>
              <h3>
                {registration.status === "Pendiente"
                  ? "Esperando aprobación"
                  : "Solicitud rechazada"}
              </h3>
              <b>{registration.teamName}</b>
              <p>
                {registration.status === "Pendiente"
                  ? "El organizador revisará tus datos. Vuelve a esta opción después de recibir la aprobación."
                  : "Comunícate con el organizador para conocer el motivo o enviar una nueva solicitud."}
              </p>
              <button onClick={close}>Entendido</button>
            </div>
          )}
          {((mode === "Organizador" && !registration) ||
            (registration?.status === "Aprobado" &&
              !registration.profileComplete)) && (
            <form className="registrationForm" onSubmit={saveProfile}>
              <div className="registrationHead">
                <p>PASO 2 DE 3</p>
                <h3>Registrar el equipo</h3>
                <span>
                  Completa la identidad deportiva y los colores del uniforme
                  principal.
                </span>
              </div>
              <div className="formRow">
                <div className="field">
                  <label>Nombre del equipo *</label>
                  <input
                    required
                    value={profile.teamName}
                    onChange={(e) =>
                      setProfile({ ...profile, teamName: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Ciudad o barrio *</label>
                  <input
                    required
                    value={profile.city}
                    onChange={(e) =>
                      setProfile({ ...profile, city: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="formRow">
                <div className="field">
                  <label>Representante *</label>
                  <input
                    required
                    value={profile.representative}
                    onChange={(e) =>
                      setProfile({ ...profile, representative: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Director técnico *</label>
                  <input
                    required
                    value={profile.coach}
                    onChange={(e) =>
                      setProfile({ ...profile, coach: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="formRow">
                <div className="field">
                  <label>WhatsApp *</label>
                  <input
                    required
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Correo electrónico *</label>
                  <input
                    required
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="uniformSection">
                <div>
                  <p>UNIFORME PRINCIPAL</p>
                  <h4>Selecciona los colores</h4>
                </div>
                <div className="uniformColors">
                  <label>
                    <input
                      type="color"
                      value={profile.shirtColor}
                      onChange={(e) =>
                        setProfile({ ...profile, shirtColor: e.target.value })
                      }
                    />
                    <span>
                      Camisa<b>{profile.shirtColor}</b>
                    </span>
                  </label>
                  <label>
                    <input
                      type="color"
                      value={profile.shortsColor}
                      onChange={(e) =>
                        setProfile({ ...profile, shortsColor: e.target.value })
                      }
                    />
                    <span>
                      Pantaloneta<b>{profile.shortsColor}</b>
                    </span>
                  </label>
                  <label>
                    <input
                      type="color"
                      value={profile.socksColor}
                      onChange={(e) =>
                        setProfile({ ...profile, socksColor: e.target.value })
                      }
                    />
                    <span>
                      Medias<b>{profile.socksColor}</b>
                    </span>
                  </label>
                  <div className="uniformPreview">
                    <i style={{ background: profile.shirtColor }}>▾</i>
                    <i style={{ background: profile.shortsColor }} />
                    <i style={{ background: profile.socksColor }} />
                  </div>
                </div>
              </div>
              <div className="registrationActions">
                <button type="button" onClick={close}>
                  Guardar después
                </button>
                <button>Guardar y registrar jugadores →</button>
              </div>
            </form>
          )}
          {registration?.profileComplete && (
            <div className="rosterRegistration">
              <div className="registrationHead">
                <p>PASO 3 DE 3</p>
                <h3>Plantilla de jugadores</h3>
                <span>
                  {registration.teamName} · {registration.players.length}{" "}
                  jugadores registrados
                </span>
              </div>
              <form className="playerAddForm" onSubmit={addPlayer}>
                <label className="playerPhoto">
                  {player.photo ? (
                    <img src={player.photo} alt="Foto del jugador" />
                  ) : (
                    <span>＋ Foto</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        setPlayer({
                          ...player,
                          photo: URL.createObjectURL(file),
                        });
                    }}
                  />
                </label>
                <div className="field">
                  <label>Nombre completo *</label>
                  <input
                    required
                    value={player.name}
                    onChange={(e) =>
                      setPlayer({ ...player, name: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Documento *</label>
                  <input
                    required
                    value={player.document}
                    onChange={(e) =>
                      setPlayer({ ...player, document: e.target.value })
                    }
                  />
                </div>
                <div className="field smallField">
                  <label>Dorsal *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="99"
                    value={player.number}
                    onChange={(e) =>
                      setPlayer({ ...player, number: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Posición *</label>
                  <select
                    value={player.position}
                    onChange={(e) =>
                      setPlayer({ ...player, position: e.target.value })
                    }
                  >
                    <option>Arquero</option>
                    <option>Defensa</option>
                    <option>Volante</option>
                    <option>Delantero</option>
                  </select>
                </div>
                <button>＋ Agregar</button>
              </form>
              <div className="registeredRoster">
                {registration.players.map((p) => (
                  <article key={p.id}>
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} />
                    ) : (
                      <span>{p.number}</span>
                    )}
                    <div>
                      <b>{p.name}</b>
                      <p>
                        #{p.number} · {p.position} · CC {p.document}
                      </p>
                    </div>
                    <em>Registrado</em>
                  </article>
                ))}
                {registration.players.length === 0 && (
                  <div>
                    Aún no hay jugadores. Agrega el primero usando el
                    formulario.
                  </div>
                )}
              </div>
              <div className="registrationActions">
                <button onClick={close}>Guardar y salir</button>
                <button
                  onClick={() => {
                    notify("Plantilla enviada al organizador para revisión");
                    close();
                  }}
                >
                  Enviar plantilla para aprobación →
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type ManagedTournament = {
  id: number;
  name: string;
  format: string;
  image: string;
  status: string;
  teams: number;
  slug: string;
  startDate: string;
  teamFee: number;
  qualifiers: number;
};

function TournamentManager({ notify }: { notify: (s: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tournaments, setTournaments] = useState<ManagedTournament[]>([
    {
      id: 1,
      name: "Copa La Playa 2026",
      format: "Todos contra todos + mata-mata",
      image:
        "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=900&q=80",
      status: "En curso",
      teams: 16,
      slug: "copa-la-playa-2026",
      startDate: "2026-08-02",
      teamFee: 850000,
      qualifiers: 4,
    },
  ]);
  if (creating)
    return (
      <NewTournamentForm
        notify={notify}
        existingNames={tournaments.map((t) => t.name)}
        onCancel={() => setCreating(false)}
        onCreated={(t) => {
          setTournaments([
            ...tournaments,
            {
              ...t,
              id: Date.now(),
              status: "En preparación",
              teams: 0,
              qualifiers: 4,
            },
          ]);
          setCreating(false);
        }}
      />
    );
  const selected = tournaments.find((t) => t.id === selectedId);
  if (selected)
    return (
      <TournamentAdministration
        tournament={selected}
        onBack={() => setSelectedId(null)}
        onStatusChange={(status) =>
          setTournaments(
            tournaments.map((t) =>
              t.id === selected.id ? { ...t, status } : t,
            ),
          )
        }
        onQualifiersChange={(qualifiers) => {
          setTournaments(
            tournaments.map((t) =>
              t.id === selected.id ? { ...t, qualifiers } : t,
            ),
          );
          if (selected.id === 1)
            window.dispatchEvent(
              new CustomEvent("qualifiers-change", { detail: qualifiers }),
            );
        }}
        notify={notify}
      />
    );
  return (
    <div className="tournamentManager">
      <div className="tournamentToolbar">
        <div>
          <p>MIS CAMPEONATOS</p>
          <h3>Torneos creados</h3>
          <span>Administra cada campeonato desde un solo lugar.</span>
        </div>
        <button className="green" onClick={() => setCreating(true)}>
          ＋ Crear torneo
        </button>
      </div>
      <div className="tournamentList">
        {tournaments.map((t) => (
          <article key={t.id}>
            <div
              className="tournamentThumb"
              style={{ backgroundImage: `url(${t.image})` }}
            >
              {!t.image && "⚽"}
              <span>{t.status}</span>
            </div>
            <div className="tournamentInfo">
              <small>{t.format}</small>
              <h3>{t.name}</h3>
              <p>liguita.co/{t.slug}</p>
              <div>
                <span>
                  📅 Inicia{" "}
                  <b>
                    {new Date(`${t.startDate}T12:00:00`).toLocaleDateString(
                      "es-CO",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )}
                  </b>
                </span>
                <span>
                  💰{" "}
                  <b>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0,
                    }).format(t.teamFee)}
                  </b>{" "}
                  por equipo
                </span>
                <span>
                  ♟ <b>{t.teams}</b> equipos
                </span>
              </div>
            </div>
            <div className="tournamentButtons">
              <button onClick={() => setSelectedId(t.id)}>Administrar →</button>
              <button aria-label={`Más opciones para ${t.name}`}>•••</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

type RegisteredTeam = {
  id: number;
  name: string;
  coach: string;
  players: number;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  fee: number;
  paid: number;
  code: string;
};

function TournamentAdministration({
  tournament,
  onBack,
  onStatusChange,
  onQualifiersChange,
  notify,
}: {
  tournament: ManagedTournament;
  onBack: () => void;
  onStatusChange: (s: string) => void;
  onQualifiersChange: (n: number) => void;
  notify: (s: string) => void;
}) {
  const [registered, setRegistered] = useState<RegisteredTeam[]>([
    {
      id: 1,
      name: "Deportivo Bahía",
      coach: "Juan Carlos Díaz",
      players: 22,
      status: "Aprobado",
      fee: tournament.teamFee,
      paid: Math.min(600000, tournament.teamFee),
      code: "DB",
    },
    {
      id: 2,
      name: "Real Ciénaga",
      coach: "Miguel Herrera",
      players: 20,
      status: "Pendiente",
      fee: tournament.teamFee,
      paid: Math.min(350000, tournament.teamFee),
      code: "RC",
    },
    {
      id: 3,
      name: "Atlético Caribe",
      coach: "Óscar Gómez",
      players: 23,
      status: "Aprobado",
      fee: tournament.teamFee,
      paid: tournament.teamFee,
      code: "AC",
    },
    {
      id: 4,
      name: "Unión Pescadores",
      coach: "Luis Martínez",
      players: 19,
      status: "Pendiente",
      fee: tournament.teamFee,
      paid: 0,
      code: "UP",
    },
  ]);
  const [paymentTeam, setPaymentTeam] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [qualifierDraft, setQualifierDraft] = useState(tournament.qualifiers);
  const [matchRules, setMatchRules] = useState({
    starters: 11,
    maxSubstitutes: 7,
    allowedChanges: 5,
  });
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lasuperliga-match-rules");
      if (saved) setMatchRules(JSON.parse(saved));
    } catch {}
  }, []);
  const money = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  const changeTeam = (id: number, status: RegisteredTeam["status"]) => {
    const team = registered.find((t) => t.id === id);
    if (
      !team ||
      !window.confirm(
        `¿Estás seguro de marcar a ${team.name} como ${status.toLowerCase()}?`,
      )
    )
      return;
    setRegistered(registered.map((t) => (t.id === id ? { ...t, status } : t)));
    notify(`${team.name}: ${status}`);
  };
  const changeStatus = (status: string) => {
    if (status === tournament.status) return;
    if (
      !window.confirm(
        `¿Estás seguro de cambiar el estado de “${tournament.name}” de “${tournament.status}” a “${status}”?`,
      )
    )
      return;
    onStatusChange(status);
    notify(`El torneo ahora está ${status.toLowerCase()}`);
  };
  const addPayment = (id: number) => {
    const value = Number(amount);
    const team = registered.find((t) => t.id === id);
    if (!team || value <= 0) return;
    setRegistered(
      registered.map((t) =>
        t.id === id ? { ...t, paid: Math.min(t.fee, t.paid + value) } : t,
      ),
    );
    setPaymentTeam(null);
    setAmount("");
    notify(`Abono de ${money(value)} registrado para ${team.name}`);
  };
  const total = registered.reduce((sum, t) => sum + t.fee, 0),
    paid = registered.reduce((sum, t) => sum + t.paid, 0);
  return (
    <div className="tournamentAdmin">
      <button className="backLink" onClick={onBack}>
        ← Volver a mis torneos
      </button>
      <div className="adminTournamentTitle">
        <div>
          <p>ADMINISTRAR TORNEO</p>
          <h3>{tournament.name}</h3>
          <span>{tournament.format}</span>
        </div>
        <div className="tournamentState">
          <small>ESTADO DEL TORNEO</small>
          <div>
            {["En preparación", "En curso", "Finalizado"].map((s) => (
              <button
                key={s}
                className={tournament.status === s ? "active" : ""}
                onClick={() => changeStatus(s)}
              >
                {tournament.status === s && "● "}
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="qualificationConfig">
        <div>
          <span>CLASIFICACIÓN A LA SIGUIENTE FASE</span>
          <h4>¿Cuántos equipos clasifican?</h4>
          <p>
            La tabla marcará en verde los clasificados y en gris los equipos por
            debajo del corte.
          </p>
        </div>
        <div className="qualifierControl">
          <button
            onClick={() => setQualifierDraft(Math.max(1, qualifierDraft - 1))}
          >
            −
          </button>
          <input
            aria-label="Cantidad de equipos clasificados"
            type="number"
            min="1"
            max="16"
            value={qualifierDraft}
            onChange={(e) =>
              setQualifierDraft(
                Math.max(1, Math.min(16, Number(e.target.value))),
              )
            }
          />
          <button
            onClick={() => setQualifierDraft(Math.min(16, qualifierDraft + 1))}
          >
            ＋
          </button>
          <span>de 16 equipos</span>
          <button
            className="saveQualifier"
            disabled={qualifierDraft === tournament.qualifiers}
            onClick={() => {
              onQualifiersChange(qualifierDraft);
              notify(`Ahora clasifican ${qualifierDraft} equipos`);
            }}
          >
            Guardar cambio
          </button>
        </div>
        <div className="qualificationLegend">
          <span>
            <i /> Puestos 1—{qualifierDraft}
            <b>Clasifican</b>
          </span>
          <span>
            <i /> Puestos {qualifierDraft + 1}—16<b>No clasifican</b>
          </span>
        </div>
      </div>
      <div className="matchRulesConfig">
        <div>
          <span>REGLAS DE PLANILLAJE</span>
          <h4>Jugadores y sustituciones</h4>
          <p>
            Esta configuración determina quiénes aparecen como titulares y
            suplentes en cada partido.
          </p>
        </div>
        <label>
          Jugadores en cancha
          <select
            value={matchRules.starters}
            onChange={(e) =>
              setMatchRules({ ...matchRules, starters: Number(e.target.value) })
            }
          >
            {[11, 9, 8, 7, 6, 5].map((n) => (
              <option value={n} key={n}>
                Fútbol {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Máximo de suplentes
          <input
            type="number"
            min="0"
            max="15"
            value={matchRules.maxSubstitutes}
            onChange={(e) =>
              setMatchRules({
                ...matchRules,
                maxSubstitutes: Math.max(0, Number(e.target.value)),
              })
            }
          />
        </label>
        <label>
          Cambios permitidos
          <input
            type="number"
            min="0"
            max="15"
            value={matchRules.allowedChanges}
            onChange={(e) =>
              setMatchRules({
                ...matchRules,
                allowedChanges: Math.max(0, Number(e.target.value)),
              })
            }
          />
        </label>
        <button
          onClick={() => {
            window.localStorage.setItem(
              "lasuperliga-match-rules",
              JSON.stringify(matchRules),
            );
            notify(
              `Reglas guardadas: fútbol ${matchRules.starters}, ${matchRules.maxSubstitutes} suplentes y ${matchRules.allowedChanges} cambios`,
            );
          }}
        >
          Guardar reglas
        </button>
      </div>
      <div className="financeSummary">
        <div>
          <span>VALOR TOTAL INSCRIPCIONES</span>
          <b>{money(total)}</b>
        </div>
        <div>
          <span>TOTAL ABONADO</span>
          <b>{money(paid)}</b>
        </div>
        <div>
          <span>SALDO PENDIENTE</span>
          <b>{money(total - paid)}</b>
        </div>
        <div>
          <span>EQUIPOS APROBADOS</span>
          <b>
            {registered.filter((t) => t.status === "Aprobado").length} /{" "}
            {registered.length}
          </b>
        </div>
      </div>
      <div className="registeredHeader">
        <div>
          <p>EQUIPOS REGISTRADOS</p>
          <h3>Solicitudes e inscripciones</h3>
        </div>
        <span>
          {registered.filter((t) => t.status === "Pendiente").length} pendientes
          de revisión
        </span>
      </div>
      <div className="registeredTeams">
        {registered.map((team) => (
          <article key={team.id}>
            <div className="registeredIdentity">
              <Crest code={team.code} small />
              <div>
                <h4>{team.name}</h4>
                <p>
                  DT: {team.coach} · {team.players} jugadores
                </p>
              </div>
            </div>
            <div className="paymentProgress">
              <span>
                <b>{money(team.paid)}</b> de {money(team.fee)}
              </span>
              <div>
                <i
                  style={{
                    width: `${Math.min(100, (team.paid / team.fee) * 100)}%`,
                  }}
                />
              </div>
              <small>Saldo: {money(team.fee - team.paid)}</small>
            </div>
            <span className={`teamStatus ${team.status.toLowerCase()}`}>
              {team.status}
            </span>
            <div className="teamActions">
              {team.status !== "Aprobado" && (
                <button
                  className="approveBtn"
                  onClick={() => changeTeam(team.id, "Aprobado")}
                >
                  ✓ Aprobar
                </button>
              )}
              {team.status !== "Rechazado" && (
                <button
                  className="rejectBtn"
                  onClick={() => changeTeam(team.id, "Rechazado")}
                >
                  × Rechazar
                </button>
              )}
              <button
                className="payBtn"
                onClick={() =>
                  setPaymentTeam(paymentTeam === team.id ? null : team.id)
                }
              >
                ＋ Abono
              </button>
            </div>
            {paymentTeam === team.id && (
              <div className="paymentForm">
                <label>Nuevo abono para {team.name}</label>
                <div>
                  <span>$</span>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    max={team.fee - team.paid}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Valor del abono"
                  />
                  <button onClick={() => addPayment(team.id)}>
                    Registrar pago
                  </button>
                  <button onClick={() => setPaymentTeam(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function NewTournamentForm({
  notify,
  onCancel,
  onCreated,
  existingNames,
}: {
  notify: (s: string) => void;
  onCancel: () => void;
  onCreated: (
    t: Omit<ManagedTournament, "id" | "status" | "teams" | "qualifiers">,
  ) => void;
  existingNames: string[];
}) {
  const [name, setName] = useState("Copa La Playa Apertura 2026");
  const [format, setFormat] = useState("round-robin");
  const [image, setImage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [teamFee, setTeamFee] = useState("850000");
  const duplicate = existingNames.some(
    (n) => n.toLowerCase() === name.trim().toLowerCase(),
  );
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicate || !name.trim() || !startDate || Number(teamFee) <= 0) return;
    onCreated({
      name: name.trim(),
      format:
        format === "round-robin"
          ? "Todos contra todos + mata-mata"
          : "Fase de grupos + mata-mata",
      image,
      slug,
      startDate,
      teamFee: Number(teamFee),
    });
    notify(`${name} fue creado correctamente`);
  };
  return (
    <form className="tournamentForm" onSubmit={submit}>
      <div className="formIntro">
        <div>
          <p>CONFIGURACIÓN GENERAL</p>
          <h3>Información del campeonato</h3>
          <span>Estos datos aparecerán en el enlace público del torneo.</span>
        </div>
        <div className="formStep">
          PASO <b>1</b> DE 1
        </div>
      </div>
      <div className="formColumns">
        <div className="formMain">
          <label className="imageUpload">
            {image ? (
              <img src={image} alt="Vista previa del torneo" />
            ) : (
              <div>
                <b>▣</b>
                <strong>Imagen principal del torneo</strong>
                <span>Sube una foto horizontal en JPG o PNG</span>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImage(URL.createObjectURL(file));
              }}
            />
            <em>{image ? "Cambiar imagen" : "Seleccionar imagen"}</em>
          </label>
          <div className="field full">
            <label htmlFor="tournament-name">Nombre único del torneo *</label>
            <input
              id="tournament-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={duplicate ? "invalid" : ""}
            />
            {duplicate ? (
              <small className="error">
                Este nombre ya está registrado. Elige uno diferente.
              </small>
            ) : (
              <small>
                Enlace: liguita.co/{slug || "nombre-del-torneo"}
              </small>
            )}
          </div>
          <div className="field full">
            <label htmlFor="start-date">Fecha de inicio del torneo *</label>
            <input
              id="start-date"
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <small>
              Esta fecha aparecerá en la página pública y en el calendario.
            </small>
          </div>
          <div className="field full">
            <label htmlFor="team-fee">Valor de inscripción por equipo *</label>
            <input
              id="team-fee"
              required
              type="number"
              min="1"
              step="1000"
              value={teamFee}
              onChange={(e) => setTeamFee(e.target.value)}
              placeholder="850000"
            />
            <small>
              Este valor será la base para calcular abonos y saldos de todos los
              equipos.
            </small>
          </div>
          <div className="field full">
            <label>¿Cómo se jugará?</label>
            <div className="formatOptions">
              <button
                type="button"
                className={format === "round-robin" ? "selected" : ""}
                onClick={() => setFormat("round-robin")}
              >
                <i>↻</i>
                <span>
                  <b>Todos contra todos + mata-mata</b>
                  <small>
                    Todos se enfrentan; los clasificados pasan a eliminación
                    directa.
                  </small>
                </span>
                <em>○</em>
              </button>
              <button
                type="button"
                className={format === "groups" ? "selected" : ""}
                onClick={() => setFormat("groups")}
              >
                <i>▦</i>
                <span>
                  <b>Fase de grupos + mata-mata</b>
                  <small>
                    Formato Mundial/Copa América; avanzan los mejores de cada
                    grupo.
                  </small>
                </span>
                <em>○</em>
              </button>
            </div>
          </div>
          <div className="formRow">
            <div className="field">
              <label htmlFor="venues">Nombre de las canchas *</label>
              <textarea
                id="venues"
                required
                rows={3}
                placeholder={"Cancha La Castellana\nEstadio Municipal"}
              />
              <small>Escribe una cancha por línea.</small>
            </div>
            <div className="field">
              <label htmlFor="hours">Días y horarios de juego *</label>
              <textarea
                id="hours"
                required
                rows={3}
                placeholder={
                  "Sábados: 3:00 PM – 8:00 PM\nDomingos: 9:00 AM – 6:00 PM"
                }
              />
              <small>Podrás ajustar cada partido después.</small>
            </div>
          </div>
          <div className="field full">
            <label htmlFor="description">Descripción breve</label>
            <textarea
              id="description"
              maxLength={280}
              rows={3}
              placeholder="Cuenta qué hace especial este torneo, quiénes participan y dónde se juega."
            />
          </div>
          <div className="contactBox">
            <h4>Persona representante del torneo</h4>
            <div className="formRow three">
              <div className="field">
                <label htmlFor="contact-name">Nombre completo *</label>
                <input
                  id="contact-name"
                  required
                  placeholder="Carlos Mendoza"
                />
              </div>
              <div className="field">
                <label htmlFor="contact-phone">Celular / WhatsApp *</label>
                <input
                  id="contact-phone"
                  required
                  type="tel"
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div className="field">
                <label htmlFor="contact-email">Correo electrónico *</label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  placeholder="organizador@correo.com"
                />
              </div>
            </div>
          </div>
        </div>
        <aside className="formPreview">
          <p>VISTA PREVIA</p>
          <div
            className="previewImage"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          >
            {!image && <span>⚽</span>}
          </div>
          <small>
            {format === "round-robin"
              ? "TODOS CONTRA TODOS + MATA-MATA"
              : "FASE DE GRUPOS + MATA-MATA"}
          </small>
          <h3>{name || "Nombre del torneo"}</h3>
          <p>/{slug || "nombre-del-torneo"}</p>
          {startDate && (
            <p className="previewDate">
              📅 Inicia el{" "}
              {new Date(`${startDate}T12:00:00`).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <p className="previewDate">
            💰{" "}
            {Number(teamFee) > 0
              ? new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                }).format(Number(teamFee))
              : "Valor pendiente"}{" "}
            por equipo
          </p>
          <ul>
            <li>✓ Página pública propia</li>
            <li>✓ Registro y aprobación de equipos</li>
            <li>✓ Calendario según el formato</li>
            <li>✓ Tabla y estadísticas automáticas</li>
          </ul>
        </aside>
      </div>
      <div className="formActions">
        <span>Los campos marcados con * son obligatorios.</span>
        <button type="button" className="reject" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="green"
          disabled={
            duplicate || !name.trim() || !startDate || Number(teamFee) <= 0
          }
        >
          Guardar y crear torneo →
        </button>
      </div>
    </form>
  );
}
