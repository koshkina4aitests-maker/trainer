import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

import { loginLocal, loginWithGoogle, registerLocal } from "../api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  async function submitLocalAuth(event) {
    event.preventDefault();
    setError("");
    setStatus(mode === "login" ? "Вход..." : "Регистрация...");
    try {
      const payload = mode === "login" ? { email, password } : { email, password, full_name: fullName };
      const session = mode === "login" ? await loginLocal(payload) : await registerLocal(payload);
      onAuthenticated(session);
      setStatus("");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setError("Google не вернул id_token.");
      return;
    }
    setError("");
    setStatus("Вход через Google...");
    try {
      const session = await loginWithGoogle(idToken);
      onAuthenticated(session);
      setStatus("");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">Авторизация</CardTitle>
          <CardDescription>Локальный вход или авторизация через Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="inline-flex rounded-lg border border-slate-200 p-1">
            <Button
              variant={mode === "login" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("login")}
            >
              Вход
            </Button>
            <Button
              variant={mode === "register" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("register")}
            >
              Регистрация
            </Button>
          </div>

          <form onSubmit={submitLocalAuth} className="space-y-3">
            {mode === "register" && (
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-4 w-4" />
                  Имя
                </span>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Иван" />
              </label>
            )}

            <label className="space-y-1 text-sm text-slate-700">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email / логин
              </span>
              <Input
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com или Admin"
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span className="inline-flex items-center gap-1">
                <LockKeyhole className="h-4 w-4" />
                Пароль
              </span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={mode === "register" ? 8 : 1}
                placeholder={mode === "register" ? "Минимум 8 символов" : "Введите пароль"}
              />
            </label>

            <Button type="submit" className="w-full">
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>
          </form>

          {hasGoogleClientId ? (
            <div className="flex justify-center pt-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Ошибка Google авторизации")}
                useOneTap={false}
              />
            </div>
          ) : (
            <p className="text-xs text-amber-700">
              Google OAuth не настроен: добавьте VITE_GOOGLE_CLIENT_ID в frontend/.env.
            </p>
          )}

          {status && <p className="text-sm font-medium text-emerald-700">{status}</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
