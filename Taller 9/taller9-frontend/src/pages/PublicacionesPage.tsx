import { useCallback, useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonRouter,
  useIonToast,
  useIonViewWillEnter
} from "@ionic/react";
import type { RefresherEventDetail } from "@ionic/react";
import { add } from "ionicons/icons";

import FormularioPublicacion from "../components/FormularioPublicacion";
import {
  ErrorApi,
  actualizarPublicacion,
  crearPublicacion,
  eliminarPublicacion,
  obtenerPerfil,
  obtenerPublicaciones
} from "../services/api";
import type { DatosPublicacion, Publicacion } from "../services/api";
import { cerrarSesion, obtenerSesion } from "../services/sesion";
import "./PublicacionesPage.css";

// Esta página ya está lista: no necesitas modificarla
// (salvo para el experimento «Ocultar no es proteger» del README).

// Experimento: cambia a true para mostrar los botones de editar y eliminar
// también en las publicaciones de otros usuarios.
const MOSTRAR_ACCIONES_EN_TODAS = false;

const mensajeDeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

const PublicacionesPage: React.FC = () => {
  const [sesion, setSesion] = useState(obtenerSesion());
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Publicacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const lista = useRef<HTMLIonListElement>(null);

  const router = useIonRouter();
  const [presentarToast] = useIonToast();
  const [presentarAlerta] = useIonAlert();

  const mostrarMensaje = (mensaje: string, color: "success" | "danger") => {
    presentarToast({ message: mensaje, color, duration: 3000, position: "bottom" });
  };

  const salir = () => {
    cerrarSesion();
    setSesion(null);
    setModalAbierto(false);
    router.push("/login", "root", "replace");
  };

  // Un 401 significa que el servidor no sabe quién somos: volvemos al login.
  const manejarError = (error: unknown) => {
    if (error instanceof ErrorApi && error.status === 401) {
      if (error.message === "Token requerido" && obtenerSesion()) {
        mostrarMensaje("Hay una sesión, pero el servidor no recibió el token. Completa el paso 9 en src/services/api.ts.", "danger");
        return;
      }
      mostrarMensaje(`${error.message}. Vuelve a iniciar sesión.`, "danger");
      salir();
      return;
    }
    mostrarMensaje(mensajeDeError(error), "danger");
  };

  // GET: carga las publicaciones (ruta pública, no necesita token).
  const cargar = useCallback(async () => {
    setErrorCarga("");
    try {
      const userId = filtro === "todas" ? undefined : Number(filtro);
      setPublicaciones(await obtenerPublicaciones(userId));
    } catch (error) {
      setErrorCarga(mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cada vez que se entra a la página: se lee la sesión y se verifica el token
  // con la ruta protegida GET /api/usuarios/yo.
  useIonViewWillEnter(() => {
    const actual = obtenerSesion();
    setSesion(actual);
    cargar();
    if (actual) {
      obtenerPerfil().catch(manejarError);
    }
  });

  const recargar = async (evento: CustomEvent<RefresherEventDetail>) => {
    await cargar();
    evento.detail.complete();
  };

  const esPropia = (publicacion: Publicacion) =>
    MOSTRAR_ACCIONES_EN_TODAS || publicacion.userId === sesion?.id;

  const abrirNueva = () => {
    setEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (publicacion: Publicacion) => {
    setEnEdicion(publicacion);
    setModalAbierto(true);
  };

  // POST o PUT, según si estamos creando o editando (rutas protegidas).
  const guardar = async (datos: DatosPublicacion) => {
    setGuardando(true);
    try {
      if (enEdicion) {
        await actualizarPublicacion(enEdicion.id, datos);
        mostrarMensaje("Publicación actualizada", "success");
      } else {
        await crearPublicacion(datos);
        mostrarMensaje("Publicación creada", "success");
      }
      setModalAbierto(false);
      await cargar();
    } catch (error) {
      manejarError(error);
    } finally {
      setGuardando(false);
    }
  };

  // DELETE, después de confirmar (ruta protegida).
  const confirmarEliminacion = (publicacion: Publicacion) => {
    presentarAlerta({
      header: "Eliminar publicación",
      message: `¿Quieres eliminar «${publicacion.title}»?`,
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            try {
              await eliminarPublicacion(publicacion.id);
              mostrarMensaje("Publicación eliminada", "success");
              setModalAbierto(false);
              await cargar();
            } catch (error) {
              manejarError(error);
            }
          }
        }
      ],
      onDidDismiss: () => lista.current?.closeSlidingItems()
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Publicaciones</IonTitle>
          <IonButtons slot="end">
            {sesion ? (
              <>
                <span className="usuario">{sesion.username}</span>
                <IonButton onClick={salir}>Salir</IonButton>
              </>
            ) : (
              <IonButton onClick={() => router.push("/login", "root", "replace")}>Ingresar</IonButton>
            )}
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment scrollable value={filtro} onIonChange={(e) => setFiltro(String(e.detail.value))}>
            <IonSegmentButton value="todas">
              <IonLabel>Todas</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="1">
              <IonLabel>Usuario 1</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="2">
              <IonLabel>Usuario 2</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="3">
              <IonLabel>Usuario 3</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={recargar}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="publicaciones">
          {!sesion && (
            <p className="aviso">
              No has iniciado sesión: puedes ver las publicaciones, pero no crear, editar ni eliminar. Esta página
              debería redirigir al login (paso 10 en src/App.tsx).
            </p>
          )}

          {cargando && (
            <div className="estado">
              <IonSpinner name="dots" />
            </div>
          )}

          {!cargando && errorCarga && (
            <div className="estado">
              <p className="error">No se pudieron cargar las publicaciones: {errorCarga}</p>
              <p>Revisa que el servidor Express esté ejecutándose y abre la consola del navegador (F12).</p>
              <IonButton fill="outline" onClick={() => cargar()}>
                Reintentar
              </IonButton>
            </div>
          )}

          {!cargando && !errorCarga && publicaciones.length === 0 && (
            <div className="estado">
              <p>No hay publicaciones.</p>
            </div>
          )}

          {!cargando && !errorCarga && publicaciones.length > 0 && (
            <>
              {sesion && (
                <p className="ayuda">
                  Toca una de tus publicaciones para editarla o deslízala hacia la izquierda para eliminarla.
                </p>
              )}
              <IonList ref={lista}>
                {publicaciones.map((publicacion) =>
                  sesion && esPropia(publicacion) ? (
                    <IonItemSliding key={publicacion.id}>
                      <IonItem button detail={false} onClick={() => abrirEdicion(publicacion)}>
                        <IonLabel>
                          <h2>{publicacion.title}</h2>
                          <p>{publicacion.body}</p>
                        </IonLabel>
                        <IonNote slot="end" color={publicacion.userId === sesion.id ? "primary" : undefined}>
                          {publicacion.userId === sesion.id ? "Tuya" : `Usuario ${publicacion.userId}`}
                        </IonNote>
                      </IonItem>
                      <IonItemOptions side="end">
                        <IonItemOption color="danger" onClick={() => confirmarEliminacion(publicacion)}>
                          Eliminar
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  ) : (
                    <IonItem key={publicacion.id}>
                      <IonLabel>
                        <h2>{publicacion.title}</h2>
                        <p>{publicacion.body}</p>
                      </IonLabel>
                      <IonNote slot="end">Usuario {publicacion.userId}</IonNote>
                    </IonItem>
                  )
                )}
              </IonList>
            </>
          )}
        </div>

        {sesion && (
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={abrirNueva} aria-label="Nueva publicación">
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        <IonModal isOpen={modalAbierto} onDidDismiss={() => setModalAbierto(false)}>
          {modalAbierto && (
            <FormularioPublicacion
              key={enEdicion?.id ?? "nueva"}
              publicacion={enEdicion}
              guardando={guardando}
              onCancelar={() => setModalAbierto(false)}
              onGuardar={guardar}
              onEliminar={confirmarEliminacion}
            />
          )}
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PublicacionesPage;
