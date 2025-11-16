//app/[locale]/(auth)/signin
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import authimg from "@/assets/auth.jpg";
import styles from "./login.module.css";
import Link from "next/link";
import Image from "next/image";
import SubmitButton from "@/components/ui/SubmitButton/SubmitButton";
import { useUser } from "@/hooks/useUser";

export default function LoginForm() {
  const { t, locale, langCode } = useLocale();
  const { login, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ mobile: "", password: "" });

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (error) clearError();
    },
    [error, clearError]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;

      const { mobile, password } = formData;
      if (!mobile || !password) return;

      await login(mobile, password, langCode);
    },
    [formData, loading, login, langCode]
  );

  return (
    <section className={styles.auth__sec}>
      <div className={styles.auth__body}>
        <div>
          <Image
            alt="Authentication"
            src={authimg}
            className={styles.auth__img}
            priority
          />
        </div>

        <div>
          <h2 className={styles.auth__title}>
            {t("auth.welcomeBack", "Welcome Back")}
          </h2>

          <p className={styles.auth__para}>
            {t("auth.dontHaveAccount", "Don't have an account?")}{" "}
            <Link href={`/${locale}/signup`}>
              {t("auth.signUpNow", "Sign Up")}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className={styles.login__body}>
            <div className={styles.Login__container}>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder={t("auth.enterPhone", "Enter your phone")}
                className={styles.custom__input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.password__body}>
              <div className={styles.Login__container}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t("auth.enterPassword", "Enter your password")}
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.pass__body}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                {showPassword ? t("auth.hide", "Hide") : t("auth.show", "Show")}
              </button>
            </div>

            {error && <div className={styles.error__message}>{error}</div>}

            <SubmitButton
              text={t("auth.getStarted", "Get Started")}
              loading={loading}
            />
          </form>
        </div>
      </div>
    </section>
  );
}
