import Link from "next/link";
import "../legal.css";

export const metadata = {
  title: "Términos del servicio | Liguita",
  description: "Términos y condiciones de uso de la plataforma Liguita.",
};

export default function TermsPage() {
  return (
    <main className="legalPage">
      <article className="legalCard">
        <Link className="legalBrand" href="/">
          <img src="/liguita-logo-google-white.png" alt="Liguita" />
          LIGUITA
        </Link>
        <h1>Términos del servicio</h1>
        <p className="legalUpdated">Última actualización: 30 de agosto de 2026</p>

        <p>Al crear una cuenta o utilizar Liguita aceptas estos términos. Si administras un torneo o equipo, declaras tener capacidad y autorización para registrar su información.</p>

        <h2>1. Servicio</h2>
        <p>Liguita facilita la organización y publicación de torneos de fútbol, incluyendo equipos, jugadores, programación, planillas, eventos, estadísticas, pagos informativos y publicidad.</p>

        <h2>2. Cuentas y responsabilidades</h2>
        <p>Debes proporcionar información veraz, mantener segura tu cuenta y utilizar únicamente los permisos que te correspondan. Eres responsable de las acciones realizadas desde tu sesión.</p>

        <h2>3. Contenido y autorizaciones</h2>
        <p>Quien registra nombres, fotografías y datos de jugadores garantiza que cuenta con las autorizaciones necesarias. No se permite contenido ilegal, engañoso, discriminatorio, violento o que vulnere derechos de terceros.</p>

        <h2>4. Resultados y decisiones deportivas</h2>
        <p>Las planillas, tablas y estadísticas dependen de la información ingresada por organizadores y planilleros. Liguita ofrece herramientas de registro, pero no sustituye los reglamentos ni las autoridades deportivas de cada campeonato.</p>

        <h2>5. Pagos</h2>
        <p>Los abonos registrados en Liguita son controles administrativos del torneo. Salvo que se indique expresamente un servicio de pago integrado, Liguita no recibe ni custodia el dinero entregado entre organizadores y equipos.</p>

        <h2>6. Disponibilidad</h2>
        <p>Trabajamos para mantener el servicio disponible y seguro, pero pueden existir interrupciones por mantenimiento, proveedores externos o causas fuera de nuestro control.</p>

        <h2>7. Suspensión y terminación</h2>
        <p>Podemos limitar o suspender cuentas que comprometan la seguridad, incumplan estos términos o utilicen el servicio de forma fraudulenta. El usuario puede solicitar el cierre de su cuenta.</p>

        <h2>8. Cambios</h2>
        <p>Podremos actualizar estos términos cuando cambien las funciones o requisitos legales. La versión vigente se publicará en esta página con su fecha de actualización.</p>

        <div className="legalContact"><strong>Contacto</strong><br />Para consultas sobre el servicio, utiliza los medios de contacto publicados en liguita.co.</div>
        <div className="legalLinks"><Link href="/">Inicio</Link><Link href="/privacidad">Política de privacidad</Link></div>
      </article>
    </main>
  );
}
