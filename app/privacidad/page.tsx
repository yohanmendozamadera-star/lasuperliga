import Link from "next/link";
import "../legal.css";

export const metadata = {
  title: "Política de privacidad | Liguita",
  description: "Política de privacidad de la plataforma Liguita.",
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <article className="legalCard">
        <Link className="legalBrand" href="/">
          <img src="/liguita-logo-google-white.png" alt="Liguita" />
          LIGUITA
        </Link>
        <h1>Política de privacidad</h1>
        <p className="legalUpdated">Última actualización: 30 de agosto de 2026</p>

        <p>Liguita es una plataforma para crear, administrar y consultar campeonatos de fútbol. Esta política explica qué información tratamos y cómo la protegemos.</p>

        <h2>1. Información que recopilamos</h2>
        <ul>
          <li>Datos básicos de cuenta proporcionados por Google, como nombre, correo electrónico y fotografía de perfil.</li>
          <li>Información registrada para organizar torneos, equipos, jugadores, partidos, resultados, pagos y estadísticas.</li>
          <li>Datos técnicos necesarios para mantener la sesión, proteger la cuenta y operar el servicio.</li>
        </ul>

        <h2>2. Uso de la información</h2>
        <p>Utilizamos la información para autenticar usuarios, prestar las funciones de Liguita, mostrar información de los campeonatos, enviar notificaciones solicitadas, prevenir abusos y mejorar el servicio. No vendemos datos personales.</p>

        <h2>3. Información pública</h2>
        <p>Los organizadores pueden publicar datos deportivos como nombres de equipos y jugadores, fotografías, resultados, goles, tarjetas y clasificaciones. Cada organizador es responsable de contar con las autorizaciones necesarias para publicar dicha información.</p>

        <h2>4. Proveedores</h2>
        <p>Liguita utiliza proveedores tecnológicos como Google para autenticación, Supabase para base de datos y almacenamiento, y Netlify para alojamiento. Estos proveedores procesan información conforme a sus propias políticas y medidas de seguridad.</p>

        <h2>5. Conservación y seguridad</h2>
        <p>Conservamos los datos mientras sean necesarios para prestar el servicio o cumplir obligaciones legales. Aplicamos controles de acceso por usuario y torneo, conexiones cifradas y reglas de seguridad en la base de datos.</p>

        <h2>6. Derechos del usuario</h2>
        <p>Puedes solicitar acceso, corrección o eliminación de tus datos y retirar permisos de inicio de sesión desde tu cuenta de Google. Algunas estadísticas históricas podrán conservarse de forma anonimizada cuando sea necesario para la integridad de un campeonato.</p>

        <h2>7. Menores de edad</h2>
        <p>Cuando se registren datos de menores, el organizador y el representante del equipo deben obtener la autorización de sus padres o representantes legales antes de publicar fotografías o información personal.</p>

        <div className="legalContact"><strong>Contacto de privacidad</strong><br />Para consultas o solicitudes, utiliza los medios de contacto publicados en liguita.co.</div>
        <div className="legalLinks"><Link href="/">Inicio</Link><Link href="/terminos">Términos del servicio</Link></div>
      </article>
    </main>
  );
}
