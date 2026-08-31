"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import "./platform.css";

type PublicTournament = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  start_date: string;
  status: string;
  format: string;
};

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
const suggestTournamentSlug = (value: string) => slugify(value)
  .split("-")
  .filter((word) => word && !["torneo", "copa", "campeonato", "apertura", "clausura"].includes(word) && !/^\d{4}$/.test(word))
  .join("")
  .slice(0, 32);

export function PlatformLanding() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<PublicTournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    supabase.from("tournaments").select("id,name,slug,image_url,description,start_date,status,format").eq("is_public", true).order("created_at", { ascending: false }).then(({ data }) => setTournaments((data ?? []) as PublicTournament[]));
  }, [supabase]);

  useEffect(() => {
    if (!slugTouched) setSlug(suggestTournamentSlug(name));
  }, [name, slugTouched]);

  const login = async () => {
    if (!supabase) return setMessage("La conexión está siendo preparada. Intenta nuevamente.");
    localStorage.setItem("liguita-open-create", "1");
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://liguita.co/" } });
  };

  useEffect(() => {
    if (user && localStorage.getItem("liguita-open-create") === "1") {
      localStorage.removeItem("liguita-open-create");
      setShowCreate(true);
    }
  }, [user]);

  const openCreate = () => user ? setShowCreate(true) : login();

  const submitTournament = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;
    setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const cleanSlug = slugify(slug);
    const { data: existing } = await supabase.from("tournaments").select("id").eq("slug", cleanSlug).maybeSingle();
    if (existing) { setMessage("Ese subdominio ya está ocupado. Prueba otra opción."); setSaving(false); return; }

    let { data: organization } = await supabase.from("organizations").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
    if (!organization) {
      const base = slugify(user.user_metadata?.full_name || user.email?.split("@")[0] || "organizador");
      const created = await supabase.from("organizations").insert({ owner_id: user.id, name: `${user.user_metadata?.full_name || "Mi"} Organización`, slug: `${base}-${user.id.slice(0, 6)}` }).select("id").single();
      if (created.error) { setMessage(created.error.message); setSaving(false); return; }
      organization = created.data;
    }

    const result = await supabase.from("tournaments").insert({
      organization_id: organization.id,
      owner_id: user.id,
      name,
      slug: cleanSlug,
      description: String(form.get("description") || ""),
      format: String(form.get("format")),
      next_stage_format: "knockout",
      start_date: String(form.get("startDate")),
      registration_fee: Number(form.get("fee") || 0),
      players_on_field: Number(form.get("players") || 11),
      qualifiers: Number(form.get("qualifiers") || 4),
      contact_name: String(form.get("contactName")),
      contact_phone: String(form.get("phone") || ""),
      contact_email: user.email,
      status: "registration",
      is_public: true,
    }).select("id,name,slug,image_url,description,start_date,status,format").single();

    if (result.error) { setMessage(result.error.message); setSaving(false); return; }
    setTournaments((current) => [result.data as PublicTournament, ...current]);
    setCreatedLink(`${window.location.origin}/torneos/${cleanSlug}`);
    setSaving(false);
  };

  return <main className="platform">
    <header className="platformHeader">
      <a className="platformBrand" href="/"><img src="/liguita-logo-google-white.png" alt="Liguita"/><b>LIGUITA</b></a>
      <nav><a href="#como-funciona">Cómo funciona</a><a href="#torneos">Torneos</a></nav>
      {user ? <button className="outlineBtn" onClick={() => supabase?.auth.signOut()}>{user.user_metadata?.full_name || "Mi cuenta"} · Salir</button> : <button className="outlineBtn" onClick={login}>G&nbsp; Iniciar sesión</button>}
    </header>

    <section className="platformHero">
      <div><span className="pill">LA CASA DIGITAL DE TU CAMPEONATO</span><h1>Tu torneo.<br/><em>Tu propia liga.</em></h1><p>Crea el campeonato, invita equipos, planilla partidos y comparte resultados en vivo desde un enlace único.</p><div className="heroButtons"><button className="primaryBtn" onClick={openCreate}>Crear mi torneo →</button><a href="#torneos">Explorar campeonatos</a></div><small>✓ Registro con Google · ✓ Sin tarjeta para comenzar · ✓ Hecho para Colombia</small></div>
      <div className="heroLogo"><img src="/liguita-logo-white.png" alt="Logo Liguita"/></div>
    </section>

    <section id="como-funciona" className="how"><p className="sectionLabel">TODO EN UN SOLO LUGAR</p><h2>Del sorteo a la final</h2><div className="howGrid">{[
      ["01","Crea tu torneo","Define formato, valor, canchas, horarios, cupos y jugadores en cancha."],
      ["02","Invita los equipos","Cada representante solicita su cupo y registra jugadores y uniformes."],
      ["03","Vive cada partido","Planillas, goles, tarjetas, posiciones y notificaciones en tiempo real."],
    ].map(([n,t,d]) => <article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>

    <section className="notifications"><div><p className="sectionLabel">LA HINCHADA SIEMPRE INFORMADA</p><h2>Cada gol se siente al instante.</h2><p>Los seguidores podrán suscribirse a sus torneos y recibir novedades de goles, tarjetas, resultados, próximos partidos e invitaciones a nuevos campeonatos.</p></div><div className="phoneMock"><span>⚽ GOL · AHORA</span><b>Deportivo Bahía 2–1 Real Ciénaga</b><small>Samuel Rojas · 67&apos;</small></div></section>

    <section id="torneos" className="tournamentCatalog"><p className="sectionLabel">DESCUBRE LIGAS</p><h2>Campeonatos en Liguita</h2>{loading ? <p>Cargando torneos…</p> : tournaments.length ? <div className="catalogGrid">{tournaments.map(t => <a key={t.id} href={`/torneos/${t.slug}`}><div style={{backgroundImage:`url(${t.image_url || "/liguita-logo-white.png"})`}}/><span>{t.status.replace("_"," ")}</span><h3>{t.name}</h3><p>{t.description || "Consulta partidos, equipos y estadísticas."}</p><small>liguita.co/torneos/{t.slug} →</small></a>)}</div> : <div className="noTournaments"><img src="/liguita-logo-google-white.png" alt=""/><h3>El próximo campeonato puede ser el tuyo</h3><button className="primaryBtn" onClick={openCreate}>Registrar mi torneo</button></div>}</section>

    <section className="finalCta"><h2>Haz que tu campeonato juegue en grande.</h2><button className="primaryBtn" onClick={openCreate}>Crear mi torneo con Google →</button></section>
    <footer className="platformFooter"><b>LIGUITA</b><span>© 2026 · Hecho en Colombia 🇨🇴</span><div><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div></footer>

    {showCreate && <div className="createOverlay"><form className="createTournament" onSubmit={submitTournament}><button type="button" className="modalClose" onClick={() => setShowCreate(false)}>×</button>{createdLink ? <div className="createdSuccess"><span>✓</span><h2>¡Tu torneo está registrado!</h2><p>Este es el enlace con el que administrarás y compartirás tu campeonato:</p><a href={createdLink}>{createdLink}</a><button type="button" className="primaryBtn" onClick={() => location.href=createdLink}>Ir a mi torneo</button></div> : <><p className="sectionLabel">NUEVO CAMPEONATO</p><h2>Crea tu torneo</h2><p>Tu cuenta quedará vinculada a {user?.email}.</p><label>Nombre del torneo<input required value={name} onChange={e => {setName(e.target.value); if(!slugTouched)setSlug(slugify(e.target.value).replace(/-apertura-?\d*$/,""));}} placeholder="Torneo La Playita Apertura 2026"/></label><label>Enlace del torneo<div className="domainInput"><b>liguita.co/torneos/</b><input required value={slug} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value));}} placeholder="laplayita"/></div></label><div className="formPair"><label>Fecha de inicio<input name="startDate" type="date" required/></label><label>Modalidad<select name="format"><option value="round_robin_knockout">Todos contra todos + mata-mata</option><option value="groups_knockout">Grupos + mata-mata</option></select></label></div><div className="formPair"><label>Jugadores en cancha<select name="players" defaultValue="11">{[5,6,7,8,9,10,11].map(n=><option key={n}>{n}</option>)}</select></label><label>Clasificados<input name="qualifiers" type="number" min="1" defaultValue="4"/></label></div><div className="formPair"><label>Valor por equipo<input name="fee" type="number" min="0" defaultValue="0"/></label><label>Nombre de contacto<input name="contactName" required defaultValue={user?.user_metadata?.full_name || ""}/></label></div><label>Teléfono<input name="phone" type="tel"/></label><label>Descripción breve<textarea name="description" rows={3}/></label>{message && <div className="formMessage">{message}</div>}<button className="primaryBtn wide" disabled={saving}>{saving ? "Registrando…" : "Registrar torneo y crear enlace"}</button></>}</form></div>}
  </main>;
}
