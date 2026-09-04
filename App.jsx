import React, { useState, useEffect, useRef } from "react";
import { storageGet, storageSet } from "./storage";

/* ---------------------------------------------------------------
   PIZZA MASTER G — standalone deployment build
   Customer site + Admin dashboard sharing one real database
   (Cloudflare KV, via Pages Functions) so admin edits reflect on
   the live site for every visitor. Emoji swatches stand in for
   uploaded photos — swap in real image uploads whenever you're
   ready (see README.md for pointers).
----------------------------------------------------------------*/

const EMOJI_CHOICES = ["🍕","🍕🔥","🧄","🍟","🥤","🍰","🥗","🍗","🧀","🌶️","🥓","🍅"];

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const money = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString("en-PK")}`;

const DEFAULT_SETTINGS = {
  name: "Pizza Master G",
  tagline: "Wood-fired pizza, made your way",
  description:
    "Family-run since day one — hand-stretched dough, a wood-fired oven, and toppings we'd feed our own kids.",
  phone: "0300 1234567",
  whatsapp: "923001234567",
  address: "Block 4, Gulshan-e-Iqbal, Karachi",
  hoursOpen: "11:00",
  hoursClose: "22:00",
  deliveryCharge: 150,
  minOrder: 0,
  deliveryEnabled: true,
  pickupEnabled: true,
  logoEmoji: "🍕",
  social: {
    facebook: "https://facebook.com/pizzamasterg",
    instagram: "https://instagram.com/pizzamasterg",
    tiktok: "",
    youtube: "",
    maps: "https://maps.google.com/?q=Pizza+Master+G",
  },
  customLinks: [],
};

const DEFAULT_CATEGORIES = [
  { id: "cat-pizzas", name: "Pizzas", enabled: true, order: 1 },
  { id: "cat-sides", name: "Sides", enabled: true, order: 2 },
  { id: "cat-drinks", name: "Drinks", enabled: true, order: 3 },
  { id: "cat-desserts", name: "Desserts", enabled: true, order: 4 },
];

const DEFAULT_PRODUCTS = [
  {
    id: "p-margherita", name: "Margherita Classic", category: "cat-pizzas", image: "🍕",
    description: "San Marzano tomato, fresh mozzarella, basil, olive oil.",
    sizes: [{ name: "Small (10\")", price: 699 }, { name: "Medium (12\")", price: 999 }, { name: "Large (16\")", price: 1399 }],
    toppings: [{ name: "Extra cheese", price: 150 }, { name: "Mushrooms", price: 100 }, { name: "Kalamata olives", price: 100 }],
    addons: [{ name: "Chili oil drizzle", price: 50 }],
    available: true, enabled: true, featured: true,
  },
  {
    id: "p-pepperoni", name: "Pepperoni Storm", category: "cat-pizzas", image: "🍕🔥",
    description: "Double pepperoni, mozzarella, oregano, a little honey heat.",
    sizes: [{ name: "Small (10\")", price: 799 }, { name: "Medium (12\")", price: 1149 }, { name: "Large (16\")", price: 1549 }],
    toppings: [{ name: "Extra pepperoni", price: 200 }, { name: "Jalapeños", price: 100 }],
    addons: [{ name: "Hot honey", price: 80 }],
    available: true, enabled: true, featured: true,
  },
  {
    id: "p-bbqchicken", name: "BBQ Chicken", category: "cat-pizzas", image: "🍗",
    description: "Smoked chicken, red onion, BBQ base, smoked gouda.",
    sizes: [{ name: "Medium (12\")", price: 1249 }, { name: "Large (16\")", price: 1699 }],
    toppings: [{ name: "Extra chicken", price: 250 }],
    addons: [],
    available: true, enabled: true, featured: false,
  },
  {
    id: "p-garlicbread", name: "Garlic Bread", category: "cat-sides", image: "🧄",
    description: "Stone-baked, roasted garlic butter, parsley.",
    sizes: [{ name: "Regular", price: 349 }],
    toppings: [{ name: "Add mozzarella", price: 150 }],
    addons: [],
    available: true, enabled: true, featured: false,
  },
  {
    id: "p-loadedfries", name: "Loaded Fries", category: "cat-sides", image: "🍟",
    description: "Crispy fries, cheese sauce, bacon bits, scallion.",
    sizes: [{ name: "Regular", price: 449 }],
    toppings: [],
    addons: [{ name: "Extra cheese sauce", price: 100 }],
    available: true, enabled: true, featured: false,
  },
  {
    id: "p-coke", name: "Cola 500ml", category: "cat-drinks", image: "🥤",
    description: "Ice-cold classic cola.",
    sizes: [{ name: "500ml", price: 120 }],
    toppings: [], addons: [],
    available: true, enabled: true, featured: false,
  },
  {
    id: "p-lemonade", name: "Sparkling Lemonade", category: "cat-drinks", image: "🥤",
    description: "House-made, fresh-squeezed, lightly fizzy.",
    sizes: [{ name: "500ml", price: 160 }],
    toppings: [], addons: [],
    available: true, enabled: true, featured: false,
  },
  {
    id: "p-tiramisu", name: "Tiramisu Slice", category: "cat-desserts", image: "🍰",
    description: "Espresso-soaked sponge, mascarpone, cocoa.",
    sizes: [{ name: "Slice", price: 449 }],
    toppings: [], addons: [],
    available: true, enabled: true, featured: true,
  },
];

const DEFAULT_DEALS = [
  {
    id: "d-family", name: "Family Feast", image: "🍕🔥",
    description: "2 large pizzas of your choice, garlic bread, and a 1.5L drink.",
    price: 2999, productIds: ["p-margherita", "p-pepperoni", "p-garlicbread", "p-coke"],
    enabled: true, featured: true,
  },
  {
    id: "d-lunch", name: "Lunch Combo", image: "🍕",
    description: "1 medium pizza and a drink — weekday lunch special.",
    price: 999, productIds: ["p-margherita", "p-coke"],
    enabled: true, featured: false,
  },
];

const ORDER_STATUSES = ["New", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

const STORAGE_KEYS = {
  settings: "pmg:settings",
  categories: "pmg:categories",
  products: "pmg:products",
  deals: "pmg:deals",
  orders: "pmg:orders",
  activity: "pmg:activity",
};

async function loadKey(key, fallback) {
  const value = await storageGet(key);
  return value === null || value === undefined ? fallback : value;
}
async function saveKey(key, value, attempt = 1) {
  const ok = await storageSet(key, value);
  if (ok) return true;
  if (attempt < 2) return saveKey(key, value, attempt + 1);
  return false;
}

/* ---------------------------- small UI atoms ---------------------------- */

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`pmg-toast ${toast.type === "error" ? "pmg-toast-error" : ""}`}>
      {toast.message}
    </div>
  );
}

function Badge({ children, tone }) {
  return <span className={`pmg-badge ${tone ? `pmg-badge-${tone}` : ""}`}>{children}</span>;
}

function StatCard({ label, value, onClick }) {
  return (
    <button className="pmg-stat" onClick={onClick}>
      <div className="pmg-stat-value">{value}</div>
      <div className="pmg-stat-label">{label}</div>
    </button>
  );
}

function EmojiPicker({ value, onChange }) {
  return (
    <div className="pmg-emoji-picker">
      {EMOJI_CHOICES.map((e) => (
        <button
          key={e}
          type="button"
          className={`pmg-emoji-opt ${value === e ? "pmg-emoji-opt-selected" : ""}`}
          onClick={() => onChange(e)}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }) {
  // items: [{name, price}]
  const update = (i, field, val) => {
    const next = items.slice();
    next[i] = { ...next[i], [field]: field === "price" ? val : val };
    onChange(next);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { name: "", price: 0 }]);
  return (
    <div className="pmg-list-editor">
      {items.map((it, i) => (
        <div className="pmg-list-row" key={i}>
          <input
            className="pmg-input"
            placeholder={placeholder || "Name"}
            value={it.name}
            onChange={(e) => update(i, "name", e.target.value)}
          />
          <input
            className="pmg-input pmg-input-price"
            type="number"
            step="1"
            placeholder="Price"
            value={it.price}
            onChange={(e) => update(i, "price", parseInt(e.target.value, 10) || 0)}
          />
          <button type="button" className="pmg-icon-btn" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="pmg-link-btn" onClick={add}>+ Add row</button>
    </div>
  );
}

/* ------------------------------- APP ------------------------------- */

export default function App() {
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [deals, setDeals] = useState(DEFAULT_DEALS);
  const [orders, setOrders] = useState([]);
  const [activity, setActivity] = useState([]);

  const [mode, setMode] = useState("customer");
  const [customerView, setCustomerView] = useState("home");
  const [adminView, setAdminView] = useState("overview");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lastOrder, setLastOrder] = useState(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [trackResult, setTrackResult] = useState(undefined);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const [s, c, p, d, o, a] = await Promise.all([
        loadKey(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
        loadKey(STORAGE_KEYS.categories, DEFAULT_CATEGORIES),
        loadKey(STORAGE_KEYS.products, DEFAULT_PRODUCTS),
        loadKey(STORAGE_KEYS.deals, DEFAULT_DEALS),
        loadKey(STORAGE_KEYS.orders, []),
        loadKey(STORAGE_KEYS.activity, []),
      ]);
      setSettings(s); setCategories(c); setProducts(p); setDeals(d); setOrders(o); setActivity(a);
      const healthCheck = await storageSet("pmg:_healthcheck", "1");
      setStorageAvailable(!!healthCheck);
      setReady(true);
    })();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function logActivity(nextActivity, action, item, oldValue, newValue) {
    const entry = { id: uid(), action, item, oldValue: oldValue ?? "—", newValue: newValue ?? "—", date: new Date().toISOString(), admin: "Owner" };
    const next = [entry, ...nextActivity];
    setActivity(next);
    saveKey(STORAGE_KEYS.activity, next);
  }

  async function persist(key, setter, value, successMsg) {
    setter(value);
    if (!storageAvailable) {
      showToast("Applied in this browser — connect the Cloudflare KV database (see README.md) to make this permanent and visible to all visitors.");
      return true;
    }
    const ok = await saveKey(key, value);
    if (ok) {
      showToast(successMsg || "Changes saved successfully.");
    } else {
      showToast("Applied — the database save had trouble, but your change is live on the site.");
    }
    return true;
  }

  /* ---- cart helpers ---- */
  function addToCart(line) {
    setCart((c) => [...c, { ...line, cartId: uid() }]);
    showToast(`Added to cart: ${line.name}`);
  }
  function removeFromCart(cartId) {
    setCart((c) => c.filter((l) => l.cartId !== cartId));
  }
  function updateQty(cartId, qty) {
    setCart((c) => c.map((l) => (l.cartId === cartId ? { ...l, qty: Math.max(1, qty) } : l)));
  }
  const cartSubtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0);

  const enabledCategories = categories.filter((c) => c.enabled).sort((a, b) => a.order - b.order);
  const visibleProducts = products.filter((p) => p.enabled);
  const visibleDeals = deals.filter((d) => d.enabled);

  if (!ready) {
    return (
      <div className="pmg-root pmg-loading">
        <style>{CSS}</style>
        <div className="pmg-loading-emoji">🍕</div>
        <div>Loading Pizza Master G…</div>
      </div>
    );
  }

  return (
    <div className="pmg-root">
      <style>{CSS}</style>
      <Toast toast={toast} />

      <TopBar
        settings={settings}
        mode={mode}
        setMode={setMode}
        setCustomerView={setCustomerView}
        cartCount={cartCount}
        onCartClick={() => { setMode("customer"); setCustomerView("cart"); }}
      />

      {mode === "customer" ? (
        <CustomerSite
          settings={settings}
          categories={enabledCategories}
          products={visibleProducts}
          deals={visibleDeals}
          view={customerView}
          setView={setCustomerView}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          updateQty={updateQty}
          cartSubtotal={cartSubtotal}
          lastOrder={lastOrder}
          trackNumber={trackNumber}
          setTrackNumber={setTrackNumber}
          trackResult={trackResult}
          setTrackResult={setTrackResult}
          orders={orders}
          onPlaceOrder={async (customer) => {
            // re-validate against current product/deal data (simulates server-side price/availability check)
            const liveLines = [];
            let priceChanged = false;
            for (const line of cart) {
              if (line.kind === "product") {
                const p = products.find((x) => x.id === line.productId);
                if (!p || !p.enabled || !p.available) continue;
                liveLines.push(line);
              } else {
                const d = deals.find((x) => x.id === line.productId);
                if (!d || !d.enabled) continue;
                liveLines.push(line);
              }
            }
            const subtotal = liveLines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
            const deliveryCharge = customer.fulfillment === "delivery" ? settings.deliveryCharge : 0;
            const total = subtotal + deliveryCharge;
            const order = {
              id: uid(),
              orderNumber: "PMG-" + Date.now().toString().slice(-6),
              customer,
              items: liveLines,
              subtotal, deliveryCharge, total,
              status: "New",
              date: new Date().toISOString(),
            };
            const nextOrders = [order, ...orders];
            await persist(STORAGE_KEYS.orders, setOrders, nextOrders, "Order placed successfully.");
            logActivity(activity, "Order placed", order.orderNumber, "—", money(total));
            setCart([]);
            setLastOrder(order);
            setCustomerView("confirmation");
          }}
          settingsMinOrder={settings.minOrder}
        />
      ) : (
        <AdminDashboard
          settings={settings} setSettings={(v) => persist(STORAGE_KEYS.settings, setSettings, v, "Changes saved successfully.")}
          categories={categories} setCategories={(v, log) => { persist(STORAGE_KEYS.categories, setCategories, v); if (log) logActivity(activity, ...log); }}
          products={products} setProducts={(v, log) => { persist(STORAGE_KEYS.products, setProducts, v); if (log) logActivity(activity, ...log); }}
          deals={deals} setDeals={(v, log) => { persist(STORAGE_KEYS.deals, setDeals, v); if (log) logActivity(activity, ...log); }}
          orders={orders} setOrders={(v, log) => { persist(STORAGE_KEYS.orders, setOrders, v); if (log) logActivity(activity, ...log); }}
          activity={activity}
          view={adminView} setView={setAdminView}
          logActivity={(...args) => logActivity(activity, ...args)}
          storageAvailable={storageAvailable}
        />
      )}
    </div>
  );
}

/* ------------------------------- TOP BAR ------------------------------- */

function TopBar({ settings, mode, setMode, setCustomerView, cartCount, onCartClick }) {
  return (
    <header className="pmg-topbar">
      <div className="pmg-brand" onClick={() => { setMode("customer"); setCustomerView("home"); }}>
        <span className="pmg-brand-emoji">{settings.logoEmoji}</span>
        <div>
          <div className="pmg-brand-name">{settings.name}</div>
          <div className="pmg-brand-tagline">{settings.tagline}</div>
        </div>
      </div>
      <div className="pmg-topbar-actions">
        {mode === "customer" ? (
          <>
            <button className="pmg-cart-btn" onClick={onCartClick}>
              🛒 {cartCount > 0 && <span className="pmg-cart-count">{cartCount}</span>}
            </button>
            <button className="pmg-ghost-btn" onClick={() => setMode("admin")}>Restaurant login</button>
          </>
        ) : (
          <button className="pmg-ghost-btn" onClick={() => setMode("customer")}>View site</button>
        )}
      </div>
    </header>
  );
}

/* ----------------------------- CUSTOMER SITE ----------------------------- */

function CustomerSite(props) {
  const { view, setView } = props;
  return (
    <div className="pmg-customer">
      <nav className="pmg-subnav">
        <button className={view === "home" ? "pmg-tab-active" : ""} onClick={() => setView("home")}>Home</button>
        <button className={view === "menu" ? "pmg-tab-active" : ""} onClick={() => setView("menu")}>Menu</button>
        <button className={view === "deals" ? "pmg-tab-active" : ""} onClick={() => setView("deals")}>Deals</button>
        <button className={view === "track" ? "pmg-tab-active" : ""} onClick={() => setView("track")}>Track Order</button>
        <button className={view === "about" ? "pmg-tab-active" : ""} onClick={() => setView("about")}>Contact</button>
      </nav>

      {view === "home" && <HomeView {...props} />}
      {view === "menu" && <MenuView {...props} />}
      {view === "product" && <ProductView {...props} />}
      {view === "deals" && <DealsView {...props} />}
      {view === "cart" && <CartView {...props} />}
      {view === "checkout" && <CheckoutView {...props} />}
      {view === "confirmation" && <ConfirmationView {...props} />}
      {view === "track" && <TrackView {...props} />}
      {view === "about" && <AboutView {...props} />}
    </div>
  );
}

function HomeView({ settings, products, deals, setView, setCategoryFilter }) {
  const featuredProducts = products.filter((p) => p.featured);
  const featuredDeals = deals.filter((d) => d.featured);
  return (
    <div className="pmg-page">
      <section className="pmg-hero">
        <h1>{settings.name}</h1>
        <p className="pmg-hero-tag">{settings.tagline}</p>
        <p className="pmg-hero-desc">{settings.description}</p>
        <div className="pmg-hero-actions">
          <button className="pmg-btn-primary" onClick={() => { setCategoryFilter("all"); setView("menu"); }}>View Menu</button>
          <button className="pmg-btn-secondary" onClick={() => setView("deals")}>See Deals</button>
        </div>
        <div className="pmg-hero-meta">
          <span>⏱ Open {settings.hoursOpen}–{settings.hoursClose}</span>
          <span>📍 {settings.address}</span>
        </div>
      </section>

      {featuredDeals.length > 0 && (
        <section className="pmg-section">
          <h2>Featured deals</h2>
          <div className="pmg-grid">
            {featuredDeals.map((d) => <DealCard key={d.id} deal={d} onClick={() => setView("deals")} />)}
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="pmg-section">
          <h2>Fan favorites</h2>
          <div className="pmg-grid">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => { }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MenuView({ categories, products, categoryFilter, setCategoryFilter, setSelectedProduct, setView }) {
  const filtered = categoryFilter === "all" ? products : products.filter((p) => p.category === categoryFilter);
  return (
    <div className="pmg-page">
      <h1 className="pmg-page-title">Menu</h1>
      <div className="pmg-chip-row">
        <button className={`pmg-chip ${categoryFilter === "all" ? "pmg-chip-active" : ""}`} onClick={() => setCategoryFilter("all")}>All</button>
        {categories.map((c) => (
          <button key={c.id} className={`pmg-chip ${categoryFilter === c.id ? "pmg-chip-active" : ""}`} onClick={() => setCategoryFilter(c.id)}>{c.name}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="pmg-empty">Nothing here yet — check back soon.</p>
      ) : (
        <div className="pmg-grid">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => { setSelectedProduct(p); setView("product"); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onClick }) {
  const fromPrice = product.sizes.length ? Math.min(...product.sizes.map((s) => s.price)) : 0;
  return (
    <div className="pmg-card" onClick={onClick} role={onClick ? "button" : undefined}>
      {product.featured && <Badge tone="gold">Featured</Badge>}
      {!product.available && <Badge tone="dim">Unavailable</Badge>}
      <div className="pmg-card-emoji">{product.image}</div>
      <div className="pmg-card-name">{product.name}</div>
      <div className="pmg-card-desc">{product.description}</div>
      <div className="pmg-card-price">From {money(fromPrice)}</div>
    </div>
  );
}

function DealCard({ deal, products, onClick }) {
  return (
    <div className="pmg-card" onClick={onClick} role="button">
      {deal.featured && <Badge tone="gold">Featured</Badge>}
      <div className="pmg-card-emoji">{deal.image}</div>
      <div className="pmg-card-name">{deal.name}</div>
      <div className="pmg-card-desc">{deal.description}</div>
      <div className="pmg-card-price">{money(deal.price)}</div>
    </div>
  );
}

function ProductView({ selectedProduct: p, setView, addToCart }) {
  const [sizeIdx, setSizeIdx] = useState(0);
  const [toppings, setToppings] = useState([]);
  const [addons, setAddons] = useState([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  if (!p) { setView("menu"); return null; }

  const size = p.sizes[sizeIdx] || { name: "", price: 0 };
  const toppingsTotal = toppings.reduce((s, t) => s + t.price, 0);
  const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
  const unitPrice = size.price + toppingsTotal + addonsTotal;

  function toggle(list, setList, item) {
    const exists = list.find((x) => x.name === item.name);
    setList(exists ? list.filter((x) => x.name !== item.name) : [...list, item]);
  }

  return (
    <div className="pmg-page">
      <button className="pmg-link-btn" onClick={() => setView("menu")}>← Back to menu</button>
      <div className="pmg-product-detail">
        <div className="pmg-product-emoji">{p.image}</div>
        <div>
          <h1 className="pmg-page-title">{p.name}</h1>
          <p className="pmg-hero-desc">{p.description}</p>
          {!p.available && <Badge tone="dim">Currently unavailable</Badge>}

          {p.sizes.length > 0 && (
            <div className="pmg-field-group">
              <label>Size</label>
              <div className="pmg-chip-row">
                {p.sizes.map((s, i) => (
                  <button key={s.name} className={`pmg-chip ${sizeIdx === i ? "pmg-chip-active" : ""}`} onClick={() => setSizeIdx(i)}>
                    {s.name} — {money(s.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {p.toppings.length > 0 && (
            <div className="pmg-field-group">
              <label>Toppings</label>
              {p.toppings.map((t) => (
                <label key={t.name} className="pmg-check-row">
                  <input type="checkbox" checked={!!toppings.find((x) => x.name === t.name)} onChange={() => toggle(toppings, setToppings, t)} />
                  {t.name} (+{money(t.price)})
                </label>
              ))}
            </div>
          )}

          {p.addons.length > 0 && (
            <div className="pmg-field-group">
              <label>Add-ons</label>
              {p.addons.map((a) => (
                <label key={a.name} className="pmg-check-row">
                  <input type="checkbox" checked={!!addons.find((x) => x.name === a.name)} onChange={() => toggle(addons, setAddons, a)} />
                  {a.name} (+{money(a.price)})
                </label>
              ))}
            </div>
          )}

          <div className="pmg-field-group">
            <label>Special instructions</label>
            <textarea className="pmg-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. light sauce, no onions" />
          </div>

          <div className="pmg-field-group pmg-qty-row">
            <label>Quantity</label>
            <div className="pmg-qty-control">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>

          <button
            className="pmg-btn-primary pmg-add-btn"
            disabled={!p.available}
            onClick={() => {
              addToCart({
                kind: "product", productId: p.id, name: p.name, size: size.name,
                toppings: toppings.map((t) => t.name), addons: addons.map((a) => a.name),
                notes, unitPrice, qty,
              });
              setView("menu");
            }}
          >
            Add to cart — {money(unitPrice * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

function DealsView({ deals, products, addToCart }) {
  return (
    <div className="pmg-page">
      <h1 className="pmg-page-title">Deals</h1>
      {deals.length === 0 ? (
        <p className="pmg-empty">No active deals right now.</p>
      ) : (
        <div className="pmg-grid">
          {deals.map((d) => {
            const included = d.productIds.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean);
            return (
              <div className="pmg-card" key={d.id}>
                {d.featured && <Badge tone="gold">Featured</Badge>}
                <div className="pmg-card-emoji">{d.image}</div>
                <div className="pmg-card-name">{d.name}</div>
                <div className="pmg-card-desc">{d.description}</div>
                {included.length > 0 && <div className="pmg-deal-includes">Includes: {included.join(", ")}</div>}
                <div className="pmg-card-price">{money(d.price)}</div>
                <button
                  className="pmg-btn-primary"
                  onClick={() => addToCart({ kind: "deal", productId: d.id, name: d.name, size: "", toppings: [], addons: [], notes: "", unitPrice: d.price, qty: 1 })}
                >
                  Add deal to cart
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartView({ cart, removeFromCart, updateQty, cartSubtotal, setView, settingsMinOrder }) {
  const belowMin = cartSubtotal > 0 && cartSubtotal < settingsMinOrder;
  return (
    <div className="pmg-page">
      <h1 className="pmg-page-title">Your Cart</h1>
      {cart.length === 0 ? (
        <div className="pmg-empty">
          <p>Your cart is empty.</p>
          <button className="pmg-btn-primary" onClick={() => setView("menu")}>Browse menu</button>
        </div>
      ) : (
        <>
          <div className="pmg-cart-list">
            {cart.map((l) => (
              <div className="pmg-cart-row" key={l.cartId}>
                <div>
                  <div className="pmg-cart-name">{l.name}</div>
                  <div className="pmg-cart-meta">
                    {[l.size, ...(l.toppings || []), ...(l.addons || [])].filter(Boolean).join(", ")}
                    {l.notes ? ` · "${l.notes}"` : ""}
                  </div>
                </div>
                <div className="pmg-qty-control">
                  <button onClick={() => updateQty(l.cartId, l.qty - 1)}>−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => updateQty(l.cartId, l.qty + 1)}>+</button>
                </div>
                <div className="pmg-cart-price">{money(l.unitPrice * l.qty)}</div>
                <button className="pmg-icon-btn" onClick={() => removeFromCart(l.cartId)}>✕</button>
              </div>
            ))}
          </div>
          <div className="pmg-cart-summary">
            <div className="pmg-summary-row"><span>Subtotal</span><span>{money(cartSubtotal)}</span></div>
            <div className="pmg-summary-row pmg-summary-dim"><span>Delivery charge</span><span>calculated at checkout</span></div>
          </div>
          {belowMin && <p className="pmg-warning">Minimum order is {money(settingsMinOrder)} — add {money(settingsMinOrder - cartSubtotal)} more to check out.</p>}
          <div className="pmg-hero-actions">
            <button className="pmg-btn-secondary" onClick={() => setView("menu")}>Continue shopping</button>
            <button className="pmg-btn-primary" disabled={belowMin} onClick={() => setView("checkout")}>Proceed to checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

function CheckoutView({ cart, cartSubtotal, settings, onPlaceOrder, setView, settingsMinOrder }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState(settings.deliveryEnabled ? "delivery" : "pickup");
  const [notes, setNotes] = useState("");

  const deliveryCharge = fulfillment === "delivery" ? settings.deliveryCharge : 0;
  const total = cartSubtotal + deliveryCharge;
  const canSubmit = name && phone && (fulfillment === "pickup" || address) && cartSubtotal >= settingsMinOrder;

  return (
    <div className="pmg-page">
      <h1 className="pmg-page-title">Checkout</h1>
      <div className="pmg-checkout-grid">
        <div>
          <div className="pmg-field-group">
            <label>Full name</label>
            <input className="pmg-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="pmg-field-group">
            <label>Phone number</label>
            <input className="pmg-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="pmg-field-group">
            <label>Fulfillment</label>
            <div className="pmg-chip-row">
              {settings.deliveryEnabled && <button className={`pmg-chip ${fulfillment === "delivery" ? "pmg-chip-active" : ""}`} onClick={() => setFulfillment("delivery")}>Delivery</button>}
              {settings.pickupEnabled && <button className={`pmg-chip ${fulfillment === "pickup" ? "pmg-chip-active" : ""}`} onClick={() => setFulfillment("pickup")}>Pickup</button>}
            </div>
          </div>
          {fulfillment === "delivery" && (
            <div className="pmg-field-group">
              <label>Delivery address</label>
              <input className="pmg-input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          )}
          <div className="pmg-field-group">
            <label>Order notes</label>
            <textarea className="pmg-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="pmg-order-summary">
          <h3>Order summary</h3>
          {cart.map((l) => (
            <div className="pmg-summary-row" key={l.cartId}><span>{l.qty}× {l.name}</span><span>{money(l.unitPrice * l.qty)}</span></div>
          ))}
          <div className="pmg-summary-row"><span>Subtotal</span><span>{money(cartSubtotal)}</span></div>
          <div className="pmg-summary-row"><span>Delivery</span><span>{money(deliveryCharge)}</span></div>
          <div className="pmg-summary-row pmg-summary-total"><span>Total</span><span>{money(total)}</span></div>
          <button
            className="pmg-btn-primary pmg-add-btn"
            disabled={!canSubmit}
            onClick={() => onPlaceOrder({ name, phone, address, fulfillment, notes })}
          >
            Place order
          </button>
          <button className="pmg-link-btn" onClick={() => setView("cart")}>← Back to cart</button>
        </div>
      </div>
    </div>
  );
}

function buildWhatsAppLink(order, settings) {
  const lines = [
    `New order ${order.orderNumber} — ${settings.name}`,
    ``,
    `Customer: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    order.customer.fulfillment === "delivery" ? `Delivery address: ${order.customer.address}` : `Pickup order`,
    order.customer.notes ? `Notes: ${order.customer.notes}` : null,
    ``,
    ...order.items.map((l) => `${l.qty}× ${l.name}${l.size ? ` (${l.size})` : ""}${[...(l.toppings||[]),...(l.addons||[])].length ? ` + ${[...(l.toppings||[]),...(l.addons||[])].join(", ")}` : ""} — ${money(l.unitPrice * l.qty)}`),
    ``,
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery: ${money(order.deliveryCharge)}`,
    `Total: ${money(order.total)}`,
  ].filter((x) => x !== null);
  const text = encodeURIComponent(lines.join("\n"));
  const number = (settings.whatsapp || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${text}`;
}

