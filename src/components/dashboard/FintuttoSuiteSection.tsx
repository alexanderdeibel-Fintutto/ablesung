import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Wrench, Users, Calculator, ExternalLink, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

// App metadata not stored in DB
const APP_META: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  url: string;
  tagline: string;
}> = {
  vermietify: {
    icon: Building2,
    gradient: 'from-blue-500 to-indigo-600',
    url: 'https://vermietify.vercel.app',
    tagline: 'Immobilien professionell verwalten',
  },
  hausmeister: {
    icon: Wrench,
    gradient: 'from-amber-500 to-orange-600',
    url: 'https://hausmeister-pro.vercel.app',
    tagline: 'Aufträge & Objekte im Griff',
  },
  mieter: {
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
    url: 'https://mieter-kw8d.vercel.app',
    tagline: 'Mieter-Portal & Kommunikation',
  },
  nebenkosten: {
    icon: Calculator,
    gradient: 'from-violet-500 to-purple-600',
    url: 'https://ablesung.vercel.app',
    tagline: 'Nebenkostenabrechnung leicht gemacht',
  },
};

const SUITE_APP_IDS = ['vermietify', 'hausmeister', 'mieter', 'nebenkosten'];

function formatPrice(price: number): string {
  if (price === 0) return 'Kostenlos';
  return `${price.toFixed(2).replace('.', ',')} €`;
}

interface AppCardProps {
  product: Product;
  meta: typeof APP_META[string];
}

function AppCard({ product, meta }: AppCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const Icon = meta.icon;

  const handleCopyInvite = async () => {
    const inviteUrl = `${meta.url}?ref=fintutto-zaehler`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: 'Link kopiert!', description: 'Einladungslink in die Zwischenablage kopiert.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Link konnte nicht kopiert werden.' });
    }
  };

  const isFree = product.price_monthly === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]"
    >
      {/* Header gradient strip */}
      <div className={`h-1.5 bg-gradient-to-r ${meta.gradient}`} />

      <div className="p-4">
        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm leading-tight">{product.name}</h4>
            <p className="text-white/50 text-xs truncate">{meta.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3 px-1">
          {isFree ? (
            <span className="text-emerald-400 font-bold text-lg">Kostenlos</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-white font-bold text-lg">{formatPrice(product.price_monthly)}</span>
              <span className="text-white/40 text-xs">/Monat</span>
            </div>
          )}
          {!isFree && product.price_yearly > 0 && (
            <p className="text-white/40 text-[11px] mt-0.5">
              oder {formatPrice(product.price_yearly)}/Jahr
            </p>
          )}
        </div>

        {/* Features */}
        {product.features.length > 0 && (
          <ul className="space-y-1 mb-4 px-1">
            {product.features.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-white/60 text-xs">
                <Sparkles className="w-3 h-3 text-white/30 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className={`flex-1 bg-gradient-to-r ${meta.gradient} text-white border-0 font-medium text-xs h-9 rounded-xl hover:opacity-90`}
            onClick={() => window.open(meta.url, '_blank')}
          >
            Öffnen
            <ExternalLink className="ml-1.5 h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/50 hover:text-white hover:bg-white/10 h-9 w-9 p-0 rounded-xl"
            onClick={handleCopyInvite}
            title="Einladungslink kopieren"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function FintuttoSuiteSection() {
  const { data: allProducts, isLoading } = useProducts();

  if (isLoading) return null;

  // Get cheapest product per app
  const productsByApp = SUITE_APP_IDS.reduce((acc, appId) => {
    const appProducts = (allProducts || []).filter(p => p.app_id === appId);
    if (appProducts.length > 0) {
      // Show cheapest plan
      acc[appId] = appProducts.reduce((min, p) =>
        p.price_monthly < min.price_monthly ? p : min
      );
    }
    return acc;
  }, {} as Record<string, Product>);

  const availableApps = SUITE_APP_IDS.filter(id => productsByApp[id] && APP_META[id]);

  if (availableApps.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-4 h-4 text-white/40" />
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide">
          Fintutto Suite – Mehr entdecken
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {availableApps.map(appId => (
          <AppCard
            key={appId}
            product={productsByApp[appId]}
            meta={APP_META[appId]}
          />
        ))}
      </div>

      <p className="text-center text-white/30 text-[10px] mt-3 tracking-wide">
        Alle Apps teilen dieselbe Anmeldung · FINTUTTO SUITE
      </p>
    </section>
  );
}
