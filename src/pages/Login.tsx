import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthForm, { AuthFormData } from "../components/AuthForm";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: AuthFormData) => {
    setLoading(true);
    setError(null);

    try {
      await signIn(formData.email, formData.password, formData.keepSignedIn);
      // Redirect to home page after successful login
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to sign in",
      );
    } finally {
      setLoading(false);
    }
  };

  return <AuthForm mode="login" onSubmit={handleSubmit} loading={loading} error={error} />;
}
