-- Fix falsche Preise in der products-Tabelle + Enterprise-Tiers

UPDATE public.products SET price_monthly = 9.99, price_yearly = 95.90, stripe_price_id_monthly = 'price_1Sr56K52lqSgjCzeqfCfOudX', updated_at = NOW()
WHERE app_id = 'vermietify' AND name = 'Vermietify Basic';

UPDATE public.products SET price_monthly = 24.99, price_yearly = 239.90, stripe_price_id_monthly = 'price_1Sr56o52lqSgjCzeRuGrant2', updated_at = NOW()
WHERE app_id = 'vermietify' AND name = 'Vermietify Pro';

UPDATE public.products SET name = 'HausmeisterPro Starter', price_monthly = 9.99, price_yearly = 95.90, stripe_price_id_monthly = 'price_1St3Eg52lqSgjCze5l6pqANG', features = '["Bis zu 10 Gebaeude", "Erweiterte Aufgabenverwaltung", "Kalender-Integration"]'::jsonb, updated_at = NOW()
WHERE app_id = 'hausmeister' AND name = 'HausmeisterPro';

INSERT INTO public.products (app_id, name, description, price_monthly, price_yearly, features, sort_order)
VALUES ('hausmeister', 'HausmeisterPro Pro', 'Fuer wachsende Unternehmen', 24.99, 239.90, '["Unbegrenzte Gebaeude", "Alle Starter-Features", "Dokumenten-Management", "API-Zugang"]'::jsonb, 2)
ON CONFLICT DO NOTHING;

UPDATE public.products SET price_yearly = 191.90, updated_at = NOW() WHERE app_id = 'nebenkosten' AND name = 'Nebenkosten Starter';
UPDATE public.products SET price_yearly = 95.90, updated_at = NOW() WHERE app_id = 'zaehler' AND name LIKE 'Zählerstand Basic%';
UPDATE public.products SET price_yearly = 239.90, updated_at = NOW() WHERE app_id = 'zaehler' AND name LIKE 'Zählerstand Pro%';

INSERT INTO public.products (app_id, name, description, price_monthly, price_yearly, features, sort_order)
VALUES ('zaehler', 'Zählerstand Enterprise', 'Fuer grosse Hausverwaltungen', 49.99, 479.90, '["Unbegrenzte Einheiten", "API-Zugang", "Dedizierter Support", "Custom Reports", "SLA-Garantie"]'::jsonb, 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.products (app_id, name, description, price_monthly, price_yearly, features, sort_order)
VALUES ('hausmeister', 'HausmeisterPro Enterprise', 'Fuer grosse Hausverwaltungen', 49.99, 479.90, '["Unbegrenzte Gebaeude", "Multi-Team", "Custom Branding", "SLA-Garantie", "Dedizierter Support"]'::jsonb, 3)
ON CONFLICT DO NOTHING;
