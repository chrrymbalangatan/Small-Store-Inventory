import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Download,
  LayoutDashboard,
  LayoutGrid,
  List,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shapes,
  SlidersHorizontal,
  Sprout,
  Store,
  Sun,
  WifiOff,
  X,
} from "lucide-react";
import { BLANK_ITEM, CATALOG, CATEGORIES, formatDate } from "./catalog.js";
import { api, preparePhoto } from "./api.js";
import {
  CATEGORY_ICONS,
  CategoryTabs,
  DeleteConfirm,
  EmptyState,
  Guide,
  InstallGuide,
  ItemForm,
  Modal,
  Picker,
  ProductCard,
  categoryClass,
} from "./components.jsx";

const PAGE_SIZE = 12;

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "categories", label: "Categories", icon: Shapes },
];

const HEADINGS = {
  inventory: ["Stock Inventory", "Keep your products, prices, and stock organized."],
  overview: ["Stock Inventory", "Small daily checks. A well-stocked store."],
  categories: ["A place for every product", "Find your essentials, one shelf at a time."],
};

const MODAL_TITLES = {
  picker: "Add to your store",
  guide: "Your store, ready in 3 steps",
  install: "Keep your store close",
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All items");
  const [stockFilter, setStockFilter] = useState("all");
  const [sort, setSort] = useState("added");
  const [layout, setLayout] = useState("grid");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(window.matchMedia("(display-mode: standalone)").matches);

  // Catalog merged with saved items — used by the Categories page only.
  const catalogView = useMemo(
    () => [...CATALOG.map((p) => items.find((i) => i.catalogId === p.catalogId) || p), ...items.filter((i) => !i.catalogId)],
    [items],
  );
  const unavailable = loading || !!loadError;

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api("/inventory");
      setItems(data.items);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const goOnline = () => {
      setOnline(true);
      load();
    };
    const goOffline = () => setOnline(false);
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => setVisible(PAGE_SIZE), [category, query, stockFilter, sort, page]);

  function go(id) {
    setPage(id);
    setQuery("");
    setCategory("All items");
    setStockFilter("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function mutate(path, options, message, closeModal = true) {
    setBusy(true);
    try {
      await api(path, options);
      if (closeModal) setModal(null);
      setToast(message);
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function adjust(item, delta) {
    if (busy || !online) return;
    try {
      await mutate(`/items/${item.id}/stock`, { method: "POST", body: JSON.stringify({ delta }) }, "Stock updated.", false);
    } catch (err) {
      setToast(err.message);
    }
  }

  function openItem(item) {
    if (unavailable) setToast("Connect and refresh your inventory before making changes.");
    else setModal({ type: "item", item });
  }

  async function save(item, file) {
    setBusy(true);
    try {
      let photo = item.photo;
      if (file) {
        photo = (await api("/photos", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: await preparePhoto(file) })).photo;
      }
      return await mutate(
        item.id ? `/items/${item.id}` : "/items",
        { method: item.id ? "PUT" : "POST", body: JSON.stringify({ ...item, photo }) },
        item.id ? "Item updated." : "Item added to your inventory.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function install() {
    try {
      await installPrompt.prompt();
      if ((await installPrompt.userChoice).outcome === "accepted") setToast("Follow your browser’s installation prompt.");
    } catch {
      setToast("Use the installation instructions for your browser below.");
    } finally {
      setInstallPrompt(null);
    }
  }

  const q = query.toLowerCase();

  // Inventory page: only products the store has added.
  const shown = items.filter(
    (i) =>
      (category === "All items" || i.category === category) &&
      `${i.name} ${i.flavor} ${i.category}`.toLowerCase().includes(q) &&
      (stockFilter === "all" ||
        (stockFilter === "attention" && i.stock <= i.lowStock) ||
        (stockFilter === "low" && i.stock > 0 && i.stock <= i.lowStock) ||
        (stockFilter === "out" && i.stock === 0)),
  );
  if (sort === "name") shown.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "stock") shown.sort((a, b) => b.stock - a.stock);

  const matchingCategories = CATEGORIES.filter(
    (c) =>
      c.toLowerCase().includes(q) ||
      catalogView.some((p) => p.category === c && `${p.name} ${p.flavor}`.toLowerCase().includes(q)),
  );

  const filtersActive = !!query || category !== "All items" || stockFilter !== "all";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => go("inventory")} aria-label="Sari Sari home">
          <span className="brand-icon">
            <Store size={35} strokeWidth={1.7} />
          </span>
          <span>
            <strong>
              SARI SARI<span>STORE</span>
            </strong>
          </span>
        </button>
        <span className="nav-label">YOUR STORE</span>
        <nav aria-label="Main navigation">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              aria-current={page === n.id ? "page" : undefined}
            >
              <n.icon size={23} />
              <span>{n.label}</span>
              {n.id === "inventory" && <b>{items.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="little-store">
            <img src="/store-illustration.svg" alt="" />
            <strong>Care for your store.</strong>
            <p>
              A little help for your
              <br />
              everyday business.
            </p>
          </div>
          <button className="nav-item" onClick={() => setModal({ type: "guide" })}>
            <BookOpen size={22} />
            Getting started
            <ArrowUpRight size={17} className="push-right" />
          </button>
          <button className="nav-item" onClick={() => setModal({ type: "install" })}>
            <Download size={22} />
            Install app
            <ArrowUpRight size={17} className="push-right" />
          </button>
          <div className="browser-note">
            <span className="tiny-dot" />
            Made for your everyday.
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <Store /> SARI SARI
          </div>
          <div className="greeting">
            <Sun size={21} />
            Welcome to your store!
          </div>
          <div className="topbar-right">
            <span className={`connection ${online ? "" : "offline"}`}>
              {online ? (
                <>
                  <span className="tiny-dot" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff size={17} />
                  Offline
                </>
              )}
            </span>
            <span className="today">{formatDate(Date.now())}</span>
            <button className="help-icon icon-btn" aria-label="Open quick-start guide" onClick={() => setModal({ type: "guide" })}>
              <CircleHelp size={23} />
            </button>
            <button
              className="refresh-icon install-icon icon-btn"
              aria-label="Install app"
              title="Install app"
              onClick={() => setModal({ type: "install" })}
            >
              <Download size={20} />
              <span>Install</span>
            </button>
          </div>
        </header>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className={page === n.id ? "active" : ""}>
              <n.icon size={23} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">SARI SARI STORE</div>
              <h1>{HEADINGS[page][0]}</h1>
              <p>{HEADINGS[page][1]}</p>
            </div>
            {(page === "inventory" || page === "overview") && (
              <button className="btn primary add-main" disabled={unavailable || !online} onClick={() => setModal({ type: "picker" })}>
                <Plus size={23} />
                Add item
              </button>
            )}
          </div>

          {!online && (
            <div className="notice warning">
              <WifiOff />
              <div>
                <strong>You’re offline.</strong> The catalog is available. Reconnect to load your saved inventory and save changes.
              </div>
            </div>
          )}
          {loadError && online && (
            <div className="notice warning" role="alert">
              <CircleAlert />
              <span>{loadError} Saved stock is unavailable. Your product catalog is still available.</span>
              <button onClick={load} className="text-btn">
                <RefreshCw size={18} />
                Retry
              </button>
            </div>
          )}

          {page === "inventory" && (
            <>
              <div className="section-heading">
                <div className="section-title">
                  <h2>All your store essentials</h2>
                  <span className="count-badge">{items.length} items</span>
                </div>
              </div>
              {items.length > 0 ? (
                <>
                  <CategoryTabs category={category} setCategory={setCategory} products={items} />
                  <div className="inventory-toolbar">
                    <div className="search-field">
                      <Search size={23} />
                      <input
                        aria-label="Search products"
                        placeholder="Search products, flavors, or categories…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      {query && (
                        <button className="icon-btn" onClick={() => setQuery("")} aria-label="Clear search">
                          <X size={19} />
                        </button>
                      )}
                    </div>
                    <label className="select-control">
                      <SlidersHorizontal size={20} />
                      <select aria-label="Filter by stock" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                        <option value="all">All stock</option>
                        <option value="attention">Needs restock</option>
                        <option value="low">Low stock</option>
                        <option value="out">Out of stock</option>
                      </select>
                      <ChevronDown size={16} />
                    </label>
                    <div className="layout-switch">
                      <button
                        aria-label="Grid view"
                        aria-pressed={layout === "grid"}
                        className={layout === "grid" ? "selected" : ""}
                        onClick={() => setLayout("grid")}
                      >
                        <LayoutGrid size={21} />
                      </button>
                      <button
                        aria-label="List view"
                        aria-pressed={layout === "list"}
                        className={layout === "list" ? "selected" : ""}
                        onClick={() => setLayout("list")}
                      >
                        <List size={22} />
                      </button>
                    </div>
                  </div>
                  <div className="results-line">
                    <span>
                      Showing {Math.min(visible, shown.length)} of {shown.length} items
                    </span>
                    <label>
                      Sort by:{" "}
                      <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="added">Recently added</option>
                        <option value="name">Name A–Z</option>
                        <option value="stock">Stock count</option>
                      </select>
                    </label>
                  </div>
                  <div className={`product-grid ${layout === "list" ? "list-view" : ""}`}>
                    {shown.slice(0, visible).map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        online={online}
                        disabled={busy || unavailable}
                        open={() => openItem(item)}
                        adjust={(d) => adjust(item, d)}
                      />
                    ))}
                  </div>
                  {!shown.length && filtersActive && (
                    <EmptyState
                      icon={Search}
                      title="No products on this shelf"
                      text="Try another search or stock filter, or add a new item."
                      action={() => {
                        setQuery("");
                        setCategory("All items");
                        setStockFilter("all");
                      }}
                      actionText="Clear filters"
                    />
                  )}
                  {shown.length > visible && (
                    <button className="btn load-more" onClick={() => setVisible(visible + PAGE_SIZE)}>
                      Show more products
                      <ChevronDown size={20} />
                    </button>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={Package}
                  title={loading ? "Loading your shelves…" : "Your shelves are ready"}
                  text={
                    loading
                      ? "Getting your saved products."
                      : "Tap Add item to choose your products. They’ll appear here once you add them."
                  }
                  action={!unavailable && online ? () => setModal({ type: "picker" }) : undefined}
                  actionText="Add item"
                />
              )}
            </>
          )}

          {page === "overview" && (
            <>
              <section className="quick-banner">
                <span className="quick-icon">
                  <Sprout size={29} />
                </span>
                <div>
                  <h2>A good day starts with a little order.</h2>
                  <p>New here? Set up your store in 3 easy steps.</p>
                </div>
                <button onClick={() => setModal({ type: "guide" })}>
                  Show me how
                  <ArrowRight size={20} />
                </button>
              </section>
              <section className="overview-grid single">
                <div className="panel">
                  <div className="section-heading">
                    <h2>Your shelves</h2>
                    <Shapes size={23} />
                  </div>
                  {CATEGORIES.map((c) => {
                    const onShelf = items.filter((i) => i.category === c);
                    const Icon = CATEGORY_ICONS[c];
                    return (
                      <button
                        key={c}
                        className="shelf-row"
                        onClick={() => {
                          go("inventory");
                          setCategory(c);
                        }}
                      >
                        <span className={`category-icon ${categoryClass(c)}`}>
                          <Icon size={24} />
                        </span>
                        <span>
                          <strong>{c}</strong>
                          <small>
                            {onShelf.length} products · {onShelf.reduce((s, i) => s + i.stock, 0)} total units
                          </small>
                        </span>
                        <ChevronRight className="push-right" size={21} />
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {page === "categories" && (
            <>
              <div className="search-field category-search">
                <Search />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search categories or products…"
                  aria-label="Search categories"
                />
              </div>
              <div className="category-grid">
                {matchingCategories.map((c) => {
                  const Icon = CATEGORY_ICONS[c];
                  const products = catalogView.filter((p) => p.category === c);
                  return (
                    <button
                      key={c}
                      className="category-card"
                      onClick={() => {
                        go("inventory");
                        setCategory(c);
                      }}
                    >
                      <div className={`category-cover ${categoryClass(c)}`}>
                        <Icon className="category-background-icon" />
                        <div className="category-photo-row">
                          {products.slice(0, 3).map((p) => (
                            <img key={p.id || `c${p.catalogId}`} src={p.photo} alt="" />
                          ))}
                        </div>
                      </div>
                      <div className="category-card-text">
                        <h2>{c}</h2>
                        <p>
                          {products.length} products · {items.filter((i) => i.category === c).length} in inventory
                        </p>
                        <ArrowUpRight size={24} />
                      </div>
                    </button>
                  );
                })}
              </div>
              {!matchingCategories.length && (
                <EmptyState
                  icon={Search}
                  title="No matching categories"
                  text="Try another category, product name, or flavor."
                  action={() => setQuery("")}
                  actionText="Clear search"
                />
              )}
            </>
          )}

          <footer className="page-footer">
            <span>
              <Store size={18} />A little help for your everyday business.
            </span>
          </footer>
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={22} />
          {toast}
          <button className="icon-btn" onClick={() => setToast("")} aria-label="Dismiss notification">
            <X size={18} />
          </button>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.type === "item" ? (modal.item?.id ? "Edit item" : "Add item") : MODAL_TITLES[modal.type]}
          close={() => !busy && setModal(null)}
          wide={modal.type === "picker"}
        >
          {modal.type === "picker" && (
            <Picker
              items={items}
              choose={(item) => setModal({ type: "item", item })}
              custom={() => setModal({ type: "item", item: { ...BLANK_ITEM } })}
            />
          )}
          {modal.type === "item" && (
            <ItemForm
              key={modal.item.id || modal.item.catalogId || "custom"}
              item={modal.item}
              busy={busy}
              online={online}
              onSave={save}
              onDelete={() => setModal({ type: "delete", item: modal.item })}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === "delete" && (
            <DeleteConfirm
              item={modal.item}
              busy={busy}
              onCancel={() => setModal({ type: "item", item: modal.item })}
              onConfirm={() =>
                mutate(
                  `/items/${modal.item.id}`,
                  { method: "DELETE", body: JSON.stringify({ version: modal.item.version }) },
                  "Item removed.",
                )
              }
            />
          )}
          {modal.type === "guide" && (
            <Guide start={() => setModal({ type: "picker" })} />
          )}
          {modal.type === "install" && <InstallGuide prompt={installPrompt} installed={installed} onInstall={install} />}
        </Modal>
      )}
    </div>
  );
}
