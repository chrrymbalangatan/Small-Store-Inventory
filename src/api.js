export async function api(path, options = {}) {
  if (!navigator.onLine) throw new Error("You’re offline. Reconnect to save your changes.");
  const res = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("The store connection is unavailable. Please try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO = 10 * 1024 * 1024;
export const isValidPhoto = (file) => PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO;

// Downscale to max 1200px and re-encode as JPEG before upload.
export async function preparePhoto(file) {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error("Choose a JPEG, PNG, or WebP photo.");
  if (file.size > MAX_PHOTO) throw new Error("Choose a photo smaller than 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("This photo could not be opened. Try another image."));
      image.src = url;
    });
    const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not prepare this photo."))), "image/jpeg", 0.86),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
