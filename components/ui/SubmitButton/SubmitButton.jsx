import React from "react";
import { useFormStatus } from "react-dom";
import styles from "./submitbtn.module.css";

const SubmitButton = ({ text, loading }) => {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.button} disabled={loading}>
      {loading ? "Loading..." : text}
    </button>
  );
};

export default SubmitButton;
