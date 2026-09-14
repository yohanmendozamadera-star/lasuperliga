"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import "./platform.css";
import "./platform-overrides.css";

export function TeamHub({ id }: { id: string }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [team, setTeam] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"team" | "players">("team");
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [showColors, setShowColors] = useState(false);
  const [uniformColors, setUniformColors] = useState({ shirt: "#0b5948", shorts: "#f4f4ef", socks: "#0b5948" });

  const load = async () => {
    const { data: { user: currentUser } } = await supabase!.auth.getUser();
    setUser(currentUser);
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const { data: currentTeam } = await supabase!
      .from("teams")
      .select("*,tournaments(id,name,owner_id),application:team_applications(representative_name,phone,email,city,requested_role)")
      .eq("id", id)
      .maybeSingle();

    setTeam(currentTeam);
    if (currentTeam) {
      const valid = (value: string | null, fallback: string): string => /^#[0-9a-f]{6}$/i.test(value || "") ? String(value) : fallback;
      setUniformColors({ shirt: valid(currentTeam.shirt_color, "#0b5948"), shorts: valid(currentTeam.shorts_color, "#f4f4ef"), socks: valid(currentTeam.socks_color, "#0b5948") });
    }
    if (currentTeam) {
      const { data } = await supabase!
        .from("players")
        .select("*")
        .eq("team_id", id)
        .order("jersey_number");
      const withPhotos = await Promise.all((data ?? []).map(async (player: any) => {
        if (!player.photo_url) return player;
        const { data: signed } = await supabase!.storage.from("player-photos").createSignedUrl(player.photo_url, 3600);
        return { ...player, photo_preview: signed?.signedUrl || null };
      }));
      setPlayers(withPhotos);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [id]);

  const saveTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    const { error: teamError } = await supabase!
      .from("teams")
      .update({
        name: String(form.get("name") || "").trim(),
        coach_name: String(form.get("coach") || "").trim(),
        shirt_color: String(form.get("shirt") || "").trim(),
        shorts_color: String(form.get("shorts") || "").trim(),
        socks_color: String(form.get("socks") || "").trim(),
      })
      .eq("id", id);

    if (teamError) {
      setMessage(teamError.message);
      setSaving(false);
      return;
    }

    const isOrganizer = team?.tournaments?.owner_id === user?.id;
    if (isOrganizer && team?.application_id) {
      const { error: contactError } = await supabase!
        .from("team_applications")
        .update({
          representative_name: String(form.get("representative") || "").trim(),
          phone: String(form.get("phone") || "").trim(),
          email: String(form.get("email") || "").trim(),
          city: String(form.get("city") || "").trim(),
        })
        .eq("id", team.application_id);

      if (contactError) {
        setMessage(`El equipo se actualizó, pero no el contacto: ${contactError.message}`);
        setSaving(false);
        await load();
        return;
      }
    }

    setMessage("Ficha del equipo actualizada correctamente.");
    setSaving(false);
    await load();
  };

  const addPlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { data: player, error } = await supabase!.from("players").insert({
      team_id: id,
      created_by: user.id,
      full_name: String(form.get("name")),
      birth_date: String(form.get("birthDate") || "") || null,
      jersey_number: Number(form.get("number")),
      position: String(form.get("position")),
    }).select("id").single();
    setMessage(error?.code === "23505" ? "Ese número ya pertenece a otro jugador." : error ? error.message : "Jugador registrado.");
    if (!error && player) {
      const photo = form.get("photo");
      if (photo instanceof File && photo.size) await uploadPlayerPhoto(player.id, photo, false);
      formElement.reset();
      setShowPlayerForm(false);
      await load();
    }
  };

  const uploadPlayerPhoto = async (playerId: string, file: File, refresh = true) => {
    if (!file.type.startsWith("image/")) { setMessage("Selecciona una imagen JPG, PNG o WebP."); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage("La foto no puede superar 5 MB."); return; }
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${id}/${playerId}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase!.storage.from("player-photos").upload(path, file);
    if (uploadError) { setMessage(uploadError.message); return; }
    const { error: updateError } = await supabase!.from("players").update({ photo_url: path }).eq("id", playerId);
    setMessage(updateError ? updateError.message : "Foto guardada correctamente.");
    if (refresh && !updateError) await load();
  };

  const importPlayers = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!lines.length) return setMessage("El archivo está vacío.");
    const separator = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(separator).map(x => x.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const nameIndex = headers.findIndex(x => ["nombre", "name", "jugador"].includes(x));
    const numberIndex = headers.findIndex(x => ["numero", "number", "dorsal"].includes(x));
    const positionIndex = headers.findIndex(x => ["posicion", "position"].includes(x));
    const birthDateIndex = headers.findIndex(x => ["fecha_nacimiento", "nacimiento", "birth_date"].includes(x));
    if (nameIndex < 0 || numberIndex < 0) return setMessage("El CSV debe tener las columnas nombre, numero y posicion.");
    const rows = lines.slice(1).map(line => line.split(separator).map(x => x.trim())).filter(values => values[nameIndex] && Number(values[numberIndex])).map(values => ({
      team_id: id,
      created_by: user.id,
      full_name: values[nameIndex],
      birth_date: birthDateIndex >= 0 && values[birthDateIndex] ? values[birthDateIndex] : null,
      jersey_number: Number(values[numberIndex]),
      position: positionIndex >= 0 && values[positionIndex] ? values[positionIndex] : "Por definir",
    }));
    if (!rows.length) return setMessage("No encontramos jugadores válidos en el archivo.");
    const { error } = await supabase!.from("players").upsert(rows, { onConflict: "team_id,jersey_number" });
    setMessage(error ? error.message : `${rows.length} jugador${rows.length === 1 ? "" : "es"} importado${rows.length === 1 ? "" : "s"}.`);
    event.target.value = "";
    if (!error) await load();
  };

  const updatePlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("players").update({
      full_name: String(form.get("name") || "").trim(),
      birth_date: String(form.get("birthDate") || "") || null,
      jersey_number: Number(form.get("number")),
      position: String(form.get("position")),
    }).eq("id", editingPlayer.id);
    setMessage(error?.code === "23505" ? "Ese número ya pertenece a otro jugador." : error ? error.message : "Jugador actualizado.");
    if (!error) { setEditingPlayer(null); await load(); }
  };

  if (loading) return <main className="realPanelState"><h1>Cargando equipo…</h1></main>;
  if (!team) return <main className="realPanelState"><h1>No tienes acceso a este equipo</h1><a href="/">Volver</a></main>;

  const isOrganizer = team.tournaments?.owner_id === user.id;
  const back = isOrganizer ? `/panel/torneos/${team.tournaments.id}` : "/mis-equipos";
  const application = team.application ?? {};

  const safeColor = (value: string | null, fallback: string): string => /^#[0-9a-f]{6}$/i.test(value || "") ? String(value) : fallback;
  const shirt = safeColor(uniformColors.shirt, "#0b5948");
  const shorts = safeColor(uniformColors.shorts, "#f4f4ef");
  const socks = safeColor(uniformColors.socks, "#0b5948");

  return <main className="teamHub modernTeamHub">
    <header><a href={back}>← Volver</a><div><span className="sectionLabel">{team.tournaments?.name}</span><h1>{team.name}</h1><p>{isOrganizer ? "Administración del equipo" : "Mi equipo"} · <b>{team.approved ? "Aprobado" : "Pendiente"}</b></p></div></header>
    {message && <div className="adminMessage">{message}<button onClick={() => setMessage("")}>×</button></div>}
    <nav className="teamTabs"><button className={tab === "team" ? "active" : ""} onClick={() => setTab("team")}>Equipo</button><button className={tab === "players" ? "active" : ""} onClick={() => setTab("players")}>Jugadores <span>{players.length}</span></button></nav>

    {tab === "team" && <section className="teamProfile">
      <div className="teamSummary"><div className="teamBadge">{team.name.slice(0, 2).toUpperCase()}</div><div><span>Equipo inscrito</span><h2>{team.name}</h2><p>{team.coach_name || "Técnico por definir"} · {application.city || "Ciudad por definir"}</p></div></div>
      <div className="teamProfileGrid">
        <form className="adminForm" onSubmit={saveTeam}>
          <h2>Datos del equipo</h2><label>Nombre del equipo<input name="name" defaultValue={team.name} required /></label>
          <div className="formPair"><label>Técnico<input name="coach" defaultValue={team.coach_name || ""} /></label><label>Representante<input name="representative" defaultValue={application.representative_name || ""} readOnly={!isOrganizer} /></label></div>
          <div className="formPair"><label>Celular<input name="phone" type="tel" defaultValue={application.phone || ""} readOnly={!isOrganizer} /></label><label>Correo<input name="email" type="email" defaultValue={application.email || ""} readOnly={!isOrganizer} /></label></div>
          <label>Ciudad<input name="city" defaultValue={application.city || ""} readOnly={!isOrganizer} /></label>
          <div className="uniformFields"><h2>Uniforme</h2><p>Pulsa el uniforme para cambiar sus colores.</p><button type="button" className="uniformPreview" onClick={() => setShowColors(!showColors)} aria-label="Editar colores del uniforme"><svg viewBox="0 0 220 250"><path fill={shirt} d="M56 28 91 10h38l35 18 34 38-27 27-18-17v72H67V76L49 93 22 66z"/><path fill={shorts} stroke="#b7c2bc" d="M68 155h84l13 74-43 5-12-42-12 42-43-5z"/><path fill={socks} d="M65 231h32v17H55zm58 0h32l10 17h-42z"/><text x="110" y="93" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="900">{team.name.slice(0,2).toUpperCase()}</text></svg><span>Editar colores</span></button>{showColors && <div className="colorPanel"><label>Camisa<input name="shirt" type="color" value={shirt} onChange={e=>setUniformColors({...uniformColors,shirt:e.target.value})}/></label><label>Pantaloneta<input name="shorts" type="color" value={shorts} onChange={e=>setUniformColors({...uniformColors,shorts:e.target.value})}/></label><label>Medias<input name="socks" type="color" value={socks} onChange={e=>setUniformColors({...uniformColors,socks:e.target.value})}/></label></div>} {!showColors && <><input type="hidden" name="shirt" value={shirt}/><input type="hidden" name="shorts" value={shorts}/><input type="hidden" name="socks" value={socks}/></>}</div>
          <button className="primaryBtn" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
        </form>
      </div>
    </section>}

    {tab === "players" && <section className="playersPanel">
      <div className="playersHeading"><div><span className="sectionLabel">PLANTILLA</span><h2>Jugadores del equipo</h2><p>{players.length} jugador{players.length === 1 ? "" : "es"} registrado{players.length === 1 ? "" : "s"}</p></div><div><button className="outlineBtn" onClick={() => setShowImport(true)}>Importar lista</button><button className="primaryBtn" onClick={() => setShowPlayerForm(true)}>+ Agregar jugador</button></div></div>
      <div className="playerCards">{players.length ? players.map(player => <article key={player.id}><div className="playerIdentity">{player.photo_preview ? <img src={player.photo_preview} alt={player.full_name}/> : <span>{player.full_name.slice(0,1).toUpperCase()}</span>}<div><b>#{player.jersey_number} · {player.full_name}</b><small>{player.position || "Sin posición"}{player.birth_date ? ` · ${new Date(`${player.birth_date}T12:00:00`).toLocaleDateString("es-CO")}` : " · Sin fecha de nacimiento"}</small></div></div><div className="playerActions"><label>{player.photo_url ? "Cambiar foto" : "Subir foto"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file=event.target.files?.[0]; if(file) void uploadPlayerPhoto(player.id,file); }}/></label><button onClick={() => setEditingPlayer(player)}>Editar</button><button onClick={async()=>{if(confirm("¿Eliminar este jugador?")){await supabase!.from("players").delete().eq("id",player.id);await load();}}}>Eliminar</button></div></article>) : <div className="emptyPlayers"><b>11</b><h3>Aún no hay jugadores</h3><p>Registra uno por uno o importa la plantilla completa.</p><button className="primaryBtn" onClick={() => setShowPlayerForm(true)}>Agregar primer jugador</button></div>}</div>
    </section>}

    {(showPlayerForm || editingPlayer) && <div className="createOverlay"><form className="createTournament" onSubmit={editingPlayer ? updatePlayer : addPlayer}><button type="button" className="modalClose" onClick={() => {setShowPlayerForm(false);setEditingPlayer(null);}}>×</button><p className="sectionLabel">{editingPlayer ? "EDITAR" : "NUEVO"} JUGADOR</p><h2>{editingPlayer ? "Editar jugador" : "Agregar jugador"}</h2><label>Nombre completo<input name="name" defaultValue={editingPlayer?.full_name || ""} required /></label><div className="formPair"><label>Fecha de nacimiento<input name="birthDate" type="date" defaultValue={editingPlayer?.birth_date || ""} /></label><label>Número de camiseta<input name="number" type="number" min="1" max="99" defaultValue={editingPlayer?.jersey_number || ""} required /></label></div><label>Posición<select name="position" defaultValue={editingPlayer?.position || "Delantero"}><option>Arquero</option><option>Defensa</option><option>Volante</option><option>Delantero</option></select></label>{!editingPlayer && <label>Foto (puedes cargarla después)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>}<button className="primaryBtn wide">{editingPlayer ? "Guardar jugador" : "Agregar jugador"}</button></form></div>}
    {showImport && <div className="createOverlay"><div className="createTournament"><button type="button" className="modalClose" onClick={() => setShowImport(false)}>×</button><p className="sectionLabel">IMPORTACIÓN</p><h2>Importar jugadores</h2><p>Selecciona un archivo CSV con las columnas <b>nombre, numero, posicion, fecha_nacimiento</b>. La fecha debe ir como AAAA-MM-DD.</p><label className="csvDrop">Seleccionar archivo CSV<input type="file" accept=".csv,text/csv" onChange={async event => {await importPlayers(event);setShowImport(false);}} /></label></div></div>}
  </main>;
}