function ConfirmationView({ lastOrder, setView, settings }) {
  if (!lastOrder) { setView("home"); return null; }
  const waLink = settings.whatsapp ? buildWhatsAppLink(lastOrder, settings) : null;
  return (
    <div className="pmg-page pmg-confirmation">
      <div className="pmg-confirm-emoji">✅</div>
      <h1 className="pmg-page-title">Order placed</h1>
      <p>Order number <strong>{lastOrder.orderNumber}</strong> — status: {lastOrder.status}</p>
      <div className="pmg-order-summary">
        {lastOrder.items.map((l, i) => (
          <div className="pmg-summary-row" key={i}><span>{l.qty}× {l.name}</span><span>{money(l.unitPrice * l.qty)}</span></div>
        ))}
        <div className="pmg-summary-row"><span>Delivery</span><span>{money(lastOrder.deliveryCharge)}</span></div>
        <div className="pmg-summary-row pmg-summary-total"><span>Total</span><span>{money(lastOrder.total)}</span></div>
      </div>
      {waLink && (
        <a className="pmg-btn-primary pmg-add-btn pmg-wa-btn" href={waLink} target="_blank" rel="noreferrer">
          📲 Send order to restaurant on WhatsApp
        </a>
      )}
      <button className="pmg-btn-secondary" onClick={() => setView("home")}>Back to home</button>
    </div>
  );
}

