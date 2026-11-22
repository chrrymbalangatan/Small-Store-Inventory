import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  CircleCheck,
  Cookie,
  CupSoda,
  Download,
  LayoutGrid,
  LoaderCircle,
  Minus,
  Monitor,
  Package,
  Pencil,
  Plus,
  Search,
  Smartphone,
  SprayCan,
  Sprout,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { CATALOG, CATEGORIES, peso, unitChoices, unitName } from "./catalog.js";
import { isValidPhoto } from "./api.js";

export const CATEGORY_ICONS = {
  Pantry: Sprout,
  Snacks: Cookie,
  Beverages: CupSoda,
  "Household Supplies": SprayCan,
};

export const categoryClass = (category) => category.split(" ")[0].toLowerCase();

export function CategoryTabs({ category, setCategory, products }) {
  return (
    <div className="category-tabs" aria-label="Filter products by category">
      {["All items", ...CATEGORIES].map((name) => {
        const Icon = CATEGORY_ICONS[name] || LayoutGrid;
        return (
          <button
            key={name}
            aria-pressed={category === name}
            className={category === name ? "active" : ""}
            onClick={() => setCategory(name)}
          >
            <Icon size={19} />
            {name}
            <span>{name === "All items" ? products.length : products.filter((p) => p.category === name).length}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ProductCard({ item, open, adjust, disabled, online }) {
  const off = disabled || !online;
  const status = item.stock === 0 ? "out" : item.stock <= item.lowStock ? "low" : "good";
  return (
    <article className="product-card">
      <div className="product-image">
        <span className={`product-category ${categoryClass(item.category)}`}>
          {item.category === "Household Supplies" ? "Household" : item.category}
        </span>
        <button
          className="product-photo-button"
          onClick={open}
          aria-label={`Edit ${item.name}, ${item.flavor}`}
          disabled={off}
        >
          {item.photo ? <img src={item.photo} alt={`${item.name} ${item.flavor}`} loading="lazy" /> : <Package size={70} />}
        </button>
        <button className="edit-item icon-btn" onClick={open} aria-label={`Edit ${item.name}`} disabled={off}>
          <Pencil size={17} />
        </button>
      </div>
      <div className="product-content">
        <h3>{item.name}</h3>
        <p className="flavor">{item.flavor || "Original / no variant"}</p>
        <div className="product-numbers">
          <div>
            <span className="number-label">Selling price</span>
            <strong>{peso(item.price)}</strong>
            <span className="unit-label">per {unitName(item.unit)}</span>
          </div>
          <div className="stock-number">
            <span className="number-label">Stock count</span>
            <strong>{item.stock}</strong>
            <span className="unit-label">
              {unitName(item.unit)}
              {item.stock === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="card-bottom">
          <span className={`stock-label ${status}`}>
            <span className="tiny-dot" />
            {status === "out" ? "Out of stock" : status === "low" ? "Low stock" : "In stock"}
          </span>
          <div className="stock-stepper">
            <button aria-label={`Remove one ${item.name}`} onClick={() => adjust(-1)} disabled={off || item.stock === 0}>
              <Minus size={18} />
            </button>
            <button aria-label={`Add one ${item.name}`} onClick={() => adjust(1)} disabled={off}>
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({ icon: Icon, title, text, action, actionText }) {
  return (
    <div className="empty">
      <span>
        <Icon size={32} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="btn secondary" onClick={action}>
          {actionText}
        </button>
      )}
    </div>
  );
}

const FOCUSABLE = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]';

export function Modal({ title, close, wide, children }) {
  const ref = useRef(null);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const nodes = ref.current.querySelectorAll(FOCUSABLE);
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (document.activeElement === ref.current || !ref.current.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    ref.current?.focus();
  }, [title]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section ref={ref} tabIndex={-1} className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">YOUR EVERYDAY STORE COMPANION</span>
            <h2 id="modal-title">{title || "Remove item?"}</h2>
          </div>
          <button className="icon-btn" aria-label="Close dialog" onClick={close}>
            <X size={25} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Picker({ items, choose, custom }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All items");
  const results = CATALOG.filter(
    (p) =>
      (category === "All items" || p.category === category) &&
      `${p.name} ${p.flavor}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <button className="custom-add" onClick={custom}>
        <span>
          <Plus size={24} />
        </span>
        <div>
          <strong>Add your own item</strong>
          <small>Take a photo and enter your product details</small>
        </div>
        <ArrowRight size={23} />
      </button>
      <div className="search-field">
        <Search />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" aria-label="Search catalog" />
      </div>
      <CategoryTabs category={category} setCategory={setCategory} products={CATALOG} />
      <div className="picker-grid">
        {results.map((p) => {
          const saved = items.find((i) => i.catalogId === p.catalogId);
          return (
            <button key={p.catalogId} className="picker-item" onClick={() => choose(saved || p)}>
              <img src={p.photo} alt="" />
              <span>
                <strong>{p.name}</strong>
                <small>{p.flavor}</small>
                <em>{saved ? "In inventory · Edit item" : p.category}</em>
              </span>
              {saved ? <Pencil size={20} /> : <Plus size={23} />}
            </button>
          );
        })}
      </div>
      {!results.length && <EmptyState icon={Search} title="No matching products" text="Try another flavor or add your own item." />}
    </>
  );
}

export function ItemForm({ item, busy, online, onSave, onDelete, onCancel }) {
  const units = unitChoices(item);
  const [form, setForm] = useState({
    ...item,
    unit: units.includes(item.unit) ? item.unit : units[0],
    price: (item.price / 100).toFixed(2),
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(item.photo);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => () => preview?.startsWith("blob:") && URL.revokeObjectURL(preview), [preview]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    const price = Number(form.price);
    const stock = Number(form.stock);
    const lowStock = Number(form.lowStock);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(lowStock) || lowStock < 0) {
      setError("Enter a valid peso price.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, price: Math.round(price * 100), stock, lowStock }, file);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const locked = busy || saving;
  return (
    <form onSubmit={submit} className="item-form">
      <div className="photo-upload">
        <div className="photo-preview">{preview ? <img src={preview} alt="Product preview" /> : <Camera size={36} />}</div>
        <div>
          <strong>Your product photo</strong>
          <label className="btn secondary upload-button">
            <Camera size={19} />
            {preview ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={locked}
              onChange={(e) => {
                const f = e.target.files[0];
                if (!f) return;
                if (!isValidPhoto(f)) {
                  setError("Choose a JPEG, PNG, or WebP photo smaller than 10 MB.");
                } else {
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                  setError("");
                }
              }}
            />
          </label>
          <small>JPEG, PNG or WebP</small>
        </div>
      </div>
      <div className="form-fields">
        <label className="full">
          Product name
          <input required maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Coca-Cola" disabled={locked} />
        </label>
        <label className="full">
          Flavor / variant
          <input maxLength={120} value={form.flavor} onChange={(e) => set("flavor", e.target.value)} placeholder="e.g. Lemon or Original" disabled={locked} />
        </label>
        <label className="full">
          Category
          <select value={form.category} onChange={(e) => set("category", e.target.value)} disabled={locked}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Selling unit
          <select value={form.unit} onChange={(e) => set("unit", e.target.value)} disabled={locked}>
            {units.map((u) => (
              <option key={u} value={u}>
                {unitName(u)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Selling price (₱)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="1000000"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            disabled={locked}
          />
        </label>
      </div>
      {error && (
        <div className="notice warning" role="alert">
          <CircleAlert size={21} />
          {error}
        </div>
      )}
      <div className="form-actions">
        {item.id && (
          <button type="button" className="delete-btn" disabled={locked || !online} onClick={onDelete}>
            <Trash2 size={20} />
            Remove
          </button>
        )}
        <button type="button" className="btn secondary" onClick={onCancel} disabled={locked}>
          Cancel
        </button>
        <button className="btn primary" type="submit" disabled={locked || !online}>
          {locked ? <LoaderCircle size={21} className="spin" /> : <Check size={21} />}{" "}
          {locked ? "Saving…" : item.id ? "Save changes" : "Add to inventory"}
        </button>
      </div>
    </form>
  );
}

export function DeleteConfirm({ item, busy, onCancel, onConfirm }) {
  const [error, setError] = useState("");
  return (
    <div className="prose">
      <div className="delete-symbol">
        <Trash2 size={32} />
      </div>
      <h3>Remove {item.name}?</h3>
      <p>{item.flavor} will be removed from your inventory. Catalog products can be added again anytime.</p>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn secondary" onClick={onCancel} disabled={busy}>
          Keep item
        </button>
        <button
          className="btn danger"
          disabled={busy}
          onClick={async () => {
            try {
              await onConfirm();
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          {busy ? "Removing…" : "Remove item"}
        </button>
      </div>
    </div>
  );
}

const GUIDE_STEPS = [
  ["01", "Pick your products", "Tap Add item to select a product or add your own item and photo."],
  [
    "02",
    "Count, price, and save",
    "Choose a category and selling unit. Enter the stock count and your own peso price, then save while online.",
  ],
  [
    "03",
    "Keep your shelves up to date",
    "Use + when new stock arrives and − when you sell one. Edit an item for larger changes.",
  ],
];

export function Guide({ start }) {
  return (
    <>
      <div className="guide-steps">
        {GUIDE_STEPS.map(([num, title, text]) => (
          <div className="guide-step" key={num}>
            <span>{num}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn primary" onClick={start}>
          Add my first item
          <ArrowRight size={20} />
        </button>
      </div>
    </>
  );
}

const INSTALL_STEPS = {
  Android: [
    "Open this app in Chrome on your Android phone.",
    "Tap the three-dot menu in the top-right corner.",
    "Choose “Add to home screen” or “Install app”, then confirm.",
  ],
  iPhone: [
    "Open this app in Safari on your iPhone.",
    "Tap the Share button (the square with an upward arrow).",
    "Scroll to “Add to Home Screen”, turn on “Open as Web App” if shown, then tap Add.",
  ],
  Desktop: [
    "Open this app in Chrome or Microsoft Edge on your computer.",
    "Click the install icon at the right of the address bar, or open the browser menu.",
    "Choose “Install Sari Sari” or “Install this site as an app”, then confirm.",
  ],
};

export function InstallGuide({ prompt, installed, onInstall }) {
  const [platform, setPlatform] = useState(/iPad|iPhone/.test(navigator.userAgent) ? "iPhone" : "Android");
  return (
    <>
      <div className="install-hero">
        <img src="/icons/icon-192.png" alt="Sari Sari home screen app icon" />
        <div>
          <h3>Your store. One tap away.</h3>
          <p>Give your inventory a place on your home screen.</p>
        </div>
      </div>
      {installed ? (
        <div className="notice sage-notice">
          <CircleCheck />
          Your app is already installed.
        </div>
      ) : (
        prompt && (
          <button className="btn primary install-now" onClick={onInstall}>
            <Download size={21} />
            Install Sari Sari
          </button>
        )
      )}
      <div className="install-tabs">
        {Object.keys(INSTALL_STEPS).map((name) => (
          <button key={name} className={platform === name ? "active" : ""} onClick={() => setPlatform(name)}>
            {name === "Desktop" ? <Monitor size={20} /> : <Smartphone size={20} />} {name}
          </button>
        ))}
      </div>
      <ol className="install-steps">
        {INSTALL_STEPS[platform].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="notice sage-notice">
        <WifiOff size={23} />
        <span>
          The catalog opens offline after your first visit. Reconnect to load your saved stock and save changes. Keep using the
          same browser or installed app to access your inventory.
        </span>
      </div>
    </>
  );
}
