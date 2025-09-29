import { useEffect, useMemo, useState, type ComponentType } from "react";
import styles from "./styles/Pet.module.css";
import { api, type PetState } from "../api";
import Cat from "../components/pets/cat";
import Dog from "../components/pets/dog";
import PetCarousel, { type PetSlide } from "../components/PetCarousel";

// вместо JSX.Element — ComponentType
const ALL_PETS: Record<string, ComponentType<any>> = {
  dog: Dog,
  cat: Cat,
};

export default function Pet() {
  const [state, setState] = useState<PetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [carouselKey, setCarouselKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.petState();
        setState(s);
      } catch (e: any) {
        setErr(e?.message ?? "Не удалось загрузить питомца");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const bgClass = useMemo(() => {
    switch (state?.background) {
      case "sky":  return styles.bgSky;
      case "room": return styles.bgRoom;
      default:     return styles.bgDefault;
    }
  }, [state?.background]);

  const slides: PetSlide[] = useMemo(() => {
  const owned = new Set(state?.ownedPetIds ?? []);
  return Object.keys(ALL_PETS).map((id) => {
    const Comp = ALL_PETS[id];
    return {
      id,
      render: <Comp className={styles.pet} />,
      locked: !owned.has(id), 
    };
  });
}, [state?.ownedPetIds]);


  const initialIndex = useMemo(() => {
    if (!state?.selectedPetId) return 0;
    const idx = slides.findIndex(s => s.id === state.selectedPetId);
    return Math.max(0, idx);
  }, [state?.selectedPetId, slides]);

  async function act(name: Parameters<typeof api.petAction>[0], payload?: any) {
    try {
      const s = await api.petAction(name, payload);
      setState(s);
    } catch (e: any) {
      alert(e?.message ?? "Ошибка");
    }
  }

  if (loading) return <div className={styles.page}><main className={styles.main}><div className={styles.card}>Загрузка…</div></main></div>;
  if (err || !state) return <div className={styles.page}><main className={styles.main}><div className={styles.card}>{err ?? "Ошибка"}</div></main></div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Питомец</h1>
        <div className={styles.coins}><i />{state.coins}</div>
      </header>

      <main className={styles.main}>
        <section className={`${styles.scene} ${bgClass}`}>
          <PetCarousel
            key={carouselKey}
            slides={slides}
            initialIndex={initialIndex}
            onChange={async (i) => {
            const id = slides[i].id;

            // Заблокирован — можно смотреть, но нельзя выбирать
            if (slides[i].locked) {
              return; // ничего не делаем
            }

            if (id !== state.selectedPetId) {
              try {
                await api.petSelect(id);
                setState(s => (s ? { ...s, selectedPetId: id } : s));
              } catch {
                // если бэк вернул 400 — просто игнорируем, слайд уже на месте
              }
            }
          }}
          />
        </section>

        <section className={styles.card}>
          <div className={styles.stats}>
            <Stat label="Настроение" value={state.mood} />
            <Stat label="Сытость" value={state.satiety} />
            <Stat label="Здоровье" value={state.health} />
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={() => act("play")}>Поиграть</button>
            <button className={styles.btnPrimary} onClick={() => act("heal")}>Вылечить</button>
            <button className={styles.btnSecondary} onClick={() => setShopOpen(true)}>Магазин</button>
          </div>
        </section>

        {shopOpen && (
          <div className={styles.modalBackdrop} onClick={() => setShopOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Магазин</h2>
              <ul className={styles.shopList}>
                {[
                  { id: "food_small", title: "Корм (мал.)", price: 10, type: "food", payload: { satiety: +15 } },
                  { id: "food_big",   title: "Корм (бол.)", price: 25, type: "food", payload: { satiety: +40 } },
                  { id: "bg_sky",     title: "Фон: Небо",   price: 30, type: "bg",   payload: { background: "sky" } },
                  { id: "bg_room",    title: "Фон: Комната",price: 30, type: "bg",   payload: { background: "room" } },
                  { id: "ball",       title: "Мячик",       price: 20, type: "item", payload: { item: "ball" } },
                ].map(it => (
                  <li key={it.id} className={styles.shopRow}>
                    <div>
                      <div className={styles.shopTitle}>{it.title}</div>
                      <div className={styles.shopPrice}>{it.price} мон.</div>
                    </div>
                    <button
                      className={styles.buyBtn}
                      disabled={(state?.coins ?? 0) < it.price}
                      onClick={() => act("buy", it)}
                    >
                      Купить
                    </button>
                  </li>
                ))}
              </ul>
              <button className={styles.closeBtn} onClick={() => setShopOpen(false)}>Закрыть</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}%</span>
      </div>
      <div className={styles.progress}><i style={{ width: `${value}%` }} /></div>
    </div>
  );
}