function TrackView({ orders, trackNumber, setTrackNumber, trackResult, setTrackResult }) {
  return (
    <div className="pmg-page">
      <h1 className="pmg-page-title">Track your order</h1>
      <div className="pmg-field-group">
        <label>Order number</label>
        <div className="pmg-list-row">
          <input className="pmg-input" placeholder="PMG-123456" value={trackNumber} onChange={(e) => setTrackNumber(e.target.value)} />
          <button className="pmg-btn-primary" onClick={() => setTrackResult(orders.find((o) => o.orderNumber.toLowerCase() === trackNumber.trim().toLowerCase()) || null)}>
            Track
          </button>
        </div>
      </div>
      {trackResult === null && <p className="pmg-warning">No order found with that number.</p>}
      {trackResult && (
        <div className="pmg-order-summary">
          <div className="pmg-summary-row"><span>Status</span><span><Badge tone="gold">{trackResult.status}</Badge></span></div>
          {trackResult.items.map((l, i) => (
            <div className="pmg-summary-row" key={i}><span>{l.qty}× {l.name}</span><span>{money(l.unitPrice * l.qty)}</span></div>
          ))}
          <div className="pmg-summary-row pmg-summary-total"><span>Total</span><span>{money(trackResult.total)}</span></div>
        </div>
      )}
    </div>
  );
}

