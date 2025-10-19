import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthForm, { AuthFormData } from "../components/AuthForm";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: AuthFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.username || formData.username.length < 3) {
        throw new Error("Username must be at least 3 characters long");
      }

      await signUp(
        formData.email,
        formData.password,
        formData.name || "Player",
        formData.username,
      );
      // Redirect to flag selection page after successful signup
      navigate("/select-flag");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      mode="signup"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
}
