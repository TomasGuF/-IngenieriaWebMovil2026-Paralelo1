import { useState } from "react";
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { registrarUsuario } from "../services/api";
import "./LoginPage.css";

const RegistroPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [registrado, setRegistrado] = useState(false);
  const registrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await registrarUsuario(username, password);
      setPassword("");
      setRegistrado(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setEnviando(false);
    }
  };
  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Crear cuenta</IonTitle></IonToolbar></IonHeader>
      <IonContent className="ion-padding">
        <form className="login" onSubmit={registrar}>
          <h1>Registro</h1>
          {registrado ? <p role="status">Cuenta creada. Ya puedes iniciar sesión.</p> : <>
            <IonList>
              <IonItem><IonInput label="Usuario" labelPlacement="stacked" autocomplete="username" required value={username} onIonInput={e => setUsername(e.detail.value ?? "")} /></IonItem>
              <IonItem><IonInput label="Contraseña" labelPlacement="stacked" type="password" autocomplete="new-password" required value={password} onIonInput={e => setPassword(e.detail.value ?? "")} /></IonItem>
            </IonList>
            <p>La contraseña debe tener al menos 8 caracteres.</p>
            {error && <p role="alert">{error}</p>}
            <IonButton type="submit" expand="block" disabled={enviando}>Registrarme</IonButton>
          </>}
          <IonButton fill="clear" routerLink="/login" routerDirection="root">Iniciar sesión</IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};
export default RegistroPage;
