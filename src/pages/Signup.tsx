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
      await signUp(
        formData.email,
        formData.password,
        formData.name || "Player",
        formData.team,
        formData.flag,
      );
      // Redirect to home page after successful signup
      navigate("/");
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create account",
      );
    } finally {
      setLoading(false);
    }
  };

  return <AuthForm mode="signup" onSubmit={handleSubmit} loading={loading} error={error} />;
}
