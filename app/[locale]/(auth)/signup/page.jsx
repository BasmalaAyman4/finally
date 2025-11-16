"use client";

import { useState, useCallback } from "react";
import { useSignup } from "@/hooks/useSignup";
import { useLocale } from "@/contexts/LocaleContext";
import authimg from "@/assets/auth.jpg";
import styles from "./signup.module.css";
import Link from "next/link";
import Image from "next/image";
import OtpInput from "react-otp-input";
import SubmitButton from "@/components/ui/SubmitButton/SubmitButton";

const SignupForm = () => {
    const { t, locale } = useLocale();
    const {
        loading,
        error,
        clearError,
        registerMobile,
        verifyOTP,
        setPassword,
        completeProfile,
        autoLogin,
    } = useSignup();

    const [currentStep, setCurrentStep] = useState(0);
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [userId, setUserId] = useState("");
    const [userData, setUserData] = useState(null);

    const [formData, setFormData] = useState({
        mobile: "",
        password: "",
        firstName: "",
        lastName: "",
        birthdate: "",
        gender: "1",
    });

    const handleNext = useCallback(() => {
        if (currentStep < 3) {
            setCurrentStep((prev) => prev + 1);
        }
    }, [currentStep]);

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

    // Step 1: Mobile signup
    const handleMobileSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if (loading) return;

            const result = await registerMobile(formData.mobile);
            if (result.success) {
                setUserId(result.userId);
                handleNext();
            }
        },
        [formData.mobile, loading, registerMobile, handleNext]
    );

    // Step 2: OTP verification
    const handleOtpSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if (loading) return;

            const result = await verifyOTP(userId, otp);
            if (result.success) {
                handleNext();
            }
        },
        [userId, otp, loading, verifyOTP, handleNext]
    );

    // Step 3: Password setting
    const handlePasswordSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if (loading) return;

            const result = await setPassword(userId, formData.password);
            if (result.success) {
                setUserData(result.userData);
                handleNext();
            }
        },
        [userId, formData.password, loading, setPassword, handleNext]
    );

    // Step 4: Personal info
    const handlePersonalInfoSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if (loading || !userData) return;

            const personalData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                birthdate: formData.birthdate,
                gender: parseInt(formData.gender),
            };

            const result = await completeProfile(userData.token, personalData);
            if (result.success) {
                // Auto login and redirect
                await autoLogin(formData);
            }
        },
        [formData, userData, loading, completeProfile, autoLogin]
    );

    // Render progress steps
    const renderSteps = () => {
        return [0, 1, 2, 3].map((step, index) => {
            let className = styles.step__item;
            if (index < currentStep) {
                className += ` ${styles.active}`;
            } else if (index === currentStep) {
                className += ` ${styles.loading}`;
            }
            return (
                <div key={index} className={className}>
                    {index === currentStep && <span></span>}
                </div>
            );
        });
    };

    // Render current step content
    const renderCurrentStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <>
                        <h2 className={styles.signup__title}>
                            {t("auth.letsStartWith", "Let's start with")}{" "}
                            <span>{t("auth.yourMobileNumber", "your mobile number")}</span>
                        </h2>
                        <p className={styles.auth__para}>
                            {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
                            <Link href={`/${locale}/signin`}>
                                {t("auth.login", "Login")}
                            </Link>
                        </p>
                        <form onSubmit={handleMobileSubmit}>
                            <div className={styles.Login__container}>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                    placeholder={t("auth.enterPhone", "Enter your phone number")}
                                    className={styles.custom__input}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            {error && <div className={styles.error__message}>{error}</div>}
                            <SubmitButton
                                text={t("auth.sendOTP", "Send OTP")}
                                loading={loading}
                            />
                        </form>
                    </>
                );

            case 1:
                return (
                    <>
                        <h2 className={styles.signup__title}>
                            {t("auth.pleaseVerify", "Please verify")}{" "}
                            <span>{t("auth.yourMobileNumber", "your mobile number")}</span>
                        </h2>
                        <form onSubmit={handleOtpSubmit}>
                            <div className={`${styles.otp__body} mb-5`}>
                                <OtpInput
                                    value={otp}
                                    onChange={setOtp}
                                    numInputs={6}
                                    renderSeparator={""}
                                    renderInput={(props) => <input {...props} disabled={loading} />}
                                />
                            </div>
                            {error && <div className={styles.error__message}>{error}</div>}
                            <SubmitButton
                                text={t("auth.verifyAccount", "Verify Account")}
                                loading={loading}
                            />
                        </form>
                    </>
                );

            case 2:
                return (
                    <>
                        <h2 className={styles.signup__title}>
                            {t("auth.pleaseSet", "Please set")}{" "}
                            <span>{t("auth.yourPassword", "your password")}</span>
                        </h2>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className={styles.password__body}>
                                <div className={styles.Login__container}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder={t("auth.password", "Password")}
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
                                text={t("auth.continue", "Continue")}
                                loading={loading}
                            />
                        </form>
                    </>
                );

            case 3:
                return (
                    <>
                        <h2 className={styles.signup__title}>
                            {t("auth.pleaseSet", "Please set")}{" "}
                            <span>{t("auth.yourPersonalInfo", "your personal info")}</span>
                        </h2>
                        <form onSubmit={handlePersonalInfoSubmit}>
                            <div className={styles.Login__container}>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder={t("auth.firstName", "First Name")}
                                    className={styles.custom__input}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.Login__container}>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder={t("auth.lastName", "Last Name")}
                                    className={styles.custom__input}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.Login__container}>
                                <input
                                    type="date"
                                    name="birthdate"
                                    value={formData.birthdate}
                                    onChange={handleInputChange}
                                    placeholder={t("auth.birthdate", "Birth Date")}
                                    className={styles.custom__input}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.dropdown__container}>
                                <select
                                    className={styles.dropdown__select}
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                >
                                    <option value="1">{t("auth.male", "Male")}</option>
                                    <option value="2">{t("auth.female", "Female")}</option>
                                </select>
                            </div>

                            {error && <div className={styles.error__message}>{error}</div>}

                            <SubmitButton
                                text={t("auth.submit", "Submit")}
                                loading={loading}
                            />
                        </form>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <section className={styles.signup__sec}>
            <div className={styles.signin__body}>
                <div>
                    <Image
                        alt="Authentication"
                        src={authimg}
                        className={styles.auth__img}
                        priority
                    />
                </div>
                <div>
                    <div className={styles.steps__container}>{renderSteps()}</div>
                    <div className={styles.login__body}>{renderCurrentStepContent()}</div>
                </div>
            </div>
        </section>
    );
};

export default SignupForm;