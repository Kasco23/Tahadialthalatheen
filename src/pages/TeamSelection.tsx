import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LogoSelector from "../components/LogoSelector";
import toast from "react-hot-toast";

export default function TeamSelection() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedTeamLogo, setSelectedTeamLogo] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogoSelect = (logoUrl: string, teamName: string) => {
    setSelectedTeamLogo(logoUrl);
    setSelectedTeamName(teamName);
  };

  const handleContinue = async () => {
    if (!selectedTeamLogo || !selectedTeamName) {
      toast.error("Please select a team");
      return;
    }

    if (!user) {
      toast.error("You must be signed in");
      navigate("/login");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ team_url: selectedTeamName });
      toast.success("Team saved! Profile complete!");
      // Redirect to homepage
      navigate("/");
    } catch (error) {
      console.error("Error saving team_url:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save team",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Not Authenticated
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to complete your profile.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl">⚽</span>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-800">
            Select Your Favorite Team
          </h2>
          <p className="text-gray-600 text-center mt-2">
            Choose your favorite football team to show your support
          </p>
          <div className="mt-4 text-sm text-gray-500">Step 2 of 2</div>
        </div>

        <div className="mb-6 max-h-[60vh] overflow-y-auto">
          <LogoSelector
            selectedLogoUrl={selectedTeamLogo}
            onLogoSelect={handleLogoSelect}
            title=""
            useChromaGrid={true}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving || !selectedTeamLogo}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {saving ? "Saving..." : "Complete Profile ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
