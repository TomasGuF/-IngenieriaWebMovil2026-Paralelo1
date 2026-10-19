import { useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
  useIonToast
} from "@ionic/react";

import { iniciarSesion } from "../services/api";
import { guardarSesion } from "../services/sesion";
import "./LoginPage.css";

// Esta página ya está lista: no necesitas modificarla.
// La petición al servidor se completa en src/services/api.ts (paso 8).

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useIonRouter();
  const [presentarToast] = useIonToast();

  const ingresar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setEnviando(true);
    try {
      const sesion = await iniciarSesion(username, password);
      guardarSesion(sesion);
      setPassword("");
      router.push("/publicaciones", "root", "replace");
    } catch (error) {
      presentarToast({
        message: error instanceof Error ? error.message : String(error),
        color: "danger",
        duration: 3000,
        position: "bottom"
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar sesión</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form className="login" onSubmit={ingresar}>
          <h1>Taller 9</h1>
          <p>Ingresa con uno de los usuarios de prueba del README.</p>

          <IonList>
            <IonItem>
              <IonInput
                label="Usuario"
                labelPlacement="stacked"
                value={username}
                autocomplete="username"
                placeholder="Por ejemplo: ana"
                onIonInput={(e) => setUsername(e.detail.value ?? "")}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Contraseña"
                labelPlacement="stacked"
                type="password"
                value={password}
                autocomplete="current-password"
                onIonInput={(e) => setPassword(e.detail.value ?? "")}
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>
            </IonItem>
          </IonList>

          <IonButton type="submit" expand="block" disabled={enviando}>
            Ingresar
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
