import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook to check if the current user has a username.
 * Returns a boolean and a function to manually show the modal.
 */
export function useUsernameCheck() {
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const hasUsername = !!(profile?.username && profile.username.length >= 3);

  /**
   * Checks if user has a username. If not, shows the modal.
   * Returns true if username exists, false otherwise.
   */
  const requireUsername = (): boolean => {
    if (!user) {
      return false;
    }

    if (!hasUsername) {
      setShowModal(true);
      return false;
    }

    return true;
  };

  /**
   * Manually show the username modal
   */
  const showUsernameModal = () => {
    setShowModal(true);
  };

  /**
   * Hide the username modal
   */
  const hideUsernameModal = () => {
    setShowModal(false);
  };

  return {
    hasUsername,
    showModal,
    requireUsername,
    showUsernameModal,
    hideUsernameModal,
  };
}

/**
 * Hook that automatically shows the username modal on mount if user doesn't have a username.
 * Useful for pages that absolutely require a username.
 */
export function useRequireUsername(options?: { autoShow?: boolean; message?: string }) {
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const autoShow = options?.autoShow ?? true;

  const hasUsername = !!(profile?.username && profile.username.length >= 3);

  useEffect(() => {
    if (autoShow && user && !hasUsername) {
      setShowModal(true);
    }
  }, [autoShow, user, hasUsername]);

  const hideModal = () => {
    setShowModal(false);
  };

  return {
    hasUsername,
    showModal,
    hideModal,
    message: options?.message,
  };
}