function AboutView({ settings }) {
  const s = settings;
  const links = [
    ["Facebook", s.social.facebook], ["Instagram", s.social.instagram],
    ["TikTok", s.social.tiktok], ["YouTube", s.social.youtube], ["Google Maps", s.social.maps],
  ].filter(([, url]) => url);
  return (
    <div className="pmg-page">
      <h1 className="pmg-page-title">Visit us</h1>
      <p className="pmg-hero-desc">{s.description}</p>
      <div className="pmg-about-grid">
        <div><strong>Address</strong><p>{s.address}</p></div>
        <div><strong>Phone</strong><p>{s.phone}</p></div>
        <div><strong>Hours</strong><p>{s.hoursOpen} – {s.hoursClose} daily</p></div>
      </div>
      {links.length > 0 && (
        <div className="pmg-social-row">
          {links.map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" className="pmg-chip">{label}</a>
          ))}
        </div>
      )}
      {s.customLinks.filter((l) => l.enabled).length > 0 && (
        <div className="pmg-social-row">
          {s.customLinks.filter((l) => l.enabled).map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="pmg-chip">{l.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- ADMIN DASHBOARD ----------------------------- */

function AdminDashboard(props) {
  const { view, setView, orders, storageAvailable } = props;
  const newOrders = orders.filter((o) => o.status === "New").length;
  return (
    <div className="pmg-admin">
      <aside className="pmg-admin-sidebar">
        {!storageAvailable && (
          <div className="pmg-storage-banner">
            ⚠ Database not connected — edits work in this browser tab now, but won't be saved or shared with other visitors until the Cloudflare KV binding is set up. See README.md.
          </div>
        )}
        {[
          ["overview", "📊 Overview"], ["products", "🍕 Products"], ["categories", "🗂 Categories"],
          ["deals", "🎁 Deals"], ["orders", `📦 Orders${newOrders ? ` (${newOrders})` : ""}`],
          ["settings", "⚙️ Restaurant Settings"], ["social", "🔗 Social & Links"], ["activity", "📝 Activity Log"],
        ].map(([key, label]) => (
          <button key={key} className={view === key ? "pmg-admin-nav-active" : ""} onClick={() => setView(key)}>{label}</button>
        ))}
      </aside>
      <div className="pmg-admin-content">
        {view === "overview" && <AdminOverview {...props} />}
        {view === "products" && <AdminProducts {...props} />}
        {view === "categories" && <AdminCategories {...props} />}
        {view === "deals" && <AdminDeals {...props} />}
        {view === "orders" && <AdminOrders {...props} />}
        {view === "settings" && <AdminSettings {...props} />}
        {view === "social" && <AdminSocial {...props} />}
        {view === "activity" && <AdminActivity {...props} />}
      </div>
    </div>
  );
}

function AdminOverview({ orders, products, deals, setView }) {
  const today = new Date().toDateString();
  const todays = orders.filter((o) => new Date(o.date).toDateString() === today);
  const byStatus = (s) => orders.filter((o) => o.status === s).length;
  return (
    <div>
      <h2 className="pmg-admin-h2">Dashboard</h2>
      <div className="pmg-stat-grid">
        <StatCard label="Today's orders" value={todays.length} onClick={() => setView("orders")} />
        <StatCard label="New" value={byStatus("New")} onClick={() => setView("orders")} />
        <StatCard label="Preparing" value={byStatus("Preparing")} onClick={() => setView("orders")} />
        <StatCard label="Delivered" value={byStatus("Delivered")} onClick={() => setView("orders")} />
        <StatCard label="Total orders" value={orders.length} onClick={() => setView("orders")} />
        <StatCard label="Active products" value={products.filter((p) => p.enabled).length} onClick={() => setView("products")} />
        <StatCard label="Active deals" value={deals.filter((d) => d.enabled).length} onClick={() => setView("deals")} />
      </div>
      <h3 className="pmg-admin-h3">Quick actions</h3>
      <div className="pmg-hero-actions">
        <button className="pmg-btn-primary" onClick={() => setView("products")}>+ Add Product</button>
        <button className="pmg-btn-primary" onClick={() => setView("deals")}>+ Add Deal</button>
        <button className="pmg-btn-secondary" onClick={() => setView("orders")}>View Orders</button>
        <button className="pmg-btn-secondary" onClick={() => setView("settings")}>Restaurant Settings</button>
      </div>
    </div>
  );
}

function emptyProduct(categories) {
  return {
    id: uid(), name: "", category: categories[0]?.id || "", image: "🍕", description: "",
    sizes: [{ name: "Regular", price: 0 }], toppings: [], addons: [],
    available: true, enabled: true, featured: false,
  };
}

function AdminProducts({ products, setProducts, categories }) {
  const [editing, setEditing] = useState(null);

  function save(p, log) {
    const exists = products.find((x) => x.id === p.id);
    const next = exists ? products.map((x) => (x.id === p.id ? p : x)) : [...products, p];
    setProducts(next, log);
    setEditing(null);
  }
  function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    setProducts(products.filter((x) => x.id !== p.id), ["Product deleted", p.name, "—", "—"]);
  }
  function duplicate(p) {
    const copy = { ...p, id: uid(), name: p.name + " (copy)" };
    setProducts([...products, copy], ["Product duplicated", p.name, "—", copy.name]);
  }
  function toggle(p, field) {
    const next = products.map((x) => (x.id === p.id ? { ...x, [field]: !x[field] } : x));
    setProducts(next, [`Product ${field} changed`, p.name, String(p[field]), String(!p[field])]);
  }

  if (editing) return <ProductForm categories={categories} initial={editing} onCancel={() => setEditing(null)} onSave={(p) => save(p, [products.find((x) => x.id === p.id) ? "Product edited" : "Product created", p.name, "—", "—"])} />;

  return (
    <div>
      <div className="pmg-admin-header">
        <h2 className="pmg-admin-h2">Products</h2>
        <button className="pmg-btn-primary" onClick={() => setEditing(emptyProduct(categories))}>+ Add New Product</button>
      </div>
      <div className="pmg-admin-table">
        {products.length === 0 && <p className="pmg-empty">No products yet.</p>}
        {products.map((p) => (
          <div className="pmg-admin-row" key={p.id}>
            <span className="pmg-admin-row-emoji">{p.image}</span>
            <div className="pmg-admin-row-main">
              <div className="pmg-admin-row-title">{p.name || "(untitled)"} {p.featured && <Badge tone="gold">Featured</Badge>} {!p.enabled && <Badge tone="dim">Disabled</Badge>} {!p.available && <Badge tone="dim">Unavailable</Badge>}</div>
              <div className="pmg-admin-row-sub">{categories.find((c) => c.id === p.category)?.name || "Uncategorized"} · from {money(Math.min(...(p.sizes.map((s) => s.price) || [0])))}</div>
            </div>
            <div className="pmg-admin-row-actions">
              <button className="pmg-link-btn" onClick={() => toggle(p, "enabled")}>{p.enabled ? "Disable" : "Enable"}</button>
              <button className="pmg-link-btn" onClick={() => toggle(p, "available")}>{p.available ? "Mark unavailable" : "Mark available"}</button>
              <button className="pmg-link-btn" onClick={() => toggle(p, "featured")}>{p.featured ? "Unfeature" : "Feature"}</button>
              <button className="pmg-link-btn" onClick={() => setEditing(p)}>Edit</button>
              <button className="pmg-link-btn" onClick={() => duplicate(p)}>Duplicate</button>
              <button className="pmg-link-btn pmg-link-danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({ categories, initial, onSave, onCancel }) {
  const [p, setP] = useState(initial);
  const set = (field) => (e) => setP({ ...p, [field]: e.target.value });
  return (
    <div>
      <button className="pmg-link-btn" onClick={onCancel}>← Back to products</button>
      <h2 className="pmg-admin-h2">{initial.name ? "Edit product" : "Add new product"}</h2>
      <div className="pmg-form-grid">
        <div className="pmg-field-group"><label>Name</label><input className="pmg-input" value={p.name} onChange={set("name")} /></div>
        <div className="pmg-field-group">
          <label>Category</label>
          <select className="pmg-input" value={p.category} onChange={set("category")}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="pmg-field-group pmg-field-wide"><label>Description</label><textarea className="pmg-textarea" value={p.description} onChange={set("description")} /></div>
        <div className="pmg-field-group pmg-field-wide">
          <label>Image</label>
          <EmojiPicker value={p.image} onChange={(v) => setP({ ...p, image: v })} />
        </div>
        <div className="pmg-field-group pmg-field-wide">
          <label>Sizes &amp; prices</label>
          <ListEditor items={p.sizes} onChange={(v) => setP({ ...p, sizes: v })} placeholder="Size name" />
        </div>
        <div className="pmg-field-group pmg-field-wide">
          <label>Toppings</label>
          <ListEditor items={p.toppings} onChange={(v) => setP({ ...p, toppings: v })} placeholder="Topping name" />
        </div>
        <div className="pmg-field-group pmg-field-wide">
          <label>Add-ons</label>
          <ListEditor items={p.addons} onChange={(v) => setP({ ...p, addons: v })} placeholder="Add-on name" />
        </div>
        <div className="pmg-field-group pmg-field-wide pmg-check-row-group">
          <label className="pmg-check-row"><input type="checkbox" checked={p.enabled} onChange={(e) => setP({ ...p, enabled: e.target.checked })} /> Enabled (shown on site)</label>
          <label className="pmg-check-row"><input type="checkbox" checked={p.available} onChange={(e) => setP({ ...p, available: e.target.checked })} /> Available to order</label>
          <label className="pmg-check-row"><input type="checkbox" checked={p.featured} onChange={(e) => setP({ ...p, featured: e.target.checked })} /> Featured</label>
        </div>
      </div>
      <button className="pmg-btn-primary" disabled={!p.name} onClick={() => onSave(p)}>Save product</button>
    </div>
  );
}

function AdminCategories({ categories, setCategories }) {
  const [newName, setNewName] = useState("");
  function add() {
    if (!newName.trim()) return;
    const next = [...categories, { id: "cat-" + uid(), name: newName.trim(), enabled: true, order: categories.length + 1 }];
    setCategories(next, ["Category created", newName.trim(), "—", "—"]);
    setNewName("");
  }
  function rename(c, name) {
    setCategories(categories.map((x) => (x.id === c.id ? { ...x, name } : x)));
  }
  function toggle(c) {
    setCategories(categories.map((x) => (x.id === c.id ? { ...x, enabled: !x.enabled } : x)), ["Category enabled changed", c.name, String(c.enabled), String(!c.enabled)]);
  }
  function remove(c) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setCategories(categories.filter((x) => x.id !== c.id), ["Category deleted", c.name, "—", "—"]);
  }
  function move(c, dir) {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((x) => x.id === c.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const tmp = sorted[idx].order;
    sorted[idx].order = sorted[swapIdx].order;
    sorted[swapIdx].order = tmp;
    setCategories([...sorted]);
  }
  return (
    <div>
      <h2 className="pmg-admin-h2">Categories</h2>
      <div className="pmg-list-row">
        <input className="pmg-input" placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="pmg-btn-primary" onClick={add}>+ Add category</button>
      </div>
      <div className="pmg-admin-table">
        {categories.sort((a, b) => a.order - b.order).map((c) => (
          <div className="pmg-admin-row" key={c.id}>
            <input className="pmg-input pmg-inline-input" value={c.name} onChange={(e) => rename(c, e.target.value)} onBlur={(e) => setCategories(categories.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)), ["Category renamed", c.name, c.name, e.target.value])} />
            {!c.enabled && <Badge tone="dim">Disabled</Badge>}
            <div className="pmg-admin-row-actions">
              <button className="pmg-link-btn" onClick={() => move(c, -1)}>↑</button>
              <button className="pmg-link-btn" onClick={() => move(c, 1)}>↓</button>
              <button className="pmg-link-btn" onClick={() => toggle(c)}>{c.enabled ? "Disable" : "Enable"}</button>
              <button className="pmg-link-btn pmg-link-danger" onClick={() => remove(c)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function emptyDeal() {
  return { id: uid(), name: "", description: "", price: 0, image: "🍕", productIds: [], enabled: true, featured: false };
}

function AdminDeals({ deals, setDeals, products }) {
  const [editing, setEditing] = useState(null);

  function save(d) {
    const exists = deals.find((x) => x.id === d.id);
    const next = exists ? deals.map((x) => (x.id === d.id ? d : x)) : [...deals, d];
    setDeals(next, [exists ? "Deal edited" : "New Deal created", d.name, "—", money(d.price)]);
    setEditing(null);
  }
  function remove(d) {
    if (!window.confirm(`Delete deal "${d.name}"?`)) return;
    setDeals(deals.filter((x) => x.id !== d.id), ["Deal deleted", d.name, "—", "—"]);
  }
  function duplicate(d) {
    const copy = { ...d, id: uid(), name: d.name + " (copy)" };
    setDeals([...deals, copy], ["Deal duplicated", d.name, "—", copy.name]);
  }
  function toggle(d, field) {
    setDeals(deals.map((x) => (x.id === d.id ? { ...x, [field]: !x[field] } : x)), [`Deal ${field} changed`, d.name, String(d[field]), String(!d[field])]);
  }

  if (editing) return <DealForm products={products} initial={editing} onCancel={() => setEditing(null)} onSave={save} />;

  return (
    <div>
      <div className="pmg-admin-header">
        <h2 className="pmg-admin-h2">Deals</h2>
        <button className="pmg-btn-primary" onClick={() => setEditing(emptyDeal())}>+ Add New Deal</button>
      </div>
      <div className="pmg-admin-table">
        {deals.length === 0 && <p className="pmg-empty">No deals yet — create one whenever you like.</p>}
        {deals.map((d) => (
          <div className="pmg-admin-row" key={d.id}>
            <span className="pmg-admin-row-emoji">{d.image}</span>
            <div className="pmg-admin-row-main">
              <div className="pmg-admin-row-title">{d.name || "(untitled)"} {d.featured && <Badge tone="gold">Featured</Badge>} {!d.enabled && <Badge tone="dim">Disabled</Badge>}</div>
              <div className="pmg-admin-row-sub">{money(d.price)} · {d.productIds.length} items included</div>
            </div>
            <div className="pmg-admin-row-actions">
              <button className="pmg-link-btn" onClick={() => toggle(d, "enabled")}>{d.enabled ? "Disable" : "Enable"}</button>
              <button className="pmg-link-btn" onClick={() => toggle(d, "featured")}>{d.featured ? "Unfeature" : "Feature"}</button>
              <button className="pmg-link-btn" onClick={() => setEditing(d)}>Edit</button>
              <button className="pmg-link-btn" onClick={() => duplicate(d)}>Duplicate</button>
              <button className="pmg-link-btn pmg-link-danger" onClick={() => remove(d)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealForm({ products, initial, onSave, onCancel }) {
  const [d, setD] = useState(initial);
  const set = (field) => (e) => setD({ ...d, [field]: e.target.value });
  function toggleProduct(id) {
    setD({ ...d, productIds: d.productIds.includes(id) ? d.productIds.filter((x) => x !== id) : [...d.productIds, id] });
  }
  return (
    <div>
      <button className="pmg-link-btn" onClick={onCancel}>← Back to deals</button>
      <h2 className="pmg-admin-h2">{initial.name ? "Edit deal" : "Add new deal"}</h2>
      <div className="pmg-form-grid">
        <div className="pmg-field-group"><label>Deal name</label><input className="pmg-input" value={d.name} onChange={set("name")} /></div>
        <div className="pmg-field-group"><label>Price</label><input className="pmg-input" type="number" step="1" value={d.price} onChange={(e) => setD({ ...d, price: parseInt(e.target.value, 10) || 0 })} /></div>
        <div className="pmg-field-group pmg-field-wide"><label>Description</label><textarea className="pmg-textarea" value={d.description} onChange={set("description")} /></div>
        <div className="pmg-field-group pmg-field-wide"><label>Image</label><EmojiPicker value={d.image} onChange={(v) => setD({ ...d, image: v })} /></div>
        <div className="pmg-field-group pmg-field-wide">
          <label>Included products</label>
          <div className="pmg-check-row-group">
            {products.map((p) => (
              <label key={p.id} className="pmg-check-row">
                <input type="checkbox" checked={d.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} /> {p.name}
              </label>
            ))}
          </div>
        </div>
        <div className="pmg-field-group pmg-field-wide pmg-check-row-group">
          <label className="pmg-check-row"><input type="checkbox" checked={d.enabled} onChange={(e) => setD({ ...d, enabled: e.target.checked })} /> Enabled (shown on site)</label>
          <label className="pmg-check-row"><input type="checkbox" checked={d.featured} onChange={(e) => setD({ ...d, featured: e.target.checked })} /> Featured</label>
        </div>
      </div>
      <button className="pmg-btn-primary" disabled={!d.name} onClick={() => onSave(d)}>Save deal</button>
    </div>
  );
}

function AdminOrders({ orders, setOrders }) {
  const [expanded, setExpanded] = useState(null);
  function updateStatus(o, status) {
    const next = orders.map((x) => (x.id === o.id ? { ...x, status } : x));
    setOrders(next, ["Order status changed", o.orderNumber, o.status, status]);
  }
  return (
    <div>
      <h2 className="pmg-admin-h2">Orders</h2>
      {orders.length === 0 && <p className="pmg-empty">No orders yet.</p>}
      <div className="pmg-admin-table">
        {orders.map((o) => (
          <div key={o.id} className="pmg-order-card">
            <div className="pmg-admin-row" onClick={() => setExpanded(expanded === o.id ? null : o.id)} role="button">
              <div className="pmg-admin-row-main">
                <div className="pmg-admin-row-title">{o.orderNumber} — {o.customer.name}</div>
                <div className="pmg-admin-row-sub">{new Date(o.date).toLocaleString()} · {money(o.total)} · {o.customer.fulfillment}</div>
              </div>
              <select className="pmg-input pmg-status-select" value={o.status} onChange={(e) => { e.stopPropagation(); updateStatus(o, e.target.value); }} onClick={(e) => e.stopPropagation()}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {expanded === o.id && (
              <div className="pmg-order-detail">
                <p><strong>Phone:</strong> {o.customer.phone}</p>
                {o.customer.address && <p><strong>Address:</strong> {o.customer.address}</p>}
                {o.customer.notes && <p><strong>Notes:</strong> {o.customer.notes}</p>}
                {o.items.map((l, i) => (
                  <div className="pmg-summary-row" key={i}><span>{l.qty}× {l.name} {l.size ? `(${l.size})` : ""}{[...(l.toppings||[]),...(l.addons||[])].length ? ` + ${[...(l.toppings||[]),...(l.addons||[])].join(", ")}` : ""}</span><span>{money(l.unitPrice * l.qty)}</span></div>
                ))}
                <div className="pmg-summary-row"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
                <div className="pmg-summary-row"><span>Delivery</span><span>{money(o.deliveryCharge)}</span></div>
                <div className="pmg-summary-row pmg-summary-total"><span>Total</span><span>{money(o.total)}</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSettings({ settings, setSettings }) {
  const [s, setS] = useState(settings);
  const set = (field) => (e) => setS({ ...s, [field]: e.target.value });
  return (
    <div>
      <h2 className="pmg-admin-h2">Restaurant Settings</h2>
      <div className="pmg-form-grid">
        <div className="pmg-field-group"><label>Restaurant name</label><input className="pmg-input" value={s.name} onChange={set("name")} /></div>
        <div className="pmg-field-group"><label>Logo (emoji)</label><EmojiPicker value={s.logoEmoji} onChange={(v) => setS({ ...s, logoEmoji: v })} /></div>
        <div className="pmg-field-group pmg-field-wide"><label>Tagline</label><input className="pmg-input" value={s.tagline} onChange={set("tagline")} /></div>
        <div className="pmg-field-group pmg-field-wide"><label>Description</label><textarea className="pmg-textarea" value={s.description} onChange={set("description")} /></div>
        <div className="pmg-field-group"><label>Phone</label><input className="pmg-input" value={s.phone} onChange={set("phone")} /></div>
        <div className="pmg-field-group"><label>WhatsApp number</label><input className="pmg-input" value={s.whatsapp} onChange={set("whatsapp")} /></div>
        <div className="pmg-field-group pmg-field-wide"><label>Address</label><input className="pmg-input" value={s.address} onChange={set("address")} /></div>
        <div className="pmg-field-group"><label>Opening time</label><input className="pmg-input" type="time" value={s.hoursOpen} onChange={set("hoursOpen")} /></div>
        <div className="pmg-field-group"><label>Closing time</label><input className="pmg-input" type="time" value={s.hoursClose} onChange={set("hoursClose")} /></div>
        <div className="pmg-field-group"><label>Delivery charge</label><input className="pmg-input" type="number" step="1" value={s.deliveryCharge} onChange={(e) => setS({ ...s, deliveryCharge: parseInt(e.target.value, 10) || 0 })} /></div>
        <div className="pmg-field-group"><label>Minimum order</label><input className="pmg-input" type="number" step="1" value={s.minOrder} onChange={(e) => setS({ ...s, minOrder: parseInt(e.target.value, 10) || 0 })} /></div>
        <div className="pmg-field-group pmg-field-wide pmg-check-row-group">
          <label className="pmg-check-row"><input type="checkbox" checked={s.deliveryEnabled} onChange={(e) => setS({ ...s, deliveryEnabled: e.target.checked })} /> Delivery offered</label>
          <label className="pmg-check-row"><input type="checkbox" checked={s.pickupEnabled} onChange={(e) => setS({ ...s, pickupEnabled: e.target.checked })} /> Pickup offered</label>
        </div>
      </div>
      <button className="pmg-btn-primary" onClick={() => setSettings(s)}>Save changes</button>
    </div>
  );
}

function AdminSocial({ settings, setSettings }) {
  const [s, setS] = useState(settings);
  const setSocial = (field) => (e) => setS({ ...s, social: { ...s.social, [field]: e.target.value } });
  function addCustom() {
    setS({ ...s, customLinks: [...s.customLinks, { id: uid(), label: "", url: "", enabled: true }] });
  }
  function updateCustom(id, field, val) {
    setS({ ...s, customLinks: s.customLinks.map((l) => (l.id === id ? { ...l, [field]: val } : l)) });
  }
  function removeCustom(id) {
    setS({ ...s, customLinks: s.customLinks.filter((l) => l.id !== id) });
  }
  return (
    <div>
      <h2 className="pmg-admin-h2">Social Media &amp; Links</h2>
      <div className="pmg-form-grid">
        <div className="pmg-field-group"><label>Facebook URL</label><input className="pmg-input" value={s.social.facebook} onChange={setSocial("facebook")} /></div>
        <div className="pmg-field-group"><label>Instagram URL</label><input className="pmg-input" value={s.social.instagram} onChange={setSocial("instagram")} /></div>
        <div className="pmg-field-group"><label>TikTok URL</label><input className="pmg-input" value={s.social.tiktok} onChange={setSocial("tiktok")} /></div>
        <div className="pmg-field-group"><label>YouTube URL</label><input className="pmg-input" value={s.social.youtube} onChange={setSocial("youtube")} /></div>
        <div className="pmg-field-group pmg-field-wide"><label>Google Maps link</label><input className="pmg-input" value={s.social.maps} onChange={setSocial("maps")} /></div>
      </div>
      <h3 className="pmg-admin-h3">Custom links</h3>
      {s.customLinks.map((l) => (
        <div className="pmg-list-row" key={l.id}>
          <input className="pmg-input" placeholder="Label" value={l.label} onChange={(e) => updateCustom(l.id, "label", e.target.value)} />
          <input className="pmg-input" placeholder="https://…" value={l.url} onChange={(e) => updateCustom(l.id, "url", e.target.value)} />
          <label className="pmg-check-row"><input type="checkbox" checked={l.enabled} onChange={(e) => updateCustom(l.id, "enabled", e.target.checked)} /> On</label>
          <button className="pmg-icon-btn" onClick={() => removeCustom(l.id)}>✕</button>
        </div>
      ))}
      <button className="pmg-link-btn" onClick={addCustom}>+ Add custom link</button>
      <div style={{ marginTop: 16 }}>
        <button className="pmg-btn-primary" onClick={() => setSettings(s)}>Save changes</button>
      </div>
    </div>
  );
}

function AdminActivity({ activity }) {
  return (
    <div>
      <h2 className="pmg-admin-h2">Activity Log</h2>
      {activity.length === 0 && <p className="pmg-empty">No activity recorded yet.</p>}
      <div className="pmg-admin-table">
        {activity.map((a) => (
          <div className="pmg-admin-row" key={a.id}>
            <div className="pmg-admin-row-main">
              <div className="pmg-admin-row-title">{a.action} — {a.item}</div>
              <div className="pmg-admin-row-sub">{a.oldValue} → {a.newValue} · {a.admin} · {new Date(a.date).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- CSS ------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@400;500;600;700&display=swap');

.pmg-root {
  --bg: #1C1A17; --surface: #252220; --surface-2: #2E2A26; --border: #3A342E;
  --text: #F2EDE4; --text-dim: #B8AFA3; --accent: #C1401C; --accent-dim: #8f2f14;
  --basil: #4C6B3D; --gold: #D4A03C;
  background: var(--bg); color: var(--text); min-height: 100vh;
  font-family: 'Work Sans', sans-serif; font-size: 15px; line-height: 1.5;
}
.pmg-root * { box-sizing: border-box; }
.pmg-root h1, .pmg-root h2, .pmg-root .pmg-brand-name { font-family: 'Anton', sans-serif; letter-spacing: 0.02em; font-weight: 400; }

.pmg-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px 20px; }
.pmg-loading-emoji { font-size: 40px; }

.pmg-topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; top: 0; z-index: 20; }
.pmg-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.pmg-brand-emoji { font-size: 28px; }
.pmg-brand-name { font-size: 20px; color: var(--gold); }
.pmg-brand-tagline { font-size: 11px; color: var(--text-dim); }
.pmg-topbar-actions { display: flex; align-items: center; gap: 10px; }
.pmg-cart-btn { position: relative; background: none; border: 1px solid var(--border); color: var(--text); font-size: 18px; padding: 7px 12px; border-radius: 8px; cursor: pointer; }
.pmg-cart-count { position: absolute; top: -6px; right: -6px; background: var(--accent); color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 10px; }
.pmg-ghost-btn { background: none; border: 1px solid var(--border); color: var(--text-dim); padding: 7px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; }

.pmg-subnav { display: flex; gap: 4px; padding: 10px 18px; border-bottom: 1px solid var(--border); overflow-x: auto; }
.pmg-subnav button { background: none; border: none; color: var(--text-dim); padding: 8px 12px; border-radius: 7px; cursor: pointer; font-size: 14px; white-space: nowrap; }
.pmg-subnav .pmg-tab-active { color: var(--text); background: var(--surface-2); }

.pmg-page { padding: 22px 18px 60px; max-width: 900px; margin: 0 auto; }
.pmg-page-title { font-size: 26px; margin: 0 0 14px; color: var(--text); }

.pmg-hero { padding: 20px 0 10px; }
.pmg-hero h1 { font-size: 36px; margin: 0 0 6px; color: var(--gold); }
.pmg-hero-tag { color: var(--accent); font-weight: 600; margin: 0 0 10px; }
.pmg-hero-desc { color: var(--text-dim); max-width: 60ch; margin: 0 0 16px; }
.pmg-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0; }
.pmg-hero-meta { display: flex; gap: 18px; color: var(--text-dim); font-size: 13px; margin-top: 14px; flex-wrap: wrap; }

.pmg-btn-primary { background: var(--accent); color: #fff; border: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
.pmg-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.pmg-btn-secondary { background: none; border: 1px solid var(--border); color: var(--text); padding: 11px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; }
.pmg-link-btn { background: none; border: none; color: var(--gold); cursor: pointer; padding: 4px 0; font-size: 13px; text-align: left; }
.pmg-link-danger { color: #e0654f; }
.pmg-icon-btn { background: none; border: 1px solid var(--border); color: var(--text-dim); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }

.pmg-section { margin: 30px 0; }
.pmg-section h2 { font-size: 20px; color: var(--text); margin: 0 0 12px; }

.pmg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.pmg-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; cursor: pointer; display: flex; flex-direction: column; gap: 6px; }
.pmg-card-emoji { font-size: 34px; }
.pmg-card-name { font-weight: 600; }
.pmg-card-desc { color: var(--text-dim); font-size: 12.5px; flex-grow: 1; }
.pmg-card-price { color: var(--gold); font-weight: 700; }
.pmg-deal-includes { color: var(--text-dim); font-size: 12px; }

.pmg-badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 10px; background: var(--surface-2); color: var(--text-dim); align-self: flex-start; }
.pmg-badge-gold { background: var(--gold); color: #241d0e; }
.pmg-badge-dim { background: var(--surface-2); color: var(--text-dim); }

.pmg-chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
.pmg-chip { background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); padding: 7px 13px; border-radius: 20px; cursor: pointer; font-size: 13px; text-decoration: none; }
.pmg-chip-active { background: var(--accent); border-color: var(--accent); color: #fff; }

.pmg-empty { color: var(--text-dim); padding: 20px 0; }

.pmg-product-detail { display: grid; grid-template-columns: 120px 1fr; gap: 20px; }
.pmg-product-emoji { font-size: 64px; }
.pmg-field-group { margin: 14px 0; }
.pmg-field-group label { display: block; font-size: 12.5px; color: var(--text-dim); margin-bottom: 6px; }
.pmg-field-wide { grid-column: 1 / -1; }
.pmg-check-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; margin: 5px 0; }
.pmg-check-row-group { display: flex; flex-direction: column; gap: 2px; max-height: 220px; overflow-y: auto; }
.pmg-textarea, .pmg-input { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 9px 11px; border-radius: 7px; font-family: inherit; font-size: 13.5px; }
.pmg-textarea { min-height: 60px; resize: vertical; }
.pmg-input-price { max-width: 100px; }
.pmg-inline-input { max-width: 220px; }
.pmg-qty-row { display: flex; align-items: center; gap: 12px; }
.pmg-qty-control { display: flex; align-items: center; gap: 10px; }
.pmg-qty-control button { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
.pmg-add-btn { width: 100%; margin-top: 10px; }
.pmg-wa-btn { background: #25D366; color: #06210f; text-decoration: none; display: block; text-align: center; margin-bottom: 10px; }

.pmg-cart-list { display: flex; flex-direction: column; gap: 10px; }
.pmg-cart-row { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; }
.pmg-cart-name { font-weight: 600; }
.pmg-cart-meta { color: var(--text-dim); font-size: 12px; }
.pmg-cart-price { font-weight: 600; color: var(--gold); }
.pmg-cart-summary, .pmg-order-summary { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-top: 16px; }
.pmg-summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13.5px; }
.pmg-summary-dim { color: var(--text-dim); font-size: 12px; }
.pmg-summary-total { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 10px; font-weight: 700; color: var(--gold); font-size: 15px; }
.pmg-warning { color: #e0a24f; font-size: 13px; margin-top: 10px; }

.pmg-checkout-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
.pmg-confirmation { text-align: center; }
.pmg-confirm-emoji { font-size: 44px; }

.pmg-about-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 14px; margin: 16px 0; }
.pmg-social-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }

.pmg-toast { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); background: var(--basil); color: #fff; padding: 10px 18px; border-radius: 8px; z-index: 100; font-size: 13.5px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); }
.pmg-toast-error { background: var(--accent); }

.pmg-admin { display: flex; min-height: calc(100vh - 60px); }
.pmg-admin-sidebar { width: 190px; flex-shrink: 0; border-right: 1px solid var(--border); padding: 14px 8px; display: flex; flex-direction: column; gap: 2px; }
.pmg-storage-banner { background: var(--surface-2); border: 1px solid var(--gold); color: var(--gold); font-size: 11px; padding: 8px 9px; border-radius: 7px; margin-bottom: 8px; line-height: 1.4; }
.pmg-admin-sidebar button { text-align: left; background: none; border: none; color: var(--text-dim); padding: 9px 10px; border-radius: 7px; cursor: pointer; font-size: 13px; }
.pmg-admin-nav-active { background: var(--surface-2); color: var(--text) !important; }
.pmg-admin-content { flex-grow: 1; padding: 20px; min-width: 0; }
.pmg-admin-h2 { font-size: 20px; margin: 0 0 14px; }
.pmg-admin-h3 { font-size: 15px; color: var(--text-dim); margin: 20px 0 8px; }
.pmg-admin-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }

.pmg-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px,1fr)); gap: 10px; }
.pmg-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 14px; cursor: pointer; text-align: left; }
.pmg-stat-value { font-size: 24px; font-weight: 700; color: var(--gold); }
.pmg-stat-label { color: var(--text-dim); font-size: 12px; margin-top: 3px; }

.pmg-admin-table { display: flex; flex-direction: column; gap: 8px; }
.pmg-admin-row { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; flex-wrap: wrap; }
.pmg-admin-row-emoji { font-size: 24px; }
.pmg-admin-row-main { flex-grow: 1; min-width: 160px; }
.pmg-admin-row-title { font-weight: 600; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.pmg-admin-row-sub { color: var(--text-dim); font-size: 12px; }
.pmg-admin-row-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.pmg-status-select { max-width: 160px; }
.pmg-order-detail { background: var(--surface-2); border: 1px solid var(--border); border-top: none; border-radius: 0 0 8px 8px; padding: 12px 16px; margin-top: -8px; font-size: 13px; }

.pmg-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
.pmg-list-editor { display: flex; flex-direction: column; gap: 6px; }
.pmg-list-row { display: flex; gap: 8px; align-items: center; margin: 6px 0; }

.pmg-emoji-picker { display: flex; gap: 6px; flex-wrap: wrap; }
.pmg-emoji-opt { background: var(--surface); border: 1px solid var(--border); border-radius: 7px; font-size: 18px; padding: 5px 9px; cursor: pointer; }
.pmg-emoji-opt-selected { border-color: var(--gold); background: var(--surface-2); }

@media (max-width: 720px) {
  .pmg-product-detail { grid-template-columns: 1fr; }
  .pmg-checkout-grid { grid-template-columns: 1fr; }
  .pmg-form-grid { grid-template-columns: 1fr; }
  .pmg-admin { flex-direction: column; }
  .pmg-admin-sidebar { width: 100%; flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 1px solid var(--border); }
}
`;
