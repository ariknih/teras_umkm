const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports at the top
const targetImports = "import InteractiveFeatures from '@/app/components/InteractiveFeatures'";
const newImports = `import InteractiveFeatures from '@/app/components/InteractiveFeatures'
import HeroBackground from '@/app/components/HeroBackground'
import ScrollReveal from '@/app/components/ScrollReveal'`;

if (content.includes(targetImports)) {
  content = content.replace(targetImports, newImports);
  console.log("1. Imports added.");
} else {
  console.error("1. Failed to find imports target.");
  process.exit(1);
}

// 2. Replace Hero Background section
const startHeroBg = "        {/* Background Gradients & Images */}";
const endHeroBg = "           />\n        </div>";
const startIndexBg = content.indexOf(startHeroBg);
const endIndexBg = content.indexOf(endHeroBg);

if (startIndexBg !== -1 && endIndexBg !== -1) {
  const oldBgBlock = content.substring(startIndexBg, endIndexBg + endHeroBg.length);
  content = content.replace(oldBgBlock, "        <HeroBackground />");
  console.log("2. Hero background replaced.");
} else {
  console.error("2. Failed to find hero background block.");
  process.exit(1);
}

// 3. Wrap Keunggulan Platform
const startKeunggulan = `      {/* ── KEUNGGULAN PLATFORM ──────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex flex-col items-center bg-surface">
        <div className="w-full max-w-[1280px] py-8 px-6 bg-surface rounded-3xl border border-border shadow-sm flex flex-col items-center gap-8 overflow-hidden">`;

const replaceKeunggulan = `      {/* ── KEUNGGULAN PLATFORM ──────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex flex-col items-center bg-surface">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] py-8 px-6 bg-surface rounded-3xl border border-border shadow-sm flex flex-col items-center gap-8 overflow-hidden">`;

const endKeunggulan = `            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">💬</span>
              <span className="text-2xl font-bold text-text-primary">Komunitas</span>
              <span className="text-xs text-text-secondary">Forum diskusi & networking</span>
            </div>
          </div>
        </div>
      </section>`;

const replaceEndKeunggulan = `            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">💬</span>
              <span className="text-2xl font-bold text-text-primary">Komunitas</span>
              <span className="text-xs text-text-secondary">Forum diskusi & networking</span>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>`;

if (content.includes(startKeunggulan)) {
  content = content.replace(startKeunggulan, replaceKeunggulan);
  content = content.replace(endKeunggulan, replaceEndKeunggulan);
  console.log("3. Keunggulan Platform wrapped.");
} else {
  console.error("3. Failed to find Keunggulan Platform block.");
  process.exit(1);
}

// 4. Wrap Features & Testimonial
const startFeatures = `      {/* ── FEATURES & TESTIMONIAL ──────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 bg-background flex justify-center">
        <div className="w-full max-w-[1280px] flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">`;

const replaceFeatures = `      {/* ── FEATURES & TESTIMONIAL ──────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 bg-background flex justify-center">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">`;

const endFeatures = `              <div className="mt-4">
                <h4 className="font-semibold text-lg text-surface">Gilang Prangestu</h4>
                <p className="text-xs text-surface/70">Jasa Keramik Bandung</p>
              </div>
            </div>
          </div>
        </div>
      </section>`;

const replaceEndFeatures = `              <div className="mt-4">
                <h4 className="font-semibold text-lg text-surface">Gilang Prangestu</h4>
                <p className="text-xs text-surface/70">Jasa Keramik Bandung</p>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>`;

if (content.includes(startFeatures)) {
  content = content.replace(startFeatures, replaceFeatures);
  content = content.replace(endFeatures, replaceEndFeatures);
  console.log("4. Features wrapped.");
} else {
  console.error("4. Failed to find Features block.");
  process.exit(1);
}

// 5. Wrap Produk Unggulan
const startProduk = `      {/* ── PRODUK UNGGULAN ───────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <div className="w-full max-w-[1280px] bg-background rounded-3xl border border-border p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden shadow-sm">`;

const replaceProduk = `      {/* ── PRODUK UNGGULAN ───────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] bg-background rounded-3xl border border-border p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden shadow-sm">`;

const endProduk = `              </Link>
            ))}
          </div>
        </div>
      </section>
      )}`;

const replaceEndProduk = `              </Link>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>
      )}`;

if (content.includes(startProduk)) {
  content = content.replace(startProduk, replaceProduk);
  content = content.replace(endProduk, replaceEndProduk);
  console.log("5. Produk Unggulan wrapped.");
} else {
  console.error("5. Failed to find Produk Unggulan block.");
  process.exit(1);
}

// 6. Wrap FAQ
const startFaq = `      {/* ── FAQ SECTION ─────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <div className="w-full max-w-[1280px] flex flex-col md:flex-row gap-12 lg:gap-24">`;

const replaceFaq = `      {/* ── FAQ SECTION ─────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] flex flex-col md:flex-row gap-12 lg:gap-24">`;

const endFaq = `              </details>
            ))}
          </div>
        </div>
      </section>`;

const replaceEndFaq = `              </details>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>`;

if (content.includes(startFaq)) {
  content = content.replace(startFaq, replaceFaq);
  content = content.replace(endFaq, replaceEndFaq);
  console.log("6. FAQ wrapped.");
} else {
  console.error("6. Failed to find FAQ block.");
  process.exit(1);
}

// 7. Wrap Bottom CTA
const startCta = `        <div className="relative z-10 w-full max-w-[800px] flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            Siap memperluas jangkauan bisnis?`;

const replaceCta = `        <ScrollReveal>
          <div className="relative z-10 w-full max-w-[800px] flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              Siap memperluas jangkauan bisnis?`;

const endCta = `          <Link href={user ? "/merchant/dashboard" : "/auth?tab=register"} className="mt-4 btn-primary shadow-lg">
            {user ? "Buka Dashboard Anda" : "Mulai Berdagang Sekarang!"}
          </Link>
        </div>
      </section>
    </div>
  )
}`;

const replaceEndCta = `          <Link href={user ? "/merchant/dashboard" : "/auth?tab=register"} className="mt-4 btn-primary shadow-lg">
            {user ? "Buka Dashboard Anda" : "Mulai Berdagang Sekarang!"}
          </Link>
        </div>
        </ScrollReveal>
      </section>
    </div>
  )
}`;

if (content.includes(startCta)) {
  content = content.replace(startCta, replaceCta);
  content = content.replace(endCta, replaceEndCta);
  console.log("7. Bottom CTA wrapped.");
} else {
  console.error("7. Failed to find Bottom CTA block.");
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("File saved successfully.");
