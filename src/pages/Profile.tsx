import { useState, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import AvatarEditor from "../components/AvatarEditor";
import toast from "react-hot-toast";
import { Flag } from "../components/Flag";
import { getFlagName } from "../lib/flagHelper";
import { StadiumBackground } from "../components/StadiumBackground";
import StatisticsTab from "../components/profile/StatisticsTab";
import FriendsTab from "../components/profile/FriendsTab";
import {
  UserIcon,
  ChartBarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "profile" | "statistics" | "friends"
  >("profile");

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowAvatarEditor(true);
    };

    reader.readAsDataURL(file);
  };

  const handleAvatarComplete = async (croppedImage: Blob) => {
    try {
      setUploading(true);
      setShowAvatarEditor(false);

      const fileExt = "jpg";
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload cropped image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImage, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar"
      );
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const handleAvatarCancel = () => {
    setShowAvatarEditor(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate username
    if (!formData.username || formData.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(formData.username)) {
      toast.error(
        "Username can only contain lowercase letters, numbers, and underscores"
      );
      return;
    }

    setSaving(true);

    try {
      await updateProfile({
        name: formData.name || undefined,
        username: formData.username,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";

      // Check for unique constraint violation
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("unique")
      ) {
        toast.error(
          "This username is already taken. Please choose another one."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
      toast.success("Signed out successfully!");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumber = /[0-9]/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error("Password must contain uppercase, lowercase, and numbers");
      return;
    }

    setChangingPassword(true);
    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully!");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <StadiumBackground variant="bright" animated={true}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Not Authenticated
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to view your profile.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              Go to Login
            </button>
          </div>
        </div>
      </StadiumBackground>
    );
  }

  return (
    <StadiumBackground variant="bright" animated={true}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-all disabled:bg-gray-400"
              >
                {uploading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                    />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-800">
              {profile?.name || "Player"}
            </h2>
            <p className="text-gray-600 text-center mt-1">
              @{profile?.username || user.email}
            </p>
            <p className="text-gray-500 text-center text-sm">{user.email}</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b-2 border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-3 px-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "profile"
                  ? "border-b-4 border-green-600 text-green-600 -mb-0.5"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <UserIcon className="h-5 w-5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`flex-1 py-3 px-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "statistics"
                  ? "border-b-4 border-green-600 text-green-600 -mb-0.5"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <ChartBarIcon className="h-5 w-5" />
              Statistics
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-3 px-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "friends"
                  ? "border-b-4 border-green-600 text-green-600 -mb-0.5"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <UserGroupIcon className="h-5 w-5" />
              Friends
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "profile" && (
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed transition-all duration-200 outline-none"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
                    placeholder="Enter your name"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      @
                    </span>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        // Only allow lowercase letters, numbers, and underscores
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "");
                        setFormData({ ...formData, username: value });
                      }}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
                      placeholder="username"
                      minLength={3}
                      maxLength={20}
                      pattern="[a-z0-9_]{3,20}"
                      disabled={saving}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    3-20 characters: lowercase letters, numbers, and underscores
                    only. Used for friend requests.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="team"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Favorite Team
                  </label>
                  <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                    {profile?.team ? (
                      <div className="flex items-center gap-3">
                        {/* Show team logo if it's a URL */}
                        {profile.team.startsWith("http") && (
                          <img
                            src={profile.team}
                            alt="Team logo"
                            className="w-8 h-8 object-contain"
                            style={{
                              imageRendering: "-webkit-optimize-contrast",
                              shapeRendering: "geometricPrecision",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {/* Extract team name from URL or show as-is */}
                          {profile.team.startsWith("http")
                            ? decodeURIComponent(
                                profile.team
                                  .split("/")
                                  .pop()
                                  ?.replace(".svg", "")
                                  .replace(/-/g, " ") || profile.team
                              )
                                .split(" ")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")
                            : profile.team}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No team selected
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="flag"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Country
                  </label>
                  <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                    {profile?.flag ? (
                      <div className="flex items-center gap-3">
                        <Flag code={profile.flag} className="text-2xl" />
                        <span className="text-sm font-medium text-gray-700">
                          {getFlagName(profile.flag)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No country selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sign Out
                  </button>
                </div>
              </form>

              {/* Password Change Section */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Security Settings
                  </h3>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="text-sm text-green-600 hover:text-green-700 font-semibold"
                  >
                    {showPasswordChange ? "Cancel" : "Change Password"}
                  </button>
                </div>

                {showPasswordChange && (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        disabled={changingPassword}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 8 characters with uppercase, lowercase,
                        and numbers
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none"
                        placeholder="Confirm new password"
                        required
                        minLength={8}
                        disabled={changingPassword}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {changingPassword
                        ? "Changing Password..."
                        : "Update Password"}
                    </button>
                  </form>
                )}
              </div>

              {/* Re-onboarding Section */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Update Preferences
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/select-flag")}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>🏴</span>
                    Change Flag
                  </button>
                  <button
                    onClick={() => navigate("/select-team")}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>⚽</span>
                    Change Team
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate("/")}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "statistics" && (
            <div className="mt-4">
              <StatisticsTab />
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div className="mt-4">
              <FriendsTab />
            </div>
          )}
        </div>

        {/* Avatar Editor Modal */}
        {showAvatarEditor && selectedImage && (
          <AvatarEditor
            imageSrc={selectedImage}
            onComplete={handleAvatarComplete}
            onCancel={handleAvatarCancel}
          />
        )}
      </div>
    </StadiumBackground>
  );
}
