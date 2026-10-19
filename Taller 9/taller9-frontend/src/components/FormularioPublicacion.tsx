import { useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar
} from "@ionic/react";

import type { DatosPublicacion, Publicacion } from "../services/api";

// Este componente ya está listo: no necesitas modificarlo.
// Se utiliza tanto para crear (publicacion = null) como para editar una publicación.
// Ya no se elige el usuario: el servidor asigna como autor al usuario del token.

interface Props {
  publicacion: Publicacion | null;
  guardando: boolean;
  onCancelar: () => void;
  onGuardar: (datos: DatosPublicacion) => void;
  onEliminar: (publicacion: Publicacion) => void;
}

const FormularioPublicacion: React.FC<Props> = ({ publicacion, guardando, onCancelar, onGuardar, onEliminar }) => {
  const [title, setTitle] = useState(publicacion?.title ?? "");
  const [body, setBody] = useState(publicacion?.body ?? "");

  // No validamos aquí a propósito: si falta un campo, el servidor responde 400
  // y la aplicación muestra su mensaje.
  const guardar = () => {
    onGuardar({ title, body });
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onCancelar}>Cancelar</IonButton>
          </IonButtons>
          <IonTitle>{publicacion ? "Editar" : "Nueva"}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={guardar} disabled={guardando}>
              Guardar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonInput
              label="Título"
              labelPlacement="stacked"
              value={title}
              placeholder="Escribe el título"
              onIonInput={(e) => setTitle(e.detail.value ?? "")}
            />
          </IonItem>
          <IonItem>
            <IonTextarea
              label="Contenido"
              labelPlacement="stacked"
              value={body}
              autoGrow
              rows={4}
              placeholder="Escribe el contenido"
              onIonInput={(e) => setBody(e.detail.value ?? "")}
            />
          </IonItem>
        </IonList>
      </IonContent>

      {publicacion && (
        <IonFooter>
          <IonToolbar>
            <IonButton
              expand="block"
              fill="clear"
              color="danger"
              disabled={guardando}
              onClick={() => onEliminar(publicacion)}
            >
              Eliminar publicación
            </IonButton>
          </IonToolbar>
        </IonFooter>
      )}
    </>
  );
};

export default FormularioPublicacion;
