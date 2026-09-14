"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useEffect, useMemo, useState } from "react";
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
      setPlayers(data ?? []);
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
    const { error } = await supabase!.from("players").insert({
      team_id: id,
      created_by: user.id,
      full_name: String(form.get("name")),
      jersey_number: Number(form.get("number")),
      position: String(form.get("position")),
      photo_url: String(form.get("photo") || "") || null,
    });
    setMessage(error?.code === "23505" ? "Ese número ya pertenece a otro jugador." : error ? error.message : "Jugador registrado.");
    if (!error) {
      formElement.reset();
      await load();
    }
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
        <label>URL de la foto<input name="photo" type="url" placeholder="https://..." /></label>
        <button className="primaryBtn">Agregar jugador</button>
      </form>
    </div>

    <section>
      <h2>Plantilla ({players.length})</h2>
      {players.length ? players.map((player) => <article className="adminRow" key={player.id}>
        <div><b>#{player.jersey_number} · {player.full_name}</b><small>{player.position}</small></div>
        <button onClick={async () => {
          if (confirm("¿Eliminar este jugador?")) {
            await supabase!.from("players").delete().eq("id", player.id);
            await load();
          }
        }}>Eliminar</button>
      </article>) : <p>Aún no hay jugadores registrados.</p>}
    </section>
  </main>;
}
