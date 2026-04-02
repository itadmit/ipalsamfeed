import { useAuthStore } from "./auth";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://ipalsam.com";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

/** מפרש תגובת fetch כ-JSON; אם השרת מחזיר HTML (למשל 404 מ-NEXT) — זורק הודעה ברורה במקום כשל JSON גנרי */
export async function parseResponseJson<T = Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return {} as T;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    if (!res.ok) {
      throw new Error(
        `השרת החזיר ${res.status} בלי JSON. ייתכן שכתובת ה-API שגויה או ש-/api/mobile לא פרוס ב-${API_BASE.replace(/^https?:\/\//, "")}.`
      );
    }
    throw new Error("תגובת השרת אינה JSON תקין");
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}/api/mobile${path}`, config);

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Unauthorized");
  }

  const data = await parseResponseJson<Record<string, unknown> & T>(res);

  if (!res.ok) {
    const err =
      typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(err);
  }

  return data as T;
}

export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${API_BASE}/api/mobile${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Unauthorized");
  }

  const data = await parseResponseJson<Record<string, unknown> & T>(res);
  if (!res.ok) {
    const err =
      typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}

/** העלאת קובץ עם דיווח התקדמות — XMLHttpRequest (תומך upload progress בנייטיב) */
export function apiUploadWithProgress<T = unknown>(
  path: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<T> {
  const token = useAuthStore.getState().token;
  const url = `${API_BASE}/api/mobile${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        const pct = Math.min(99, Math.round((100 * ev.loaded) / ev.total));
        onProgress(pct);
      }
    });

    xhr.onload = () => {
      const text = xhr.responseText?.trim() ?? "";
      if (xhr.status === 401) {
        useAuthStore.getState().logout();
        reject(new Error("Unauthorized"));
        return;
      }
      let data: Record<string, unknown>;
      try {
        data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        reject(new Error("תגובת השרת אינה JSON תקין"));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(data as T);
        return;
      }
      const err =
        typeof data.error === "string" ? data.error : `HTTP ${xhr.status}`;
      reject(new Error(err));
    };

    xhr.onerror = () => reject(new Error("שגיאת רשת"));
    xhr.send(formData as unknown as XMLHttpRequestBodyInit);
  });
}
