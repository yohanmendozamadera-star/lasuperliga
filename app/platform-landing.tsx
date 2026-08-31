"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import "./platform.css";
import "./platform-overrides.css";

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
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState("");
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
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://liguita.co/" } });
  };

  const emailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (authMode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
      if (error) setAuthMessage(error.message);
      else if (data.session) setShowAuth(false);
      else setAuthMessage("Revisa tu correo y confirma el enlace para activar tu cuenta.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthMessage("No pudimos ingresar. Revisa el correo y la contraseña.");
      else setShowAuth(false);
    }
    setSaving(false);
  };

  const openCreate = () => user ? setShowCreate(true) : setShowAuth(true);

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
      <nav><a href="#informacion">Información</a><a href="#torneos">Torneos</a></nav>
      {user ? <div className="ownerActions"><button className="outlineBtn" onClick={openCreate}>+ Nuevo torneo</button><button className="outlineBtn" onClick={() => supabase?.auth.signOut()}>Salir</button></div> : <button className="outlineBtn" onClick={() => setShowAuth(true)}>Iniciar sesión / Registrarme</button>}
    </header>

    <section className="platformHero">
      <div><span className="pill">FÚTBOL, PASIÓN Y COMUNIDAD</span><h1>Vive cada partido.<br/><em>Sigue tu campeonato.</em></h1><p>Consulta torneos, equipos, calendario, resultados y tablas de posiciones desde un solo lugar.</p><div className="heroButtons"><a className="primaryBtn" href="#torneos">Ver campeonatos →</a><a href="#informacion">Conocer la plataforma</a></div><small>⚽ Resultados oficiales · 🏆 Posiciones actualizadas · 📅 Próximos partidos</small></div>
      <div className="heroLogo"><img src="/liguita-logo-white.png" alt="Logo Liguita"/></div>
    </section>

    <section id="informacion" className="how"><p className="sectionLabel">TODO EN UN SOLO LUGAR</p><h2>La información que busca la hinchada</h2><div className="howGrid">{[
      ["01","Explora los torneos","Encuentra los campeonatos disponibles y entra directamente al que quieras seguir."],
      ["02","Consulta cada fecha","Revisa partidos programados, canchas, horarios, resultados y novedades."],
      ["03","Sigue la clasificación","Conoce posiciones, goleadores, estadísticas y el camino hacia la final."],
    ].map(([n,t,d]) => <article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>

    <section className="notifications"><div><p className="sectionLabel">LA HINCHADA SIEMPRE INFORMADA</p><h2>Cada gol se siente al instante.</h2><p>Los seguidores podrán conocer goles, tarjetas, resultados, próximos partidos y novedades de sus campeonatos favoritos.</p></div><div className="phoneMock"><span>⚽ GOL · AHORA</span><b>Deportivo Bahía 2–1 Real Ciénaga</b><small>Samuel Rojas · 67&apos;</small></div></section>

    <section id="torneos" className="tournamentCatalog"><p className="sectionLabel">COMPETENCIAS</p><h2>Campeonatos disponibles</h2>{loading ? <p>Cargando torneos…</p> : tournaments.length ? <div className="catalogGrid">{tournaments.map(t => <a key={t.id} href={`/torneos/${t.slug}`}><div style={{backgroundImage:`url(${t.image_url || "/liguita-logo-white.png"})`}}/><span>{t.status.replace("_"," ")}</span><h3>{t.name}</h3><p>{t.description || "Consulta partidos, equipos y estadísticas."}</p><small>Ver campeonato →</small></a>)}</div> : <div className="noTournaments"><img src="/liguita-logo-google-white.png" alt=""/><h3>Próximamente publicaremos nuevos campeonatos</h3><p>Regresa pronto para consultar equipos, partidos y resultados.</p></div>}</section>

    <section className="finalCta"><h2>Todo el campeonato, siempre contigo.</h2><a className="primaryBtn" href="#torneos">Consultar torneos →</a></section>
    <footer className="platformFooter"><b>LIGUITA</b><span>© 2026 · Hecho en Colombia 🇨🇴</span><div><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div></footer>

    {showAuth && <div className="createOverlay"><form className="authCard" onSubmit={emailAuth}><button type="button" className="modalClose" onClick={() => setShowAuth(false)}>×</button><img src="/liguita-logo-google-white.png" alt="Liguita"/><p className="sectionLabel">BIENVENIDO A LIGUITA</p><h2>{authMode === "register" ? "Crea tu cuenta" : "Inicia sesión"}</h2><p>Accede para seguir campeonatos y administrar tu perfil.</p><button type="button" className="googleAuthBtn" onClick={login}><b>G</b> Continuar con Google</button><div className="authDivider"><span>o usa tu correo</span></div><label>Correo electrónico<input name="email" type="email" required autoComplete="email"/></label><label>Contraseña<input name="password" type="password" required minLength={6} autoComplete={authMode === "register" ? "new-password" : "current-password"}/></label>{authMessage && <div className="authMessage">{authMessage}</div>}<button className="primaryBtn wide" disabled={saving}>{saving ? "Procesando…" : authMode === "register" ? "Registrarme" : "Ingresar"}</button><button type="button" className="authSwitch" onClick={() => {setAuthMode(authMode === "register" ? "login" : "register");setAuthMessage("");}}>{authMode === "register" ? "Ya tengo cuenta · Iniciar sesión" : "No tengo cuenta · Registrarme"}</button><small>Al continuar aceptas nuestros <a href="/terminos">Términos</a> y la <a href="/privacidad">Política de privacidad</a>.</small></form></div>}

    {showCreate && <div className="createOverlay"><form className="createTournament" onSubmit={submitTournament}><button type="button" className="modalClose" onClick={() => setShowCreate(false)}>×</button>{createdLink ? <div className="createdSuccess"><span>✓</span><h2>¡Tu torneo está registrado!</h2><p>Este es el enlace con el que administrarás y compartirás tu campeonato:</p><a href={createdLink}>{createdLink}</a><button type="button" className="primaryBtn" onClick={() => location.href=createdLink}>Ir a mi torneo</button></div> : <><p className="sectionLabel">NUEVO CAMPEONATO</p><h2>Crea tu torneo</h2><p>Tu cuenta quedará vinculada a {user?.email}.</p><label>Nombre del torneo<input required value={name} onChange={e => {setName(e.target.value); if(!slugTouched)setSlug(slugify(e.target.value).replace(/-apertura-?\d*$/,""));}} placeholder="Torneo La Playita Apertura 2026"/></label><label>Enlace del torneo<div className="domainInput"><b>liguita.co/torneos/</b><input required value={slug} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value));}} placeholder="laplayita"/></div></label><div className="formPair"><label>Fecha de inicio<input name="startDate" type="date" required/></label><label>Modalidad<select name="format"><option value="round_robin_knockout">Todos contra todos + mata-mata</option><option value="groups_knockout">Grupos + mata-mata</option></select></label></div><div className="formPair"><label>Jugadores en cancha<select name="players" defaultValue="11">{[5,6,7,8,9,10,11].map(n=><option key={n}>{n}</option>)}</select></label><label>Clasificados<input name="qualifiers" type="number" min="1" defaultValue="4"/></label></div><div className="formPair"><label>Valor por equipo<input name="fee" type="number" min="0" defaultValue="0"/></label><label>Nombre de contacto<input name="contactName" required defaultValue={user?.user_metadata?.full_name || ""}/></label></div><label>Teléfono<input name="phone" type="tel"/></label><label>Descripción breve<textarea name="description" rows={3}/></label>{message && <div className="formMessage">{message}</div>}<button className="primaryBtn wide" disabled={saving}>{saving ? "Registrando…" : "Registrar torneo y crear enlace"}</button></>}</form></div>}
  </main>;
}
