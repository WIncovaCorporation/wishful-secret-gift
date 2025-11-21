-- =====================================================
-- GIVLYN DATABASE DATA EXPORT
-- Generated: 2025-11-21
-- Export from Lovable Cloud Database
-- =====================================================
-- 
-- IMPORTANT: Run database_export.sql FIRST to create the schema
-- This file contains only the INSERT statements for data
-- 
-- Tables with data:
-- - profiles (5 rows)
-- - user_roles (7 rows)
-- - subscription_plans (3 rows)
-- - usage_tracking (5 rows)
-- - events (1 row)
-- - groups (2 rows)
-- - group_members (3 rows)
-- - gift_lists (3 rows)
-- - gift_items (10 rows)
-- - gift_exchanges (2 rows)
-- - anonymous_messages (2 rows)
-- - affiliate_products (10 rows)
-- - affiliate_config (5 rows)
-- - ai_corrections (100+ rows)
-- - gift_card_inventory (6 rows)
-- - github_audit_logs (large dataset)
--
-- =====================================================

-- Disable triggers temporarily for faster import
SET session_replication_role = 'replica';

-- =====================================================
-- TABLE: profiles
-- =====================================================

INSERT INTO public.profiles (id, user_id, display_name, avatar_url, onboarding_completed, created_at, updated_at) VALUES
('9503f3ee-7afe-44bc-b6d1-187e83e5cf96', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 'JUAN 2', NULL, true, '2025-11-10 16:30:00.153136+00', '2025-11-20 19:40:11.482365+00'),
('bcaf2985-8af7-4a86-8970-fa97c3d0cf22', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 'JUAN CARLOS COVA GOMEZ', NULL, true, '2025-11-10 18:19:38.742936+00', '2025-11-20 19:38:36.259422+00'),
('cec23eeb-a5a9-4d51-bdb4-53d4e8f1cec0', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', 'Usuario', NULL, false, '2025-11-10 21:40:25.262898+00', '2025-11-10 21:40:25.262898+00'),
('f5cc3e63-486e-4146-8a3f-6a6f2be8f910', 'b31b2f6f-ac26-451b-ad4b-e0b079fe4486', 'temporal1', NULL, false, '2025-11-20 19:14:22.778674+00', '2025-11-20 19:14:22.778674+00'),
('8c1cd52b-0f4e-409f-b971-af3cfc40683f', '7c8b6d2e-8bc5-4d6a-8817-24fca4b296e8', 'T2', NULL, true, '2025-11-20 19:16:59.979797+00', '2025-11-20 19:31:41.552907+00');

-- =====================================================
-- TABLE: user_roles
-- =====================================================

INSERT INTO public.user_roles (id, user_id, role, assigned_at, created_by, expires_at) VALUES
('7deb5945-635c-4a4d-9a14-1a78c354b44a', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', 'free_user', '2025-11-11 18:05:35.151852+00', NULL, NULL),
('84ab90d1-d5d0-4422-a72c-4d2565289e4d', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 'free_user', '2025-11-11 18:05:35.151852+00', NULL, NULL),
('0db4f0ae-a342-413c-9249-0bbd6c430038', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 'free_user', '2025-11-11 18:05:35.151852+00', NULL, NULL),
('9c497565-898a-4d06-9333-2c13bf08ea11', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 'admin', '2025-11-15 23:06:05.292113+00', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', NULL),
('7ffb8c87-28c2-41bc-af37-9e07f6877fcc', 'b31b2f6f-ac26-451b-ad4b-e0b079fe4486', 'free_user', '2025-11-20 19:14:22.778674+00', NULL, NULL),
('2c9ae850-b7ce-4d48-81bf-8d94b2eb1ccc', '7c8b6d2e-8bc5-4d6a-8817-24fca4b296e8', 'free_user', '2025-11-20 19:16:59.979797+00', NULL, NULL),
('c66f0f4f-c45b-4a58-854e-f9ddc3719cb2', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', 'admin', '2025-11-21 16:43:30.928673+00', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', NULL);

-- =====================================================
-- TABLE: subscription_plans
-- =====================================================

INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_annual, currency, features, stripe_price_id_monthly, stripe_price_id_annual, is_active, sort_order, created_at, updated_at) VALUES
('81c39518-9716-4856-8c25-17c157636263', 'free', 'Plan Gratuito', 'Perfecto para probar', 0.00, 0.00, 'USD', '{"ai_suggestions_per_month":0,"amazon_product_search":false,"amazon_searches_per_month":0,"can_remove_branding":false,"max_affiliate_products":10,"max_groups":3,"max_participants_per_group":10,"max_wishlists":1,"priority_support":false}', NULL, NULL, true, 1, '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00'),
('3e0090d2-dc68-468e-b758-0cdfbcc60640', 'premium_individual', 'Premium Individual', 'Para usuarios activos', 4.99, 49.99, 'USD', '{"ai_suggestions_per_month":10,"amazon_product_search":true,"amazon_searches_per_month":100,"can_remove_branding":true,"max_groups":999,"max_participants_per_group":50,"max_wishlists":5,"priority_support":false}', NULL, NULL, true, 2, '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00'),
('d522f774-c1ab-4457-97d4-632dabce0664', 'premium_business', 'Premium Business', 'Para equipos y empresas', 19.99, 199.99, 'USD', '{"ai_suggestions_per_month":999,"amazon_product_search":true,"amazon_searches_per_month":999,"can_remove_branding":true,"custom_branding":true,"max_groups":999,"max_participants_per_group":9999,"max_wishlists":999,"priority_support":true}', NULL, NULL, true, 3, '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00');

-- =====================================================
-- TABLE: usage_tracking
-- =====================================================

INSERT INTO public.usage_tracking (id, user_id, ai_suggestions_used, groups_count, participants_total, wishlists_count, period_start, period_end, last_reset_at, created_at, updated_at) VALUES
('1d8ff4a3-1a80-440b-af76-f8f923dbde5c', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', 0, 0, 0, 0, '2025-11-11 18:29:31.04573+00', '2025-12-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00'),
('a1996032-0616-42d7-9ec7-fe664dac8791', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 0, 0, 0, 0, '2025-11-11 18:29:31.04573+00', '2025-12-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00'),
('13e7fe23-8f60-4c2e-bcc4-afb5d232cc65', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 0, 0, 0, 0, '2025-11-11 18:29:31.04573+00', '2025-12-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00', '2025-11-11 18:29:31.04573+00'),
('141b1c4b-fa19-488d-904e-ccdcf224347f', 'b31b2f6f-ac26-451b-ad4b-e0b079fe4486', 0, 0, 0, 0, '2025-11-20 19:14:22.778674+00', '2025-12-20 19:14:22.778674+00', '2025-11-20 19:14:22.778674+00', '2025-11-20 19:14:22.778674+00', '2025-11-20 19:14:22.778674+00'),
('f84714cf-3916-46ed-9eb6-fe151aacf549', '7c8b6d2e-8bc5-4d6a-8817-24fca4b296e8', 0, 0, 0, 0, '2025-11-20 19:16:59.979797+00', '2025-12-20 19:16:59.979797+00', '2025-11-20 19:16:59.979797+00', '2025-11-20 19:16:59.979797+00', '2025-11-20 19:16:59.979797+00');

-- =====================================================
-- TABLE: events
-- =====================================================

INSERT INTO public.events (id, name, type, date, created_by, created_at) VALUES
('5bf2b547-89a7-4e14-b1be-02516f2ff541', 'intercambio de Regalos Navidad', 'christmas', '2025-12-24', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', '2025-11-10 16:27:53.721841+00');

-- =====================================================
-- TABLE: groups
-- =====================================================

INSERT INTO public.groups (id, name, description, share_code, min_budget, max_budget, suggested_budget, exchange_date, notification_mode, organizer_message, is_drawn, event_id, created_by, created_at, updated_at) VALUES
('c0eb7c63-94dc-4062-a34d-ca10f026dceb', 'Navidad 2025', 'Regalos para el intercambio de regalos secreto', 'ex509kor', 50.00, NULL, NULL, '2025-12-24', 'private', NULL, false, NULL, 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', '2025-11-10 16:26:46.77103+00', '2025-11-10 16:26:46.77103+00'),
('069530e8-03b2-47bd-a19d-fb87e1c44704', 'Navidad2025', NULL, 'totp8wmr', 50.00, NULL, NULL, '2025-12-24', 'private', NULL, true, NULL, 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', '2025-11-10 18:21:21.059863+00', '2025-11-10 22:50:29.017112+00');

-- =====================================================
-- TABLE: group_members
-- =====================================================

INSERT INTO public.group_members (id, group_id, user_id, list_id, joined_at) VALUES
('096aca5a-2dd0-4839-97c3-1f8e2f57fa27', 'c0eb7c63-94dc-4062-a34d-ca10f026dceb', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', NULL, '2025-11-10 16:26:46.980644+00'),
('5228e984-16e1-4818-b3c6-7ddff56979a5', '069530e8-03b2-47bd-a19d-fb87e1c44704', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', NULL, '2025-11-10 18:21:21.416042+00'),
('0e61b594-9c3f-42c4-a8f9-51c9c385c573', '069530e8-03b2-47bd-a19d-fb87e1c44704', 'b1449b30-d9af-47c4-98b7-3758c78512e4', NULL, '2025-11-10 20:07:19.130539+00');

-- =====================================================
-- TABLE: gift_lists
-- =====================================================

INSERT INTO public.gift_lists (id, user_id, name, event_id, created_at, updated_at) VALUES
('40b57b17-5982-4684-879d-5b1ccbbd6ff4', 'ce16e4c5-9252-40dc-83a1-3d9a52e7cfaf', 'Navidad 2025', NULL, '2025-11-09 21:42:41.121192+00', '2025-11-09 21:42:41.121192+00'),
('2788d87e-7ba7-43e8-8a42-14d54d44c121', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 'Navidad 2025', NULL, '2025-11-10 16:35:03.577265+00', '2025-11-10 16:35:03.577265+00'),
('8ac0cfe6-bf5e-456b-85cc-655b68f62d6a', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 'Navidad 2025', NULL, '2025-11-10 18:20:15.415296+00', '2025-11-10 18:20:15.415296+00');

-- =====================================================
-- TABLE: gift_items
-- =====================================================

INSERT INTO public.gift_items (id, list_id, name, brand, category, color, size, priority, notes, reference_link, image_url, is_purchased, created_at, updated_at) VALUES
('db52603e-c125-49ca-8df5-d4458f1ee71d', '40b57b17-5982-4684-879d-5b1ccbbd6ff4', 'zapatos', 'Puma', 'Zapatos', 'Negro', '45', 'medium', '', '', NULL, false, '2025-11-10 16:12:07.923876+00', '2025-11-10 16:12:16.819861+00'),
('947832d7-308d-4738-84b7-d50a53983fb7', '2788d87e-7ba7-43e8-8a42-14d54d44c121', 'TELEFONO', 'Samsung', 'Smartphone', 'Blanco', '', 'medium', '', '', NULL, true, '2025-11-10 16:35:37.093963+00', '2025-11-12 17:09:14.696567+00'),
('43e4b03d-8944-4e2f-a48d-3a13bf2fb90c', '8ac0cfe6-bf5e-456b-85cc-655b68f62d6a', 'zapatos', 'Adidas', 'Zapatos', 'Blanco', '45', 'medium', '', '', NULL, false, '2025-11-10 18:20:45.37005+00', '2025-11-13 19:01:38.436192+00'),
('81939373-6aa2-4d10-bf8f-9f8d7748aad9', '2788d87e-7ba7-43e8-8a42-14d54d44c121', 'camisa', '', '', 'azul', 'M', 'medium', '', 'https://www.amazon.com/-/es/J-VER-Camisas-el%C3%A1sticas-negocios-casuales/dp/B09JFR8HTV/ref=sr_1_3?dib=eyJ2IjoiMSJ9', NULL, false, '2025-11-12 20:37:05.907909+00', '2025-11-12 20:37:05.907909+00'),
('c5ecbaea-3f51-4791-b8ae-c6039618283a', '2788d87e-7ba7-43e8-8a42-14d54d44c121', 'iPad Air', NULL, 'electronics', NULL, NULL, 'medium', 'Tablet potente con chip M1 y pantalla Liquid Retina de 10.9 pulgadas', 'https://amazon.com/ipad-air?tag=giftapp-20', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', false, '2025-11-13 00:05:43.13487+00', '2025-11-13 00:05:43.13487+00'),
('7dfc72f1-a59d-4f88-ab33-0039aa132f1f', '2788d87e-7ba7-43e8-8a42-14d54d44c121', 'Yoga Mat Premium', NULL, 'sports', NULL, NULL, 'medium', 'Tapete de yoga antideslizante con alineación y bolsa de transporte', 'https://amazon.com/yoga-mat?tag=giftapp-20', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f', false, '2025-11-13 19:20:14.542206+00', '2025-11-13 19:20:14.542206+00'),
('af70f559-4157-4e64-8056-2525ece86812', '2788d87e-7ba7-43e8-8a42-14d54d44c121', 'PlayStation 5', NULL, 'electronics', NULL, NULL, 'medium', 'Consola de videojuegos de última generación con SSD ultrarrápido', 'https://amazon.com/ps5?tag=giftapp-20', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db', false, '2025-11-14 13:35:00.762871+00', '2025-11-14 13:35:00.762871+00'),
('d9f6fde2-f596-4ff7-b91e-1e58b6594c14', '2788d87e-7ba7-43e8-8a42-14d54d44c121', 'Kindle Paperwhite', '', 'books', '', '', 'high', 'Lector de libros electrónicos con pantalla antirreflejos y luz cálida', 'https://amazon.com/kindle?tag=giftapp-20', 'https://images.unsplash.com/photo-1512820790803-83ca734da794', false, '2025-11-12 23:55:55.977091+00', '2025-11-12 23:56:36.228364+00');

-- =====================================================
-- TABLE: gift_exchanges
-- =====================================================

INSERT INTO public.gift_exchanges (id, group_id, giver_id, receiver_id, view_count, viewed_at, created_at) VALUES
('f7dd74fe-78dd-402c-b8ed-884feae2a1da', '069530e8-03b2-47bd-a19d-fb87e1c44704', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 1, '2025-11-12 22:59:02.015+00', '2025-11-10 22:50:28.793728+00'),
('c37495f9-e199-4d64-91aa-5589935e4de6', '069530e8-03b2-47bd-a19d-fb87e1c44704', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 1, '2025-11-15 23:06:14.328+00', '2025-11-10 22:50:28.793728+00');

-- =====================================================
-- TABLE: anonymous_messages
-- =====================================================

INSERT INTO public.anonymous_messages (id, group_id, giver_id, receiver_id, message, is_read, created_at) VALUES
('e4d69bc9-bf41-4e2e-9549-675b62c39e05', '069530e8-03b2-47bd-a19d-fb87e1c44704', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 'quieres zapatos o camisa ?', false, '2025-11-11 16:14:05.56116+00'),
('0e80df0a-edc5-4a70-a539-684fea00c662', '069530e8-03b2-47bd-a19d-fb87e1c44704', 'b1449b30-d9af-47c4-98b7-3758c78512e4', 'b94521a7-a5f5-4f18-8664-7ec8cb32f874', 'adidas o puma?', false, '2025-11-11 16:50:30.324317+00');

-- =====================================================
-- TABLE: affiliate_products
-- =====================================================

INSERT INTO public.affiliate_products (id, name, description, category, price, currency, image_url, affiliate_link, product_url, affiliate_network, commission_rate, rating, reviews_count, is_active, owner_id, created_at, updated_at) VALUES
('c59443b5-0b80-402a-88f9-5b4b3dd46638', 'AirPods Pro (2da Gen)', 'Audífonos inalámbricos con cancelación activa de ruido y audio espacial', 'electronics', 249.99, 'USD', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7', 'https://amazon.com/airpods-pro?tag=giftapp-20', 'https://amazon.com/airpods-pro', 'amazon', 0.04, 4.80, 15234, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('3209b999-6a43-4324-a645-9d8cd5f1414f', 'iPad Air', 'Tablet potente con chip M1 y pantalla Liquid Retina de 10.9 pulgadas', 'electronics', 599.99, 'USD', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 'https://amazon.com/ipad-air?tag=giftapp-20', 'https://amazon.com/ipad-air', 'amazon', 0.04, 4.70, 8932, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('653039b5-afc3-4aa6-847c-38a652aa4f40', 'PlayStation 5', 'Consola de videojuegos de última generación con SSD ultrarrápido', 'electronics', 499.99, 'USD', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db', 'https://amazon.com/ps5?tag=giftapp-20', 'https://amazon.com/ps5', 'amazon', 0.04, 4.90, 21045, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('768857e4-cbe0-43f1-a62b-7e9079607aec', 'Nike Air Force 1', 'Zapatillas clásicas de cuero con suela Air para comodidad todo el día', 'fashion', 110.00, 'USD', 'https://images.unsplash.com/photo-1549298916-b41d501d3772', 'https://amazon.com/nike-air-force?tag=giftapp-20', 'https://amazon.com/nike-air-force', 'amazon', 0.04, 4.60, 6543, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('c3221cc4-767e-4669-bed6-7f80a274d985', 'Reloj Smartwatch', 'Reloj inteligente con monitor de salud y notificaciones', 'fashion', 199.99, 'USD', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30', 'https://amazon.com/smartwatch?tag=giftapp-20', 'https://amazon.com/smartwatch', 'amazon', 0.04, 4.50, 3421, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('a6c93fe0-4dcc-4205-83bb-4f2bb89481df', 'Cafetera Espresso', 'Máquina de café espresso automática con espumador de leche', 'home', 299.99, 'USD', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6', 'https://amazon.com/espresso-machine?tag=giftapp-20', 'https://amazon.com/espresso-machine', 'amazon', 0.04, 4.40, 2134, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('66c63c1a-5feb-4c91-9302-fedbded88757', 'Robot Aspiradora', 'Robot aspiradora inteligente con mapeo láser y app móvil', 'home', 399.99, 'USD', 'https://images.unsplash.com/photo-1558317374-067fb5f30001', 'https://amazon.com/robot-vacuum?tag=giftapp-20', 'https://amazon.com/robot-vacuum', 'amazon', 0.04, 4.70, 5432, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('e13e052d-2c78-41bb-97fc-ed66bcfc9f75', 'Kindle Paperwhite', 'Lector de libros electrónicos con pantalla antirreflejos y luz cálida', 'books', 139.99, 'USD', 'https://images.unsplash.com/photo-1512820790803-83ca734da794', 'https://amazon.com/kindle?tag=giftapp-20', 'https://amazon.com/kindle', 'amazon', 0.04, 4.80, 9876, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00'),
('b66d620d-6378-4573-9445-68d9aaa4ca47', 'Yoga Mat Premium', 'Tapete de yoga antideslizante con alineación y bolsa de transporte', 'sports', 49.99, 'USD', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f', 'https://amazon.com/yoga-mat?tag=giftapp-20', 'https://amazon.com/yoga-mat', 'amazon', 0.04, 4.50, 4321, true, NULL, '2025-11-11 18:44:05.873084+00', '2025-11-11 18:44:05.873084+00');

-- =====================================================
-- TABLE: affiliate_config
-- =====================================================

INSERT INTO public.affiliate_config (id, store_name, affiliate_id, commission_rate, is_active, notes, created_at, updated_at) VALUES
('1993264a-4ee5-47ca-b02e-a045108e33ad', 'amazon', NULL, 4.00, false, 'Amazon Associates - Pending registration', '2025-11-21 16:38:13.521367+00', '2025-11-21 16:38:13.521367+00'),
('3f34dad9-4189-4590-84a5-b9f05fd2f46e', 'walmart', NULL, 4.00, false, 'Walmart Affiliates - Pending registration', '2025-11-21 16:38:13.521367+00', '2025-11-21 16:38:13.521367+00'),
('89a7af9b-58a9-4efe-8fcb-fc440dee7fd2', 'target', NULL, 5.00, false, 'Target Partners - Pending registration', '2025-11-21 16:38:13.521367+00', '2025-11-21 16:38:13.521367+00'),
('11ddc632-3fdd-4f10-b24b-c233fa3713df', 'etsy', NULL, 4.00, false, 'Etsy Affiliates - Pending registration', '2025-11-21 16:38:13.521367+00', '2025-11-21 16:38:13.521367+00'),
('659cc2a0-75f4-469a-8bf1-1d6e8f9b7217', 'ebay', NULL, 5.00, false, 'eBay Partner Network - Pending registration', '2025-11-21 16:38:13.521367+00', '2025-11-21 16:38:13.521367+00');

-- =====================================================
-- TABLE: gift_card_inventory
-- =====================================================

INSERT INTO public.gift_card_inventory (id, retailer, code, pin, denomination, cost, selling_price, margin, currency, expires_at, is_sold, sold_at, sold_to_user_id, created_at) VALUES
('9d430b95-830b-4360-b46f-9126d0ee0456', 'Amazon', 'AMZN-XXXX-XXXX-0001', NULL, 25.00, 23.75, 25.00, 1.25, 'USD', '2026-12-31', false, NULL, NULL, '2025-11-11 18:44:05.873084+00'),
('9ac1bb35-ee9f-4fe7-b247-80311cb97510', 'Amazon', 'AMZN-XXXX-XXXX-0002', NULL, 50.00, 47.50, 50.00, 2.50, 'USD', '2026-12-31', false, NULL, NULL, '2025-11-11 18:44:05.873084+00'),
('80156620-4f8a-4360-bd5d-6d98699c8f9a', 'Amazon', 'AMZN-XXXX-XXXX-0003', NULL, 100.00, 95.00, 100.00, 5.00, 'USD', '2026-12-31', false, NULL, NULL, '2025-11-11 18:44:05.873084+00'),
('83d40a3e-3a40-48ac-9a02-5e19f96f59f3', 'Spotify', 'SPOT-XXXX-XXXX-0001', '1234', 10.00, 9.50, 10.00, 0.50, 'USD', '2026-06-30', false, NULL, NULL, '2025-11-11 18:44:05.873084+00'),
('4ad2d22a-b87e-4165-a550-8746fb2ddf60', 'Netflix', 'NFLX-XXXX-XXXX-0001', NULL, 25.00, 23.75, 25.00, 1.25, 'USD', '2026-12-31', false, NULL, NULL, '2025-11-11 18:44:05.873084+00'),
('2d272079-dcbb-4e24-9481-83bfa6c0aa8c', 'Steam', 'STEM-XXXX-XXXX-0001', NULL, 20.00, 19.00, 20.00, 1.00, 'USD', '2027-12-31', false, NULL, NULL, '2025-11-11 18:44:05.873084+00');

-- =====================================================
-- NOTE: ai_corrections and github_audit_logs tables
-- contain 100+ rows with complex JSONB data
-- For data export, use CSV export from Supabase dashboard
-- or contact support for large data migration
-- =====================================================

-- Re-enable triggers
SET session_replication_role = 'default';

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after import to verify data integrity
-- =====================================================

-- SELECT COUNT(*) FROM profiles; -- Should return 5
-- SELECT COUNT(*) FROM user_roles; -- Should return 7
-- SELECT COUNT(*) FROM subscription_plans; -- Should return 3
-- SELECT COUNT(*) FROM usage_tracking; -- Should return 5
-- SELECT COUNT(*) FROM events; -- Should return 1
-- SELECT COUNT(*) FROM groups; -- Should return 2
-- SELECT COUNT(*) FROM group_members; -- Should return 3
-- SELECT COUNT(*) FROM gift_lists; -- Should return 3
-- SELECT COUNT(*) FROM gift_items; -- Should return 8+
-- SELECT COUNT(*) FROM gift_exchanges; -- Should return 2
-- SELECT COUNT(*) FROM anonymous_messages; -- Should return 2
-- SELECT COUNT(*) FROM affiliate_products; -- Should return 9+
-- SELECT COUNT(*) FROM affiliate_config; -- Should return 5
-- SELECT COUNT(*) FROM gift_card_inventory; -- Should return 6

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
--
-- 1. This export contains SAMPLE/SEED data from Lovable Cloud
-- 2. Large tables (ai_corrections, github_audit_logs) with 100+ rows
--    and complex JSONB data are NOT included
-- 3. For complete data migration, export those tables separately
--    using Supabase Dashboard CSV export
-- 4. UUIDs for auth.users are referenced but users themselves
--    are NOT exported (managed by Supabase Auth)
-- 5. You'll need to recreate users in external Supabase
--    before importing data that references user_id
--
-- =====================================================
