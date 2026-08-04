export interface PresentationSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

const SESSION_ID_KEY = "crisiseye_user_id";
const SESSION_NAME_KEY = "crisiseye_user_name";
const SESSION_ROLE_KEY = "crisiseye_user_role";
const SESSION_EMAIL_KEY = "crisiseye_user_email";

function normalizeEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : `${trimmed}@citizen.local`;
}

export function createPresentationSession(input: {
  name: string;
  email: string;
  role: string;
}): PresentationSession {
  const email = normalizeEmail(input.email);
  const role = input.role.trim().toLowerCase() || "citizen";
  const name = input.name.trim() || email.split("@")[0];
  return {
    id: `presentation:${role}:${email}`,
    name,
    email,
    role,
  };
}

export function savePresentationSession(session: PresentationSession) {
  localStorage.setItem(SESSION_ID_KEY, session.id);
  localStorage.setItem(SESSION_NAME_KEY, session.name);
  localStorage.setItem(SESSION_ROLE_KEY, session.role);
  localStorage.setItem(SESSION_EMAIL_KEY, session.email);
}

export function readPresentationSession(): PresentationSession | null {
  const id = localStorage.getItem(SESSION_ID_KEY);
  const role = localStorage.getItem(SESSION_ROLE_KEY);
  if (!id || !role) return null;

  const email = localStorage.getItem(SESSION_EMAIL_KEY);
  const name = localStorage.getItem(SESSION_NAME_KEY);
  const normalizedEmail = normalizeEmail(email || role);

  return {
    id,
    role,
    email: normalizedEmail,
    name: name || normalizedEmail.split("@")[0],
  };
}

export function clearPresentationSession() {
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(SESSION_NAME_KEY);
  localStorage.removeItem(SESSION_ROLE_KEY);
  localStorage.removeItem(SESSION_EMAIL_KEY);
}
