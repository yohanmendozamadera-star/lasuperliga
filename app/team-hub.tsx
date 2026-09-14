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
      jersey_number: Number(form.get("number")),
      position: String(form.get("position")),
    }).select("id").single();
    setMessage(error?.code === "23505" ? "Ese número ya pertenece a otro jugador." : error ? error.message : "Jugador registrado.");
    if (!error && player) {
      const photo = form.get("photo");
      if (photo instanceof File && photo.size) await uploadPlayerPhoto(player.id, photo, false);
      formElement.reset();
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
    if (nameIndex < 0 || numberIndex < 0) return setMessage("El CSV debe tener las columnas nombre, numero y posicion.");
    const rows = lines.slice(1).map(line => line.split(separator).map(x => x.trim())).filter(values => values[nameIndex] && Number(values[numberIndex])).map(values => ({
      team_id: id,
      created_by: user.id,
      full_name: values[nameIndex],
      jersey_number: Number(values[numberIndex]),
      position: positionIndex >= 0 && values[positionIndex] ? values[positionIndex] : "Por definir",
    }));
    if (!rows.length) return setMessage("No encontramos jugadores válidos en el archivo.");
    const { error } = await supabase!.from("players").upsert(rows, { onConflict: "team_id,jersey_number" });
    setMessage(error ? error.message : `${rows.length} jugador${rows.length === 1 ? "" : "es"} importado${rows.length === 1 ? "" : "s"}.`);
    event.target.value = "";
    if (!error) await load();
  };

  if (loading) return <main className="realPanelState"><h1>Cargando equipo…</h1></main>;
  if (!team) return <main className="realPanelState"><h1>No tienes acceso a este equipo</h1><a href="/">Volver</a></main>;

  const isOrganizer = team.tournaments?.owner_id === user.id;
  const back = isOrganizer ? `/panel/torneos/${team.tournaments.id}` : "/mis-equipos";
  const application = team.application ?? {};

  return <main className="teamHub">
    <header>
      <a href={back}>← Volver</a>
      <div>
        <span className="sectionLabel">{team.tournaments?.name}</span>
        <h1>Ficha de {team.name}</h1>
        <p>{isOrganizer ? "Edición como organizador" : "Panel del equipo"} · {team.approved ? "Aprobado" : "Pendiente"}</p>
      </div>
    </header>

    {message && <div className="adminMessage">{message}</div>}

    <div className="adminGrid teamEditGrid">
      <form className="adminForm" onSubmit={saveTeam}>
        <h2>Equipo y contacto</h2>
        <label>Nombre del equipo<input name="name" defaultValue={team.name} required /></label>
        <div className="formPair">
          <label>Técnico<input name="coach" defaultValue={team.coach_name || ""} /></label>
          <label>Representante<input name="representative" defaultValue={application.representative_name || ""} readOnly={!isOrganizer} /></label>
        </div>
        <div className="formPair">
          <label>Celular<input name="phone" type="tel" defaultValue={application.phone || ""} readOnly={!isOrganizer} /></label>
          <label>Correo<input name="email" type="email" defaultValue={application.email || ""} readOnly={!isOrganizer} /></label>
        </div>
        <label>Ciudad<input name="city" defaultValue={application.city || ""} readOnly={!isOrganizer} /></label>
        {!team.application_id && <p className="teamContactNote">Este equipo no tiene una solicitud vinculada; por eso todavía no hay datos del representante.</p>}

        <h2>Colores del uniforme</h2>
        <div className="formPair">
          <label>Camisa<input name="shirt" defaultValue={team.shirt_color || ""} required /></label>
          <label>Pantaloneta<input name="shorts" defaultValue={team.shorts_color || ""} required /></label>
        </div>
        <label>Medias<input name="socks" defaultValue={team.socks_color || ""} required /></label>
        <button className="primaryBtn" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
      </form>

      <form className="adminForm" onSubmit={addPlayer}>
        <h2>Registrar jugador</h2>
        <label>Nombre completo<input name="name" required /></label>
        <div className="formPair">
          <label>Número<input name="number" type="number" min="1" max="99" required /></label>
          <label>Posición<select name="position"><option>Arquero</option><option>Defensa</option><option>Volante</option><option>Delantero</option></select></label>
        </div>
        <label>Foto del jugador<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <button className="primaryBtn">Agregar jugador</button>
        <div className="playerImport"><b>Importar varios jugadores</b><small>Archivo CSV con columnas: nombre, numero, posicion.</small><label className="outlineBtn">Seleccionar CSV<input type="file" accept=".csv,text/csv" onChange={importPlayers} /></label></div>
      </form>
    </div>

    <section>
      <h2>Plantilla ({players.length})</h2>
      {players.length ? players.map((player) => <article className="adminRow" key={player.id}>
        <div className="playerIdentity">{player.photo_preview ? <img src={player.photo_preview} alt={player.full_name} /> : <span>{player.full_name.slice(0, 1).toUpperCase()}</span>}<div><b>#{player.jersey_number} · {player.full_name}</b><small>{player.position}</small></div></div>
        <div className="playerActions"><label>Subir foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadPlayerPhoto(player.id, file); }} /></label><button onClick={async () => {
          if (confirm("¿Eliminar este jugador?")) {
            await supabase!.from("players").delete().eq("id", player.id);
            await load();
          }
        }}>Eliminar</button></div>
      </article>) : <p>Aún no hay jugadores registrados.</p>}
    </section>
  </main>;
}
